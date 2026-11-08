/** Pure helpers for the cross-translation compare page: word diff and verse alignment. */
import type { Ref } from './refs';

export interface Cell { native: string; text: string; exact: boolean; note?: string }
export interface AlignedRow { c: number; v: number; cells: (Cell | null)[] }
export interface Piece { text: string; changed: boolean }

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/** Split into words, keeping each word's original spelling. */
export const words = (s: string) => s.split(/\s+/).filter(Boolean);

/**
 * Word diff of `other` against `base`. Returns the words of `other` in order, each marked changed when it is not part of a
 * longest common run of words with `base` (case and punctuation are ignored when matching).
 */
export function diffWords(base: string, other: string): Piece[] {
  const a = words(base).map(norm);
  const bw = words(other);
  const b = bw.map(norm);
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const same = new Array(m).fill(false);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { same[j] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return bw.map((text, k) => ({ text, changed: !same[k] && b[k] !== '' }));
}

/** How much of `other` matches `base`, 0 to 1 (for a plain "identical" label). */
export function sameness(base: string, other: string): number {
  const p = diffWords(base, other);
  return p.length ? p.filter((x) => !x.changed).length / p.length : 1;
}

/**
 * Line the columns up verse by verse. `columns[k]` maps "chapter.verse" (anchor numbering) to the verse in edition k.
 * Rows run in order through the passage; a missing verse is null so the reader sees the gap instead of a shifted line.
 */
export function alignVerses(ref: Ref, columns: Map<string, Cell>[], maxRows = 60): { rows: AlignedRow[]; truncated: boolean } {
  const keys = new Set<string>();
  for (const col of columns) for (const k of col.keys()) keys.add(k);
  const inRange = (c: number, v: number) => {
    if (c < ref.c1 || c > ref.c2) return false;
    if (c === ref.c1 && ref.v1 !== undefined && v < ref.v1) return false;
    if (c === ref.c2 && ref.v2 !== undefined && v > ref.v2) return false;
    return true;
  };
  const all = [...keys]
    .map((k) => { const [c, v] = k.split('.').map(Number); return { c, v, k }; })
    .filter((x) => inRange(x.c, x.v))
    .sort((x, y) => x.c - y.c || x.v - y.v);
  const rows = all.slice(0, maxRows).map((x) => ({ c: x.c, v: x.v, cells: columns.map((col) => col.get(x.k) ?? null) }));
  return { rows, truncated: all.length > maxRows };
}
