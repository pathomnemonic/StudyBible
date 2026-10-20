import { getChalloner, getCatena, getCccLinks, getHaydock, getLibScripture, getResourceRefs } from '../data/content';
import { parseRefId } from '../lib/refs';

/**
 * How many distinct resources (commentary notes, Catena groups, library sections, catalogued articles, Catechism citations) touch each verse
 * of one anchor chapter. Used for the small margin markers in the reader so connections are visible at a glance.
 */
export async function verseResourceCounts(book: string, chapter: number, verseCount: number): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  /** only verse-specific material counts: a link to a whole chapter or book is not "connected to this verse" */
  const add = (c1: number, v1: number, c2: number, v2: number, wide = false) => {
    if (chapter < c1 || chapter > c2) return;
    if (wide && (c2 > c1 || (v2 && v2 < 999 ? v2 : verseCount) - Math.max(1, v1 || 1) + 1 > 12)) return;
    const from = chapter === c1 ? Math.max(1, v1 || 1) : 1;
    const to = chapter === c2 ? (v2 && v2 < 999 ? v2 : verseCount) : verseCount;
    for (let v = from; v <= Math.min(to, verseCount); v++) counts.set(v, (counts.get(v) ?? 0) + 1);
  };
  const [hay, cat, lib, ext, ccc, chal] = await Promise.all([getHaydock(book), getCatena(book), getLibScripture(book), getResourceRefs(book), getCccLinks(), getChalloner(book)]);
  for (const [c1, v1, c2, v2] of hay ?? []) add(c1, v1, c2, v2);
  for (const [c1, v1, c2, v2] of chal?.notes ?? []) add(c1, v1, c2, v2);
  for (const g of cat?.groups ?? []) add(g.c, g.v1, g.c, g.v2);
  const seen = new Set<string>();
  for (const e of lib ?? []) {
    const k = `${e[4]}-${e[5]}`;
    // one count per (work, section) per verse range
    if (e[6] === 't' || true) {
      if (chapter >= e[0] && chapter <= e[2]) {
        const key = `${k}-${e[0]}-${e[1]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        add(e[0], e[1], e[2], e[3], e[6] !== 's');
      }
    }
  }
  for (const [c1, v1, c2, v2] of ext ?? []) add(c1, v1, c2, v2, true);
  for (const l of ccc?.links ?? []) {
    const r = parseRefId(l.ref);
    if (r && r.book === book) add(r.c1, r.v1 ?? 1, r.c2, r.v2 ?? 999, true);
  }
  return counts;
}
