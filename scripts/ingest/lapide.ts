// @ts-nocheck (work in progress)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_DATA, RAW, Report, sha256, writeJson } from './lib/util';

/**
 * Cornelius a Lapide, *The Great Commentary*, English translation (Thomas W. Mossman and others; W. F. Cobb for the Epistles to the
 * Corinthians and Galatians), as printed by John Grant, Edinburgh, 1908 (Internet Archive scans of the University of Virginia copies,
 * Google-digitised, OCR text). The translation was made 1876-1908; the printing is pre-1929, so the text is public domain in the US
 * (the Internet Archive items carry a "Public Domain Mark" licence). See docs/DATA_SOURCES.md.
 *
 * The raw OCR text is cached under data/raw/lapide (ignored by git); the build writes public/data/commentary/lapide/<BOOK>.json
 * (rows [c1, v1, c2, v2, text], the same shape as haydock) and an index.json with provenance and per-book coverage notes.
 *
 * Shape of the source: each chapter is  `CHAPTER N` heading, a one-paragraph argument, the Authorized Version text of the chapter
 * (verse 1 unnumbered, then `2 ...`), and then the commentary. The commentary is either `Ver. 12. - words of the verse. ...` blocks,
 * or (Matthew 1-21 chiefly) plain paragraphs that begin with the words of the verse being explained. The second kind is placed by
 * matching the opening words of the paragraph against the printed verse text; a paragraph that cannot be matched stays with the
 * block before it, so nothing is dropped or reordered.
 */
const UA = 'StudyBibleApp/1.0 (+https://github.com/pathomnemonic/StudyBible)';
const DIR = join(RAW, 'lapide');
const OUT = join(PUBLIC_DATA, 'commentary/lapide');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface BookSpec { book: string; name: string; chapters: number; single?: RegExp; kind: 'chapters' | 'single'; colonLemma?: boolean; endBefore?: RegExp }
interface VolSpec { id: string; vol: number; title: string; translator: string; edition: string; year: number; books: BookSpec[] }

const J = 'Thomas W. Mossman, B.A., assisted by various scholars';
const C = 'W. F. Cobb, D.D. (translated and edited)';
export const VOLUMES: VolSpec[] = [
  { id: 'TheGreatCommentaryOfCorneliusALapideV1', vol: 1, title: "S. Matthew's Gospel, chaps. I-IX", translator: J, edition: 'Sixth edition', year: 1908, books: [{ book: 'MAT', name: 'Matthew', chapters: 9, kind: 'chapters' }] },
  { id: 'TheGreatCommentaryOfCorneliusALapideV2', vol: 2, title: "S. Matthew's Gospel, chaps. X-XXI", translator: J, edition: 'Fourth edition', year: 1908, books: [{ book: 'MAT', name: 'Matthew', chapters: 12, kind: 'chapters' }] },
  { id: 'TheGreatCommentaryOfCorneliusALapideV3', vol: 3, title: "S. Matthew's Gospel, chaps. XXII-XXVIII; S. Mark's Gospel", translator: J, edition: 'Fifth edition', year: 1908, books: [{ book: 'MAT', name: 'Matthew', chapters: 7, kind: 'chapters', endBefore: /^END OF S\. ?MATTHEW/i }, { book: 'MRK', name: 'Mark', chapters: 16, kind: 'chapters' }] },
  { id: 'TheGreatCommentaryOfCorneliusALapideV4', vol: 4, title: "S. Luke's Gospel", translator: J, edition: 'Fourth edition', year: 1908, books: [{ book: 'LUK', name: 'Luke', chapters: 24, kind: 'chapters' }] },
  { id: 'TheGreatCommentaryOfCorneliusALapideV5', vol: 5, title: "S. John's Gospel, chaps. I-XI", translator: J, edition: 'Third edition', year: 1908, books: [{ book: 'JHN', name: 'John', chapters: 11, kind: 'chapters' }] },
  {
    id: 'TheGreatCommentaryOfCorneliusALapideV6', vol: 6, title: "S. John's Gospel, chaps. XII-XXI; Epistles I, II and III of S. John", translator: J, edition: 'Fourth edition', year: 1908,
    books: [
      { book: 'JHN', name: 'John', chapters: 10, kind: 'chapters', endBefore: /^(THE )?FIRST EPISTLE (GENERAL )?OF S\. ?JOHN\.?$|^COMMENTARY UPON THE (FIRST )?EPISTLE/i },
      { book: '1JN', name: '1 John', chapters: 5, kind: 'chapters', endBefore: /^EPISTLE OF S\. ?JOHN\.?$|^PREFACE TO JOHN/i },
      { book: '2JN', name: '2 John', chapters: 1, kind: 'single', single: /^THE SECOND EPISTLE OF/i, colonLemma: true, endBefore: /^THE THIRD EPISTLE OF/i },
      { book: '3JN', name: '3 John', chapters: 1, kind: 'single', single: /^THE THIRD EPISTLE OF/i, colonLemma: true, endBefore: /^THE END\.?$/i },
    ],
  },
  { id: 'TheGreatCommentaryOfCorneliusALapideV7', vol: 7, title: 'I Corinthians', translator: C, edition: 'first edition of the volume (undated edition statement)', year: 1908, books: [{ book: '1CO', name: '1 Corinthians', chapters: 16, kind: 'chapters' }] },
  { id: 'TheGreatCommentaryOfCorneliusALapideV8', vol: 8, title: 'II Corinthians and Galatians', translator: C, edition: 'first edition of the volume (undated edition statement)', year: 1908, books: [{ book: '2CO', name: '2 Corinthians', chapters: 13, kind: 'chapters', endBefore: /^THE EPISTLE (OF S\. PAUL )?TO THE GALATIANS\.?$/i }, { book: 'GAL', name: 'Galatians', chapters: 6, kind: 'chapters' }] },
];

export async function fetchLapide() {
  mkdirSync(DIR, { recursive: true });
  for (const v of VOLUMES) {
    for (const [url, name] of [[`https://archive.org/download/${v.id}/${v.id}_djvu.txt`, `${v.id}.txt`], [`https://archive.org/metadata/${v.id}`, `${v.id}.meta.json`]] as const) {
      const f = join(DIR, name);
      if (existsSync(f)) continue;
      const r = await fetch(url, { headers: { 'user-agent': UA } });
      if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
      writeFileSync(f, Buffer.from(await r.arrayBuffer()));
      console.log(`lapide: fetched ${name}`);
      await sleep(1200);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Cleaning

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };
/** `CHAPTER XIL`, `CHAPTER L` ... OCR reads the final I of a numeral as L or l or 1, and the second I of II as T. */
function parseChapterHeading(s: string): number | null {
  const m = /^CHAPTER\s+([IVXLlT1]{1,7})\s*[.,*:;]?\s*$/.exec(s.trim());
  if (!m) return null;
  const r = m[1].replace(/[lT1]/g, 'I').replace(/L$/, 'I');
  if (/L/.test(r)) return null;
  let n = 0;
  for (let i = 0; i < r.length; i++) {
    const a = ROMAN[r[i]], b = ROMAN[r[i + 1]] ?? 0;
    n += a < b ? -a : a;
  }
  return n;
}

const isDigitized = (s: string) => /^(Digit|Digged|Digiti)/i.test(s) || /^Google\s*$/i.test(s) || /ooQ?Q?le\s*$/i.test(s) || /^(L|G|C|v|V)?[\^.,]*(o|O|0)+(Q|g|G)(l|i)e\s*$/.test(s);
const letters = (s: string) => s.replace(/[^A-Za-z]/g, '');
const upperRatio = (s: string) => { const l = letters(s); return l ? l.replace(/[^A-Z]/g, '').length / l.length : 0; };
const pageNo = (s: string) => /^[\dIlOoSs]{1,4}(?: \d)?$/.test(s);
const HEAD_WORDS = /\b(S\.? ?(MATTHEW|MARK|LUKE|JOHN)|EPISTLE|GOSPEL|CORINTHIANS|CORINTHTANS|GALATIANS|PREFACE|C\.? ?[IVXL1]+\.?)\b/i;
/** Running heads: `S. LUKE, C. XII.`, `146 SECOND EPISTLE TO THE CORINTHIANS, C. X.`, `THE HOLY GOSPEL OF S. LUKE. 75`. */
const isRunningHead = (s: string) => s.length < 100 && upperRatio(s) > 0.7 && HEAD_WORDS.test(s) && !/^CHAPTER\b/.test(s);
const isHeaderish = (s: string) => pageNo(s) || isRunningHead(s) || (s.length <= 80 && letters(s).length >= 3 && upperRatio(s) > 0.8 && s.split(/\s+/).length <= 9 && !/^Ver/i.test(s));

/** Removes scan boilerplate, page numbers, running heads and signature marks. Chapter headings that were not chosen as the real heading go too. */
function cleanLines(raw: string[]): string[] {
  const out: string[] = [];
  let header = 0; // non-blank header lines still to swallow after a page break
  for (let s of raw) {
    s = s.replace(/\s+/g, ' ').trim();
    if (isDigitized(s)) { header = 6; continue; }
    if (!s) { out.push(''); continue; }
    if (header > 0) {
      if (isHeaderish(s) || parseChapterHeading(s) !== null) { header--; continue; }
      header = 0;
    }
    if (isRunningHead(s) || parseChapterHeading(s) !== null) continue;
    if (/^VOL\.? ?[IVXLvl1]+\.? ?\d*[A-Z]?$/.test(s) || /^[B-HJ-Z]$/.test(s) || pageNo(s)) continue;
    out.push(s);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Paragraphs

interface Corpus { freq: Map<string, number>; hyph: Set<string> }
function buildCorpus(lines: string[]): Corpus {
  const freq = new Map<string, number>();
  const hyph = new Set<string>();
  for (const l of lines) {
    for (const w of l.toLowerCase().match(/[a-zà-ÿ]+(?:-[a-zà-ÿ]+)*/g) ?? []) {
      if (w.includes('-')) hyph.add(w);
      else freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  return { freq, hyph };
}

/** A line ending in `-` is either a syllable break (drop the hyphen) or a real compound (keep it): decided by how the corpus spells the word elsewhere. */
function joinHyphen(prev: string, next: string, corpus: Corpus): string {
  const left = /([A-Za-zà-ÿ]+)-$/.exec(prev);
  const right = /^([A-Za-zà-ÿ]+)/.exec(next);
  if (!left || !right || !/^[a-zà-ÿ]/.test(next)) return prev + ' ' + next;
  const a = left[1].toLowerCase(), b = right[1].toLowerCase();
  const solid = corpus.freq.get(a + b) ?? 0;
  if (!solid && corpus.hyph.has(`${a}-${b}`)) return prev + next; // keep the hyphen
  return prev.slice(0, -1) + next;
}

function toParagraphs(lines: string[], corpus: Corpus): string[] {
  const paras: string[] = [];
  let cur = '';
  let brk = false;
  for (const l of lines) {
    if (!l) { brk = true; continue; }
    if (!cur) { cur = l; brk = false; continue; }
    if (brk) {
      const terminal = /[.!?:;”"')\]*—]$/.test(cur);
      // a blank line that falls in mid-sentence (page break) does not end the paragraph
      if (terminal || !/^[a-zà-ÿ(“‘'"]/.test(l)) { paras.push(cur); cur = l; brk = false; continue; }
    }
    cur = cur.endsWith('-') ? joinHyphen(cur, l, corpus) : cur + ' ' + l;
    brk = false;
  }
  if (cur) paras.push(cur);
  return paras;
}

/** Typographic repair only: stray space before punctuation and the backslash the OCR makes of an italic comma. */
function tidy(t: string): string {
  return t
    .replace(/\s*\\\s+/g, ', ')
    .replace(/\s+([,.;:!?])(?=\s|$)/g, '$1')
    .replace(/ {2,}/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Verses

const fixDigits = (s: string) => s.replace(/[Il]/g, '1').replace(/[Oo]/g, '0').replace(/[Ss$]/g, '5');
const NUM = '[\\dIlOoSs$]{1,3}(?: [\\dIlOo])?';
const MARK = new RegExp(`^(?:Vers?|Yer|Vor)s?\\s*\\.?\\s*(${NUM}(?:\\s*(?:,|and|&|to|-|–)\\s*${NUM})*)\\s*([.,:;—–-]|(?=\\s+[A-Z]))`);

function parseVerseNums(s: string): number[] {
  const out: number[] = [];
  for (const part of s.split(/\s*(?:,|and|&|to|-|–)\s*/)) {
    const t = fixDigits(part.trim());
    const joined = t.replace(/ /g, '');
    if (/^\d+$/.test(joined)) out.push(+joined);
  }
  return out;
}

interface Marker { v1: number; v2: number; rest: string }
function readMarker(p: string, cur: number, max: number): Marker | null {
  const m = MARK.exec(p);
  if (!m) return null;
  let nums = parseVerseNums(m[1]);
  if (!nums.length) return null;
  // "1 6" can be 16 or (rarely) 1, 6: take the joined reading when it is in range
  nums = nums.filter((n) => n >= 1 && n <= max);
  if (!nums.length) return null;
  const v1 = nums[0], v2 = Math.max(...nums);
  if (v1 < cur) return null;
  const rest = p.slice(m[0].length).replace(/^[\s.,:;—–-]+/, '');
  return { v1, v2: v2 >= v1 ? v2 : v1, rest };
}

const norm = (w: string) => w.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
const toks = (s: string) => s.split(/\s+/).map(norm).filter(Boolean);
function lev1(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
}

interface ChapterText { verses: Map<number, string[]>; scriptureEnd: number; maxVerse: number }

/** Reads the chapter's printed text: verse 1 is the unnumbered paragraph before `2 ...`. Returns where the commentary begins (paragraph index). */
function readScripture(paras: string[], maxVerse: number): ChapterText {
  const verses = new Map<number, string[]>();
  const numAt = (p: string) => {
    const m = new RegExp(`^(${NUM})\\s+\\S`).exec(p);
    if (!m) return null;
    const n = +fixDigits(m[1]).replace(/ /g, '');
    return Number.isFinite(n) ? n : null;
  };
  let expected = 2;
  let end = -1;
  let first2 = -1;
  for (let i = 0; i < Math.min(paras.length, 250); i++) {
    const n = numAt(paras[i]);
    if (n === expected || (n !== null && n > expected && n <= expected + 2 && n <= maxVerse)) {
      if (first2 < 0 && n === 2) first2 = i;
      if (first2 >= 0 || n === expected) { verses.set(n, toks(paras[i].replace(new RegExp(`^${NUM}\\s+`), ''))); end = i; expected = n + 1; }
    } else if (first2 >= 0 && /^\D/.test(paras[i]) && n === null) {
      // a verse that continues over a page break, or the unnumbered tail: stays scripture only if no commentary has begun
      if (i === end + 1 && expected <= maxVerse && !MARK.test(paras[i])) { const v = expected - 1; verses.set(v, [...(verses.get(v) ?? []), ...toks(paras[i])]); end = i; }
      else if (expected > maxVerse || i > end + 1) break;
    } else if (first2 >= 0 && i > end + 1) break;
    if (expected > maxVerse + 1) break;
  }
  if (first2 > 0) verses.set(1, toks(paras[first2 - 1]));
  else if (end < 0) return { verses, scriptureEnd: -1, maxVerse };
  // scripture may run on after the last numbered verse (page-break continuation lines starting with digits)
  while (end + 1 < paras.length && numAt(paras[end + 1]) !== null && !MARK.test(paras[end + 1]) && expected <= maxVerse) { end++; expected++; }
  return { verses, scriptureEnd: end, maxVerse };
}

/** Which verse does a paragraph begin with the words of? Tolerant of OCR slips; only looks forward from `cur`. */
function lemmaVerse(p: string, ch: ChapterText, cur: number, colon: boolean): number | null {
  let head = p;
  if (colon) {
    const m = /^([A-Z][A-Za-z]+(?: [A-Za-z]+){0,3}):\s/.exec(p);
    if (!m) return null;
    head = m[1];
  }
  const t = toks(head.slice(0, 160)).slice(0, 6);
  const need = colon ? Math.min(t.length, 2) : 4;
  if (t.length < need || !t.length) return null;
  let best: { v: number; score: number } | null = null;
  const hi = Math.min(ch.maxVerse, cur + 12);
  for (let v = Math.max(cur, 1); v <= hi; v++) {
    const vt = ch.verses.get(v);
    if (!vt) continue;
    // the lemma may run over into the next verse, so match against this verse followed by the next
    const stream = [...vt, ...(ch.verses.get(v + 1) ?? [])];
    for (let s = 0; s < vt.length; s++) {
      let score = 0;
      for (let i = 0; i < t.length && s + i < stream.length; i++) if (lev1(t[i], stream[s + i])) score++; else if (i < 2) break;
      if (!best || score > best.score) best = { v, score };
    }
  }
  if (!best) return null;
  const goal = colon ? need : Math.min(t.length, 5) - 1;
  if (best.score < Math.max(goal, colon ? 1 : 4)) return null;
  if (colon && t.length === 1 && t[0].length < 4) return null;
  return best.v;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Build

type Row = [number, number, number, number, string];
interface Block { v1: number; v2: number; paras: string[]; via: 'marker' | 'lemma' | 'intro' }

function verseCounts(book: string): number[] {
  const f = join(PUBLIC_DATA, 'bible/webc', `${book}.json`);
  const d = JSON.parse(readFileSync(f, 'utf8'));
  return d.chapters.map((c: any) => Math.max(0, ...c.blocks.flatMap((b: any) => (b[0] === 'p' ? b[1].map((x: any) => x[0]) : []))));
}

interface ChapterResult { c: number; rows: Row[]; markers: number; lemmas: number; maxVerse: number; covered: number; mode: 'verse' | 'chapter'; note?: string }

function parseChapter(c: number, body: string[], maxVerse: number, corpus: Corpus, colon: boolean, report: Report, tag: string): ChapterResult {
  const paras = toParagraphs(cleanLines(body), corpus);
  const scr = readScripture(paras, maxVerse);
  const blocks: Block[] = [];
  const start = scr.scriptureEnd + 1;
  let cur = 1;
  let blk: Block | null = null;
  const push = (v1: number, v2: number, via: Block['via'], text: string) => { blk = { v1, v2, paras: text ? [text] : [], via }; blocks.push(blk); };
  push(1, 1, 'intro', '');
  const intro = blocks[0];
  // does the chapter use `Ver. N` blocks (then trust them alone) or opening-word paragraphs?
  const explicit = paras.slice(start).filter((p) => !!readMarker(p, 1, maxVerse)).length;
  const useLemma = explicit < Math.max(3, 0.4 * maxVerse);
  let markers = 0, lemmas = 0;
  let sawFirst = false;
  for (let i = Math.max(start, 0); i < paras.length; i++) {
    const p = paras[i];
    const mk = readMarker(p, sawFirst ? cur : 1, maxVerse);
    if (mk) {
      markers++;
      if ((blk as any) && (blk as any).via !== "intro" && (blk as any).v1 === mk.v1 && (blk as any).v2 === mk.v2) { if (mk.rest) (blk as any).paras.push(mk.rest); }
      else push(mk.v1, mk.v2, 'marker', mk.rest);
      cur = mk.v2;
      sawFirst = true;
      continue;
    }
    if (useLemma && (!blk || true)) {
      const v = lemmaVerse(p, scr, sawFirst ? cur : 1, colon);
      if (v !== null && (!sawFirst || v > cur || (v === cur && blk?.via === 'intro'))) {
        lemmas++;
        push(v, v, 'lemma', p);
        cur = v;
        sawFirst = true;
        continue;
      }
    }
    (blk as Block).paras.push(p);
  }
  const rows: Row[] = [];
  const covered = new Set<number>();
  // when the chapter produced nothing verse-anchored, say so and give the whole commentary as one chapter-level row
  const anchored = blocks.filter((b) => b.via !== 'intro');
  if (!anchored.length || (anchored.length < 2 && maxVerse > 6 && !colon)) {
    const all = blocks.flatMap((b) => b.paras).map(tidy).filter(Boolean).join('\n\n');
    if (all) rows.push([c, 1, c, maxVerse, all]);
    report.warn(`lapide: ${tag} ${c}: no verse-level structure found, kept as one chapter-level row`);
    return { c, rows, markers, lemmas, maxVerse, covered: 0, mode: 'chapter' };
  }
  // the intro (everything between the printed text and the first block) is a row on verse 1
  for (const b of blocks) {
    const text = b.paras.map(tidy).filter(Boolean).join('\n\n');
    if (!text) continue;
    rows.push([c, b.v1, c, b.v2, text]);
    if (b.via !== 'intro') for (let v = b.v1; v <= b.v2; v++) covered.add(v);
  }
  void intro;
  return { c, rows, markers, lemmas, maxVerse, covered: covered.size, mode: 'verse' };
}

function findHeadings(lines: string[], from: number, to: number, chapters: number): number[] {
  const idx: number[] = [];
  let want = 1;
  let pos = from;
  for (let i = from; i < to && want <= chapters; i++) {
    const n = parseChapterHeading(lines[i].replace(/\s+/g, ' ').trim());
    if (n === want) { idx.push(i); want++; pos = i; }
  }
  void pos;
  return idx;
}

export function buildLapide(report: Report) {
  if (!existsSync(join(DIR, `${VOLUMES[0].id}.txt`))) { report.warn('lapide: raw text missing (run: npx tsx scripts/ingest/lapide.ts fetch); Lapide is skipped'); return; }
  const byBook = new Map<string, Row[]>();
  const books: any[] = [];
  const volumes: any[] = [];
  for (const v of VOLUMES) {
    const file = join(DIR, `${v.id}.txt`);
    if (!existsSync(file)) { report.warn(`lapide: ${v.id} not fetched`); continue; }
    const raw = readFileSync(file, 'utf8');
    const meta = existsSync(join(DIR, `${v.id}.meta.json`)) ? JSON.parse(readFileSync(join(DIR, `${v.id}.meta.json`), 'utf8')) : null;
    const rights = meta?.metadata?.licenseurl ?? '';
    // Rights gate: the title page of every volume must show an Edinburgh/John Grant 1908 imprint (pre-1929) and the scan must carry a public-domain mark.
    const front = raw.slice(0, 12000);
    if (!/\b1908\b/.test(front) || !/JOHN GRANT/i.test(front)) { report.warn(`lapide: ${v.id}: imprint year/publisher not confirmed on the title page; skipped`); continue; }
    if (!/publicdomain/i.test(rights)) { report.warn(`lapide: ${v.id}: no public-domain mark in the Internet Archive record; skipped`); continue; }
    volumes.push({ vol: v.vol, archiveId: v.id, url: `https://archive.org/details/${v.id}`, title: v.title, translator: v.translator, edition: v.edition, imprint: `Edinburgh: John Grant, ${v.year}`, rights: 'pre-1929 print; Internet Archive Public Domain Mark', sha256: sha256(raw).slice(0, 16) });

    const lines = raw.split('\n');
    const corpus = buildCorpus(lines.map((l) => l.replace(/\s+/g, ' ').trim()));
    let from = 0;
    // trailing library stamps at the end of the scan
    let volEnd = lines.length;
    for (let i = lines.length - 1; i > lines.length * 0.5; i--) if (/^(END OF VOL|end or VOL|Printed by|ALDERMAN LIBRARY|THE END\.?\s*$)/i.test(lines[i].replace(/\s+/g, ' ').trim())) volEnd = i;
    for (const b of v.books) {
      const counts = verseCounts(b.book);
      const norm1 = (i: number) => lines[i].replace(/\s+/g, ' ').trim();
      let heads: number[];
      let end: number;
      if (b.kind === 'single') {
        let s = -1;
        for (let i = from; i < volEnd; i++) if (b.single!.test(norm1(i)) && s < 0) { s = i; break; }
        if (s < 0) { report.warn(`lapide: ${v.id}: ${b.book} title not found`); continue; }
        heads = [s];
        end = volEnd;
        if (b.endBefore) for (let i = s + 1; i < volEnd; i++) if (b.endBefore.test(norm1(i))) { end = i; break; }
      } else {
        heads = findHeadings(lines, from, volEnd, b.chapters);
        if (heads.length !== b.chapters) { report.warn(`lapide: ${v.id}: ${b.book}: found ${heads.length}/${b.chapters} chapter headings`); }
        end = volEnd;
        const lastHead = heads[heads.length - 1];
        if (b.endBefore) for (let i = lastHead + 1; i < volEnd; i++) if (b.endBefore.test(norm1(i))) { end = i; break; }
      }
      // chapter numbering inside this volume starts at the first chapter present
      const firstCh = b.kind === 'single' ? 1 : v.books.slice(0, v.books.indexOf(b)).filter((x) => x.book === b.book).length ? 0 : 0;
      void firstCh;
      const startChapter = b.book === 'MAT' && v.vol === 2 ? 10 : b.book === 'MAT' && v.vol === 3 ? 22 : b.book === 'JHN' && v.vol === 6 ? 12 : 1;
      const results: ChapterResult[] = [];
      for (let k = 0; k < heads.length; k++) {
        const c = startChapter + k;
        const body = lines.slice(heads[k] + 1, k + 1 < heads.length ? heads[k + 1] : end);
        const maxVerse = counts[c - 1] ?? 0;
        if (!maxVerse) { report.warn(`lapide: ${b.book} ${c}: no verse count`); continue; }
        // a heading is the start of its chapter, but the next book's argument/preface can trail the last chapter; the cut above handles known cases
        results.push(parseChapter(c, body, maxVerse, corpus, !!b.colonLemma, report, b.book));
      }
      const rows = results.flatMap((r) => r.rows);
      byBook.set(b.book, [...(byBook.get(b.book) ?? []), ...rows]);
      const lastFrom = heads.length ? heads[heads.length - 1] : from;
      from = Math.max(from, lastFrom + 1);
      books.push({ book: b.book, name: b.name, vol: v.vol, chapters: results.map((r) => r.c), results: results.map((r) => ({ c: r.c, mode: r.mode, rows: r.rows.length, markers: r.markers, lemmas: r.lemmas, versesCovered: r.covered, verses: r.maxVerse })) });
    }
  }

  const coverage: any[] = [];
  const fileBooks: string[] = [];
  const bookOrder = [...new Set(books.map((b) => b.book))];
  for (const bk of bookOrder) {
    const rows = (byBook.get(bk) ?? []).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]);
    if (!rows.length) continue;
    writeJson(join(OUT, `${bk}.json`), rows);
    fileBooks.push(bk);
    const parts = books.filter((b) => b.book === bk);
    const res = parts.flatMap((p) => p.results);
    const chapterLevel = res.filter((r: any) => r.mode === 'chapter').map((r: any) => r.c);
    const total = res.reduce((n: number, r: any) => n + r.verses, 0);
    const cov = res.reduce((n: number, r: any) => n + r.versesCovered, 0);
    const chs = res.map((r: any) => r.c);
    const range = `${Math.min(...chs)}-${Math.max(...chs)}`;
    const note = `${parts[0].name} ${range}: ${chapterLevel.length ? (chapterLevel.length === res.length ? 'chapter-level' : `verse-level except chapter-level for ${chapterLevel.join(', ')}`) : 'verse-level'}; ${cov} of ${total} verses carry a note of their own (${Math.round((100 * cov) / total)}%)`;
    coverage.push({ book: bk, name: parts[0].name, volumes: [...new Set(parts.map((p) => p.vol))], rows: rows.length, chapters: res.length, verseLevel: res.length - chapterLevel.length, chapterLevel, versesCovered: cov, versesTotal: total, note, perChapter: res });
    report.stats[`lapide:${bk}`] = { rows: rows.length, chapters: res.length, chapterLevel: chapterLevel.length, versesCovered: cov, versesTotal: total };
  }
  writeJson(join(OUT, 'index.json'), {
    source: 'Cornelius a Lapide, The Great Commentary, English translation (Mossman and others; Cobb for 1-2 Corinthians and Galatians), John Grant, Edinburgh, 1908. Internet Archive OCR text.',
    numbering: 'English/KJV numbering (the numbering of the printed Authorized Version text), equal to the app anchor for the New Testament',
    rights: 'Printed 1908; public domain in the US (pre-1929). Internet Archive Public Domain Mark on every volume used.',
    volumes,
    books: coverage,
    notRead: 'Book-level prefaces that precede Chapter I of a Gospel or Epistle (general preface, "Canons", introductions to Mark, Luke, John, 1-3 John) are not included; the printed Authorized Version text of each chapter is dropped (the app has its own Bible text).',
    method: 'Chapter headings found in order; the printed verse text and running heads removed; `Ver. N.` blocks anchor commentary to verses, otherwise a paragraph opening with the words of a verse is placed at that verse; unplaced paragraphs stay with the block before. Hyphenation repaired by the printed spelling elsewhere in the volume.',
  }, true);
  report.stats['lapide'] = { books: fileBooks.length, rows: [...byBook.values()].reduce((n, r) => n + r.length, 0) };
}

if (process.argv[2] === 'fetch') fetchLapide().then(() => console.log('lapide fetched'));
if (process.argv[2] === 'build') {
  const r = new Report();
  buildLapide(r);
  console.log(JSON.stringify(r.stats, null, 1));
  console.log(r.warnings.join('\n'));
}
