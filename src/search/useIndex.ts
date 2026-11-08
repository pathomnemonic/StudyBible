import { buildIndex, type DocIndex } from './rank';
import { loadLessonDocs, loadLibraryDocs, loadQuickDocs } from './docs';
import type { SearchDoc } from './rank';

export type Tier = 'quick' | 'library' | 'full';
const cache = new Map<Tier, Promise<DocIndex>>();
let quick: Promise<SearchDoc[]> | null = null;
let lib: Promise<SearchDoc[]> | null = null;
let lessons: Promise<SearchDoc[]> | null = null;
const q = () => (quick ??= loadQuickDocs());
const l = () => (lib ??= loadLibraryDocs());
const ls = () => (lessons ??= loadLessonDocs().catch(() => []));

/** Search index, built lazily. 'quick' is instant; 'library' adds chains, claims, apologetics and lives; 'full' adds lessons. */
export function getIndex(tier: Tier): Promise<DocIndex> {
  let p = cache.get(tier);
  if (!p) {
    p = (async () => {
      const parts = [await q()];
      if (tier !== 'quick') parts.push(await l());
      if (tier === 'full') parts.push(await ls());
      return buildIndex(parts.flat());
    })();
    p.catch(() => cache.delete(tier));
    cache.set(tier, p);
  }
  return p;
}
