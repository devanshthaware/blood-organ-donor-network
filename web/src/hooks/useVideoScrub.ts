import { useEffect, useRef, useState } from 'react';
import * as MP4Box from 'mp4box';

interface FrameItem {
  ts: number; // microseconds
  blob: Blob;
}

const LERP_TAU = 8;
const SNAP = 0.002;
const LRU_MAX = 24;
const LEAD = 24;
const WATCHDOG = 60000;

function binarySearchNearest(bank: FrameItem[], targetTs: number): number {
  if (bank.length === 0) return -1;
  let low = 0;
  let high = bank.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (bank[mid].ts < targetTs) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  if (low >= bank.length) return bank.length - 1;
  if (high < 0) return 0;
  return Math.abs(bank[low].ts - targetTs) < Math.abs(bank[high].ts - targetTs)
    ? low
    : high;
}

function getTrackDescription(mp4boxfile: any, track: any): Uint8Array | undefined {
  try {
    const trak = mp4boxfile.getTrackById(track.id);
    if (!trak || !trak.mdia || !trak.mdia.minf || !trak.mdia.minf.stbl || !trak.mdia.minf.stbl.stsd) {
      return undefined;
    }
    for (const entry of trak.mdia.minf.stbl.stsd.entries) {
      const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
      if (box) {
        const stream = new (MP4Box as any).DataStream(undefined, 0, (MP4Box as any).Endianness.BIG_ENDIAN);
        box.write(stream);
        // Slice off the 8-byte box header: 4-byte size + 4-byte fourcc type
        return new Uint8Array(stream.buffer, 8);
      }
    }
  } catch (err) {
    console.warn('Could not extract track description box:', err);
  }
  return undefined;
}

export function useVideoScrub(videoSrc: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [canvasLive, setCanvasLive] = useState(false);
  const [ready, setReady] = useState(false);

  // Mutable refs for high-frequency rAF loop
  const bankRef = useRef<FrameItem[]>([]);
  const lruRef = useRef<Map<number, ImageBitmap | null>>(new Map());
  const currentTimeRef = useRef(0);
  const targetTimeRef = useRef(0);
  const durationRef = useRef(0);
  const readyRef = useRef(false);
  const paintedRef = useRef(false);
  const revertedRef = useRef(false);
  const buildingRef = useRef(false);

  // Frame Bank Decoding with WebCodecs & MP4Box
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let watchdogTimer: NodeJS.Timeout | null = null;
    let decoder: VideoDecoder | null = null;

    const buildFrameBank = async () => {
      if (buildingRef.current) return;
      buildingRef.current = true;

      // Skip if reduced-motion or no VideoDecoder support
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || typeof window.VideoDecoder === 'undefined') {
        console.info('Skipping frame bank decode: reduced motion or VideoDecoder unsupported');
        return;
      }

      watchdogTimer = setTimeout(() => {
        if (!readyRef.current && !paintedRef.current) {
          console.warn('Video scrub watchdog timer fired (60s). Reverting to native video seek.');
          revertedRef.current = true;
          setCanvasLive(false);
        }
      }, WATCHDOG);

      type HardwarePref = 'prefer-hardware' | 'prefer-software' | 'no-preference';
      const initDecoder = async (hardwarePreference: HardwarePref): Promise<boolean> => {
        return new Promise(async (resolve) => {
          try {
            const response = await fetch(videoSrc);
            if (!response.ok) {
              throw new Error(`Failed to fetch video: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            if (!isMounted) return resolve(false);

            const mp4boxfile = MP4Box.createFile();
            const samplesQueue: any[] = [];
            let videoTrack: any = null;
            let totalSamples = 0;

            mp4boxfile.onReady = async (info: any) => {
              if (!isMounted) return;
              if (!info.videoTracks || info.videoTracks.length === 0) {
                console.warn('No video tracks found in MP4');
                return resolve(false);
              }

              videoTrack = info.videoTracks[0];
              totalSamples = videoTrack.nb_samples;
              if (info.duration && info.timescale) {
                durationRef.current = info.duration / info.timescale;
              }

              const description = getTrackDescription(mp4boxfile, videoTrack);
              const codec = videoTrack.codec;

              let hasError = false;

              try {
                decoder = new VideoDecoder({
                  output: async (frame: VideoFrame) => {
                    if (!isMounted) {
                      frame.close();
                      return;
                    }
                    const ts = frame.timestamp;
                    try {
                      let blob: Blob | null = null;
                      if (typeof OffscreenCanvas !== 'undefined') {
                        const offscreen = new OffscreenCanvas(frame.displayWidth, frame.displayHeight);
                        const offCtx = offscreen.getContext('2d');
                        if (offCtx) {
                          offCtx.drawImage(frame, 0, 0);
                          blob = await offscreen.convertToBlob({ type: 'image/webp', quality: 0.82 });
                        }
                      } else {
                        const c = document.createElement('canvas');
                        c.width = frame.displayWidth;
                        c.height = frame.displayHeight;
                        const offCtx = c.getContext('2d');
                        if (offCtx) {
                          offCtx.drawImage(frame, 0, 0);
                          blob = await new Promise<Blob | null>((res) =>
                            c.toBlob((b) => res(b), 'image/webp', 0.82)
                          );
                        }
                      }

                      if (blob) {
                        bankRef.current.push({ ts, blob });
                      }
                    } catch (e) {
                      console.warn('Error converting frame to WebP:', e);
                    } finally {
                      frame.close();
                    }
                  },
                  error: (e) => {
                    console.warn('VideoDecoder runtime error:', e);
                    hasError = true;
                  }
                });

                const config: VideoDecoderConfig = {
                  codec,
                  codedWidth: videoTrack.video.width,
                  codedHeight: videoTrack.video.height,
                  hardwareAcceleration: hardwarePreference,
                };
                if (description) {
                  config.description = description as any;
                }

                const support = await VideoDecoder.isConfigSupported(config);
                if (!support.supported) {
                  console.warn('Config not supported by VideoDecoder:', config);
                  return resolve(false);
                }

                decoder.configure(config);

                // Set extraction options and start demuxing
                mp4boxfile.setExtractionOptions(videoTrack.id, null, { nbSamples: 1000 });
                mp4boxfile.start();
              } catch (decErr) {
                console.warn('Failed to configure VideoDecoder:', decErr);
                resolve(false);
              }
            };

            mp4boxfile.onSamples = async (_trackId: number, _user: any, samples: any[]) => {
              if (!decoder || decoder.state === 'closed') return;
              for (const sample of samples) {
                samplesQueue.push(sample);
              }

              // Process queue with LEAD throttle
              while (samplesQueue.length > 0 && decoder && decoder.state === 'configured') {
                if (decoder.decodeQueueSize > LEAD) {
                  await new Promise<void>((r) => {
                    const onDequeue = () => {
                      decoder?.removeEventListener('dequeue', onDequeue);
                      r();
                    };
                    decoder?.addEventListener('dequeue', onDequeue);
                  });
                }

                const s = samplesQueue.shift();
                if (!s) break;

                const chunk = new EncodedVideoChunk({
                  type: s.is_sync ? 'key' : 'delta',
                  timestamp: (s.cts * 1_000_000) / s.timescale,
                  duration: (s.duration * 1_000_000) / s.timescale,
                  data: s.data,
                });
                decoder.decode(chunk);
              }

              // When all samples queued and flushed
              if (bankRef.current.length >= totalSamples * 0.95 || samplesQueue.length === 0) {
                try {
                  await decoder.flush();
                  // Sort bank by timestamp
                  bankRef.current.sort((a, b) => a.ts - b.ts);
                  readyRef.current = true;
                  if (isMounted) {
                    setReady(true);
                  }
                  resolve(true);
                } catch {
                  resolve(true);
                }
              }
            };

            mp4boxfile.onError = (e: string) => {
              console.warn('MP4Box error:', e);
              resolve(false);
            };

            // Feed the buffer into MP4Box
            const buffer = arrayBuffer as any;
            buffer.fileStart = 0;
            mp4boxfile.appendBuffer(buffer);
            mp4boxfile.flush();
          } catch (fetchErr) {
            console.warn('Error fetching or decoding video for frame bank (falling back to video seek):', fetchErr);
            resolve(false);
          }
        });
      };

      // Attempt 1: Default / Hardware acceleration
      let success = await initDecoder('prefer-hardware');
      if (!success && isMounted) {
        console.warn('Hardware decode failed, retrying once with prefer-software...');
        bankRef.current = [];
        success = await initDecoder('prefer-software');
      }

      if (!success) {
        console.warn('Frame bank decoding failed; video element fallback will handle scrubbing.');
        revertedRef.current = true;
      }
    };

    if (document.readyState === 'complete') {
      buildFrameBank();
    } else {
      window.addEventListener('load', buildFrameBank, { once: true });
    }

    return () => {
      isMounted = false;
      if (watchdogTimer) clearTimeout(watchdogTimer);
      if (decoder && decoder.state !== 'closed') {
        try {
          decoder.close();
        } catch {}
      }
      // Clean up LRU bitmaps
      for (const bmp of lruRef.current.values()) {
        if (bmp) bmp.close?.();
      }
      lruRef.current.clear();
    };
  }, [videoSrc]);

  // Main high-performance rAF loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const drawFrameFromBank = (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas || bankRef.current.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const targetTs = timeSec * 1_000_000;
      const nearestIdx = binarySearchNearest(bankRef.current, targetTs);
      if (nearestIdx < 0 || nearestIdx >= bankRef.current.length) return;

      // Warm LRU around i-1..i+2
      for (let offset = -1; offset <= 2; offset++) {
        const idx = nearestIdx + offset;
        if (idx >= 0 && idx < bankRef.current.length && !lruRef.current.has(idx)) {
          lruRef.current.set(idx, null);
          createImageBitmap(bankRef.current[idx].blob)
            .then((bmp) => {
              lruRef.current.set(idx, bmp);
            })
            .catch(() => {
              lruRef.current.delete(idx);
            });
        }
      }

      // Evict oldest when size > LRU_MAX
      if (lruRef.current.size > LRU_MAX) {
        for (const [key, bmp] of lruRef.current.entries()) {
          if (Math.abs(key - nearestIdx) > 3) {
            if (bmp) {
              try {
                bmp.close?.();
              } catch {}
            }
            lruRef.current.delete(key);
            if (lruRef.current.size <= LRU_MAX) break;
          }
        }
      }

      const bitmap = lruRef.current.get(nearestIdx);
      if (bitmap) {
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        if (!paintedRef.current) {
          paintedRef.current = true;
          setCanvasLive(true);
        }
      } else {
        // Asynchronously render if not yet loaded in LRU
        createImageBitmap(bankRef.current[nearestIdx].blob)
          .then((bmp) => {
            lruRef.current.set(nearestIdx, bmp);
            if (canvasRef.current) {
              const c = canvasRef.current.getContext('2d');
              c?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
              if (!paintedRef.current) {
                paintedRef.current = true;
                setCanvasLive(true);
              }
            }
          })
          .catch(() => {});
      }
    };

    const loop = (now: number) => {
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(0.1, deltaSeconds);

      if (containerRef.current) {
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = Math.max(1, containerRef.current.offsetHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, scrollY / maxScroll));
        setScrollProgress(p);

        const video = videoRef.current;
        const dur = (video && video.duration && !isNaN(video.duration) && video.duration > 0)
          ? video.duration
          : durationRef.current;

        if (dur > 0) {
          targetTimeRef.current = p * dur;

          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (prefersReducedMotion) {
            currentTimeRef.current = targetTimeRef.current;
          } else {
            currentTimeRef.current += (targetTimeRef.current - currentTimeRef.current) * (1 - Math.exp(-dt * LERP_TAU));
            if (Math.abs(targetTimeRef.current - currentTimeRef.current) < SNAP) {
              currentTimeRef.current = targetTimeRef.current;
            }
          }

          if (readyRef.current && bankRef.current.length > 0 && !revertedRef.current) {
            drawFrameFromBank(currentTimeRef.current);
          } else {
            // Native video element fallback
            if (video && !video.seeking && Math.abs(video.currentTime - currentTimeRef.current) > 0.01) {
              video.currentTime = currentTimeRef.current;
            }
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return {
    containerRef,
    videoRef,
    canvasRef,
    scrollProgress,
    canvasLive,
    ready,
  };
}
export default useVideoScrub;
