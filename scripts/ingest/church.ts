import { join } from 'node:path';
import { lookupBook, refId, type Ref } from '../../src/lib/refs';
import { toAnchor } from '../../src/lib/versification';
import { PUBLIC_DATA, RAW, readJson, readText, REGISTRY, Report, today, writeJson, exists } from './lib/util';

/**
 * Magisterial documents → Scripture. For each numbered article/paragraph of a Vatican document we record WHICH Scripture
 * references appear in it (in the text or its footnotes) and link to the Vatican's page. No document text is stored.
 */
interface Doc {
  id: string;
  title: string;
  short: string;
  author: string;
  date: string;
  kind: string;
  focus: string;
  url: string;
  era: 'pre-1965' | 'post-1965';
}

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(+n))
    .replace(/&[a-z]+;/g, ' ');
const strip = (h: string) => decode(h.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

const ROMAN = '(?:x{0,3}(?:ix|iv|v?i{0,3}))';
/** Older style: "Luke, x. 16", "2 Tim. iii. 16, 17". */
const ROMAN_RE = new RegExp(`((?:[1-3]\\s?)?[A-Z][a-z]{1,12}\\.?),?\\s+(${ROMAN})\\.\\s?(\\d{1,3})(?:\\s?[-–]\\s?(\\d{1,3}))?`, 'g');
const fromRoman = (r: string) => {
  const v: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100 };
  let n = 0;
  for (let i = 0; i < r.length; i++) n += v[r[i]] < (v[r[i + 1]] ?? 0) ? -v[r[i]] : v[r[i]];
  return n;
};
const REF_RE = /((?:[1-3]\s?)?[A-Z][a-z]{1,12}\.?)\s+(\d{1,3}):(\d{1,3})(?:\s?[-–]\s?(\d{1,3})(?::(\d{1,3}))?)?((?:,\s?\d{1,3}(?:\s?[-–]\s?\d{1,3})?(?![\d:]))*)/g;

/** Scripture references in a piece of text, as modern-numbered Refs. Only forms with chapter:verse are accepted. */
export function scriptureRefs(text: string): Ref[] {
  const out: Ref[] = [];
  for (const m of text.matchAll(REF_RE)) {
    const book = lookupBook(m[1].replace(/\.$/, ''));
    if (!book) continue;
    const c = +m[2];
    const v1 = +m[3];
    const endCh = m[5] ? +m[4] : c;
    const v2 = m[5] ? +m[5] : m[4] ? +m[4] : v1;
    out.push({ book, c1: c, v1, c2: endCh, v2 });
    for (const extra of (m[6] ?? '').split(',').map((x) => x.trim()).filter(Boolean)) {
      const [a, b] = extra.split(/\s?[-–]\s?/).map(Number);
      if (a) out.push({ book, c1: c, v1: a, c2: c, v2: b ?? a });
    }
  }
  for (const m of text.matchAll(ROMAN_RE)) {
    if (!m[2]) continue;
    const book = lookupBook(m[1].replace(/\.$/, ''));
    if (!book) continue;
    const c = fromRoman(m[2]);
    if (c < 1) continue;
    out.push({ book, c1: c, v1: +m[3], c2: c, v2: m[4] ? +m[4] : +m[3] });
  }
  return out;
}

/** Splits a document into numbered articles and gathers footnote text for each. */
export function splitArticles(html: string): { n: number; text: string; foot: string }[] {
  // footnote definitions (Vatican layout: <div id="ftnN"> ... <a name="_ftnN">[N]</a> text)
  const footIdx = html.search(/<div id="ftn1"/);
  const body = footIdx > 0 ? html.slice(0, footIdx) : html;
  const feet = new Map<number, string>();
  if (footIdx > 0) {
    for (const m of html.slice(footIdx).matchAll(/<a name="_ftn(\d+)"[^>]*>\s*\[\d+\]\s*<\/a>([\s\S]*?)<\/p>/g)) feet.set(+m[1], strip(m[2]));
  }
  const paras = body.split(/<\/p>|<p[^>]*>|<br\s*\/?>|<\/div>|<\/center>/i);
  const arts: { n: number; text: string; foot: string }[] = [];
  let cur: { n: number; text: string; foot: string } | null = null;
  let endnotes = false; // "Article 13:" style endnote blocks (Dei Verbum)
  let target: { n: number; text: string; foot: string } | undefined;
  for (const p of paras) {
    const plain = strip(p);
    const en = /^Article (\d{1,3}):?$/.exec(plain);
    if (en) {
      endnotes = true;
      target = arts.find((x) => x.n === +en[1]);
      continue;
    }
    if (endnotes) {
      if (target) target.foot += ' ' + plain;
      continue;
    }
    // trailing footnote lists "(12) Cf. …" and "Notes" blocks: their numbers do not belong to any article
    if (/^\(\d{1,3}\)\s+\S/.test(plain) || /^(Notes?|Footnotes?)$/i.test(plain)) {
      endnotes = true;
      target = undefined;
      continue;
    }
    const num = /^(\d{1,3})\.\s+\S/.exec(plain);
    // numbers must increase; small gaps are allowed because some paragraphs carry their number inside other markup
    if (num && +num[1] > (cur?.n ?? 0) && +num[1] <= (cur?.n ?? 0) + 6) {
      cur = { n: +num[1], text: '', foot: '' };
      arts.push(cur);
    }
    if (!cur) continue;
    cur.text += ' ' + plain;
    for (const f of p.matchAll(/href="#_ftn(\d+)"/g)) cur.foot += ' ' + (feet.get(+f[1]) ?? '');
  }
  return arts;
}

/** Pre-Vatican-II documents sometimes use Vulgate Psalm numbers; those citations are skipped, not guessed. */
export function buildChurchDocs(report: Report) {
  const reg = readJson(join(REGISTRY, 'church-documents.json')).documents as Doc[];
  const vcPath = join(PUBLIC_DATA, 'editions.json');
  void vcPath;
  const byBook = new Map<string, any[]>();
  const docsOut: any[] = [];
  let total = 0;
  for (const [di, d] of reg.entries()) {
    const f = join(RAW, `church_${d.id}.html`);
    if (!exists(f)) {
      report.warn(`church: ${d.id} not fetched`);
      continue;
    }
    const html = readText(f);
    const arts = splitArticles(html);
    let refCount = 0;
    const articlesWithRefs = new Set<number>();
    if (arts.length < 5) report.warn(`church: ${d.id}: only ${arts.length} numbered articles found; document will be listed without verse links`);
    for (const a of arts) {
      const seen = new Set<string>();
      for (const r of [...scriptureRefs(a.text), ...scriptureRefs(a.foot)]) {
        if (d.era === 'pre-1965' && r.book === 'PSA') continue;
        const x = toAnchor('kjv', r.book, r.c1, r.v1 ?? 1);
        const y = toAnchor('kjv', r.book, r.c2, r.v2 ?? r.v1 ?? 1);
        const id = refId({ book: r.book, c1: x.c, v1: x.v1, c2: y.c, v2: Math.max(y.v2, x.v1) });
        const key = `${a.n}|${id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const m = /^[1-3A-Z]{3}\.(\d+)\.(\d+)(?:-(?:(\d+)\.)?(\d+))?$/.exec(id);
        if (!m) continue;
        const c1 = +m[1];
        const v1 = +m[2];
        const c2 = m[3] ? +m[3] : c1;
        const v2 = m[4] ? +m[4] : v1;
        (byBook.get(r.book) ?? byBook.set(r.book, []).get(r.book)!).push([c1, v1, c2, v2, di, a.n]);
        refCount++;
        articlesWithRefs.add(a.n);
      }
    }
    total += refCount;
    docsOut.push({ ...d, articles: arts.length, articlesWithRefs: articlesWithRefs.size, citations: refCount });
  }
  for (const [book, list] of byBook) writeJson(join(PUBLIC_DATA, 'magisterium', `${book}.json`), list);
  writeJson(join(PUBLIC_DATA, 'magisterium/index.json'), { generated: today(), note: 'Article numbers and Scripture references only. No document text is stored. Texts © Libreria Editrice Vaticana; links go to vatican.va.', documents: docsOut }, true);
  report.stats['church'] = { documents: docsOut.length, citations: total, books: byBook.size, perDoc: Object.fromEntries(docsOut.map((x) => [x.id, `${x.articlesWithRefs}/${x.articles} articles, ${x.citations} refs`])) };
}
