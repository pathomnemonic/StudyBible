import { BOOKS } from '../lib/canon';
import { getXrefs } from '../data/loader';

export type BookMatrix = Record<string, Record<string, number>>;
let cache: Promise<BookMatrix> | null = null;

/** How strongly the cross-reference data joins each pair of books (square roots of vote counts, summed). */
export function bookMatrix(): Promise<BookMatrix> {
  cache ??= (async () => {
    const ids = new Set(BOOKS.map((b) => b.id));
    const out: BookMatrix = {};
    await Promise.all(
      BOOKS.map(async (b) => {
        const f = await getXrefs(b.id).catch(() => null);
        const row: Record<string, number> = (out[b.id] = {});
        for (const targets of Object.values(f ?? {})) {
          for (const [ref, votes] of targets as [string, number][]) {
            const t = ref.split('.')[0];
            if (t === b.id || !ids.has(t)) continue;
            row[t] = (row[t] ?? 0) + Math.sqrt(votes || 1);
          }
        }
      }),
    );
    return out;
  })();
  return cache;
}

/** the strongest links of one book, in both directions */
export function topLinks(m: BookMatrix, id: string, n = 8): [string, number][] {
  return Object.entries(m[id] ?? {})
    .map(([b, w]) => [b, w + (m[b]?.[id] ?? 0)] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export function pairLinks(m: BookMatrix, limit: number) {
  const pair: Record<string, number> = {};
  for (const a of Object.keys(m)) for (const [b, w] of Object.entries(m[a])) {
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    pair[k] = (pair[k] ?? 0) + w;
  }
  const all = Object.entries(pair).sort((x, y) => y[1] - x[1]);
  const max = all[0]?.[1] ?? 1;
  return all.slice(0, limit).map(([k, w]) => ({ a: k.split('|')[0], b: k.split('|')[1], w, n: w / max }));
}
