import { getJson } from '../data/loader';

export interface ButlerEntry { name: string; heading?: string; text: string[] }
export interface ButlerMonth { month: string; monthName: string; source: string; edition: string; days: Record<string, ButlerEntry[]> }

const months = new Map<string, Promise<ButlerMonth | null>>();
export const butlerMonth = (mm: string) => {
  if (!months.has(mm)) months.set(mm, getJson<ButlerMonth>(`saints/butler/${mm}.json`, true).catch(() => null));
  return months.get(mm)!;
};
export const butlerDay = async (md: string): Promise<ButlerEntry[]> => (await butlerMonth(md.slice(0, 2)))?.days[md.slice(3)] ?? [];
let names: Promise<Record<string, string[]> | null> | null = null;
export const butlerNames = () => (names ??= getJson<Record<string, string[]>>('saints/butler/names.json', true).catch(() => null));

const STRIP = /\b(?:saints?|sts?\.?|blessed|bl\.|bd\.?|pope|popes|bishop|bishops|martyrs?|virgins?|confessors?|abbots?|abbess|priests?|doctors?|of the church|memorial|feast|solemnity|optional|apostles?|and companions|companions|the|hermit|widow|religious|founder|deacon|archbishop|patriarch|evangelist|c|m|v|mm|b)\b\.?/gi;
const STOP = new Set(['of', 'de', 'di', 'da', 'del', 'des', 'and', 'ov', 'von', 'van']);
/** the words of a saint's name, without titles, for comparing a calendar's wording with Butler's */
export const nameTokens = (s: string) => s.replace(/\(.*?\)/g, ' ').replace(STRIP, ' ').toLowerCase().replace(/[^a-zà-ÿ ]/g, ' ').split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
const lev1 = (a: string, b: string) => { if (Math.abs(a.length - b.length) > 1) return false; let i = 0, j = 0, d = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; } else { if (++d > 1) return false; if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; } } } return d + (a.length - i) + (b.length - j) <= 1; };
const sameWord = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && (lev1(a, b) || (a.slice(0, 5) === b.slice(0, 5) && a.length >= 5 && b.length >= 5)));
const dayNum = (md: string) => { const d = new Date(Date.UTC(2023, +md.slice(0, 2) - 1, +md.slice(3, 5))); return Math.floor(+d / 864e5); };
const near = (a: string, b: string) => { const x = Math.abs(dayNum(a) - dayNum(b)); return Math.min(x, 365 - x); };
/** how well a printed name (Butler's, or an index key) matches the wording of a calendar entry, 0 to 1 */
export function nameScore(printed: string[], wanted: string[]): number {
  if (!printed.length || !wanted.length) return 0;
  const a = printed.filter((p) => wanted.some((w) => sameWord(p, w))).length;
  const b = wanted.filter((w) => printed.some((p) => sameWord(p, w))).length;
  return (a / printed.length) * 0.6 + (b / wanted.length) * 0.4;
}
/**
 * The date (MM-DD) of Butler's life of the saint a calendar names. Butler keeps his own calendar, so the date can differ by a few days
 * (or more), and he spells some names his own way: names are compared word by word, and a life on or near the calendar's own day wins.
 */
export async function butlerFor(calendarName: string, isoDate?: string): Promise<string | null> {
  const n = await butlerNames();
  if (!n) return null;
  const want = nameTokens(calendarName.replace(/,.*$/, ''));
  if (!want.length) return null;
  const md = isoDate ? isoDate.slice(5, 10) : null;
  let best: { md: string; sc: number } | null = null;
  for (const [key, dates] of Object.entries(n)) {
    const sc = nameScore(nameTokens(key), want);
    if (sc < 0.55) continue;
    for (const d of dates) {
      const gap = md ? near(md, d) : 99;
      const total = sc + (gap === 0 ? 0.7 : gap <= 3 ? 0.5 : gap <= 10 ? 0.25 : 0);
      if (!best || total > best.sc) best = { md: d, sc: total };
    }
  }
  return best && best.sc >= 0.85 ? best.md : null;
}
