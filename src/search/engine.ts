import MiniSearch from 'minisearch';
import { BOOKS, BOOK_BY_ID } from '../lib/canon';
import { formatRef, looksLikeRef, parseRefs, suggestBooks, type Ref } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { flattenChapter } from '../lib/bibleText';
import { getBookText, type EditionRecord } from '../data/loader';
import { getBiay, getCatena, getDoctrine, getEntities, getFulltextIndex, getLibraryIndex, getWork, type BiayEpisode, type DoctrineTopic, type Entity } from '../data/content';
import { db, type Note } from '../db/db';
import { refId } from '../lib/refs';

/** lower-case, accent-fold and expand ligatures so Latin (æ, œ) and English match the same way. */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'");

// ---------------------------------------------------------------------------
// Query parsing
// ---------------------------------------------------------------------------

export interface ParsedQuery {
  raw: string;
  phrases: string[]; // exact phrases ("…")
  terms: string[]; // loose words
  scopeBook?: string; // in:john
  scopeTestament?: 'OT' | 'NT';
  author?: string; // by:augustine
}

export function parseQuery(raw: string): ParsedQuery {
  let rest = raw.trim();
  const q: ParsedQuery = { raw, phrases: [], terms: [] };
  rest = rest.replace(/"([^"]+)"/g, (_m, p: string) => {
    q.phrases.push(fold(p).trim());
    return ' ';
  });
  rest = rest.replace(/\b(?:in|book):([a-z0-9 ]+?)(?=\s+\w+:|$|\s{2})/gi, (_m, b: string) => {
    const lower = b.trim().toLowerCase();
    if (lower === 'ot' || lower === 'nt') q.scopeTestament = lower.toUpperCase() as 'OT' | 'NT';
    else {
      const hit = BOOKS.find((x) => x.name.toLowerCase() === lower || x.id.toLowerCase() === lower || x.aliases.includes(lower));
      if (hit) q.scopeBook = hit.id;
    }
    return ' ';
  });
  rest = rest.replace(/\bby:(\w+)/gi, (_m, a: string) => {
    q.author = a.toLowerCase();
    return ' ';
  });
  q.terms = fold(rest)
    .split(/[^a-z0-9']+/)
    .filter((t) => t.length > 0);
  return q;
}

// ---------------------------------------------------------------------------
// Scripture index (per edition, built lazily and cached)
// ---------------------------------------------------------------------------

interface VerseDoc {
  id: string;
  b: string;
  c: number;
  v: number;
  t: string;
}
const scriptureIndexes = new Map<string, Promise<MiniSearch<VerseDoc>>>();

const tokenizer = (s: string) => fold(s).split(/[^a-z0-9']+/).filter(Boolean);

export function scriptureIndex(edition: EditionRecord, onProgress?: (done: number, total: number) => void): Promise<MiniSearch<VerseDoc>> {
  let p = scriptureIndexes.get(edition.id);
  if (!p) {
    p = (async () => {
      const ms = new MiniSearch<VerseDoc>({
        fields: ['t'],
        storeFields: ['b', 'c', 'v', 't'],
        tokenize: tokenizer,
        processTerm: (t) => t,
        searchOptions: { prefix: true, combineWith: 'AND' },
      });
      let done = 0;
      for (const b of BOOKS) {
        const data = await getBookText(edition.id, b.id);
        const docs: VerseDoc[] = [];
        for (const ch of data.chapters) for (const v of flattenChapter(ch)) docs.push({ id: `${b.id}.${ch.n}.${v.n}`, b: b.id, c: ch.n, v: v.n, t: v.text });
        ms.addAll(docs);
        onProgress?.(++done, BOOKS.length);
        await new Promise((r) => setTimeout(r, 0));
      }
      return ms;
    })();
    scriptureIndexes.set(edition.id, p);
  }
  return p;
}

export interface VerseHit {
  edition: EditionRecord;
  book: string;
  c: number; // native chapter
  v: number; // native verse
  text: string;
  score: number;
  exact: boolean; // contains the exact phrase / all words as typed
}

export async function searchScripture(editions: EditionRecord[], q: ParsedQuery, limit = 80, onProgress?: (e: string, d: number, t: number) => void): Promise<{ hits: VerseHit[]; total: number }> {
  const hits: VerseHit[] = [];
  let total = 0;
  // Very short function words ("of", "a") make prefix-AND searches noisy; ignore them unless they are all there is.
  const content = q.terms.filter((t) => t.length > 2);
  const words = [...(content.length ? content : q.terms), ...q.phrases.flatMap((p) => tokenizer(p))];
  if (!words.length) return { hits, total };
  for (const ed of editions) {
    const idx = await scriptureIndex(ed, (d, t) => onProgress?.(ed.shortName, d, t));
    const filter = (r: any) => {
      if (q.scopeBook && r.b !== q.scopeBook) return false;
      if (q.scopeTestament && BOOK_BY_ID[r.b].testament !== q.scopeTestament) return false;
      if (q.phrases.length) {
        const f = fold(r.t);
        if (!q.phrases.every((p) => f.includes(p))) return false;
      }
      return true;
    };
    let res = idx.search(words.join(' '), { prefix: true, combineWith: 'AND', filter });
    // Misspellings / partial words: only if exact search is thin, widen with fuzzy matching and say so via `exact`.
    let fuzzy = false;
    if (res.length < 5 && !q.phrases.length) {
      const f = idx.search(words.join(' '), { prefix: true, fuzzy: 0.2, combineWith: 'AND', filter });
      if (f.length > res.length) {
        res = f;
        fuzzy = true;
      }
    }
    total += res.length;
    const norm = q.terms.join(' ');
    for (const r of res.slice(0, limit * 3)) {
      const contiguous = norm.length > 0 && fold(r.t).includes(norm);
      hits.push({ edition: ed, book: r.b, c: r.c, v: r.v, text: r.t, score: r.score + (contiguous ? 12 : 0), exact: !fuzzy });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return { hits: hits.slice(0, limit), total };
}

export function highlight(text: string, q: ParsedQuery): string {
  const words = [...q.terms.filter((t) => t.length > 2), ...q.phrases].filter((w) => w.length > 1);
  if (!words.length) return escapeHtml(text);
  const folded = fold(text);
  // fold() can change string length (ligatures); fall back to plain text rather than mis-highlight.
  if (folded.length !== text.length) return escapeHtml(text);
  const ranges: [number, number][] = [];
  for (const w of words) {
    const re = new RegExp(`(?<![a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[a-z0-9']*`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(folded))) ranges.push([m.index, m.index + m[0].length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let out = '';
  let pos = 0;
  for (const [a, b] of ranges) {
    if (a < pos) continue;
    out += escapeHtml(text.slice(pos, a)) + '<mark>' + escapeHtml(text.slice(a, b)) + '</mark>';
    pos = b;
  }
  return out + escapeHtml(text.slice(pos));
}
const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// ---------------------------------------------------------------------------
// Other content types
// ---------------------------------------------------------------------------

export interface Snip {
  id: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  href?: string; // in-app
  url?: string; // external
  badge?: string;
  authority?: string;
  year?: number;
  author?: string;
}

const matchAll = (text: string, q: ParsedQuery) => {
  const f = fold(text);
  return q.terms.every((t) => f.includes(t)) && q.phrases.every((p) => f.includes(p));
};
const snippetAround = (text: string, q: ParsedQuery, radius = 120) => {
  const f = fold(text);
  const key = q.phrases[0] ?? q.terms[0];
  const i = key ? f.indexOf(key) : -1;
  if (i < 0 || f.length !== text.length) return text.slice(0, radius * 2);
  const a = Math.max(0, i - radius);
  return (a > 0 ? '…' : '') + text.slice(a, i + radius) + '…';
};

export async function searchTopics(q: ParsedQuery): Promise<Snip[]> {
  const d = await getDoctrine();
  if (!d) return [];
  const out: Snip[] = [];
  for (const t of d.topics as DoctrineTopic[]) {
    const hay = [t.title, t.summary, ...t.keywords].join(' ');
    if (matchAll(hay, q) || q.terms.some((w) => t.keywords.some((k) => fold(k) === w || fold(k).startsWith(w)))) {
      out.push({ id: t.id, title: t.title, snippet: t.summary.slice(0, 200) + '…', href: `/study/topics/${t.id}`, badge: 'Doctrine topic (editorial)', authority: 'scholarship' });
    }
  }
  for (const [id, doc] of Object.entries(d.documents)) {
    if (matchAll(doc.title + ' ' + doc.body, q)) out.push({ id: 'doc-' + id, title: doc.title, subtitle: doc.body, url: doc.url, badge: doc.level === 'doctrine' ? 'Official doctrine' : 'Authoritative teaching', authority: doc.level });
  }
  return out;
}

export async function searchEntities(q: ParsedQuery): Promise<{ entity: Entity; refs: Ref[] }[]> {
  const ents = (await getEntities()) ?? [];
  const words = q.terms.join(' ');
  if (!words) return [];
  return ents
    .filter((e) => [e.name, ...e.aliases].some((n) => fold(n).includes(words) || words.includes(fold(n))))
    .map((entity) => ({ entity, refs: entity.passages.map((p) => parseRefsAnchor(p)).filter(Boolean) as Ref[] }));
}
import { parseRefId } from '../lib/refs';
const parseRefsAnchor = (id: string) => parseRefId(id);

let catenaIdx: Promise<MiniSearch<any>> | null = null;
async function catenaIndex() {
  if (!catenaIdx) {
    catenaIdx = (async () => {
      const ms = new MiniSearch<any>({ fields: ['t', 'a'], storeFields: ['a', 'l', 't', 'b', 'c', 'v1', 'v2'], tokenize: tokenizer });
      for (const b of ['MAT', 'MRK']) {
        const cat = await getCatena(b);
        if (!cat) continue;
        const docs: any[] = [];
        cat.groups.forEach((g, gi) => g.items.forEach((it, ii) => docs.push({ id: `${b}-${gi}-${ii}`, b, c: g.c, v1: g.v1, v2: g.v2, a: it.a, l: it.l, t: it.t })));
        ms.addAll(docs);
      }
      return ms;
    })();
  }
  return catenaIdx;
}

export async function searchCommentary(q: ParsedQuery): Promise<Snip[]> {
  const idx = await catenaIndex();
  const words = [...q.terms, ...q.phrases.flatMap(tokenizer)].join(' ');
  if (!words) return [];
  const res = idx.search(words, { prefix: true, combineWith: 'AND', filter: (r) => (!q.phrases.length || q.phrases.every((p) => fold(r.t).includes(p))) && (!q.scopeBook || r.b === q.scopeBook) && (!q.author || fold(r.a).includes(q.author)) });
  return res.slice(0, 40).map((r) => ({
    id: r.id,
    title: `${r.a} on ${BOOK_BY_ID[r.b].name} ${r.c}:${r.v1}${r.v2 > r.v1 ? '–' + r.v2 : ''}`,
    subtitle: r.l,
    snippet: snippetAround(r.t, q),
    href: `/read/dra/${r.b}/${r.c}?v=${r.v1}`,
    badge: 'Catena Aurea (Fathers, verse-by-verse)',
    authority: 'father',
    author: r.a,
  }));
}

export async function searchLibrary(q: ParsedQuery): Promise<Snip[]> {
  const ft = await getFulltextIndex();
  const lib = await getLibraryIndex();
  if (!ft || !lib) return [];
  const words = [...q.terms, ...q.phrases.flatMap(tokenizer)].map((w) => fold(w)).filter((w) => w.length >= 4);
  if (!words.length) return [];
  // Section-level postings → intersect, then verify phrases in the actual text.
  let sets: Set<number>[] = words.map((w) => {
    const s = new Set<number>();
    for (const [word, ids] of Object.entries(ft.postings)) if (word === w || (w.length >= 5 && word.startsWith(w))) ids.forEach((i) => s.add(i));
    return s;
  });
  let inter = sets.reduce((a, b) => new Set([...a].filter((x) => b.has(x))));
  const cands = [...inter].slice(0, 60);
  const out: Snip[] = [];
  const workCache = new Map<string, Awaited<ReturnType<typeof getWork>>>();
  for (const gi of cands) {
    const [wid, si] = ft.sections[gi];
    const meta = lib.works.find((w) => w.id === wid)!;
    if (q.author && !fold(meta.author + ' ' + meta.authorId).includes(q.author)) continue;
    if (!workCache.has(wid)) workCache.set(wid, await getWork(wid));
    const sec = workCache.get(wid)?.sections[si];
    if (!sec) continue;
    const para = sec.paras.find((p) => matchAll(p, { ...q, terms: q.terms }));
    if (!para && (q.phrases.length || q.terms.length)) {
      // words occur in the section but not together; still list but with first matching paragraph for any term
      const loose = sec.paras.find((p) => fold(p).includes(words[0]));
      if (!loose) continue;
      out.push({ id: `${wid}-${si}`, title: `${meta.title}: ${sec.title}`, subtitle: meta.author, snippet: snippetAround(loose, q), href: `/study/works/${wid}/${si}`, badge: 'Words appear in this section (not necessarily together)', authority: meta.authority, author: meta.author });
      continue;
    }
    out.push({ id: `${wid}-${si}`, title: `${meta.title}: ${sec.title}`, subtitle: meta.author, snippet: snippetAround(para!, q), href: `/study/works/${wid}/${si}`, badge: 'Full text match', authority: meta.authority, author: meta.author });
    if (out.length >= 30) break;
  }
  // exact matches first
  return out.sort((a, b) => Number(b.badge === 'Full text match') - Number(a.badge === 'Full text match'));
}

let epIdx: Promise<{ ms: MiniSearch<any>; eps: Map<string, BiayEpisode> }> | null = null;
export async function searchEpisodes(q: ParsedQuery): Promise<Snip[]> {
  if (!epIdx) {
    epIdx = (async () => {
      const b = await getBiay();
      const eps = new Map<string, BiayEpisode>();
      const ms = new MiniSearch<any>({ fields: ['title', 'description', 'day', 'passageNames'], storeFields: ['id'], tokenize: tokenizer });
      for (const e of b?.episodes ?? []) {
        eps.set(e.id, e);
        const names = e.passages
          .map((p) => {
            const r = parseRefId(p);
            return r ? formatRef(r) : '';
          })
          .join(' ');
        ms.add({ id: e.id, title: e.title, description: e.description, day: e.day ? `day ${e.day}` : '', passageNames: names });
      }
      return { ms, eps };
    })();
  }
  const { ms, eps } = await epIdx;
  const words = [...q.terms, ...q.phrases.flatMap(tokenizer)].join(' ');
  if (!words) return [];
  return ms
    .search(words, { prefix: true, combineWith: 'AND', fuzzy: 0.1 })
    .slice(0, 40)
    .map((r) => {
      const e = eps.get(r.id)!;
      return {
        id: e.id,
        title: e.title,
        subtitle: e.date,
        snippet: e.description.slice(0, 180) + '…',
        href: `/listen/episode/${e.id}`,
        badge: 'Bible in a Year (metadata match; transcripts are not published in the feed)',
        year: e.year ?? undefined,
        authority: 'media',
      };
    });
}

export async function searchNotes(q: ParsedQuery): Promise<Snip[]> {
  const out: Snip[] = [];
  const notes: Note[] = await db.notes.toArray();
  for (const n of notes) {
    const hay = [n.title ?? '', n.body, n.tags.join(' ')].join(' ');
    if (matchAll(hay, q)) out.push({ id: `n${n.id}`, title: n.title || n.body.slice(0, 60), snippet: snippetAround(n.body, q), href: `/library/notes/${n.id}`, badge: `Your ${n.kind}` });
  }
  const j = await db.journal.toArray();
  for (const e of j) if (matchAll((e.title ?? '') + ' ' + e.body, q)) out.push({ id: `j${e.id}`, title: e.title || `${e.kind} · ${e.date}`, snippet: snippetAround(e.body, q), href: '/pray/journal', badge: `Your ${e.kind}` });
  return out;
}

// ---------------------------------------------------------------------------
// Reference interpretation
// ---------------------------------------------------------------------------

export interface RefResult {
  refs: Ref[]; // anchor refs
  display: string;
  note?: string;
}

/** Interpret a typed reference. `numbering` says whether psalm/verse numbers are Vulgate or English. */
export function interpretReference(input: string, numbering: 'vulgate' | 'english'): { ok: true; results: RefResult[] } | { ok: false; error: string; suggestions: string[] } {
  if (!looksLikeRef(input)) return { ok: false, error: '', suggestions: [] };
  const p = parseRefs(input);
  if (!p.ok) return { ok: false, error: p.error, suggestions: p.suggestions };
  const results = p.refs.map(({ ref }) => {
    if (numbering === 'vulgate') return { refs: [ref], display: formatRef(ref) } as RefResult;
    const conv = convertRef('kjv', 'vulgate', ref);
    return { refs: [conv.ref], display: formatRef(ref), note: conv.exact ? undefined : 'Numbering differs between traditions; the Vulgate anchor shown may be approximate.' } as RefResult;
  });
  return { ok: true, results };
}

export { refId, suggestBooks };
