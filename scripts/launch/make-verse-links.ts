/** Builds public/data/verse-links/<BOOK>.json: for each verse, the pieces of this app (arguments, lessons, stories, walks, ...) that are about it,
 *  so the reader can show "More in this app" beside a verse's notes. Two sources, both honest about what they are:
 *   1. harvested: every Scripture reference the app's own content already carries (chain steps, lessons, stories, ...), weighted by directness;
 *   2. curated topic hooks (src/data/verseHooks.json): hand-made links from a topic's key passages to the content that discusses the topic.
 *  Verse numbers are the WEB-Catholic (modern English) numbering the reader's default text uses.
 *  File shape: { v, book, items:[[kind,id,title,route]], why:[...], notes:[...], topics:[...], r:{ "<chapter>": [[item,from,to,weight,why,note,topic]] } }
 *  from=0,to=0 means "this chapter as a whole" (shown in chapter roll-ups only). why/note/topic are indexes into the tables, or -1.
 *  Run: npx tsx scripts/launch/make-verse-links.ts */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRefs, parseRefId, type Ref } from '../../src/lib/refs';
import { convertRef, loadVersification } from '../../src/lib/versification';
import { plainCitations } from '../ingest/lib/citations';
import { HARD_KINDS } from '../../src/data/hardDay';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(ROOT, 'public', 'data');
const OUT = join(DATA, 'verse-links');
const json = <T = any>(p: string): T => JSON.parse(readFileSync(p, 'utf8'));
loadVersification(json(join(DATA, 'versification.json')));

export interface CatalogItem { kind: string; id: string; title: string; route: string }
export type Row = [item: number, from: number, to: number, weight: number, why: number, note: number, topic: number];
export interface BookFile { v: 1; book: string; items: [string, string, string, string][]; why: string[]; notes: string[]; topics: string[]; r: Record<string, Row[]> }

const MODES: [string, string][] = [['arguments', 'argument'], ['claims', 'claim'], ['heresies', 'heresy'], ['development', 'development'], ['words', 'words']];
const chainFiles = (mode: string) => readdirSync(join(ROOT, 'src', 'data', 'chains')).filter((f) => f === `${mode}.json` || (f.startsWith(`${mode}.`) && f.endsWith('.json'))).sort();
const chainsOf = (mode: string): any[] => chainFiles(mode).flatMap((f) => json(join(ROOT, 'src', 'data', 'chains', f)));
const filesOf = (stem: string): any[] => chainFiles(stem).flatMap((f) => json(join(ROOT, 'src', 'data', 'chains', f)));

const trunc = (s: string, n = 150) => {
  const t = s.replace(/\s+/g, ' ').trim();
  const first = /^(.+?[.!?])(\s|$)/.exec(t)?.[1] ?? t;
  const u = first.length <= n ? first : t.slice(0, n).replace(/\s+\S*$/, '') + '…';
  return u;
};

export function buildCatalog(): Map<string, CatalogItem> {
  const cat = new Map<string, CatalogItem>();
  const put = (kind: string, id: string, title: string, route: string) => cat.set(`${kind}:${id}`, { kind, id, title, route });
  for (const [mode, kind] of MODES) for (const c of chainsOf(mode)) put(kind, c.id, c.title, `/study/${mode}/${c.id}`);
  for (const s of filesOf('situations')) put('mentor', s.id, s.title, `/study/mentors/${s.id}`);
  for (const l of filesOf('lives')) put('life', l.id, l.name, `/study/lives/${l.id}`);
  for (const w of json<any[]>(join(ROOT, 'src', 'data', 'walks.json'))) put('walk', w.id, w.title, `/study/walks/${w.id}`);
  for (const t of json(join(DATA, 'apologetics.json')).topics) put('apologetics', t.id, t.title, `/study/apologetics/${t.id}`);
  for (const f of ['kids_stories.json', 'kids_stories2.json']) for (const s of json(join(DATA, f)).stories) put('kids-story', s.id, s.title, `/study/kids/${s.id}`);
  for (const q of json<any[]>(join(DATA, 'kids', 'questions.json'))) put('kids-question', q.id, q.q, '/kids/questions');
  for (const k of HARD_KINDS) put('hard-day', k.id, `On a hard day: ${k.label}`, '/pray/hard-day');
  put('apostolic', 'apostolic-chain', 'The apostolic chain', '/study/apostolic-chain');
  for (const f of readdirSync(join(DATA, 'curriculum')).filter((x) => /^grade-.+\.json$/.test(x))) {
    const g = json(join(DATA, 'curriculum', f));
    for (const u of g.units) for (const l of u.lessons) put('lesson', `${g.id}/${l.id}`, l.title, `/study/curriculum/${g.id}/${l.id}`);
  }
  for (const y of [2026, 2027, 2028]) {
    const f = join(DATA, 'readings-together', `${y}.json`);
    if (existsSync(f)) for (const [date, d] of Object.entries<any>(json(f).days)) put('reading', date, d.title, `/pray/readings-together/${date}`);
  }
  return cat;
}

const webc = (() => {
  const e = json(join(DATA, 'editions.json')).editions.find((x: any) => x.id === 'webc');
  return e.verseCounts as Record<string, number[]>;
})();
export const verseCount = (book: string, c: number): number => webc[book]?.[c - 1] ?? 0;

interface Link { key: string; from: number; to: number; w: number; why?: string; note?: string; topic?: string }

export interface BuildResult { files: Map<string, BookFile>; stats: { kinds: Record<string, number>; versesLinked: number; dropped: string[]; unparsed: string[] } }

export function buildIndex(): BuildResult {
  const cat = buildCatalog();
  const links = new Map<string, Map<number, Link[]>>(); // book -> chapter -> links
  const dropped: string[] = [];
  const unparsed: string[] = [];
  const add = (r: Ref, key: string, w: number, opts: { why?: string; note?: string; topic?: string; expand?: boolean } = {}) => {
    if (!cat.has(key)) throw new Error(`unknown item ${key}`);
    const n = verseCount(r.book, r.c1);
    if (!n || r.c2 > (webc[r.book]?.length ?? 0)) { dropped.push(`${key} ${r.book} ${r.c1}-${r.c2}`); return; }
    for (let c = r.c1; c <= r.c2; c++) {
      const max = verseCount(r.book, c);
      let from: number, to: number;
      if (r.v1 === undefined) { from = opts.expand ? 1 : 0; to = opts.expand ? max : 0; }
      else {
        from = c === r.c1 ? r.v1 : 1;
        to = c === r.c2 ? Math.min(r.v2 ?? max, max) : max;
        if (from > max || to < from) { dropped.push(`${key} ${r.book} ${c}:${from}-${to}`); continue; }
      }
      const byCh = links.get(r.book) ?? links.set(r.book, new Map()).get(r.book)!;
      (byCh.get(c) ?? byCh.set(c, []).get(c)!).push({ key, from, to, w, why: opts.why, note: opts.note, topic: opts.topic });
    }
  };
  const addText = (s: string | undefined, key: string, w: number, why?: string) => {
    if (!s) return;
    for (const a of plainCitations(s)) add(convertRef('vulgate', 'english', a).ref, key, w, { why });
  };
  const addStr = (s: string | undefined, key: string, w: number, opts: { why?: string; expand?: boolean } = {}) => {
    if (!s) return;
    for (const piece of s.split(/\s*;\s*/)) {
      const t = piece.replace(/^see\s+/i, '').trim();
      if (!t) continue;
      const p = parseRefs(t);
      if (!p.ok) { if (/\d/.test(t) && !/^(Lumen|Sign of|St |Catechism)/.test(t)) unparsed.push(`${key}: ${t}`); continue; }
      for (const { ref } of p.refs) add(ref, key, w, opts);
    }
  };
  const addId = (s: string | undefined, key: string, w: number, opts: { why?: string; note?: string; topic?: string; expand?: boolean } = {}) => {
    if (!s) return;
    const r = parseRefId(s);
    if (!r) { unparsed.push(`${key}: ${s}`); return; }
    add(r, key, w, opts);
  };

  // 1. chains
  for (const [mode, kind] of MODES) {
    for (const c of chainsOf(mode)) {
      const key = `${kind}:${c.id}`;
      for (const s of c.steps ?? []) {
        addId(s.ref, key, s.quote ? 100 : 85, { why: trunc(s.note ?? '') });
        addText(s.note, key, 35, 'Mentioned in this discussion.');
        addText(s.quote, key, 35, 'Mentioned in this discussion.');
      }
      for (const o of c.objections ?? []) for (const s of o.steps ?? []) addId(s.ref, key, 70, { why: trunc(s.note ?? '') });
      for (const s of c.heresy?.advocate ?? []) addId(s.ref, key, 55, { why: `Appealed to by the error: ${trunc(s.note ?? '', 120)}` });
      addText(c.summary, key, 35, 'Mentioned in this discussion.');
      addText(c.question, key, 35, 'Mentioned in this discussion.');
      addText(c.verdict?.why, key, 35, 'Mentioned in this discussion.');
    }
  }
  for (const s of filesOf('situations')) for (const m of s.mentors ?? []) addId(m.step?.ref, `mentor:${s.id}`, 60, { why: `${m.name}: ${trunc(m.step.note ?? '', 120)}` });
  for (const l of filesOf('lives')) for (const e of l.events ?? []) addId(e.step?.ref, `life:${l.id}`, 60, { why: trunc(e.step?.note ?? e.text ?? "") });
  for (const w of json<any[]>(join(ROOT, 'src', 'data', 'walks.json'))) for (const st of w.stops ?? []) addId(st.ref, `walk:${w.id}`, 75, { why: `${st.place}: ${trunc(st.what ?? '', 120)}` });
  // 2. apologetics, kids, lessons
  for (const t of json(join(DATA, 'apologetics.json')).topics) for (const v of t.verses ?? []) addStr(v.ref, `apologetics:${t.id}`, 80, { why: trunc(t.objection ?? '') });
  for (const f of ['kids_stories.json', 'kids_stories2.json']) for (const s of json(join(DATA, f)).stories) {
    for (const r of s.refs ?? []) addStr(r, `kids-story:${s.id}`, 50, { why: 'The story, told for children.' });
    addStr(s.memory, `kids-story:${s.id}`, 40, { why: 'A verse to learn from this story.' });
  }
  for (const q of json<any[]>(join(DATA, 'kids', 'questions.json'))) for (const s of q.scripture ?? []) addId(s.ref, `kids-question:${q.id}`, 60, { why: 'A question children ask, with this verse in the answer.' });
  for (const f of readdirSync(join(DATA, 'curriculum')).filter((x) => /^grade-.+\.json$/.test(x))) {
    const g = json(join(DATA, 'curriculum', f));
    for (const u of g.units) for (const l of u.lessons) {
      const key = `lesson:${g.id}/${l.id}`;
      const why = trunc(l.idea ?? '');
      addStr(l.scripture, key, 60, { why });
      const mem = /\(([^()]*\d[^()]*)\)\s*$/.exec(l.mem ?? '');
      if (mem) addStr(mem[1], key, 40, { why: 'The memory verse of this lesson.' });
    }
  }
  // 3. hard-day verses, apostolic chain, readings together
  for (const k of HARD_KINDS) for (const v of k.verses) addId(v, `hard-day:${k.id}`, 40, { why: 'A verse offered for this kind of hard day.' });
  for (const e of json(join(ROOT, 'src', 'data', 'apostolicChain.json')).edges) if (e.ref) addId(e.ref, 'apostolic:apostolic-chain', 60, { why: trunc(e.note ?? '') });
  for (const y of [2026, 2027, 2028]) {
    const f = join(DATA, 'readings-together', `${y}.json`);
    if (!existsSync(f)) continue;
    for (const [date, d] of Object.entries<any>(json(f).days)) {
      const key = `reading:${date}`;
      for (const [slot, text] of Object.entries<string>(d.readings)) {
        const label = slot === 'gospel' ? 'Gospel' : slot === 'responsorial_psalm' ? 'Psalm' : slot === 'second_reading' ? 'Second reading' : 'First reading';
        for (const piece of text.split('|')) {
          const p = parseRefs(piece.replace(/(\d)[a-d]+\b/g, '$1').replace(/\s*[–—]\s*/g, '-').replace(/\(\d+\)/g, ''));
          if (!p.ok) continue;
          for (const { ref } of p.refs) {
            const why = `${label} on ${date}`;
            if (ref.book === 'PSA') { for (let c = ref.c1; c <= ref.c2; c++) add({ book: 'PSA', c1: c, c2: c }, key, 20, { why }); }
            else add(convertRef('kjv', 'english', ref).ref, key, 20, { why });
          }
        }
      }
    }
  }
  // 4. curated hooks
  const hooks = json<{ hooks: { topic: string; verses: string[]; items: { kind: string; id: string }[]; why: string; note?: string }[] }>(join(ROOT, 'src', 'data', 'verseHooks.json')).hooks;
  for (const h of hooks) for (const it of h.items) for (const v of h.verses) addId(v, `${it.kind}:${it.id}`, 90, { why: h.why, note: h.note, topic: h.topic, expand: true });

  // pack into per-book files
  const files = new Map<string, BookFile>();
  const kinds: Record<string, Set<string>> = {};
  let versesLinked = 0;
  for (const [book, byCh] of links) {
    const bf: BookFile = { v: 1, book, items: [], why: [], notes: [], topics: [], r: {} };
    const idx = (arr: string[], s: string | undefined) => (s === undefined ? -1 : arr.indexOf(s) >= 0 ? arr.indexOf(s) : arr.push(s) - 1);
    const itemIdx = new Map<string, number>();
    for (const [c, ls] of [...byCh].sort((a, b) => a[0] - b[0])) {
      // merge identical links whose ranges touch
      ls.sort((a, b) => a.key.localeCompare(b.key) || (a.why ?? '').localeCompare(b.why ?? '') || a.w - b.w || a.from - b.from);
      const merged: Link[] = [];
      for (const l of ls) {
        const p = merged[merged.length - 1];
        if (p && p.key === l.key && p.w === l.w && p.why === l.why && p.note === l.note && p.topic === l.topic && l.from <= p.to + 1 && !(p.from === 0) === !(l.from === 0)) p.to = Math.max(p.to, l.to);
        else merged.push({ ...l });
      }
      bf.r[String(c)] = merged.map((l) => {
        let i = itemIdx.get(l.key);
        if (i === undefined) {
          const ci = cat.get(l.key)!;
          i = bf.items.push([ci.kind, ci.id, ci.title, ci.route]) - 1;
          itemIdx.set(l.key, i);
          (kinds[ci.kind] ??= new Set()).add(l.key);
        }
        return [i, l.from, l.to, l.w, idx(bf.why, l.why), idx(bf.notes, l.note), idx(bf.topics, l.topic)] as Row;
      });
      const covered = new Set<number>();
      for (const l of merged) if (l.from > 0) for (let v = l.from; v <= l.to; v++) covered.add(v);
      versesLinked += covered.size;
    }
    files.set(book, bf);
  }
  return { files, stats: { kinds: Object.fromEntries(Object.entries(kinds).map(([k, s]) => [k, s.size])), versesLinked, dropped, unparsed } };
}

export function writeIndex() {
  const { files, stats } = buildIndex();
  if (existsSync(OUT)) rmSync(OUT, { recursive: true });
  mkdirSync(OUT, { recursive: true });
  let bytes = 0;
  for (const [book, bf] of files) {
    // trailing -1s are dropped to keep files small; readers treat a missing value as -1
    const out = { ...bf, r: Object.fromEntries(Object.entries(bf.r).map(([c, rows]) => [c, rows.map((r) => { const a: number[] = [...r]; while (a.length > 5 && a[a.length - 1] === -1) a.pop(); return a; })])) };
    const s = JSON.stringify(out);
    bytes += s.length;
    writeFileSync(join(OUT, `${book}.json`), s);
  }
  console.log(`verse-links: ${files.size} books, ${stats.versesLinked} verses with a verse-level link, ${(bytes / 1024).toFixed(0)} KB`);
  console.log('items linked per kind:', JSON.stringify(stats.kinds));
  if (stats.dropped.length) console.log(`dropped ${stats.dropped.length} refs outside the text:`, stats.dropped.slice(0, 15));
  if (stats.unparsed.length) console.log(`could not read ${stats.unparsed.length} refs:`, stats.unparsed.slice(0, 15));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) writeIndex();
