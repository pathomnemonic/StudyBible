/**
 * A small QR code encoder with no dependencies: byte mode, error correction level L or M, versions 1 to 10 (up to 213 bytes at L),
 * Reed-Solomon codewords, all eight masks tried and the best one kept. Enough for a link a phone camera should read.
 */
export type Ecc = 'L' | 'M';
// [ec codewords per block, [blocks, data codewords per block][]] for versions 1..10
const BLOCKS: Record<Ecc, [number, [number, number][]][]> = {
  L: [[7, [[1, 19]]], [10, [[1, 34]]], [15, [[1, 55]]], [20, [[1, 80]]], [26, [[1, 108]]], [18, [[2, 68]]], [20, [[2, 78]]], [24, [[2, 97]]], [30, [[2, 116]]], [18, [[2, 68], [2, 69]]]],
  M: [[10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]], [24, [[2, 43]]], [16, [[4, 27]]], [18, [[4, 31]]], [22, [[2, 38], [2, 39]]], [22, [[3, 36], [2, 37]]], [26, [[4, 43], [1, 44]]]],
};
const ALIGN = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const ECC_BITS: Record<Ecc, number> = { L: 1, M: 0 };

// ---- Galois field 256 (x^8 + x^4 + x^3 + x^2 + 1)
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

export function rsGenerator(degree: number): number[] {
  let g = [1];
  for (let i = 0; i < degree; i++) { const n = new Array(g.length + 1).fill(0); g.forEach((c, j) => { n[j] ^= c; n[j + 1] ^= mul(c, EXP[i]); }); g = n; }
  return g;
}
/** the Reed-Solomon remainder: `degree` error correction codewords for these data codewords */
export function rsRemainder(data: number[], degree: number): number[] {
  const g = rsGenerator(degree), r = new Array(degree).fill(0);
  for (const d of data) { const f = d ^ r.shift()!; r.push(0); if (f) for (let i = 0; i < degree; i++) r[i] ^= mul(g[i + 1], f); }
  return r;
}

export const capacity = (version: number, ecc: Ecc) => BLOCKS[ecc][version - 1][1].reduce((n, [b, d]) => n + b * d, 0);
const bch = (v: number, poly: number, bits: number) => { let r = v << bits; const top = 31 - Math.clz32(poly); for (let i = 31 - Math.clz32(r); i >= top; i--) if (r & (1 << i)) r ^= poly << (i - top); return r; };
/** the 15 format bits: error level and mask, protected by a BCH code and XOR-ed with a fixed pattern */
export const formatBits = (ecc: Ecc, mask: number) => { const d = (ECC_BITS[ecc] << 3) | mask; return ((d << 10) | bch(d, 0x537, 10)) ^ 0x5412; };
/** the 18 version bits, for versions 7 and up */
export const versionBits = (version: number) => (version << 12) | bch(version, 0x1f25, 12);

export const sizeOf = (version: number) => 17 + 4 * version;
const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (_, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];
export const maskFn = (m: number) => MASKS[m];

/** which modules belong to finder, timing, alignment, format and version patterns (everything that is not data) */
export function functionMap(version: number): boolean[][] {
  const n = sizeOf(version), f = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  const box = (r0: number, c0: number, h: number, w: number) => { for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) if (r >= 0 && c >= 0 && r < n && c < n) f[r][c] = true; };
  box(0, 0, 9, 9); box(0, n - 8, 9, 8); box(n - 8, 0, 8, 9);
  for (let i = 0; i < n; i++) { f[6][i] = true; f[i][6] = true; }
  const al = ALIGN[version - 1];
  for (const r of al) for (const c of al) { if ((r === 6 && c === 6) || (r === 6 && c === al[al.length - 1]) || (r === al[al.length - 1] && c === 6)) continue; box(r - 2, c - 2, 5, 5); }
  if (version >= 7) { box(0, n - 11, 6, 3); box(n - 11, 0, 3, 6); }
  return f;
}

function placeFunction(m: boolean[][], version: number) {
  const n = sizeOf(version);
  const set = (r: number, c: number, v: boolean) => { if (r >= 0 && c >= 0 && r < n && c < n) m[r][c] = v; };
  const finder = (r0: number, c0: number) => { for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) set(r0 + r, c0 + c, r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))); };
  finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
  for (let i = 8; i < n - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const al = ALIGN[version - 1];
  for (const r of al) for (const c of al) { if ((r === 6 && c === 6) || (r === 6 && c === al[al.length - 1]) || (r === al[al.length - 1] && c === 6)) continue; for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1); }
  set(n - 8, 8, true); // the always-dark module
  if (version >= 7) { const v = versionBits(version); for (let i = 0; i < 18; i++) { const b = ((v >> i) & 1) === 1, a = Math.floor(i / 3), c = (i % 3) + n - 11; set(a, c, b); set(c, a, b); } }
}
function placeFormat(m: boolean[][], version: number, ecc: Ecc, mask: number) {
  const n = sizeOf(version), f = formatBits(ecc, mask), bit = (i: number) => ((f >> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) m[i][8] = bit(i);
  m[7][8] = bit(6); m[8][8] = bit(7); m[8][7] = bit(8);
  for (let i = 9; i < 15; i++) m[8][14 - i] = bit(i);
  for (let i = 0; i < 8; i++) m[8][n - 1 - i] = bit(i);
  for (let i = 8; i < 15; i++) m[n - 15 + i][8] = bit(i);
  m[n - 8][8] = true;
}
/** the zigzag order in which data modules are read and written */
export function dataOrder(version: number): [number, number][] {
  const n = sizeOf(version), f = functionMap(version), out: [number, number][] = [];
  let up = true;
  for (let c = n - 1; c > 0; c -= 2) {
    if (c === 6) c = 5;
    for (let k = 0; k < n; k++) { const r = up ? n - 1 - k : k; for (const cc of [c, c - 1]) if (!f[r][cc]) out.push([r, cc]); }
    up = !up;
  }
  return out;
}
function penalty(m: boolean[][]): number {
  const n = m.length; let p = 0;
  const run = (line: boolean[]) => { let s = 0, i = 0; while (i < n) { let j = i; while (j < n && line[j] === line[i]) j++; if (j - i >= 5) s += 3 + (j - i - 5); i = j; } return s; };
  const pat = (line: boolean[]) => { let s = 0; const a = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], b = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]; for (let i = 0; i + 11 <= n; i++) { const w = line.slice(i, i + 11).map(Number); if (w.every((x, k) => x === a[k]) || w.every((x, k) => x === b[k])) s += 40; } return s; };
  for (let r = 0; r < n; r++) { p += run(m[r]) + pat(m[r]); const col = m.map((row) => row[r]); p += run(col) + pat(col); }
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) if (m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c] && m[r][c] === m[r + 1][c + 1]) p += 3;
  const dark = m.flat().filter(Boolean).length;
  return p + Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
}

/** the data and error correction codewords of a message, interleaved in block order, ready to place */
export function codewords(bytes: number[], version: number, ecc: Ecc): number[] {
  const [ecLen, groups] = BLOCKS[ecc][version - 1];
  const total = capacity(version, ecc), bits: number[] = [];
  const put = (v: number, len: number) => { for (let i = len - 1; i >= 0; i--) bits.push((v >> i) & 1); };
  put(4, 4); put(bytes.length, version >= 10 ? 16 : 8); bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, total * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < total; pad ^= 0xec ^ 0x11) data.push(pad);
  const blocks: { d: number[]; e: number[] }[] = [];
  let at = 0;
  for (const [count, len] of groups) for (let i = 0; i < count; i++) { const d = data.slice(at, at + len); at += len; blocks.push({ d, e: rsRemainder(d, ecLen) }); }
  const out: number[] = [];
  const longest = Math.max(...blocks.map((b) => b.d.length));
  for (let i = 0; i < longest; i++) for (const b of blocks) if (i < b.d.length) out.push(b.d[i]);
  for (let i = 0; i < ecLen; i++) for (const b of blocks) out.push(b.e[i]);
  return out;
}

export interface QrCode { version: number; ecc: Ecc; mask: number; size: number; modules: boolean[][] }

/** Encode text (as UTF-8 bytes) into a QR matrix. Tries level M first for sturdiness, then L; throws if it does not fit in version 10. */
export function encodeQr(text: string, prefer: Ecc = 'M'): QrCode {
  const bytes = [...new TextEncoder().encode(text)];
  const order: Ecc[] = prefer === 'M' ? ['M', 'L'] : ['L'];
  for (const ecc of order) for (let version = 1; version <= 10; version++) {
    if (bytes.length > capacity(version, ecc) - (version >= 10 ? 3 : 2)) continue;
    const words = codewords(bytes, version, ecc), n = sizeOf(version), f = functionMap(version), order2 = dataOrder(version);
    const bits: boolean[] = []; for (const w of words) for (let i = 7; i >= 0; i--) bits.push(((w >> i) & 1) === 1);
    let best: QrCode | null = null, bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const m = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
      placeFunction(m, version);
      order2.forEach(([r, c], i) => { m[r][c] = (bits[i] ?? false) !== MASKS[mask](r, c); });
      placeFormat(m, version, ecc, mask);
      const s = penalty(m);
      if (s < bestScore) { bestScore = s; best = { version, ecc, mask, size: n, modules: m }; }
    }
    void f;
    return best!;
  }
  throw new Error('That link is too long for a QR code.');
}
