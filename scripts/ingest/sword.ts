/**
 * Minimal reader for SWORD zCom modules (compressed commentaries): `<name>.czv` (10-byte verse index:
 * block u32, offset u32, size u16), `<name>.czs` (12-byte block index: offset, compressed size, uncompressed
 * size) and `<name>.czz` (zlib blocks). Only what the Catena module needs; no dependency on libsword.
 */
import { inflateSync } from 'node:zlib';

export interface ZCom {
  entries: number;
  entry(i: number): string;
}

export function openZCom(czv: Uint8Array, czs: Uint8Array, czz: Uint8Array): ZCom {
  const dvV = new DataView(czv.buffer, czv.byteOffset, czv.byteLength);
  const dvS = new DataView(czs.buffer, czs.byteOffset, czs.byteLength);
  const cache = new Map<number, Buffer>();
  const block = (i: number) => {
    let b = cache.get(i);
    if (!b) {
      const off = dvS.getUint32(i * 12, true);
      const csz = dvS.getUint32(i * 12 + 4, true);
      b = inflateSync(czz.subarray(off, off + csz));
      cache.set(i, b);
    }
    return b;
  };
  return {
    entries: czv.byteLength / 10,
    entry(i) {
      const bl = dvV.getUint32(i * 10, true);
      const off = dvV.getUint32(i * 10 + 4, true);
      const sz = dvV.getUint16(i * 10 + 8, true);
      return sz ? block(bl).subarray(off, off + sz).toString('utf8') : '';
    },
  };
}
