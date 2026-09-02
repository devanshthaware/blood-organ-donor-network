/**
 * Deterministic Canonicalizer & Pure JavaScript Cryptographic Hashing Engine
 * Ensures logically identical audit records produce identical SHA-256 digests.
 * 100% compliant with Convex V8 runtime (zero Node.js "crypto" dependencies).
 */

/**
 * Recursively sorts all object keys alphabetically and standardizes primitive formatting.
 */
export function canonicalizeValue(val: any): any {
  if (val === null || val === undefined) {
    return null;
  }
  if (Array.isArray(val)) {
    return val.map((item) => canonicalizeValue(item));
  }
  if (typeof val === "object") {
    const sortedKeys = Object.keys(val).sort();
    const result: Record<string, any> = {};
    for (const key of sortedKeys) {
      result[key] = canonicalizeValue(val[key]);
    }
    return result;
  }
  if (typeof val === "number") {
    return Number.isFinite(val) ? val : null;
  }
  return val;
}

/**
 * Converts any JavaScript object into a deterministic, canonical JSON string.
 */
export function canonicalStringify(obj: any): string {
  const canonicalObj = canonicalizeValue(obj);
  return JSON.stringify(canonicalObj);
}

function stringToUtf8Bytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) bytes.push((c >> 6) | 192, (c & 63) | 128);
    else bytes.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
  }
  return bytes;
}

function sha256Bytes(bytes: number[]): number[] {
  function rr(v: number, a: number): number {
    return (v >>> a) | (v << (32 - a));
  }
  const words: number[] = [];
  const len = bytes.length * 8;
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const padded = [...bytes, 0x80];
  while (padded.length % 64 !== 56) padded.push(0);
  for (let i = 0; i < padded.length; i++) {
    words[i >> 2] |= (padded[i] & 255) << ((3 - (i % 4)) * 8);
  }
  words.push(Math.floor(len / 0x100000000));
  words.push(len & 0xffffffff);

  for (let j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    const old = [...hash];
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      if (i >= 16) {
        const s0 = rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3);
        const s1 = rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      const S1 = rr(hash[4], 6) ^ rr(hash[4], 11) ^ rr(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + S1 + ch + k[i] + w[i]) | 0;
      const S0 = rr(hash[0], 2) ^ rr(hash[0], 13) ^ rr(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (S0 + maj) | 0;
      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
  }

  const outBytes: number[] = [];
  for (let i = 0; i < 8; i++) {
    outBytes.push(
      (hash[i] >>> 24) & 0xff,
      (hash[i] >>> 16) & 0xff,
      (hash[i] >>> 8) & 0xff,
      hash[i] & 0xff
    );
  }
  return outBytes;
}

/**
 * Calculates a SHA-256 cryptographic digest from an object or string in pure JavaScript.
 */
export function computeSha256(data: any): string {
  const str = typeof data === "string" ? data : canonicalStringify(data);
  const bytes = stringToUtf8Bytes(str);
  const hashBytes = sha256Bytes(bytes);
  return hashBytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Calculates an HMAC-SHA256 signature in pure JavaScript.
 */
export function computeHmacSha256(keyStr: string, msgStr: string): string {
  let key = stringToUtf8Bytes(keyStr);
  const msg = stringToUtf8Bytes(msgStr);
  if (key.length > 64) key = sha256Bytes(key);
  while (key.length < 64) key.push(0);
  const oKeyPad = key.map((b) => b ^ 0x5c);
  const iKeyPad = key.map((b) => b ^ 0x36);
  const innerHash = sha256Bytes([...iKeyPad, ...msg]);
  const outerHash = sha256Bytes([...oKeyPad, ...innerHash]);
  return outerHash.map((b) => b.toString(16).padStart(2, "0")).join("");
}
