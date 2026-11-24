import type { DayCardSpec } from './draw';
import { pickTagline } from './taglines';
import words from '../../data/dailyWords.json';

/** The hand-picked Daily Word slate: a word, the verse it comes from, and (where one was supplied) a question, for a date. The cards and the app use the same list. */
export interface DailyWord { word: string; ref: string; date: string; question?: string }
export const DAILY_WORDS = words as DailyWord[];
export const wordFor = (date: string): DailyWord | null => DAILY_WORDS.find((w) => w.date === date) ?? null;

/** The longest verse text one card carries; a longer passage is cut at a whole verse. */
export const MAX_VERSE_CHARS = 330;
export function trimVerses(all: [number, string][], from: number, to: number): { text: string; first: number; last: number; trimmed: boolean } | null {
  const picked: [number, string][] = [];
  let len = 0, trimmed = false;
  for (const [n, t] of all) {
    if (n < from || n > to) continue;
    if (picked.length && len + t.length > MAX_VERSE_CHARS) { trimmed = true; break; }
    picked.push([n, t]); len += t.length + 1;
  }
  if (!picked.length) return null;
  return { text: fixSmallCaps(picked.map((p) => p[1]).join(' ')), first: picked[0][0], last: picked[picked.length - 1][0], trimmed };
}

/** The Douay prints the opening words of some verses in capitals (AND THOU, BETHLEHEM). On a card that reads as shouting: lower them, keeping names capitalised. Only case changes; no wording. */
const NAMES = new Set(['BETHLEHEM', 'GOD', 'LORD', 'ISRAEL', 'JERUSALEM', 'SION', 'ZACHARY', 'JUDA', 'CHRIST']);
export function fixSmallCaps(t: string): string {
  const out = t.replace(/\b[A-Z]{2,}\b/g, (w) => (w === 'JESUS' ? w : NAMES.has(w) ? w[0] + w.slice(1).toLowerCase() : w.toLowerCase()));
  return out.replace(/^[a-z]/, (c) => c.toUpperCase());
}

export const longDate = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

export interface CardInputs {
  date: string; dayName: string; color: DayCardSpec['color'];
  verse: { text: string; label: string };
  /** the date's own Father or saint line from the daily data */
  saint?: { text: string; who: string; work?: string; verified?: boolean } | null;
  question?: string;
  word?: string; walk?: string;
  tagline?: string | number | null;
  /** Advent dates may also carry the Advent-only lines */
  advent?: boolean;
  credit?: string;
}

/** Assemble the card. A saint line that is not marked verified never goes on a card: the date is flagged instead. */
export function buildSpec(i: CardInputs): { spec: DayCardSpec; issues: string[] } {
  const issues: string[] = [];
  let father: DayCardSpec['father'];
  if (i.saint && i.saint.verified === true) father = { text: i.saint.text, who: i.saint.who + (i.saint.work && !i.saint.who.includes(i.saint.work) ? `, ${i.saint.work}` : '') };
  else issues.push(i.saint ? 'the date’s saint line is not marked verified in the app data, so it is left off' : 'no saint line for this date in the app data');
  return {
    issues,
    spec: {
      dateLine: longDate(i.date), dayName: i.dayName, color: i.color, word: i.word, walk: i.walk,
      verse: { ...i.verse, translation: 'Douay-Rheims' }, father, question: i.question || undefined,
      tagline: pickTagline(i.date, i.tagline, { advent: i.advent }), credit: i.credit,
    },
  };
}

/** The Catechism paragraphs that cite a verse, from the Catechism's own scripture index: [c1, v1, c2, v2, paragraph, 1 when the footnote quotes the verse]. Quoting ones first. */
export function cccParagraphs(cites: [number, number, number, number, number, number][] | null, chapter: number, v1: number | undefined, v2: number | undefined, max = 6): number[] {
  if (!cites) return [];
  const a = v1 ?? 1, b = v2 ?? v1 ?? 999;
  const hit = new Map<number, boolean>();
  for (const [c1, x, c2, y, para, quotes] of cites) {
    if (c1 !== chapter || c2 !== chapter || y < a || x > b) continue;
    hit.set(para, (hit.get(para) ?? false) || quotes === 1);
  }
  return [...hit].sort((p, q) => Number(q[1]) - Number(p[1]) || p[0] - q[0]).slice(0, max).map(([n]) => n);
}
