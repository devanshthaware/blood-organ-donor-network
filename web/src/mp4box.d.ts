declare module 'mp4box' {
  export interface MP4Track {
    id: number;
    codec: string;
    nb_samples: number;
    duration: number;
    timescale: number;
    video?: {
      width: number;
      height: number;
    };
    mdia?: any;
    [key: string]: any;
  }

  export interface MP4Info {
    duration: number;
    timescale: number;
    tracks: MP4Track[];
    videoTracks: MP4Track[];
    audioTracks: MP4Track[];
    [key: string]: any;
  }

  export interface MP4Sample {
    track_id: number;
    description: any;
    is_sync: boolean;
    is_rap?: boolean;
    timescale: number;
    dts: number;
    cts: number;
    duration: number;
    size: number;
    data: ArrayBuffer;
    [key: string]: any;
  }

  export interface MP4File {
    onReady?: (info: MP4Info) => void;
    onError?: (e: string) => void;
    onSamples?: (trackId: number, user: any, samples: MP4Sample[]) => void;
    appendBuffer(data: ArrayBuffer): number;
    start(): void;
    stop(): void;
    flush(): void;
    setExtractionOptions(trackId: number, user?: any, options?: { nbSamples?: number; rapAlignment?: boolean }): void;
    getTrackById(trackId: number): any;
    [key: string]: any;
  }

  export class DataStream {
    constructor(buffer?: ArrayBuffer, byteOffset?: number, endianness?: boolean);
    buffer: ArrayBuffer;
    position: number;
    [key: string]: any;
  }

  export const Endianness: {
    BIG_ENDIAN: boolean;
    LITTLE_ENDIAN: boolean;
  };

  export function createFile(): MP4File;
}
