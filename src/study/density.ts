import { getChalloner, getCatena, getCccLinks, getHaydock, getLibScripture, getResourceRefs } from '../data/content';
import { parseRefId } from '../lib/refs';

/** How far a note reaches. A note on one verse or a run of verses belongs to those verses; one that covers (nearly) the whole chapter belongs to the chapter. */
export type Reach = 'verse' | 'unit' | 'chapter';
export function reachOf(c1: number, v1: number, c2: number, v2: number, verseCount: number): Reach {
  if (c2 > c1) return 'chapter';
  const a = Math.max(1, v1 || 1);
  const b = v2 && v2 < 999 ? v2 : verseCount;
  const span = b - a + 1;
  if (verseCount && span >= Math.max(10, Math.round(verseCount * 0.8))) return 'chapter';
  return span <= 1 ? 'verse' : 'unit';
}

/**
 * How many distinct resources touch each verse of one anchor chapter (the small margin markers in the reader). A note written for a
 * run of verses counts once, on the last verse of the run, so one note is never counted three times; tapping any verse of the run
 * still shows it. A note about the whole chapter is not counted on any verse: key 0 of the result is the chapter's own count.
 */
export async function verseResourceCounts(book: string, chapter: number, verseCount: number): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  const bump = (v: number) => counts.set(v, (counts.get(v) ?? 0) + 1);
  const add = (c1: number, v1: number, c2: number, v2: number) => {
    if (chapter < c1 || chapter > c2) return;
    const reach = reachOf(c1, v1, c2, v2, verseCount);
    if (reach === 'chapter') {
      if (chapter === c1) bump(0);
      return;
    }
    if (chapter !== c2) return;
    bump(Math.min(v2 && v2 < 999 ? v2 : verseCount, verseCount));
  };
  const [hay, cat, lib, ext, ccc, chal] = await Promise.all([getHaydock(book), getCatena(book), getLibScripture(book), getResourceRefs(book), getCccLinks(), getChalloner(book)]);
  for (const [c1, v1, c2, v2] of hay ?? []) add(c1, v1, c2, v2);
  for (const [c1, v1, c2, v2] of chal?.notes ?? []) add(c1, v1, c2, v2);
  for (const g of cat?.groups ?? []) add(g.c, g.v1, g.c, g.v2);
  const seen = new Set<string>();
  for (const e of lib ?? []) {
    const key = `${e[4]}-${e[5]}-${e[0]}-${e[1]}`;
    if (chapter < e[0] || chapter > e[2] || seen.has(key)) continue;
    seen.add(key);
    add(e[0], e[1], e[2], e[3]);
  }
  for (const [c1, v1, c2, v2] of ext ?? []) add(c1, v1, c2, v2);
  for (const l of ccc?.links ?? []) {
    const r = parseRefId(l.ref);
    if (r && r.book === book) add(r.c1, r.v1 ?? 1, r.c2, r.v2 ?? 999);
  }
  return counts;
}
