import { getJson } from '../data/loader';

/** character ranges, by "block.run", inside one chapter that are the words of Jesus */
export type RedRanges = Record<string, [number, number][]>;
const cache = new Map<string, Promise<Record<string, RedRanges> | null>>();

/** The words of Jesus for a chapter of an edition that has them marked (see scripts/ingest/jesus.ts); null when it has none. */
export async function jesusWords(edition: string, book: string, chapter: number): Promise<RedRanges | null> {
  const k = `${edition}/${book}`;
  if (!cache.has(k)) cache.set(k, getJson<Record<string, RedRanges>>(`jesus/${edition}/${book}.json`, true).catch(() => null));
  return (await cache.get(k))?.[String(chapter)] ?? null;
}
