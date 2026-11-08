/**
 * Retrieval over the bundled library (Fathers, saints, councils, church documents).
 * Nothing is generated: every result is a verbatim passage with its work, author, date and section.
 * Pure functions plus a small engine class, so tests can feed it the index files straight from disk.
 */
import type { LibraryWorkMeta } from '../data/content';

export interface FtIndex { sections: [string, number][]; postings: Record<string, number[]> }
export interface LibIndex { works: LibraryWorkMeta[] }
export type LoadWork = (id: string) => Promise<{ sections: { title: string; paras: string[] }[] } | null>;

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Words that carry no topic (query side). The index itself already drops words under four letters. */
const STOP = new Set('about above after again against also among because been before being between both cannot could does doing done down during each either else even ever every from further have having here hers herself himself into itself just least less made make many might more most much must never none nothing once only other ours ourselves over same shall should since some such than that their theirs them themselves then there these they this those through thus unto until upon very what when where whether which while whom whose will with within without would your yours yourself yourselves hath thee thou thy thine doth shalt wilt art therefore however church catholic catholics believe believes teach teaches say says said mean means tell explain why how who'.split(' '));

/** Light stemmer: enough to join baptize / baptized / baptism / baptizing, infant / infants. */
export function stem(raw: string): string {
  let w = fold(raw).replace(/[^a-z]/g, '');
  if (w.length <= 4) return w;
  const strip = (re: RegExp) => { const t = w.replace(re, ''); if (t.length >= 4) w = t; };
  strip(/(ing|ed|es|s)$/);
  if (/(iz|is)$/.test(w) && w.length > 5) w += 'e';
  strip(/(ize|ise|ism|ist|ation)$/);
  strip(/e$/);
  return w;
}

/** Words that stand near each other in the Fathers' vocabulary. Used at a lower weight than the words asked. */
const SIMILAR: Record<string, string[]> = {
  worship: ['assemble', 'assembly', 'liturgy', 'sacrifice', 'prayers'], baptize: ['baptism', 'washing', 'regeneration'], baptism: ['baptize', 'regeneration'],
  confess: ['penance', 'absolution'], confession: ['penance', 'absolution'], sin: ['transgression'], pray: ['prayer', 'supplication'],
  eucharist: ['communion', 'sacrifice'], communion: ['eucharist', 'sacrifice'], mass: ['eucharist', 'sacrifice', 'liturgy'], marriage: ['wedlock', 'matrimony'],
  martyr: ['martyrdom', 'witness'], fast: ['fasting'], fasting: ['fast'], poor: ['alms', 'almsgiving'], charity: ['alms', 'love'], pope: ['bishop', 'peter', 'successor'],
  mary: ['virgin', 'mother'], saint: ['intercession', 'martyr'], heaven: ['paradise', 'kingdom'], hell: ['punishment', 'fire'], trinity: ['father', 'spirit', 'consubstantial'],
  priest: ['presbyter', 'bishop', 'ordination'], bishop: ['overseer', 'succession'], scripture: ['writings', 'prophets'], bible: ['scripture', 'writings'],
  resurrection: ['rising', 'immortality'], suffer: ['affliction', 'tribulation'], evil: ['wickedness'], grace: ['gift', 'favour'], faith: ['belief'], pagan: ['gentile', 'idols'],
};

/** The page is about the Fathers, so their own words are lifted slightly over later catechisms and modern writers. Stated on the page. */
const PRIOR: Record<string, number> = { Fathers: 1.15, Saints: 1.05, Councils: 1, 'Church documents': 0.9, Scholarship: 0.9 };
export type Group = 'Fathers' | 'Saints' | 'Councils' | 'Church documents' | 'Scholarship';
export const GROUPS: Group[] = ['Fathers', 'Saints', 'Councils', 'Church documents', 'Scholarship'];
export function groupOf(w: Pick<LibraryWorkMeta, 'authority' | 'kind'>): Group {
  if (w.kind === 'council') return 'Councils';
  if (w.authority === 'father') return 'Fathers';
  if (w.authority === 'saint') return 'Saints';
  if (w.authority === 'church') return 'Church documents';
  return 'Scholarship';
}

/** Ids that name the same person in the library index. */
const ALIAS: Record<string, string> = { 'basil-the-great': 'basil' };
export const authorKey = (id: string) => ALIAS[id] ?? id;

/** First year in a string like "c. 407–420", "386–429" or "1076–1098". */
export function startYear(y?: string): number | null {
  const m = y?.match(/\d{2,4}/);
  return m ? Number(m[0]) : null;
}
export const CENTURIES = ['1st–2nd', '3rd', '4th', '5th', '6th–15th', 'Later'] as const;
export type CenturyBand = (typeof CENTURIES)[number];
export function centuryBand(year: number | null): CenturyBand | null {
  if (year == null) return null;
  if (year <= 200) return '1st–2nd';
  if (year <= 300) return '3rd';
  if (year <= 400) return '4th';
  if (year <= 500) return '5th';
  if (year <= 1500) return '6th–15th';
  return 'Later';
}
const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
export const centuryLabel = (year: number | null) => (year == null ? 'date unknown' : `${ord(Math.ceil(year / 100))} century`);

/** Query words that can be matched against the index (four letters or more, not stop words). */
export function queryWords(q: string): string[] {
  return [...new Set(fold(q).split(/[^a-z]+/).filter((w) => w.length >= 4 && !STOP.has(w)))];
}

export interface Segment { t: string; hit: boolean }
/** Split text into runs so the words that matched the question can be marked. */
export function highlight(text: string, words: string[]): Segment[] {
  const stems = new Set(words.flatMap((w) => [stem(w), ...(SIMILAR[stem(w)] ?? SIMILAR[w] ?? []).flatMap((s) => s.split(' ').map(stem))]));
  const prime = new Set(words.map(stem));
  return text.split(/([A-Za-zÀ-ÿ]+)/).filter(Boolean).map((t) => ({ t, hit: /^[A-Za-zÀ-ÿ]/.test(t) && fold(t).length >= 4 && (prime.has(stem(t)) || stems.has(stem(t))) }));
}

export interface Passage { para: number; text: string; score: number }
export interface Hit {
  workId: string; sectionIdx: number; sectionTitle: string; workTitle: string;
  author: string; authorId: string; group: Group; kind: string; yearText: string; year: number | null; band: CenturyBand | null;
  score: number; passages: Passage[]; href: string;
}
export interface Filters { bands?: CenturyBand[]; authorIds?: string[]; groups?: Group[] }
export interface SearchResult { words: string[]; matchedWords: string[]; unmatchedWords: string[]; hits: Hit[]; sectionsMatched: number }

interface TermGroup { word: string; primary: Set<number>; extra: Set<number>; idf: number }

export class FathersEngine {
  private stems?: Map<string, string[]>;
  private byWork = new Map<string, LibraryWorkMeta>();
  private secLen: number[] = [];
  private avgLen = 1;
  constructor(private ft: FtIndex, private lib: LibIndex) {
    for (const w of lib.works) this.byWork.set(w.id, w);
    let tot = 0;
    this.secLen = ft.sections.map(([id, i]) => { const n = this.byWork.get(id)?.sections[i]?.words ?? 0; tot += n; return n; });
    this.avgLen = tot / Math.max(1, ft.sections.length) || 1;
  }
  meta(id: string) { return this.byWork.get(id); }
  get sectionCount() { return this.ft.sections.length; }

  private variants(word: string): string[] {
    if (!this.stems) {
      this.stems = new Map();
      for (const tok of Object.keys(this.ft.postings)) { const s = stem(tok); (this.stems.get(s) ?? this.stems.set(s, []).get(s)!).push(tok); }
    }
    const s = stem(word);
    return [...new Set([...(this.stems.get(s) ?? []), ...(this.ft.postings[word] ? [word] : [])])];
  }
  private union(words: string[]): Set<number> {
    const out = new Set<number>();
    for (const w of words) for (const t of this.variants(w)) for (const i of this.ft.postings[t] ?? []) out.add(i);
    return out;
  }
  /** Squared, so a rare word (Sunday) outweighs a common one (worship). */
  private idf(df: number) { const N = this.ft.sections.length; return Math.log(1 + (N - df + 0.5) / (df + 0.5)) ** 2; }

  /** Authors in the library with the number of works and the earliest year, for pickers. */
  authors(groups: Group[] = ['Fathers', 'Saints']) {
    const m = new Map<string, { id: string; name: string; works: number; year: number | null; names: Map<string, number> }>();
    for (const w of this.lib.works) {
      if (!groups.includes(groupOf(w))) continue;
      const k = authorKey(w.authorId);
      const e = m.get(k) ?? m.set(k, { id: k, name: w.author, works: 0, year: null, names: new Map() }).get(k)!;
      e.works++;
      e.names.set(w.author, (e.names.get(w.author) ?? 0) + 1);
      const y = startYear(w.year);
      if (y != null && (e.year == null || y < e.year)) e.year = y;
    }
    return [...m.values()].map((e) => ({ id: e.id, name: [...e.names.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0], works: e.works, year: e.year })).sort((a, b) => a.name.localeCompare(b.name));
  }

  async search(question: string, loadWork: LoadWork, f: Filters = {}, limit = 24): Promise<SearchResult> {
    const words = queryWords(question);
    const empty: SearchResult = { words, matchedWords: [], unmatchedWords: words, hits: [], sectionsMatched: 0 };
    const groups: TermGroup[] = [];
    for (const word of words) {
      const primary = this.union([word]);
      if (!primary.size) continue;
      const syn = (SIMILAR[stem(word)] ?? SIMILAR[word] ?? []).flatMap((s) => s.split(' ')).filter((s) => !queryWords(question).includes(s));
      const extra = syn.length ? this.union(syn) : new Set<number>();
      groups.push({ word, primary, extra, idf: this.idf(primary.size) });
    }
    if (!groups.length) return empty;

    const allowed = (gi: number) => {
      const [wid] = this.ft.sections[gi];
      const w = this.byWork.get(wid);
      if (!w) return false;
      if (f.authorIds?.length && !f.authorIds.includes(authorKey(w.authorId))) return false;
      if (f.groups?.length && !f.groups.includes(groupOf(w))) return false;
      if (f.bands?.length) { const b = centuryBand(startYear(w.year)); if (!b || !f.bands.includes(b)) return false; }
      return true;
    };
    const k1 = 1.2, b = 0.35;
    const score = new Map<number, { s: number; cov: number }>();
    for (const g of groups) {
      for (const gi of g.primary) {
        if (!allowed(gi)) continue;
        const len = this.secLen[gi] || this.avgLen;
        const norm = (k1 + 1) / (1 + k1 * (1 - b + b * (len / this.avgLen)));
        const e = score.get(gi) ?? score.set(gi, { s: 0, cov: 0 }).get(gi)!;
        e.s += g.idf * norm; e.cov++;
      }
      for (const gi of g.extra) {
        if (g.primary.has(gi) || !allowed(gi)) continue;
        const len = this.secLen[gi] || this.avgLen;
        const e = score.get(gi) ?? score.set(gi, { s: 0, cov: 0 }).get(gi)!;
        e.s += 0.3 * g.idf * (k1 + 1) / (1 + k1 * (1 - b + b * (len / this.avgLen)));
      }
    }
    const maxCov = Math.max(0, ...[...score.values()].map((v) => v.cov));
    if (!maxCov) return { ...empty, matchedWords: groups.map((g) => g.word), unmatchedWords: words.filter((w) => !groups.some((g) => g.word === w)) };
    const need = Math.min(maxCov, Math.ceil(groups.length * 0.6));
    const cands = [...score.entries()].filter(([, v]) => v.cov >= need).sort((a, b2) => b2[1].s - a[1].s).slice(0, 100);
    const topSec = cands[0]?.[1].s || 1;

    const idfSum = groups.reduce((a, g) => a + g.idf, 0);
    const stemIdf = new Map<string, number>();
    for (const g of groups) stemIdf.set(stem(g.word), g.idf);
    // related words count for a little, once per word asked
    const synOf = new Map<string, { parent: string; w: number }>();
    for (const g of groups) for (const sy of (SIMILAR[stem(g.word)] ?? SIMILAR[g.word] ?? []).flatMap((x) => x.split(' '))) if (!stemIdf.has(stem(sy))) synOf.set(stem(sy), { parent: stem(g.word), w: 0.35 * g.idf });
    const hits: Hit[] = [];
    for (const [gi, v] of cands) {
      const [wid, si] = this.ft.sections[gi];
      const meta = this.byWork.get(wid)!;
      const work = await loadWork(wid);
      const sec = work?.sections[si];
      if (!sec) continue;
      const scored: Passage[] = sec.paras.map((text, para) => {
        const toks = text.split(/[^A-Za-zÀ-ÿ]+/).filter((t) => t.length >= 4);
        const n = text.split(/\s+/).length;
        const count = new Map<string, number>();
        for (const t of toks) { const st = stem(t); if (stemIdf.has(st)) count.set(st, (count.get(st) ?? 0) + 1); }
        let s = 0;
        for (const [st, c] of count) s += stemIdf.get(st)! * (1 + 0.35 * Math.log(c));
        const synBest = new Map<string, number>();
        for (const t of toks) { const y = synOf.get(stem(t)); if (y && !count.has(y.parent)) synBest.set(y.parent, y.w); }
        for (const w of synBest.values()) s += w;
        if (!s) return { para, text, score: 0 };
        const len = n < 25 ? n / 25 : n > 300 ? Math.sqrt(300 / n) : 1;
        return { para, text, score: s * len };
      }).filter((p) => p.score > 0).sort((a, b2) => b2.score - a.score);
      if (!scored.length) continue; // matched only through the section's wider vocabulary
      const best = scored[0].score / idfSum;
      const passages = scored.slice(0, 2).filter((p, i) => i === 0 || p.score >= scored[0].score * 0.6);
      const year = startYear(meta.year);
      hits.push({
        workId: wid, sectionIdx: si, sectionTitle: sec.title, workTitle: meta.title, author: meta.author, authorId: authorKey(meta.authorId),
        group: groupOf(meta), kind: meta.kind, yearText: meta.year ?? '', year, band: centuryBand(year),
        score: (0.35 * (v.s / topSec) + 0.65 * Math.min(1.6, best) ** 0.5) * PRIOR[groupOf(meta)], passages, href: `/study/works/${wid}/${si}`,
      });
    }
    hits.sort((a, b2) => b2.score - a.score);
    // no single author fills the list (filter by author to see more)
    const perWork = new Map<string, number>();
    const out = hits.filter((h) => { const n = (perWork.get(h.authorId) ?? 0) + 1; perWork.set(h.authorId, n); return n <= 3; }).slice(0, limit);
    return { words, matchedWords: groups.map((g) => g.word), unmatchedWords: words.filter((w) => !groups.some((g) => g.word === w)), hits: out, sectionsMatched: cands.length };
  }
}

export interface Comparison {
  a: Hit[]; b: Hit[]; words: string[];
  sharedTerms: string[]; onlyA: string[]; onlyB: string[]; yearGap: number | null;
}
/** Best passages from two authors on one topic, plus a plain count of words both passages share. No interpretation. */
export async function compareAuthors(engine: FathersEngine, question: string, authorA: string, authorB: string, loadWork: LoadWork): Promise<Comparison> {
  const [ra, rb] = await Promise.all([
    engine.search(question, loadWork, { authorIds: [authorA] }, 3),
    engine.search(question, loadWork, { authorIds: [authorB] }, 3),
  ]);
  const content = (hs: Hit[]) => new Set(hs.flatMap((h) => h.passages.slice(0, 1)).flatMap((p) => p.text.split(/[^A-Za-zÀ-ÿ]+/).map(fold).filter((w) => w.length >= 5 && !STOP.has(w)).map(stem)));
  const A = content(ra.hits.slice(0, 1)), B = content(rb.hits.slice(0, 1));
  const asked = new Set(ra.words.map(stem));
  const shared = [...A].filter((w) => B.has(w));
  // "key" terms: the words asked about first, then other words both passages use
  const sharedTerms = shared.sort((x, y) => Number(asked.has(y)) - Number(asked.has(x)) || x.localeCompare(y));
  const ya = ra.hits[0]?.year ?? null, yb = rb.hits[0]?.year ?? null;
  return {
    a: ra.hits, b: rb.hits, words: ra.words, sharedTerms,
    onlyA: ra.words.filter((w) => A.has(stem(w)) && !B.has(stem(w))), onlyB: ra.words.filter((w) => B.has(stem(w)) && !A.has(stem(w))),
    yearGap: ya != null && yb != null ? Math.abs(ya - yb) : null,
  };
}

/** Questions to try. Each is checked against the real index by the test. */
export const EXAMPLE_QUESTIONS = [
  'Why do we baptize infants?', 'Sunday worship', 'Is the Eucharist really the body of Christ?', 'Why should we fast?', 'What did the martyrs believe about death?',
  'Can a bishop forgive sins?', 'Should Christians give to the poor?', 'How did early Christians pray?',
];
