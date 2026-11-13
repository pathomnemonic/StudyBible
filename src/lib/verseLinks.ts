/** "More in this app": the pieces of this app that are about a verse. The index is built by scripts/launch/make-verse-links.ts
 *  into public/data/verse-links/<BOOK>.json (one file per book, fetched on demand). Numbers in the index are WEB-Catholic (modern English);
 *  pass `scheme` when the reader is showing an edition numbered differently and the call converts. */
import { getJson } from '../data/loader';
import { anchorChaptersFor, convertRef, nativeChaptersFor } from './versification';
import type { Scheme } from './types';

export type LinkKind =
  | 'argument' | 'claim' | 'heresy' | 'development' | 'words' | 'mentor' | 'life' | 'walk' | 'lesson'
  | 'kids-story' | 'kids-question' | 'apologetics' | 'apostolic' | 'reading' | 'hard-day';

export const KIND_LABEL: Record<LinkKind, string> = {
  argument: 'Argument', claim: 'Is that true?', heresy: 'Heresy lab', development: 'How it developed', words: 'Key word',
  mentor: 'Saints for this', life: 'Life of a saint', walk: 'Bible walk', lesson: 'Lesson', 'kids-story': 'Kids story',
  'kids-question': 'Kids question', apologetics: 'Apologetics', apostolic: 'Apostolic chain', reading: 'Sunday readings', 'hard-day': 'Hard day',
};
export const KIND_ICON: Record<LinkKind, string> = {
  argument: '🧩', claim: '❓', heresy: '⚠️', development: '🌱', words: '🔤', mentor: '🕊️', life: '📜', walk: '🥾', lesson: '🎓',
  'kids-story': '🧒', 'kids-question': '💬', apologetics: '🛡️', apostolic: '🔗', reading: '📖', 'hard-day': '🤍',
};

export interface VerseLink { kind: LinkKind; id: string; title: string; route: string; weight: number; why?: string; note?: string; topic?: string; verses?: number; /** true when the item is tied to the whole chapter, not to particular verses, so it must not be read as a verse-level citation */ wholeChapter?: boolean }
export interface LinkResult { items: VerseLink[]; /** how many more matched but are not in `items` */ more: number; total: number; notes: { topic?: string; text: string }[] }

/** [item, from, to, weight, why, note, topic]: from=0,to=0 means the whole chapter. */
type Row = number[];
export interface BookFile { v: 1; book: string; items: [string, string, string, string][]; why: string[]; notes: string[]; topics: string[]; r: Record<string, Row[]> }

const EMPTY: LinkResult = { items: [], more: 0, total: 0, notes: [] };
const PER_KIND = 3;

export function loadVerseLinks(book: string): Promise<BookFile | null> {
  return getJson<BookFile>(`verse-links/${book}.json`, true).catch(() => null);
}

/** English-numbered [chapter, verse] pairs for what the reader is showing. Defensive: any trouble falls back to the numbers as given. */
export function toIndexVerses(scheme: Scheme | undefined, book: string, chapter: number, verse: number): [number, number][] {
  if (!scheme || scheme === 'english') return [[chapter, verse]];
  try {
    const r = convertRef(scheme, 'english', { book, c1: chapter, v1: verse, c2: chapter, v2: verse }).ref;
    const out: [number, number][] = [];
    for (let v = r.v1 ?? verse; v <= Math.min(r.v2 ?? verse, (r.v1 ?? verse) + 5); v++) out.push([r.c1, v]);
    return out.length ? out : [[chapter, verse]];
  } catch { return [[chapter, verse]]; }
}
export function toIndexChapters(scheme: Scheme | undefined, book: string, chapter: number): number[] {
  if (!scheme || scheme === 'english') return [chapter];
  try {
    const set = new Set<number>();
    for (const a of anchorChaptersFor(scheme, book, chapter)) for (const n of nativeChaptersFor('english', book, a)) set.add(n);
    return set.size ? [...set] : [chapter];
  } catch { return [chapter]; }
}

function rank(found: Map<string, VerseLink>, cap: number, notes: LinkResult['notes']): LinkResult {
  const all = [...found.values()].sort((a, b) => b.weight - a.weight || a.title.localeCompare(b.title));
  // no one kind (a run of lessons, say) may fill the list while other kinds wait
  const used: Record<string, number> = {};
  const first: VerseLink[] = [];
  const rest: VerseLink[] = [];
  for (const l of all) { if ((used[l.kind] = (used[l.kind] ?? 0) + 1) <= PER_KIND) first.push(l); else rest.push(l); }
  const items = [...first, ...rest].slice(0, cap).sort((a, b) => b.weight - a.weight || a.title.localeCompare(b.title));
  return { items, more: Math.max(0, all.length - items.length), total: all.length, notes };
}

function collect(f: BookFile, chapters: Map<number, number[] | 'all'>, cap: number): LinkResult {
  const found = new Map<string, VerseLink>();
  const noteSet = new Map<string, { topic?: string; text: string }>();
  for (const [c, vs] of chapters) {
    for (const row of f.r[String(c)] ?? []) {
      const [i, from, to, w, why = -1, note = -1, topic = -1] = row;
      if (vs !== 'all' && (from === 0 || !vs.some((v) => v >= from && v <= to))) continue;
      const it = f.items[i];
      if (!it) continue;
      const key = `${it[0]}:${it[1]}`;
      const cur = found.get(key);
      const covered = from === 0 ? 0 : to - from + 1;
      if (cur) { cur.verses = (cur.verses ?? 0) + covered; cur.wholeChapter = cur.wholeChapter && from === 0; if (w <= cur.weight) continue; }
      found.set(key, { wholeChapter: (cur ? !!cur.wholeChapter : true) && from === 0, kind: it[0] as LinkKind, id: it[1], title: it[2], route: it[3], weight: w, why: why >= 0 ? f.why[why] : undefined, note: note >= 0 ? f.notes[note] : undefined, topic: topic >= 0 ? f.topics[topic] : undefined, verses: cur ? cur.verses : covered });
      if (note >= 0) noteSet.set(f.topics[topic] ?? f.notes[note], { topic: f.topics[topic], text: f.notes[note] });
    }
  }
  return found.size ? rank(found, cap, [...noteSet.values()]) : EMPTY;
}

/** Pure form, for tests and for callers that already hold the book file. */
export function verseLinksFrom(f: BookFile | null, book: string, chapter: number, verse: number, scheme?: Scheme, cap = 8): LinkResult {
  if (!f) return EMPTY;
  const m = new Map<number, number[]>();
  for (const [c, v] of toIndexVerses(scheme, book, chapter, verse)) (m.get(c) ?? m.set(c, []).get(c)!).push(v);
  return collect(f, m, cap);
}
export function chapterLinksFrom(f: BookFile | null, book: string, chapter: number, scheme?: Scheme, cap = 8): LinkResult {
  if (!f) return EMPTY;
  return collect(f, new Map(toIndexChapters(scheme, book, chapter).map((c) => [c, 'all' as const])), cap);
}

export async function getVerseLinks(book: string, chapter: number, verse: number, scheme?: Scheme, cap = 8): Promise<LinkResult> {
  return verseLinksFrom(await loadVerseLinks(book), book, chapter, verse, scheme, cap);
}
export async function getChapterLinks(book: string, chapter: number, scheme?: Scheme, cap = 8): Promise<LinkResult> {
  return chapterLinksFrom(await loadVerseLinks(book), book, chapter, scheme, cap);
}
