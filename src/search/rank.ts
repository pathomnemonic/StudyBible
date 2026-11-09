/**
 * Pure ranking code for the app-wide search (no React, no network), so it runs the same in the browser and in tests.
 * Documents are small records (title, keywords, summary) built from the app's own pages by docs.ts.
 */
import { PHRASES, QUESTION_STOP, SYNONYMS } from './synonyms';

export type Group = 'best' | 'teaching' | 'scripture' | 'fathers' | 'do' | 'learn' | 'mine';
export type Kind =
  | 'argument' | 'claim' | 'development' | 'heresy' | 'word' | 'apologetics' | 'glossary'
  | 'topic' | 'council' | 'mentor' | 'life' | 'feature' | 'prayer' | 'feast' | 'lesson' | 'doc';

export interface SearchDoc {
  id: string;
  kind: Kind;
  group: Group;
  title: string;
  /** Short line shown under the title */
  sub?: string;
  /** Summary and other prose (weight 1) */
  text?: string;
  /** Other names for the title, e.g. the page's id words (weight 5, same as the title) */
  alias?: string;
  /** Keywords, the question as asked, aliases (weight 3) */
  keys?: string;
  href: string;
  /** Label shown on the result, e.g. "Argument map" */
  badge: string;
}

export const GROUPS: { id: Group; label: string; note?: string; first: number }[] = [
  { id: 'best', label: 'Best answers', note: 'Arguments, claims, questions and key terms that answer what you asked.', first: 5 },
  { id: 'teaching', label: 'Church teaching', note: 'The Catechism and the councils.', first: 4 },
  { id: 'scripture', label: 'Scripture', first: 6 },
  { id: 'fathers', label: 'The Fathers and saints', note: 'Library texts, commentary, saints’ lives and mentors.', first: 4 },
  { id: 'do', label: 'Pray and do', note: 'Pages, prayers and feasts.', first: 4 },
  { id: 'learn', label: 'Learn', note: 'Lessons and episodes.', first: 4 },
  { id: 'mine', label: 'My notes, highlights and journal', first: 4 },
];

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

export const fold = (s: string) =>
  s.toLowerCase().replace(/æ/g, 'ae').replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`]/g, "'");

const words = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(Boolean);

const SUFFIX = /(ibility|ability|ible|able|ations?|ments?|ness|ings?|ers?|ing|ed|es|s|ly|ity|ions?|ism|ize|ise|al|y)$/;
/** A light stemmer: enough that saint/saints, infallible/infallibility, pray/prayer/praying meet. Applied to both sides. */
export function stem(w: string): string {
  if (w.length <= 4) return w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;
  let s = w;
  for (let i = 0; i < 2; i++) {
    const t = s.replace(SUFFIX, '');
    if (t.length < 4 || t === s) break;
    s = t;
  }
  return s;
}

export interface QueryTerms {
  /** the words as typed, in order, question words removed */
  content: string[];
  /** stems of `content` */
  stems: string[];
  /** extra phrases (as stem lists) from synonyms, with the index of the typed word they stand in for (-1 = whole query) */
  extra: { stems: string[]; of: number }[];
  isQuestion: boolean;
}

const QUESTION_START = /^(why|what|whats|how|who|when|where|which|is|are|do|does|did|can|could|should|will|would|was|were|may)\b/i;

/** Strip question words and expand with synonyms. "why do Catholics pray to saints" becomes pray, saints (+ intercession, communion of saints…). */
export function queryTerms(raw: string): QueryTerms {
  const all = words(raw);
  const isQuestion = QUESTION_START.test(raw.trim()) || /\?\s*$/.test(raw);
  let content = all.filter((w) => !QUESTION_STOP.has(w));
  if (!content.length) content = all.filter((w) => w.length > 2);
  const stems = content.map(stem);
  const extra: QueryTerms['extra'] = [];
  const seen = new Set<string>();
  const push = (phrase: string, of: number) => {
    const ss = words(phrase).filter((w) => !QUESTION_STOP.has(w)).map(stem);
    if (!ss.length) return;
    const k = ss.join(' ') + '|' + of;
    if (!seen.has(k) && !(ss.length === 1 && stems.includes(ss[0]))) (seen.add(k), extra.push({ stems: ss, of }));
  };
  content.forEach((w, i) => {
    const syn = SYNONYMS[w] ?? SYNONYMS[w.replace(/s$/, '')] ?? SYNONYMS[stem(w)];
    for (const p of syn ?? []) push(p, i);
  });
  const joined = ' ' + all.join(' ') + ' ';
  const tight = ' ' + content.join(' ') + ' ';
  for (const [phrase, adds] of PHRASES) {
    const pw = words(phrase);
    const hit = (hay: string) => hay.includes(' ' + pw.join(' ') + ' ') || hay.includes(' ' + pw.map((x) => x.replace(/s$/, '')).join(' ') + ' ');
    if (hit(joined) || hit(tight)) for (const a of adds) push(a, -1);
  }
  return { content, stems, extra, isQuestion };
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

export interface DocIndex {
  docs: SearchDoc[];
  /** stem -> doc number -> best field weight */
  post: Map<string, Map<number, number>>;
  stemList: string[];
  /** raw words from titles and keywords, with how many docs use them (for "did you mean") */
  vocab: Map<string, number>;
  /** folded titles */
  titles: string[];
}

const W_TITLE = 5, W_KEYS = 3, W_TEXT = 1;

export function buildIndex(docs: SearchDoc[]): DocIndex {
  const post = new Map<string, Map<number, number>>();
  const vocab = new Map<string, number>();
  const titles: string[] = [];
  const add = (st: string, d: number, w: number) => {
    let m = post.get(st);
    if (!m) post.set(st, (m = new Map()));
    if ((m.get(d) ?? 0) < w) m.set(d, w);
  };
  docs.forEach((doc, d) => {
    titles.push(words(doc.title).join(' '));
    const seenV = new Set<string>();
    const run = (s: string | undefined, w: number, vocabulary: boolean) => {
      if (!s) return;
      for (const t of words(s)) {
        if (t.length < 2 || QUESTION_STOP.has(t)) continue;
        add(stem(t), d, w);
        if (vocabulary && t.length >= 4 && !seenV.has(t)) (seenV.add(t), vocab.set(t, (vocab.get(t) ?? 0) + 1));
      }
    };
    run(doc.title, W_TITLE, true);
    run(doc.alias, W_TITLE, true);
    run(doc.keys, W_KEYS, true);
    run(doc.sub, W_TEXT, false);
    run(doc.text, W_TEXT, false);
  });
  return { docs, post, stemList: [...post.keys()], vocab, titles };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface Hit { doc: SearchDoc; score: number; matched: number }

const KIND_BOOST: Partial<Record<Kind, number>> = { argument: 1.45, claim: 1.3, apologetics: 1.15, glossary: 1.1, development: 1.0, topic: 1.05, heresy: 0.95, word: 0.95, feature: 1.1, feast: 0.9, council: 1.0, lesson: 0.6, prayer: 0.9, mentor: 0.9, life: 0.9 };

/** postings of one stem, plus longer stems it is a prefix of (at a discount) */
function lookup(ix: DocIndex, st: string): Map<number, number> {
  const out = new Map<number, number>();
  const direct = ix.post.get(st);
  if (direct) for (const [d, w] of direct) out.set(d, w);
  if (st.length >= 4) {
    for (const other of ix.stemList) {
      if (other !== st && other.startsWith(st)) {
        for (const [d, w] of ix.post.get(other)!) if ((out.get(d) ?? 0) < w * 0.7) out.set(d, w * 0.7);
      }
    }
  }
  return out;
}
const idf = (ix: DocIndex, m: Map<number, number>) => Math.log(1 + ix.docs.length / (1 + m.size));

/** All docs matching a phrase of stems (every stem present anywhere), with the weakest field weight. */
function phraseMatch(ix: DocIndex, ss: string[], cache: Map<string, Map<number, number>>): { m: Map<number, number>; idf: number } {
  const key = ss.join(' ');
  let m = cache.get(key);
  if (!m) {
    const sets = ss.map((s) => lookup(ix, s));
    m = new Map();
    for (const [d, w] of sets[0]) {
      let ww = w;
      let ok = true;
      for (let i = 1; i < sets.length; i++) {
        const o = sets[i].get(d);
        if (o === undefined) { ok = false; break; }
        ww = Math.min(ww, o);
      }
      if (ok) m.set(d, ww);
    }
    cache.set(key, m);
  }
  return { m, idf: idf(ix, m) };
}

export interface SearchOptions { limit?: number; groups?: Group[] }

export function rank(ix: DocIndex, raw: string, opts: SearchOptions = {}): Hit[] {
  const q = queryTerms(raw);
  const n = q.stems.length;
  if (!n) return [];
  const cache = new Map<string, Map<number, number>>();
  const per = new Map<number, { s: number[]; x: number }>();
  const slot = (d: number) => { let r = per.get(d); if (!r) per.set(d, (r = { s: new Array(n).fill(0), x: 0 })); return r; };
  q.stems.forEach((st, i) => {
    const { m, idf: f } = phraseMatch(ix, [st], cache);
    for (const [d, w] of m) slot(d).s[i] = Math.max(slot(d).s[i], w * f);
  });
  // synonyms stand in for the word they came from (never worth more than half a direct hit)
  for (const e of q.extra) {
    const { m, idf: f } = phraseMatch(ix, e.stems, cache);
    for (const [d, w] of m) {
      const r = slot(d);
      const v = w * f * 0.45;
      if (e.of >= 0) r.s[e.of] = Math.max(r.s[e.of], v);
      else r.x = Math.max(r.x, v);
    }
  }
  const tight = q.content.join(' ');
  const exact = (s: string) => fold(s).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  // a missing common word ("pray") costs little; a missing rare one ("rosary") costs a lot
  const termIdf = q.stems.map((st) => phraseMatch(ix, [st], cache).idf);
  const totalIdf = termIdf.reduce((a, b) => a + b, 0) || 1;
  const score = (minCover: number) => {
    const hits: Hit[] = [];
    for (const [d, r] of per) {
      const matched = r.s.filter((v) => v > 0).length;
      const cover = r.s.reduce((a, v, i) => a + (v > 0 ? termIdf[i] : 0), 0) / totalIdf;
      if (cover < minCover && !(matched >= 1 && r.x > 0 && n > 1 && cover + 0.2 >= minCover)) continue;
      const doc = ix.docs[d];
      if (opts.groups && !opts.groups.includes(doc.group)) continue;
      let s = r.s.reduce((a, b) => a + b, 0) + r.x * 0.5;
      s *= Math.pow(Math.max(cover, 0.1), 1.5);
      const t = ix.titles[d];
      if (t === tight || t === exact(raw)) s += 12;
      else if (n > 1 && (' ' + t + ' ').includes(' ' + q.stems.join(' ') + ' ')) s += 6;
      else if (t && n > 1 && q.content.every((w) => t.includes(w))) s += 4;
      s *= KIND_BOOST[doc.kind] ?? 1;
      hits.push({ doc, score: s, matched });
    }
    return hits.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  };
  let hits = score(n <= 1 ? 0.01 : 0.55);
  if (hits.length < 3 && n > 1) hits = score(0.01);
  // drop the long tail of weak matches
  const cut = hits.length ? hits[0].score * 0.12 : 0;
  return hits.filter((h) => h.score >= cut).slice(0, opts.limit ?? 200);
}

/** Hits split into the display groups, in display order. */
export function groupHits(hits: Hit[]): { id: Group; label: string; note?: string; first: number; hits: Hit[] }[] {
  return GROUPS.map((g) => ({ ...g, hits: hits.filter((h) => h.doc.group === g.id) })).filter((g) => g.hits.length);
}

// ---------------------------------------------------------------------------
// Did you mean
// ---------------------------------------------------------------------------

/** Edit distance with early exit once it exceeds `max` (insert, delete, replace, swap of neighbours). */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < best) best = v;
    }
    if (best > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

/** A corrected spelling of the query, or null when every word is already known. */
export function didYouMean(ix: DocIndex, raw: string): string | null {
  const toks = words(raw);
  let changed = false;
  const out = toks.map((t) => {
    if (t.length < 4 || QUESTION_STOP.has(t) || /\d/.test(t) || ix.vocab.has(t)) return t;
    const st = stem(t);
    if (ix.post.has(st) || ix.stemList.some((s) => s.length >= 4 && st.length >= 4 && s.startsWith(st))) return t;
    const max = t.length <= 5 ? 1 : 2;
    let best = '';
    let bd = max + 1;
    let bc = 0;
    for (const [w, c] of ix.vocab) {
      if (w[0] !== t[0] && max < 2) continue;
      const d = editDistance(t, w, max);
      if (d < bd || (d === bd && c > bc)) (bd = d, best = w, bc = c);
    }
    if (best && bd <= max) { changed = true; return best; }
    return t;
  });
  return changed ? out.join(' ') : null;
}
