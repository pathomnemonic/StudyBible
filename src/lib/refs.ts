import { BOOKS, BOOK_BY_ID, BOOK_ORDER, getBook } from './canon';
import { psalmDualLabel } from './versification';

/**
 * A passage in the *anchor* (Clementine Vulgate) numbering unless a caller says otherwise.
 * `v1` undefined means "whole chapter" (or from the start of chapter c1).
 */
export interface Ref {
  book: string;
  c1: number;
  v1?: number;
  c2: number;
  v2?: number;
}

export const MAX_VERSE = 999;

/** Stable single-verse identifier, e.g. `JHN.6.51`. */
export const vid = (book: string, c: number, v: number) => `${book}.${c}.${v}`;

export function parseVid(id: string): { book: string; c: number; v: number } | null {
  const m = /^([1-3A-Z]{3})\.(\d+)\.(\d+)$/.exec(id);
  return m ? { book: m[1], c: +m[2], v: +m[3] } : null;
}

/** Stable passage identifier, e.g. `JHN.6.51-58`, `GEN.1.1-2.3`, `PSA.22`. */
export function refId(r: Ref): string {
  const a = r.v1 === undefined ? `${r.book}.${r.c1}` : `${r.book}.${r.c1}.${r.v1}`;
  if (r.c1 === r.c2 && r.v1 === r.v2) return a;
  if (r.c1 === r.c2 && r.v1 !== undefined && r.v2 !== undefined) return `${a}-${r.v2}`;
  if (r.v2 === undefined) return `${a}-${r.c2}`;
  return `${a}-${r.c2}.${r.v2}`;
}

export function parseRefId(id: string): Ref | null {
  const m = /^([1-3A-Z]{3})\.(\d+)(?:\.(\d+))?(?:-(\d+)(?:\.(\d+))?)?$/.exec(id);
  if (!m) return null;
  const book = m[1];
  const c1 = +m[2];
  const v1 = m[3] ? +m[3] : undefined;
  if (m[4] === undefined) return { book, c1, v1, c2: c1, v2: v1 };
  if (m[5] !== undefined) return { book, c1, v1, c2: +m[4], v2: +m[5] };
  if (v1 === undefined) return { book, c1, c2: +m[4] };
  return { book, c1, v1, c2: c1, v2: +m[4] };
}

export function isWholeChapter(r: Ref) {
  return r.v1 === undefined;
}

/** Human-readable reference like `John 6:51–58` (uses an en dash). */
export function formatRef(r: Ref, opts: { abbr?: boolean; name?: string; noDual?: boolean } = {}): string {
  const base = formatRefPlain(r, opts);
  // Psalms are numbered differently in the Vulgate/Douay anchor and in most modern Bibles: always show both.
  if (r.book === 'PSA' && !opts.noDual && r.c1 === r.c2) {
    const dual = psalmDualLabel(r.c1);
    if (dual) return `${base} (Heb. ${dual})`;
  }
  return base;
}

function formatRefPlain(r: Ref, opts: { abbr?: boolean; name?: string } = {}): string {
  const b = getBook(r.book);
  const name = opts.name ?? (opts.abbr ? b.abbr : b.name);
  const single = b.chapters === 1;
  if (r.v1 === undefined) {
    return r.c2 === r.c1 ? `${name} ${r.c1}` : `${name} ${r.c1}–${r.c2}`;
  }
  if (single) {
    // Single-chapter books: "Jude 5–7".
    const end = r.v2 !== undefined && r.v2 !== r.v1 ? `–${r.v2}` : '';
    return `${name} ${r.v1}${end}`;
  }
  if (r.c1 === r.c2) {
    const end = r.v2 !== undefined && r.v2 !== r.v1 ? `–${r.v2}` : '';
    return `${name} ${r.c1}:${r.v1}${end}`;
  }
  return `${name} ${r.c1}:${r.v1}–${r.c2}:${r.v2 ?? ''}`;
}

/** True if ref `a` contains verse (book,c,v). */
export function refContains(a: Ref, book: string, c: number, v: number): boolean {
  if (a.book !== book) return false;
  if (c < a.c1 || c > a.c2) return false;
  if (c === a.c1 && a.v1 !== undefined && v < a.v1) return false;
  if (c === a.c2 && a.v2 !== undefined && v > a.v2) return false;
  return true;
}

export function refsOverlap(a: Ref, b: Ref): boolean {
  if (a.book !== b.book) return false;
  const aStart = a.c1 * 1000 + (a.v1 ?? 0);
  const aEnd = a.c2 * 1000 + (a.v2 ?? MAX_VERSE);
  const bStart = b.c1 * 1000 + (b.v1 ?? 0);
  const bEnd = b.c2 * 1000 + (b.v2 ?? MAX_VERSE);
  return aStart <= bEnd && bStart <= aEnd;
}

export function compareRefs(a: Ref, b: Ref): number {
  const bo = BOOK_ORDER[a.book] - BOOK_ORDER[b.book];
  if (bo) return bo;
  return a.c1 * 1000 + (a.v1 ?? 0) - (b.c1 * 1000 + (b.v1 ?? 0));
}

// ---------------------------------------------------------------------------
// Parsing user input
// ---------------------------------------------------------------------------

const ROMAN: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4', '1st': '1', '2nd': '2', '3rd': '3', first: '1', second: '2', third: '3' };

export function normalizeBookText(s: string): string {
  let t = s
    .toLowerCase()
    .replace(/[.’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  t = t.replace(/^(i{1,3}|iv|1st|2nd|3rd|first|second|third)\s+/, (_m, r: string) => `${ROMAN[r]} `);
  t = t.replace(/^([1-4])(?=[a-z])/, '$1 ');
  return t;
}

const ALIAS_MAP = new Map<string, string>();
(function buildAliases() {
  const put = (alias: string, id: string, strong = false) => {
    const n = normalizeBookText(alias);
    if (!n) return;
    if (!ALIAS_MAP.has(n) || strong) ALIAS_MAP.set(n, id);
  };
  // Full names and abbreviations win over looser aliases.
  for (const b of BOOKS) {
    put(b.name, b.id, true);
    put(b.abbr, b.id, true);
    put(b.id, b.id, true);
  }
  for (const b of BOOKS) {
    if (b.douayName) put(b.douayName, b.id);
    for (const a of b.aliases) put(a, b.id);
  }
  // In Douay-Rheims usage "1 Kings" means 1 Samuel; modern usage is the reverse. Modern wins; "3 Kings"/"4 Kings" resolve to Kings.
})();

export function lookupBook(text: string): string | null {
  return ALIAS_MAP.get(normalizeBookText(text)) ?? null;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** Suggest books for a misspelled / partial name ("Mathew", "Revalations", "1 Corinthans"). */
export function suggestBooks(text: string, limit = 4): string[] {
  const q = normalizeBookText(text);
  if (!q) return [];
  const scored = new Map<string, number>();
  for (const [alias, id] of ALIAS_MAP) {
    let s: number;
    if (alias.startsWith(q)) s = 0.2 + (alias.length - q.length) * 0.01;
    else if (alias.includes(q) && q.length >= 3) s = 0.5;
    else {
      const d = levenshtein(alias, q);
      const allowed = Math.max(1, Math.floor(Math.max(alias.length, q.length) / 4));
      if (d > allowed) continue;
      s = 1 + d;
    }
    if (s < (scored.get(id) ?? Infinity)) scored.set(id, s);
  }
  return [...scored.entries()]
    .sort((a, b) => a[1] - b[1] || BOOK_ORDER[a[0]] - BOOK_ORDER[b[0]])
    .slice(0, limit)
    .map(([id]) => id);
}

export interface ParsedRef {
  ref: Ref;
  /** The text matched for the book name. */
  bookText: string;
}

export type ParseResult =
  | { ok: true; refs: ParsedRef[] }
  | { ok: false; error: string; suggestions: string[] };

const SEP = /[:.]/; // "3:16" or "3.16"

/**
 * Parse a user-typed reference such as `Jn 3:16`, `1 cor 13`, `Gen 1:1-2:3`,
 * `ps23`, `jn6.51-58`, or a list `Jn 6:51-58; 1 Cor 11:23-26, 29`.
 * Numbers are returned exactly as typed; the caller decides which numbering scheme applies.
 */
export function parseRefs(input: string): ParseResult {
  const text = input.trim().replace(/[–—]/g, '-').replace(/\s+/g, ' ');
  if (!text) return { ok: false, error: 'Empty reference', suggestions: [] };
  const parts = text.split(/\s*;\s*/);
  const refs: ParsedRef[] = [];
  let lastBook: string | null = null;
  for (const part of parts) {
    // book name = optional leading numeral + letters (allowing spaces/periods), then the numeric tail.
    const m = /^((?:[1-4]|i{1,3}|iv|1st|2nd|3rd|first|second|third)?\s*\.?\s*[a-z][a-z .']*?)\s*(\d[\d\s:.,\-]*)?$/i.exec(part);
    let bookText = '';
    let tail = '';
    if (m) {
      bookText = m[1].trim();
      tail = (m[2] ?? '').trim();
    }
    let book = m ? lookupBook(bookText) : null;
    if (!book && !m && lastBook && /^\d/.test(part)) {
      book = lastBook;
      tail = part;
    }
    if (!book) {
      return { ok: false, error: `Unrecognised book: “${bookText || part}”`, suggestions: suggestBooks(bookText || part) };
    }
    lastBook = book;
    const parsed = parseTail(book, tail);
    if (typeof parsed === 'string') return { ok: false, error: parsed, suggestions: [] };
    for (const r of parsed) refs.push({ ref: r, bookText });
  }
  return { ok: true, refs };
}

function parseTail(book: string, tailIn: string): Ref[] | string {
  const b = getBook(book);
  const tail = tailIn.replace(/\s+/g, '');
  if (!tail) return [{ book, c1: 1, c2: b.chapters }];
  const segs = tail.split(',').filter(Boolean);
  const out: Ref[] = [];
  let curChapter: number | null = null;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    // forms: C | C-C | C:V | C:V-V | C:V-C:V | V (continuation, or single-chapter book) | V-V
    let m: RegExpExecArray | null;
    if ((m = new RegExp(`^(\\d+)${SEP.source}(\\d+)-(\\d+)${SEP.source}(\\d+)$`).exec(seg))) {
      out.push({ book, c1: +m[1], v1: +m[2], c2: +m[3], v2: +m[4] });
      curChapter = +m[3];
    } else if ((m = new RegExp(`^(\\d+)${SEP.source}(\\d+)-(\\d+)$`).exec(seg))) {
      out.push({ book, c1: +m[1], v1: +m[2], c2: +m[1], v2: +m[3] });
      curChapter = +m[1];
    } else if ((m = new RegExp(`^(\\d+)${SEP.source}(\\d+)$`).exec(seg))) {
      out.push({ book, c1: +m[1], v1: +m[2], c2: +m[1], v2: +m[2] });
      curChapter = +m[1];
    } else if ((m = /^(\d+)-(\d+)$/.exec(seg))) {
      if (b.chapters === 1) out.push({ book, c1: 1, v1: +m[1], c2: 1, v2: +m[2] });
      else if (curChapter !== null && i > 0) out.push({ book, c1: curChapter, v1: +m[1], c2: curChapter, v2: +m[2] });
      else out.push({ book, c1: +m[1], c2: +m[2] });
    } else if ((m = /^(\d+)$/.exec(seg))) {
      const n = +m[1];
      if (b.chapters === 1) out.push({ book, c1: 1, v1: n, c2: 1, v2: n });
      else if (curChapter !== null && i > 0) out.push({ book, c1: curChapter, v1: n, c2: curChapter, v2: n });
      else {
        out.push({ book, c1: n, c2: n });
        curChapter = null;
      }
    } else {
      return `Could not read the chapter/verse part “${tailIn}”`;
    }
  }
  for (const r of out) {
    if (r.c1 < 1 || r.c2 < r.c1 || r.c2 > b.chapters) {
      return `${b.name} has ${b.chapters} chapter${b.chapters === 1 ? '' : 's'} (in the Vulgate numbering).`;
    }
  }
  return out;
}

/** Cheap check used by search: does this input look like a scripture reference at all? */
export function looksLikeRef(input: string): boolean {
  return /^\s*(?:[1-4]|i{1,3}|iv)?\s*\.?\s*[a-z][a-z .']*\s*\d/i.test(input) || (!!lookupBook(input) && input.trim().length >= 2);
}

export { BOOK_BY_ID };
