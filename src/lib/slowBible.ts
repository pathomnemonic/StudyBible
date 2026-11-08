import data from '../data/slowBible.json';
import { BOOKS } from './canon';
import { getJson } from '../data/loader';
import { parseRefs } from './refs';

/** Every day's reading: segments of [book index, chapter, first verse, last verse], in canonical order. Modern (WEB-Catholic) numbering. */
export const SLOW_DAYS = data.days as number[][][];
export const SLOW_TOTAL = SLOW_DAYS.length;
export const YEAR_DAYS = 365;
export const SLOW_YEARS = Math.ceil(SLOW_TOTAL / YEAR_DAYS);
const bookId = (i: number) => data.books[i];
const bookName = (i: number) => BOOKS.find((b) => b.id === bookId(i))?.name ?? bookId(i);

export interface Segment { book: string; name: string; c: number; v1: number; v2: number }
export const segmentsOf = (day: number): Segment[] => (SLOW_DAYS[day] ?? []).map(([b, c, v1, v2]) => ({ book: bookId(b), name: bookName(b), c, v1, v2 }));
export const labelOf = (s: Segment) => `${s.name} ${s.c}:${s.v1}${s.v2 !== s.v1 ? `–${s.v2}` : ''}`;
export const dayLabel = (day: number) => segmentsOf(day).map(labelOf).join(' · ');
export const yearOf = (day: number) => Math.floor(day / YEAR_DAYS) + 1;
export const versesIn = (day: number) => (SLOW_DAYS[day] ?? []).reduce((n, s) => n + (s[3] - s[2] + 1), 0);

/** Where each book begins and ends, and in which year, for the table of the whole course. */
export function overview() {
  const rows: { year: number; books: { name: string; first: number; last: number }[] }[] = [];
  const first = new Map<number, number>(), last = new Map<number, number>();
  SLOW_DAYS.forEach((d, i) => { const b = d[0][0]; if (!first.has(b)) first.set(b, i); last.set(b, i); });
  for (let y = 1; y <= SLOW_YEARS; y++) rows.push({ year: y, books: [] });
  for (const [b, f] of first) { const l = last.get(b)!; for (let y = yearOf(f); y <= yearOf(l); y++) rows[y - 1].books.push({ name: bookName(b), first: f, last: l }); }
  return rows;
}

/** Progress is kept on the device: the day you began, and which days you have marked done. */
const KEY = 'sb:slowBible';
export interface SlowState { start: string; done: number[] }
export const loadSlow = (): SlowState | null => { try { const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as SlowState | null; return s && /^\d{4}-\d{2}-\d{2}$/.test(s.start) ? { start: s.start, done: Array.isArray(s.done) ? s.done : [] } : null; } catch { return null; } };
export const saveSlow = (s: SlowState | null) => { try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch { /* private mode */ } };
export const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const daysBetween = (a: string, b: string) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8))) / 864e5);
export const todayIndex = (s: SlowState) => Math.max(0, Math.min(SLOW_TOTAL - 1, daysBetween(s.start, isoToday())));

/** Where a passage is read at Mass, from the daily readings the app has for 2026 to 2028. */
export interface LitHit { date: string; title: string; slot: string; ref: string }
type Entry = { date: string; title: string; slot: string; text: string; book: string; a: [number, number]; b: [number, number] };
let index: Promise<Map<string, Entry[]>> | null = null;
const SLOTS: Record<string, string> = { first_reading: 'First reading', responsorial_psalm: 'Psalm', second_reading: 'Second reading', gospel: 'Gospel' };
export function lectionaryIndex() {
  return (index ??= (async () => {
    const m = new Map<string, Entry[]>();
    for (const y of [2026, 2027, 2028]) {
      const d = await getJson<{ days: Record<string, { t: string; r: Record<string, string> }> }>(`lectionary/${y}.json`, true).catch(() => null);
      if (!d) continue;
      for (const [date, day] of Object.entries(d.days)) for (const [slot, text] of Object.entries(day.r)) {
        if (!SLOTS[slot]) continue;
        const p = parseRefs(text.split('|')[0]); if (!p.ok) continue;
        for (const { ref } of p.refs) { const e: Entry = { date, title: day.t, slot, text: text.split('|')[0].trim(), book: ref.book, a: [ref.c1, ref.v1 ?? 1], b: [ref.c2 ?? ref.c1, ref.v2 ?? ref.v1 ?? 999] }; (m.get(ref.book) ?? m.set(ref.book, []).get(ref.book)!).push(e); }
      }
    }
    return m;
  })());
}
const cmp = (x: [number, number], y: [number, number]) => (x[0] - y[0]) || (x[1] - y[1]);
export async function massHits(segs: Segment[], from: string, max = 3): Promise<LitHit[]> {
  const m = await lectionaryIndex(); const out: LitHit[] = [];
  for (const s of segs) for (const e of m.get(s.book) ?? []) {
    if (cmp(e.a, [s.c, s.v2]) <= 0 && cmp(e.b, [s.c, s.v1]) >= 0) out.push({ date: e.date, title: e.title, slot: SLOTS[e.slot], ref: e.text });
  }
  const seen = new Set<string>();
  return out.filter((h) => { const k = h.date + h.slot; return seen.has(k) ? false : (seen.add(k), true); }).sort((a, b) => (a.date >= from ? 0 : 1) - (b.date >= from ? 0 : 1) || a.date.localeCompare(b.date)).slice(0, max);
}
