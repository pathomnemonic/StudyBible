import { getJson } from '../data/loader';
import { parseRefId, parseRefs, type Ref } from '../lib/refs';
import { convertRef } from '../lib/versification';

export interface InlineFig { id: number | string; file: string; title: string; artist: string; date: string; credit: string; page: string; ref: Ref }
interface ArtWork { id: number; file: string; page: string; title: string; artist: string; date: string; credit: string }
interface MoreWork { id: string; title: string; artist: string; date: string; credit: string; source: string; file: string; refs: string[]; theme: string }
let moreCache: Promise<{ work: MoreWork; ranges: Ref[] }[]> | null = null;
const loadMore = () => (moreCache ??= getJson<{ works: MoreWork[] }>('art-more.json', true).then((d) => (d?.works ?? []).map((work) => ({ work, ranges: work.refs.map((r) => { const p = parseRefs(r); return p.ok ? convertRef('kjv', 'vulgate', p.refs[0].ref).ref : null; }).filter(Boolean) as Ref[] }))).catch(() => []));
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
  // more pictures: Doré's engravings and museum paintings, at most three in a chapter, each after the last verse of its scene
  const more = await loadMore();
  const taken = new Set(out.map((f) => `${f.ref.c1}.${f.ref.v1}`));
  const cands: InlineFig[] = [];
  for (const { work, ranges } of more) {
    for (const r of ranges) {
      if (r.book !== book) continue;
      const c = anchorChapters.find((x) => x >= r.c1 && x <= r.c2);
      if (c === undefined) continue;
      const v = r.c2 === c ? r.v2 ?? r.v1 : undefined;
      if (v === undefined) continue;
      cands.push({ id: work.id as any, file: work.file, title: work.title, artist: work.artist, date: work.date, credit: work.credit, page: work.source, ref: { book, c1: c, c2: c, v1: v, v2: v } });
      break;
    }
  }
  // paintings first (they are in colour), then engravings; keep scenes apart so illustrations do not crowd one spot
  cands.sort((a, b) => Number(String(a.id).startsWith('dore')) - Number(String(b.id).startsWith('dore')));
  for (const c of cands) {
    if (out.length >= 3) break;
    if ([...taken].some((t) => Math.abs(+t.split('.')[1] - (c.ref.v1 ?? 0)) < 4 && t.startsWith(`${c.ref.c1}.`))) continue;
    taken.add(`${c.ref.c1}.${c.ref.v1}`);
    out.push(c);
  }
  // the same picture can be in both lists (or twice in one): show it once
  const norm = (f: InlineFig) => `${f.title}|${f.artist}`.toLowerCase().replace(/[^a-z0-9|]+/g, '');
  const names = new Set<string>(), files = new Set<string>();
  return out.filter((f) => {
    if (f.ref.v1 === undefined) return false;
    const key = norm(f), file = f.file.replace(/^.*\//, '').replace(/\.[a-z]+$/i, '');
    if (names.has(key) || files.has(file)) return false;
    names.add(key); files.add(file);
    return true;
  });
}

/** Doré engravings and museum paintings whose scene overlaps the selection (for the Media tab). */
export async function moreArtFor(sel: Ref[]) {
  const more = await loadMore();
  return more.filter(({ ranges }) => ranges.some((r) => sel.some((x) => x.book === r.book && x.c1 <= r.c2 && r.c1 <= x.c2))).map(({ work }) => work).slice(0, 6);
}
