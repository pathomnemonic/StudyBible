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

const STRIP = /\b(?:saints?|sts?\.?|blessed|bl\.|pope|popes|bishop|bishops|martyrs?|virgins?|confessors?|abbots?|abbess|priests?|doctors?|of the church|memorial|feast|solemnity|optional|apostles?|and companions|companions|the|hermit|widow|religious|founder|deacon)\b\.?/gi;
/** the date (MM-DD) of Butler's life of a saint named in today's calendar, when the name is found there */
export async function butlerFor(calendarName: string): Promise<string | null> {
  const n = await butlerNames();
  if (!n) return null;
  const simple = calendarName.replace(/\(.*?\)/g, '').replace(/,.*$/, '').replace(STRIP, ' ').replace(/[^a-z ]/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  if (simple.length < 3) return null;
  if (n[simple]?.[0]) return n[simple][0];
  const hit = Object.keys(n).find((k) => k === simple || k.endsWith(' ' + simple) || k.startsWith(simple + ' '));
  return hit ? n[hit][0] : null;
}
