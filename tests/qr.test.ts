import { describe, expect, it } from 'vitest';
import { capacity, dataOrder, encodeQr, formatBits, maskFn, rsGenerator, rsRemainder, sizeOf, versionBits, type QrCode } from '../src/lib/qr';

// A small decoder written separately from the encoder's placing code: read the format bits from the matrix, undo the mask,
// read the codewords back in zigzag order, undo the interleaving, check every block's error correction, and read the bytes.
const BLOCKS: Record<string, Record<number, [number, number][]>> = {
  L: { 1: [[1, 19]], 2: [[1, 34]], 3: [[1, 55]], 4: [[1, 80]], 5: [[1, 108]], 6: [[2, 68]], 7: [[2, 78]], 8: [[2, 97]], 9: [[2, 116]], 10: [[2, 68], [2, 69]] },
  M: { 1: [[1, 16]], 2: [[1, 28]], 3: [[1, 44]], 4: [[2, 32]], 5: [[2, 43]], 6: [[4, 27]], 7: [[4, 31]], 8: [[2, 38], [2, 39]], 9: [[3, 36], [2, 37]], 10: [[4, 43], [1, 44]] },
};
const EC: Record<string, number[]> = { L: [7, 10, 15, 20, 26, 18, 20, 24, 30, 18], M: [10, 16, 26, 18, 24, 16, 18, 22, 22, 26] };
function decode(q: QrCode): string {
  const m = q.modules, n = q.size;
  let f1 = 0;
  const cells: [number, number][] = [[0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8], [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0]];
  cells.forEach(([r, c], i) => { if (m[r][c]) f1 |= 1 << i; });
  let f2 = 0;
  for (let i = 0; i < 8; i++) if (m[8][n - 1 - i]) f2 |= 1 << i;
  for (let i = 8; i < 15; i++) if (m[n - 15 + i][8]) f2 |= 1 << i;
  expect(f2).toBe(f1);
  const ecc = ['M', 'L'].find((e) => [0, 1, 2, 3, 4, 5, 6, 7].some((k) => formatBits(e as 'L', k) === f1))!;
  const mask = [0, 1, 2, 3, 4, 5, 6, 7].find((k) => formatBits(ecc as 'L', k) === f1)!;
  expect(ecc).toBe(q.ecc); expect(mask).toBe(q.mask);
  const bits = dataOrder(q.version).map(([r, c]) => (m[r][c] !== maskFn(mask)(r, c) ? 1 : 0));
  const words: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) words.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  const groups = BLOCKS[ecc][q.version], ecLen = EC[ecc][q.version - 1];
  const lens = groups.flatMap(([c, l]) => Array<number>(c).fill(l));
  const data = lens.map(() => [] as number[]), ec = lens.map(() => [] as number[]);
  let at = 0;
  for (let i = 0; i < Math.max(...lens); i++) lens.forEach((l, b) => { if (i < l) data[b].push(words[at++]); });
  for (let i = 0; i < ecLen; i++) lens.forEach((_, b) => ec[b].push(words[at++]));
  lens.forEach((_, b) => expect(rsRemainder(data[b], ecLen)).toEqual(ec[b]));
  const flat = data.flat(), bs: number[] = [];
  for (const w of flat) for (let i = 7; i >= 0; i--) bs.push((w >> i) & 1);
  const read = (from: number, len: number) => parseInt(bs.slice(from, from + len).join('') || '0', 2);
  expect(read(0, 4)).toBe(4); // byte mode
  const cb = q.version >= 10 ? 16 : 8, len = read(4, cb);
  const out = Array.from({ length: len }, (_, i) => read(4 + cb + i * 8, 8));
  return new TextDecoder().decode(Uint8Array.from(out));
}

describe('QR encoder', () => {
  it('matches known format and version information', () => {
    expect(formatBits('M', 0).toString(2).padStart(15, '0')).toBe('101010000010010');
    expect(formatBits('L', 0).toString(2).padStart(15, '0')).toBe('111011111000100');
    expect(formatBits('L', 1).toString(2).padStart(15, '0')).toBe('111001011110011');
    expect(versionBits(7)).toBe(0x07c94);
    expect(versionBits(10)).toBe(0x0a4d3);
  });
  it('makes the standard Reed-Solomon codewords', () => {
    expect(rsGenerator(7)).toEqual([1, 127, 122, 154, 164, 11, 68, 117]); // the generator polynomial, as powers of alpha: 0 87 229 146 149 238 102 21
    const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17]; // "HELLO WORLD", version 1-M
    expect(rsRemainder(data, 10)).toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
  });
  it('draws the fixed patterns and the right size', () => {
    const q = encodeQr('https://example.org/#/join/123456');
    expect(q.size).toBe(sizeOf(q.version));
    const m = q.modules, n = q.size;
    for (const [r0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) { expect(m[r0][c0]).toBe(true); expect(m[r0 + 3][c0 + 3]).toBe(true); expect(m[r0 + 1][c0 + 1]).toBe(false); expect(m[r0 + 6][c0 + 6]).toBe(true); }
    expect(m[6][8]).toBe(true); expect(m[6][9]).toBe(false); expect(m[n - 8][8]).toBe(true);
  });
  it('round-trips links of many lengths at both levels, in every version', () => {
    for (const ecc of ['M', 'L'] as const) for (let v = 1; v <= 10; v++) {
      const len = capacity(v, ecc) - (v >= 10 ? 3 : 2);
      const text = Array.from({ length: len }, (_, i) => String.fromCharCode(97 + ((i * 7) % 26))).join('');
      const q = encodeQr(text, ecc);
      if (ecc === 'L') expect(q.version).toBe(v);
      expect(decode(q)).toBe(text);
    }
  });
  it('encodes the join link and non-ASCII text', () => {
    const url = 'https://study.example.org/StudyBible/#/join/482913';
    const q = encodeQr(url);
    expect(q.version).toBeLessThanOrEqual(4);
    expect(decode(q)).toBe(url);
    expect(decode(encodeQr('Père, “Sainte” ✝'))).toBe('Père, “Sainte” ✝');
    expect(() => encodeQr('x'.repeat(400))).toThrow();
  });
});
