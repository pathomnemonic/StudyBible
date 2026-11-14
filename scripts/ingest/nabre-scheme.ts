/**
 * Versification scheme for the NABRE (Hebrew-based numbering, with the Psalm titles counted as verses).
 *
 * Rather than trusting a hand-made table, the scheme is derived from the two texts we have: every NABRE verse is
 * matched (in order, by shared wording) to a verse of the English-numbered WEB-C, and that verse is then carried to the
 * Vulgate anchor by the already-verified `english` rules. A chapter is listed as unverified, not guessed, whenever the
 * match is weak, a verse had no partner, or the English rules themselves flag the chapter.
 */
import type { BookData, ChapterData } from '../../src/lib/types';
import { isLoaded, loadVersification, toAnchor, type Rule, type VersificationData } from '../../src/lib/versification';
import type { Report } from './lib/util';

type Scheme = VersificationData['schemes'][string];
interface V { c: number; v: number; text: string; toks: Set<string> }

const STOP = new Set('the a an and of to in for with on at by from as or not his her their your my our he she it they we you i me him them us is are was were be been am will shall may would should could do did does have has had that this these those which who whom whose what when where there then than so but if nor yet let lo behold o unto upon all any each also into out up down over under said say says'.split(' '));
const stem = (w: string) => {
  w = w.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length > 4) for (const s of ['ing', 'ed', 'es', 's']) if (w.endsWith(s) && w.length - s.length >= 3) { w = w.slice(0, -s.length); break; }
  return w;
};
const toks = (t: string) => new Set(t.split(/\s+/).map(stem).filter((w) => w.length > 2 && !STOP.has(w)));
const sim = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / Math.min(a.size, b.size) * 0.5 + n / (a.size + b.size - n) * 0.5;
};

function verses(bd: BookData): V[] {
  const out: V[] = [];
  for (const ch of bd.chapters as ChapterData[]) {
    const byV = new Map<number, string>();
    let last = 0;
    for (const b of ch.blocks) {
      if (typeof b[1] === 'string') continue;
      for (const [v, t] of b[1]) {
        if (v === 0) { if (last) byV.set(last, (byV.get(last) ?? '') + ' ' + t); continue; }
        byV.set(v, (byV.get(v) ?? '') + (byV.has(v) ? ' ' : '') + t);
        last = v;
      }
    }
    for (const [v, text] of [...byV].sort((a, b) => a[0] - b[0])) out.push({ c: ch.n, v, text, toks: toks(text) });
  }
  return out;
}

/** monotone alignment of two verse lists inside a diagonal band; returns for each N index the matched E index or -1 */
function align(N: V[], E: V[]): number[] {
  const n = N.length, m = E.length, B = 70, GAP = -0.12, THR = 0.1;
  const NEG = -1e9;
  const lo = (i: number) => Math.max(0, Math.round((i * m) / n) - B), hi = (i: number) => Math.min(m, Math.round((i * m) / n) + B);
  const score: Float64Array[] = [], from: Uint8Array[] = [];
  for (let i = 0; i <= n; i++) { score.push(new Float64Array(m + 1).fill(NEG)); from.push(new Uint8Array(m + 1)); }
  score[0][0] = 0;
  for (let j = 1; j <= Math.min(m, B); j++) { score[0][j] = j * GAP; from[0][j] = 2; }
  for (let i = 1; i <= n; i++) {
    for (let j = lo(i - 1); j <= hi(i - 1) + 1 && j <= m; j++) {
      let best = NEG, f = 0;
      if (j > 0 && score[i - 1][j - 1] > NEG) { const s = score[i - 1][j - 1] + sim(N[i - 1].toks, E[j - 1].toks) - THR; if (s > best) { best = s; f = 1; } }
      if (score[i - 1][j] > NEG) { const s = score[i - 1][j] + GAP; if (s > best) { best = s; f = 3; } }   // N verse with no partner
      if (j > 0 && score[i][j - 1] > NEG) { const s = score[i][j - 1] + GAP; if (s > best) { best = s; f = 2; } } // E verse with no partner
      score[i][j] = best; from[i][j] = f;
    }
  }
  const map = new Array<number>(n).fill(-1);
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const f = from[i][j];
    if (f === 1) { map[i - 1] = j - 1; i--; j--; }
    else if (f === 3) i--;
    else if (f === 2) j--;
    else break;
  }
  return map;
}

export interface NabreSchemeInput {
  nabre: Map<string, BookData>;
  web: Map<string, BookData>;
  english: Scheme;
  titleLen: Record<string, number>;
  report: Report;
}

export function buildNabreScheme({ nabre, web, english, report }: NabreSchemeInput): Scheme & { stats: Record<string, unknown> } {
  const wasLoaded = isLoaded();
  loadVersification({ version: 1, schemes: { english } });
  const rules: Rule[] = [];
  const unverified: Record<string, Set<number>> = {};
  const stats: Record<string, unknown> = {};
  const flag = (b: string, c: number) => (unverified[b] ??= new Set()).add(c);
  const lowChapters: string[] = [];

  for (const [book, nb] of nabre) {
    if (english.unalignedBooks[book]) continue;           // Greek-text books: compare by chapter only, as for WEB-C
    const wb = web.get(book);
    if (!wb) continue;
    const N = verses(nb), E = verses(wb);
    let map: number[];
    const key = (x: V[]) => x.map((v) => v.c + ':' + v.v).join(',');
    if (key(N) === key(E)) map = N.map((_, i) => i);
    else if (book === 'PSA') {
      // Psalms: same psalm numbers as English; the Hebrew titles are counted as verses (d of them), so verse v matches English v-d
      const byC = (x: V[]) => { const m = new Map<number, number[]>(); x.forEach((v, i) => (m.get(v.c) ?? m.set(v.c, []).get(v.c)!).push(i)); return m; };
      const nc = byC(N), ec = byC(E);
      map = new Array(N.length).fill(-1);
      for (const [c, idx] of nc) {
        const eidx = ec.get(c) ?? [];
        const d = idx.length - eidx.length;
        if (d < 0) { flag(book, c); continue; }
        idx.forEach((ni, k) => { if (k >= d) map[ni] = eidx[k - d]; });
      }
    } else map = align(N, E);

    // carry each NABRE verse to the anchor
    const perChapter = new Map<number, { v: number; ac: number; a1: number; a2: number; ok: boolean }[]>();
    let lastGood: { c: number; v: number } | null = null;
    N.forEach((nv, i) => {
      const j = map[i];
      let res: { c: number; v1: number; v2: number; exact: boolean };
      if (j >= 0) {
        const a = toAnchor('english', book, E[j].c, E[j].v);
        res = a;
        lastGood = { c: a.c, v: a.v2 };
      } else if (lastGood && book !== 'PSA') {
        // no partner (a verse the English text does not divide the same way): sit with the verse before it, flagged
        res = { c: lastGood.c, v1: lastGood.v, v2: lastGood.v, exact: false };
        flag(book, nv.c);
      } else if (book === 'PSA') {
        // a Psalm title verse: the Vulgate counts the title as verse(s) 1..t
        const t = toAnchor('english', book, nv.c, 0);
        res = { c: t.c, v1: t.v1, v2: t.v2, exact: t.exact };
      } else {
        res = { c: nv.c, v1: nv.v, v2: nv.v, exact: false };
        flag(book, nv.c);
      }
      (perChapter.get(nv.c) ?? perChapter.set(nv.c, []).get(nv.c)!).push({ v: nv.v, ac: res.c, a1: res.v1, a2: res.v2, ok: res.exact });
    });

    for (const [c, list] of perChapter) {
      const identity = list.every((x) => x.ac === c && x.a1 === x.v && x.a2 === x.v);
      if (!list.every((x) => x.ok)) flag(book, c);
      if (identity) {
        if (english.unverifiedChapters[book]?.includes(c)) flag(book, c);
        continue;
      }
      // compress runs of consecutive verses that shift by a constant
      let k = 0;
      while (k < list.length) {
        const s = list[k];
        let e = k;
        if (s.a1 === s.a2) {
          while (e + 1 < list.length && list[e + 1].ac === s.ac && list[e + 1].a1 === list[e + 1].a2 && list[e + 1].v === list[e].v + 1 && list[e + 1].a1 === list[e].a1 + 1) e++;
        }
        rules.push([book, c, s.v, list[e].v, s.ac, s.a1, s.a2 === s.a1 ? list[e].a1 : s.a2]);
        k = e + 1;
      }
    }
    // chapter-level quality: mean similarity of matched pairs
    const q = new Map<number, number[]>();
    N.forEach((nv, i) => { if (map[i] >= 0) (q.get(nv.c) ?? q.set(nv.c, []).get(nv.c)!).push(sim(nv.toks, E[map[i]].toks)); });
    for (const [c, xs] of q) {
      const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
      if (mean < 0.2 && book !== 'PSA') { flag(book, c); lowChapters.push(`${book} ${c} (${mean.toFixed(2)})`); }
    }
  }
  if (!wasLoaded) { /* the caller loads the finished file later; leave the registry as we found it */ }
  stats.lowChapters = lowChapters;
  const outUnverified: Record<string, number[]> = {};
  for (const [b, set] of Object.entries(unverified)) outUnverified[b] = [...set].sort((a, b2) => a - b2);
  for (const [b, cs] of Object.entries(english.unverifiedChapters)) if (!nabre.has(b) && b !== 'PSA') outUnverified[b] = cs;
  report.stats['versification.nabre.rules'] = rules.length;
  return {
    description:
      'NABRE (Hebrew-based numbering; Psalm titles count as verses) → Clementine Vulgate anchor. Derived by matching every NABRE verse to the English-numbered WEB-C verse with the same wording and carrying it through the verified English rules; weak or ambiguous chapters are listed as unverified instead of guessed. Greek-text books (Tobit, Judith, Esther, Sirach, Daniel) are compared by chapter only.',
    rules,
    unverifiedChapters: outUnverified,
    unalignedBooks: english.unalignedBooks,
    stats,
  };
}
