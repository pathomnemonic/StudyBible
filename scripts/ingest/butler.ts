// @ts-nocheck (work in progress)
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_DATA, RAW, Report, writeJson } from './lib/util';

/**
 * Alban Butler, "The Lives of the Fathers, Martyrs, and Other Principal Saints" (1756-59; d. 1773, so public domain everywhere).
 * Arranged by month and day. No single digital edition covers the year, so each month comes from the best pre-1929 text found:
 * Project Gutenberg (hand-proofed) where it exists, otherwise Internet Archive OCR (unproofread). See docs/DATA_SOURCES.md.
 * Raw files are cached under data/raw/butler (ignored by git); the build writes public/data/saints/butler.
 */
const UA = 'StudyBibleApp/1.0 (+https://github.com/pathomnemonic/StudyBible)';
const DIR = join(RAW, 'butler');
const OUT = join(PUBLIC_DATA, 'saints/butler');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface Source {
  file: string;
  url: string;
  kind: 'pg' | 'ocr';
  months: number[]; // 1-12
  edition: string;
  note: string;
}

const gut = (id: number) => `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;
const ia = (id: string) => `https://archive.org/download/${id}/${id}_djvu.txt`;

export const SOURCES: Source[] = [
  { file: 'pg20450.txt', url: gut(20450), kind: 'pg', months: [1, 2, 3], edition: 'New York: P. J. Kenedy, 1903 (vols. 1-3), Project Gutenberg #20450 (transcribed by Geoff Horton)', note: 'hand-transcribed; the original print was poor, so Gutenberg marks doubtful readings with {braces}' },
  { file: 'archive_livesfathersmar03butlgoog.txt', url: ia('livesfathersmar03butlgoog'), kind: 'ocr', months: [4], edition: 'Dublin: James Duffy, 1866, vol. IV (Google Books scan, archive.org livesfathersmar03butlgoog)', note: 'unproofread OCR' },
  { file: 'archive_livesoffathersma456butl.txt', url: ia('livesoffathersma456butl'), kind: 'ocr', months: [5], edition: 'New York: D. & J. Sadlier, 1846, vols. 4-6 (archive.org livesoffathersma456butl)', note: 'unproofread OCR' },
  { file: 'archive_livesfathersmar06butlgoog.txt', url: ia('livesfathersmar06butlgoog'), kind: 'ocr', months: [6], edition: 'Dublin: James Duffy, 1866, vol. VI (Google Books scan, archive.org livesfathersmar06butlgoog)', note: 'unproofread OCR' },
  { file: 'pg49604.txt', url: gut(49604), kind: 'pg', months: [7], edition: 'New York: P. J. Kenedy, 1908, vol. VII, Project Gutenberg #49604 (Geoff Horton, Richard Hulse, DP team)', note: 'proofread by Distributed Proofreaders' },
  { file: 'archive_the_lives_of_the_fathers_martyrs_vol_viii_1866-alban_butler.txt', url: ia('the_lives_of_the_fathers_martyrs_vol_viii_1866-alban_butler'), kind: 'ocr', months: [8], edition: '1866 edition, vol. VIII (Google Books scan, archive.org the_lives_of_the_fathers_martyrs_vol_viii_1866-alban_butler)', note: 'unproofread OCR' },
  { file: 'archive_livesfathersmar00butlgoog.txt', url: ia('livesfathersmar00butlgoog'), kind: 'ocr', months: [9], edition: 'Dublin: James Duffy, 1866, vol. IX (Google Books scan, archive.org livesfathersmar00butlgoog)', note: 'unproofread OCR' },
  { file: 'archive_livesoffathersm10butluoft.txt', url: ia('livesoffathersm10butluoft'), kind: 'ocr', months: [10, 11, 12], edition: 'New York: P. J. Kenedy, 1903, vol. 10 (October-December; University of Toronto scan, archive.org livesoffathersm10butluoft)', note: 'unproofread OCR' },
];

const FIXES: { file: string; month: number; day: number; before: RegExp }[] = [
  // the Gutenberg transcription has no "MARCH V." line; the contents list St. Adrian, St. Kiaran, St. Ia, St. Breaca, St. John Joseph under March 5
  { file: 'pg20450.txt', month: 3, day: 5, before: /^ST\. ADRIAN, BISHOP OF ST\. ANDREWS/ },
];

export async function fetchButler() {
  mkdirSync(DIR, { recursive: true });
  for (const s of SOURCES) {
    const f = join(DIR, s.file);
    if (existsSync(f)) continue;
    const r = await fetch(s.url, { headers: { 'user-agent': UA } });
    if (!r.ok) throw new Error(`${s.file}: HTTP ${r.status}`);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    console.log(`butler: fetched ${s.file}`);
    await sleep(1200);
  }
}

// ---------------------------------------------------------------- text cleaning

const ROMAN = (n: number) => {
  const t: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of t) while (n >= v) { s += r; n -= v; }
  return s;
};
const monthRe = MONTHS.join('|');
const monthFuzz = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]{0,6}';

const isBlank = (l: string) => !l.trim();

/** Gutenberg: drop {page} markers, footnote sections, [n] markers and _italic_ marks. */
export function cleanPg(text: string): string[] {
  const start = text.indexOf('*** START');
  const end = text.indexOf('*** END');
  let lines = text.slice(start < 0 ? 0 : start, end < 0 ? undefined : end).replace(/\r/g, '').split('\n');
  const out: string[] = [];
  let inNotes = false;
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    if (/^\s*FOOTNOTES\s*$/.test(l) && /^\s{10,}/.test(l)) { inNotes = true; continue; } // July: one block at the end
    if (/^Footnotes:\s*$/.test(l)) { inNotes = true; continue; } // Jan-Mar: after each day
    if (inNotes) {
      // a note is "N.  text" with indented continuation lines (Jan-Mar), or "[N] text" (July, until the end of the file)
      if (isBlank(l) || /^\d+\.\s{2}/.test(l) || /^\s{2,}\S/.test(l) || /^\[\d+\]/.test(l)) {
        if (new RegExp(`^\\s*(${monthRe})\\b`).test(l) && !/^\s{2,}\S/.test(l)) inNotes = false;
        else continue;
      } else if (/^\s*FOOTNOTES\s*$/.test(l)) continue;
      else inNotes = false;
    }
    if (/^\s*\{\d+(?: blank page)?\}\s*$/.test(l)) continue;
    l = l.replace(/\s*\{\d{3}\}\s*/g, ' ').replace(/\[\d+\]/g, '').replace(/(^|[\s(“"'])_([^_\n]+)_/g, '$1$2').replace(/_([^_\n]*)_/g, '$1').replace(/_/g, '');
    out.push(l);
  }
  return out;
}

const OCR_JUNK = [
  /^\s*Digitized by\b/i,
  /^\s*(Google|GOOGLE)\s*$/,
  /^\s*[ivxlc]{1,6}\s*$/i,
  /^\s*\d{1,4}\s*$/,
];

/** Running head ("14 ST. HUGH, B. C. [APRIL 1." or "April 3.] ss. agape ... 25"): a short line carrying a bracket and a month. */
function isRunningHead(l: string): boolean {
  const t = l.trim();
  if (t.length > 90 || !t) return false;
  if (new RegExp(`\\[\\s*${monthFuzz}\\b`, 'i').test(t)) return true;
  if (new RegExp(`^${monthFuzz}\\.?\\s*[\\dIlLVX]{1,5}\\.?\\s*[\\]\\)J}]`, 'i').test(t)) return true;
  if (new RegExp(`^${monthFuzz}\\W{0,2}\\s*(?=\\S{0,5}[\\d\\]])\\S{1,5}\\s+\\S`, 'i').test(t) && t.length < 75 && /[a-z]/.test(t.slice(0, 1)) === false) return true;
  // damaged month names ("Avcust 1.] the seven machabees, mm. 9", "SEPT. 5.] ST. BERTIN"): word, day, bracket, short title
  if (/^\W{0,3}[A-Za-z0-9^]{3,9}[.,]?\s*[\dIlSOo]{1,3}\W{0,3}\s*[\]\)J}3]\s*\S.{2,55}$/.test(t) && !/[a-z]{4,}\s+[a-z]{3,}\s+[a-z]{3,}\s+[a-z]{3,}/.test(t)) return true;
  if (/^\W{0,3}\d{1,3}\s+\S.{2,50}[\[\(\{|]\s*[A-Za-z0-9^]{3,9}[.,]?\s*[\dIlSOo]{1,3}\W{0,3}\s*$/.test(t)) return true;
  if (/^\s*VOL\.?\s*[IVXLCivxlc\d]{1,6}\.?\s*\S{0,3}\s*$/i.test(t)) return true;
  if (/\[\s*[A-Za-z]{3,8}\.?\s*[\dIl\\.|]{1,5}\.?\s*$/.test(t) && /[A-Z]{2}/.test(t)) return true; // "[AfBIL. \."
  return false;
}

export function cleanOcr(text: string): string[] {
  const lines = text.replace(/\r/g, '').replace(/\f/g, '\n').split('\n').map((l) => l.replace(/[ \t]+/g, ' ').replace(/\s+$/, ''));
  const out: string[] = [];
  let page: string[] = [];
  const flush = () => {
    // footnotes sit at the foot of the page: drop from the first line that opens with a note marker
    let cut = page.length;
    const lastText = page.map((l, i) => (isBlank(l) ? -1 : i)).filter((i) => i >= 0);
    for (let k = 1; k < lastText.length; k++) {
      const i = lastText[k];
      if (/^(?:[*†‡§¶‖]+|\d{1,2})\s+[A-Z(\[]/.test(page[i].trim()) && i > page.length * 0.35) { cut = i; break; }
    }
    // never cut away a day heading
    const dayHead = new RegExp(`^\\s*(${monthRe})\\b`);
    for (let i = cut; i < page.length; i++) if (dayHead.test(page[i]) && page[i].trim().length < 24) { cut = page.length; break; }
    out.push(...page.slice(0, cut), '');
    page = [];
  };
  for (const l of lines) {
    if (OCR_JUNK.some((re) => re.test(l))) { flush(); continue; }
    if (isRunningHead(l)) {
      flush();
      // keep the day the page belongs to: it lets a damaged day heading be placed later
      const mm = new RegExp(`(${monthFuzz})\\W{0,3}\\s*(\\d{1,2})`, 'i').exec(l);
      if (mm) { const mi = MONTHS.findIndex((x) => x.slice(0, 3) === mm[1].slice(0, 3).toUpperCase()); if (mi >= 0) out.push(`@@RH:${mi + 1}:${+mm[2]}`); }
      continue;
    }
    page.push(l);
  }
  flush();
  return out;
}

// ---------------------------------------------------------------- structure

const lev = (a: string, b: string) => {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const ocrRoman = (t: string) => t.toUpperCase().replace(/[L1|!TJF]/g, 'I').replace(/U/g, 'V').replace(/Y/g, 'V');

/** Find the day headings ("JANUARY II." / OCR "OCTOBER li.") for one month, in order, tolerating OCR noise. */
export function findDays(lines: string[], month: number, from: number): { day: number; at: number; start: number }[] {
  const name = MONTHS[month - 1];
  const re = new RegExp(`^\\s*${name}\\s+(\\S{1,10})\\s*$`);
  const found: { day: number; at: number; start: number }[] = [];
  let expect = 1;
  const max = DAYS_IN[month - 1];
  for (let i = from; i < lines.length; i++) {
    const m = re.exec(lines[i]);
    if (!m) continue;
    const tok = m[1].replace(/^[^A-Za-z0-9|!]+|[^A-Za-z0-9|!]+$/g, '');
    if (!tok) continue;
    const norm = ocrRoman(tok);
    let best = 0;
    let bd = 9;
    for (let d = expect; d <= Math.min(expect + 3, max); d++) {
      const dist = tok === String(d) ? 0 : lev(norm, ROMAN(d));
      if (dist < bd && dist <= (norm.length > 2 ? 1 : 0)) { bd = dist; best = d; }
    }
    if (best) { found.push({ day: best, at: i, start: i + 1 }); expect = best + 1; }
    if (expect > max) break;
  }
  // a day heading lost to OCR: its first entry heading is the first one after the first running head of that day
  const isMark = (l: string) => l.startsWith('@@RH:');
  const entryHead = (j: number) => !isMark(lines[j]) && !!lines[j].trim() && (j === 0 || !lines[j - 1].trim()) && isHeadingBlock(lines[j].trim()) && STARTS_ENTRY.test(lines[j].trim());
  found.sort((a, b) => a.at - b.at);
  const added: { day: number; at: number; start: number }[] = [];
  for (let d = 2; d <= max; d++) {
    if (found.some((x) => x.day === d)) continue;
    const prev = [...found].reverse().find((x) => x.day < d);
    const next = found.find((x) => x.day > d);
    if (!prev || !next) continue;
    const mi = lines.findIndex((l, i) => i > prev.at && i < next.at && l === `@@RH:${month}:${d}`);
    if (mi < 0) continue;
    for (let j = mi; j < next.at; j++) if (entryHead(j)) { added.push({ day: d, at: j, start: j }); break; }
  }
  found.push(...added);
  found.sort((a, b) => a.at - b.at);
  // day 1 can be printed without its number ("NOVEMBER" alone, then the heading)
  if (found.length && found[0].day > 1 && found[0].day <= 2) {
    for (let i = found[0].at - 1; i > from; i--) {
      if (lines[i].trim().replace(/\.$/, '') === name) { found.unshift({ day: 1, at: i, start: i + 1 }); break; }
    }
  }
  return found;
}

const AD_PARA = /(In the press|Now ready|price \d+s|CARDINAL WISEMAN|Superfine Paper|PUBLISHED BY|JAMES DUFFY|cloth, lettered|Morocco, super|Royal 4to|Splendid Engravings)/i;
const AD_HEAD = /^(Holy Eucharist Proved|The Douay Bible|The Real (Presence|Niesence)|The Lives?\b)/i;
const STOP = /^\s*(END O[FP] VOL|BY THE REV|INDEX|ALPHABETICAL|CHRONOLOGICAL|CENTENARY|TABLE OF|END OF THE PROJECT)\b/i;

const joinLines = (ls: string[], hyph: (a: string, b: string) => boolean) => {
  let s = '';
  for (const raw of ls) {
    const l = raw.trim();
    if (!s) { s = l; continue; }
    const m = /([A-Za-z]+)-$/.exec(s);
    if (m && /^[a-z]/.test(l)) {
      const next = /^[A-Za-z]+/.exec(l)![0];
      s = hyph(m[1], next) ? s + l : s.slice(0, -1) + l;
    } else s += ' ' + l;
  }
  return s;
};

const SMALL = new Set(['of', 'the', 'and', 'or', 'in', 'at', 'on', 'de', 'du', 'des', 'la', 'le', 'von', 'van', 'der', 'near', 'for', 'to', 'with', 'by', 'from', 'a', 'an', 'alias', 'otherwise']);
export function titleCase(h: string): string {
  return h
    .toLowerCase()
    .replace(/(^|[\s(\-"“'‘])([a-zà-ÿ])/g, (m, p, c, off) => {
      return p + c.toUpperCase();
    })
    .replace(/\b(Of|The|And|Or|In|At|On|De|Du|Des|La|Le|Von|Van|Der|Near|For|To|With|By|From|Alias|Otherwise)\b/g, (w, _a, off) => (off === 0 ? w : w.toLowerCase()))
    .replace(/\b(Ss|Bb)\./g, (w) => w.toUpperCase())
    .replace(/\b([Ii]{1,3}|[Ii][Vv]|[Vv][Ii]{0,3}|[Ii][Xx]|[Xx]{1,3})\b(?=[.,]|$)/g, (w) => w.toUpperCase())
    .replace(/\b([a-z])\.\s*([a-z])\.(?=[\s,]|$)/gi, (_w, a, b) => `${a.toUpperCase()}. ${b.toUpperCase()}.`);
}
void SMALL;

function isHeadingBlock(b: string): boolean {
  const letters = b.replace(/[^A-Za-z]/g, '');
  if (letters.length < 3 || b.length > 240) return false;
  if (/^A\.?\s?[DI1]\W/i.test(b) || /^B\.?\s?C\.?\s?\d/.test(b)) return false;
  if (/^(ABOUT|IN THE (YEAR|[A-Z]+ (CENTURY|AGE))|ANNO|[A-Z]+ (AGE|CENTURY)\W*$)/i.test(b)) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length >= 0.8;
}
const STARTS_ENTRY = /^\W{0,3}(?:[S8B6][TtfI1][.,\/'` ]|S[S8]\W|8S\W|SAI\w?T|THE |ST\.? |S\. |SS\.? |SAINTS? |B\. |BB\. |BLESSED |OUR |ALL |THE\b|SANCTI|COMMEMORATION|FEAST|DEDICATION|TRANSLATION|ANOTHER |SEVERAL |MARTYRS|HOLY |MM\.)/i;

interface Entry { name: string; heading: string; text: string[] }

function parseDay(lines: string[], hyph: (a: string, b: string) => boolean, ocr: boolean): { entries: Entry[]; orphan: number } {
  // lines -> blocks (paragraphs)
  let blocks: string[] = [];
  let cur: string[] = [];
  const push = () => { if (cur.length) blocks.push(joinLines(cur, hyph)); cur = []; };
  for (const l of lines) { if (isBlank(l) || l.startsWith('@@RH:')) push(); else cur.push(l); }
  push();
  if (ocr) {
    // a paragraph split by a page break: previous has no closing punctuation and the next starts lower case
    const m: string[] = [];
    for (const b of blocks) {
      const p = m[m.length - 1];
      if (p && !isHeadingBlock(p) && !isHeadingBlock(b) && !/[.!?:;"”’)\]*]\s*$/.test(p) && /^[a-z]/.test(b)) m[m.length - 1] = p + ' ' + b;
      else m.push(b);
    }
    blocks = m;
  }
  const entries: Entry[] = [];
  let head: string[] | null = null;
  let cu: Entry | null = null;
  let orphan = 0;
  const fin = () => { if (head) { const h = head.join(' ').replace(/[*†‡§]+/g, '').replace(/^[\s_]+|[\s_]+$/g, '').replace(/\s+/g, ' ').trim(); cu = { name: titleCase(h), heading: h, text: [] }; entries.push(cu); head = null; } };
  for (const b of blocks) {
    // OCR leftovers of running heads ("154 ST. ANICETUS [APRIL 17*") are not headings
    if (ocr && isHeadingBlock(b) && (/[\[\]|^]/.test(b) || /^\d{1,3}\s/.test(b))) continue;
    if (isHeadingBlock(b) && (head || !cu || STARTS_ENTRY.test(b))) {
      if (!head) {
        head = [b];
        cu = null;
      } else {
        const prev = head[head.length - 1];
        if (/[,]$/.test(prev) || !STARTS_ENTRY.test(b)) head.push(b);
        else { fin(); head = [b]; }
      }
      continue;
    }
    if (head) fin();
    if (!cu) { orphan++; continue; }
    cu.text.push(b);
  }
  if (head) fin();
  return { entries, orphan };
}

// ---------------------------------------------------------------- names

const LEAD = /^(?:the\s+)?(?:saints?|sts?\.?|ss\.?|s\.|blessed|bb\.?|b\.)\s+/i;
const simplify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[“”"’'‘]/g, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();

export function nameKeys(heading: string): string[] {
  const keys = new Set<string>();
  // the part before the first comma is the saint ("St. Rumold, B. M." -> "rumold"); "or X" / "alias X" give other forms
  const main = heading.replace(/\[\d+\]/g, '').split(/[,;]/)[0];
  const stripped = main.replace(LEAD, '');
  const add = (x: string) => { const k = simplify(x.replace(LEAD, '')); if (k.length > 2 && !/^(the|and|of)$/.test(k)) keys.add(k); };
  add(stripped);
  for (const alt of stripped.split(/\s+(?:or|alias|otherwise called|otherwise)\s+/i)) add(alt);
  if (/^ss\.?\s/i.test(main) || /^saints\s/i.test(main)) for (const p of stripped.split(/\s+and\s+|\s*&\s*/i)) add(p);
  // the full heading minus the title words, for names like "John of the Cross"
  const afterOr = heading.split(/[,;]/).slice(0, 2).join(' ');
  void afterOr;
  return [...keys];
}

// ---------------------------------------------------------------- build

export function buildButler(report: Report) {
  if (!existsSync(DIR)) { report.warn('butler: raw files missing (run: npx tsx scripts/ingest/butler.ts fetch); Butler skipped'); return; }
  const index: Record<string, unknown> = {};
  const names: Record<string, string[]> = {};
  const covered: number[] = [];
  const missing: { month: number; name: string; reason: string }[] = [];
  let total = 0;
  const cache = new Map<string, string[]>();

  for (const s of SOURCES) {
    const f = join(DIR, s.file);
    if (!existsSync(f)) { for (const m of s.months) missing.push({ month: m, name: MONTHS[m - 1], reason: `raw file ${s.file} not fetched` }); continue; }
    const raw = readFileSync(f, 'utf8');
    if (!cache.has(s.file)) cache.set(s.file, s.kind === 'pg' ? cleanPg(raw) : cleanOcr(raw));
    const lines = cache.get(s.file)!;
    // hyphenation evidence for line-end breaks: is "self-love" more common than "selflove"?
    const body = lines.join(' ');
    const hyphCount = new Map<string, number>();
    for (const m of body.matchAll(/\b([A-Za-z]{2,})-([a-z]{2,})\b/g)) { const k = (m[1] + m[2]).toLowerCase(); hyphCount.set(k, (hyphCount.get(k) ?? 0) + 1); }
    const hyph = (a: string, b: string) => {
      const k = (a + b).toLowerCase();
      const h = hyphCount.get(k) ?? 0;
      if (h < 2) return false;
      return h > (body.match(new RegExp(`\\b${k}\\b`, 'gi'))?.length ?? 0);
    };

    let from = 0;
    for (const m of s.months) {
      const days = findDays(lines, m, from);
      // a day heading missing from the transcription itself, restored from the book's own table of contents
      for (const fx of FIXES.filter((x) => x.file === s.file && x.month === m)) {
        if (days.some((d) => d.day === fx.day)) continue;
        const at = lines.findIndex((l, i) => i > (days.find((d) => d.day === fx.day - 1)?.at ?? 0) && fx.before.test(l));
        if (at > 0) { days.push({ day: fx.day, at, start: at }); days.sort((a, b) => a.day - b.day); }
      }
      const label = MONTHS[m - 1];
      if (days.length < DAYS_IN[m - 1] - 6) {
        missing.push({ month: m, name: label, reason: `only ${days.length} day headings found in ${s.file}` });
        report.warn(`butler: ${label}: ${days.length} day headings found; skipped`);
        continue;
      }
      // the month ends at the next month-only heading ("FEBRUARY."), an index, or the end of the text
      const last = days[days.length - 1].at;
      let endAt = lines.length;
      for (let i = last + 1; i < lines.length; i++) {
        const t = lines[i].trim();
        if (STOP.test(t) || new RegExp(`^(${monthRe})\\.?$`, 'i').test(t) || new RegExp(`^${monthFuzz}\\.?\\s*\\d{0,2}\\.?$`, 'i').test(t) && /^[A-Z]+\.?$/.test(t)) { endAt = i; break; }
      }
      from = endAt;
      const out: Record<string, Entry[]> = {};
      let count = 0;
      let orphans = 0;
      const missingDays: number[] = [];
      for (let d = 1; d <= DAYS_IN[m - 1]; d++) if (!days.some((x) => x.day === d)) missingDays.push(d);
      for (let k = 0; k < days.length; k++) {
        const stop = k + 1 < days.length ? days[k + 1].at : endAt;
        const r = parseDay(lines.slice(days[k].start, stop), hyph, s.kind === 'ocr');
        orphans += r.orphan;
        const dd = String(days[k].day).padStart(2, '0');
        let entries = r.entries.filter((e) => e.text.join('').length > 20);
        if (k === days.length - 1 && s.kind === 'ocr') {
          // the publisher's advertisements after the last day
          let cut = -1;
          for (let ei = 0; ei < entries.length && cut < 0; ei++) {
            if (AD_HEAD.test(entries[ei].heading)) { cut = ei; break; }
            const tail = Math.max(0, entries[ei].text.length - 12);
            const pi = entries[ei].text.findIndex((t, i) => i >= tail && AD_PARA.test(t));
            if (pi >= 0) { entries[ei].text = entries[ei].text.slice(0, pi); cut = entries[ei].text.length ? ei + 1 : ei; }
          }
          if (cut >= 0) entries = entries.slice(0, cut);
        }
        if (entries.length) { out[dd] = entries; count += entries.length; }
        else report.warn(`butler: ${label} ${days[k].day}: no entries parsed`);
        for (const e of entries) for (const key of nameKeys(e.heading)) (names[key] ??= []).includes(`${String(m).padStart(2, '0')}-${dd}`) || names[key].push(`${String(m).padStart(2, '0')}-${dd}`);
      }
      const mm = String(m).padStart(2, '0');
      const edition = s.edition;
      writeJson(join(OUT, `${mm}.json`), { month: m, monthName: label.charAt(0) + label.slice(1).toLowerCase(), source: s.url, edition, days: out });
      const short = Object.entries(out).flatMap(([dd, es]) => es.filter((e) => e.text.join('').length < 120).map(() => dd));
      index[mm] = { month: label, source: s.file, sourceUrl: s.url, edition, quality: s.note, kind: s.kind === 'pg' ? 'Project Gutenberg (proofread)' : 'Internet Archive OCR (unproofread)', days: Object.keys(out).length, entries: count, daysMissing: missingDays, daysWithNoEntries: DAYS_IN[m - 1] - Object.keys(out).length - missingDays.length, veryShortEntries: short.length, orphanParagraphs: orphans };
      covered.push(m);
      total += count;
      report.stats[`butler-${mm}`] = { days: Object.keys(out).length, entries: count, missingDays };
      if (missingDays.length) report.warn(`butler: ${label}: day headings not found for ${missingDays.join(', ')}`);
    }
  }
  for (let m = 1; m <= 12; m++) if (!covered.includes(m) && !missing.some((x) => x.month === m)) missing.push({ month: m, name: MONTHS[m - 1], reason: 'no public-domain digital text identified' });
  const sortedNames = Object.fromEntries(Object.entries(names).sort(([a], [b]) => a.localeCompare(b)));
  writeJson(join(OUT, 'names.json'), sortedNames);
  writeJson(join(OUT, 'index.json'), {
    work: 'The Lives of the Fathers, Martyrs, and Other Principal Saints',
    author: 'Alban Butler (1710-1773)',
    note: "Feast days are those of Butler's 18th-century calendar and can differ from the present Roman calendar. Text is as printed; footnotes and their markers are omitted.",
    months: index,
    covered: covered.sort((a, b) => a - b),
    missing: missing.sort((a, b) => a.month - b.month),
    totalEntries: total,
    nameKeys: Object.keys(sortedNames).length,
  });
  report.stats['butler'] = { months: covered.length, entries: total, names: Object.keys(sortedNames).length, missing: missing.map((x) => x.name) };
  void mkdirSync;
}

if (process.argv[2] === 'fetch') fetchButler().then(() => console.log('butler fetched'));
if (process.argv[2] === 'build') { const r = new Report(); buildButler(r); console.log(JSON.stringify(r.stats, null, 1), r.warnings.join('\n')); }
