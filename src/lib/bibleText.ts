import type { BookData, ChapterData } from './types';
import type { Scheme } from './types';
import { fromAnchor, nativeChaptersFor, toAnchor } from './versification';
import { getBookText, type EditionRecord } from '../data/loader';
import { getBook } from './canon';
import { type Ref } from './refs';

export interface FlatVerse {
  n: number;
  text: string;
  notes?: string[];
}

/** Collapse a chapter's runs into one entry per verse number. */
export function flattenChapter(ch: ChapterData | undefined): FlatVerse[] {
  if (!ch) return [];
  const map = new Map<number, FlatVerse>();
  let cur = 0;
  for (const b of ch.blocks) {
    if (typeof b[1] === 'string') continue;
    for (const [v, t] of b[1]) {
      if (v > 0) cur = v;
      if (cur === 0) continue;
      const e = map.get(cur) ?? { n: cur, text: '' };
      e.text = e.text ? `${e.text} ${t}`.trim() : t;
      map.set(cur, e);
    }
  }
  if (ch.notes) for (const [v, ns] of Object.entries(ch.notes)) {
    const e = map.get(+v);
    if (e) e.notes = ns;
  }
  return [...map.values()].sort((a, b) => a.n - b.n);
}

export function chapterTitle(ch: ChapterData | undefined): string | undefined {
  const d = ch?.blocks.find((b) => b[0] === 'd');
  return d ? (d[1] as string) : undefined;
}

export interface AnchorText {
  /** anchor verse → text in this edition */
  verses: Map<number, { text: string; span: number; native: string; exact: boolean; note?: string; footnotes?: string[] }>;
  title?: string;
}

/** The text of one anchor chapter in some edition, keyed by anchor verse number. */
export async function anchorChapterText(edition: EditionRecord, bookId: string, anchorChapter: number): Promise<AnchorText> {
  const out: AnchorText = { verses: new Map() };
  const nativeChapters = nativeChaptersFor(edition.scheme as Scheme, bookId, anchorChapter);
  let data: BookData;
  try {
    data = await getBookText(edition.id, bookId);
  } catch {
    return out;
  }
  for (const nc of nativeChapters) {
    const ch = data.chapters[nc - 1];
    if (!ch) continue;
    const title = chapterTitle(ch);
    if (title) {
      const t = toAnchor(edition.scheme as Scheme, bookId, nc, 0);
      if (t.c === anchorChapter) out.title = title;
    }
    for (const fv of flattenChapter(ch)) {
      const m = toAnchor(edition.scheme as Scheme, bookId, nc, fv.n);
      if (m.c !== anchorChapter) continue;
      const prev = out.verses.get(m.v1);
      if (prev) {
        prev.text += ' ' + fv.text;
        prev.native += `,${fv.n}`;
      } else {
        out.verses.set(m.v1, { text: fv.text, span: m.v2, native: String(fv.n), exact: m.exact, note: m.note, footnotes: fv.notes });
      }
    }
  }
  return out;
}

/** Text of an anchor passage, for cross-reference previews and verse comparison. */
export async function passageText(edition: EditionRecord, ref: Ref, maxVerses = 12): Promise<{ v: number; c: number; text: string }[]> {
  const out: { v: number; c: number; text: string }[] = [];
  const book = getBook(ref.book);
  for (let c = ref.c1; c <= ref.c2 && out.length < maxVerses; c++) {
    const at = await anchorChapterText(edition, ref.book, c);
    const from = c === ref.c1 ? (ref.v1 ?? 1) : 1;
    const to = c === ref.c2 ? (ref.v2 ?? 999) : 999;
    for (const [v, e] of [...at.verses.entries()].sort((a, b) => a[0] - b[0])) {
      if (v >= from && v <= to) out.push({ v, c, text: e.text });
      if (out.length >= maxVerses) break;
    }
  }
  void book;
  return out;
}

/** Native verse numbers → anchor Ref (verses of one chapter). */
export function nativeToAnchorRef(edition: EditionRecord, book: string, nativeChapter: number, v1: number, v2: number): { ref: Ref; exact: boolean } {
  const a = toAnchor(edition.scheme as Scheme, book, nativeChapter, v1);
  const b = toAnchor(edition.scheme as Scheme, book, nativeChapter, v2);
  return { ref: { book, c1: a.c, v1: a.v1, c2: b.c, v2: b.v2 }, exact: a.exact && b.exact };
}

/** Anchor ref → where to open it in an edition (native chapter + verse). */
export function anchorToNative(edition: EditionRecord, ref: Ref): { chapter: number; v1?: number; v2?: number; exact: boolean } {
  const s = edition.scheme as Scheme;
  if (ref.v1 === undefined) return { chapter: nativeChaptersFor(s, ref.book, ref.c1)[0], exact: true };
  const a = fromAnchor(s, ref.book, ref.c1, ref.v1);
  const b = ref.v2 !== undefined ? fromAnchor(s, ref.book, ref.c2, ref.v2) : a;
  return { chapter: a.c, v1: a.v1, v2: b.c === a.c ? b.v2 : undefined, exact: a.exact && b.exact };
}
