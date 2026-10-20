import { getJson } from '../data/loader';
import { parseRefId, type Ref } from '../lib/refs';

export interface InlineFig { id: number; file: string; title: string; artist: string; date: string; credit: string; page: string; ref: Ref }
interface ArtWork { id: number; file: string; page: string; title: string; artist: string; date: string; credit: string }
let cache: Promise<{ works: Map<number, ArtWork>; entries: { work: number; a: string[] }[] }> | null = null;
const load = () => (cache ??= Promise.all([getJson<{ works: ArtWork[] }>('art.json', true), getJson<{ entries: { work: number; a: string[] }[] }>('lens/art.json', true)]).then(([a, l]) => ({ works: new Map((a?.works ?? []).map((w) => [w.id, w])), entries: l?.entries ?? [] })).catch(() => ({ works: new Map(), entries: [] })));

/** Paintings whose subject is a scene in this (anchor) chapter, each placed after the scene's last verse in this chapter. At most two per chapter. */
export async function artForChapter(book: string, anchorChapters: number[]): Promise<InlineFig[]> {
  const { works, entries } = await load();
  const out: InlineFig[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const w = works.get(e.work);
    if (!w) continue;
    for (const id of e.a) {
      const r = parseRefId(id);
      if (!r || r.book !== book) continue;
      const c = anchorChapters.find((x) => x >= r.c1 && x <= r.c2);
      if (c === undefined) continue;
      const key = `${r.book}.${c}.${r.v2 ?? r.v1}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const v = r.c2 === c ? r.v2 ?? r.v1 : undefined;
      out.push({ ...w, ref: { book, c1: c, c2: c, v1: v, v2: v } });
      break;
    }
    if (out.length >= 2) break;
  }
  return out.filter((f) => f.ref.v1 !== undefined);
}
