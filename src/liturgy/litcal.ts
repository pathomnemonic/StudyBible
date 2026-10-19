import { db } from '../db/db';

/**
 * LitCal (https://litcal.johnromanodorazio.com) — an open-source liturgical calendar service (GPL) that knows the
 * General Roman Calendar and national/diocesan calendars. We call it from the browser, cache the response for the
 * year, and fall back to the offline computation (compute.ts) when it is unreachable. The app does not depend on it.
 */
export interface LitEvent {
  event_key: string;
  name: string;
  color: string[];
  grade: number;
  grade_lcl?: string;
  common_lcl?: string;
  date: string;
  readings?: Record<string, any>;
}

export interface LitYear {
  fetched: number;
  nation: string;
  year: number;
  events: LitEvent[];
}

const API = 'https://litcal.johnromanodorazio.com/api/v5';
const GRADE_NAME: Record<number, string> = { 0: 'Weekday', 1: 'Commemoration', 2: 'Optional memorial', 3: 'Memorial', 4: 'Feast', 5: 'Feast of the Lord', 6: 'Solemnity', 7: 'Higher solemnity' };
export const gradeName = (g: number) => GRADE_NAME[g] ?? '';

export const NATIONS: Record<string, string> = { universal: 'Universal (General Roman Calendar)', US: 'United States', CA: 'Canada', GB: 'Great Britain', AU: 'Australia', IE: 'Ireland', PH: 'Philippines', IN: 'India', IT: 'Italy', ES: 'Spain', FR: 'France', DE: 'Germany', PL: 'Poland', MX: 'Mexico', BR: 'Brazil' };

export async function loadLitYear(nation: string, year: number): Promise<LitYear | null> {
  const key = `litcal:${nation}:${year}`;
  const row = await db.cache.get(key);
  if (row && Date.now() - row.ts < 14 * 86400000) return row.value as LitYear;
  try {
    const url = nation === 'universal' ? `${API}/calendar/${year}` : `${API}/calendar/nation/${nation}/${year}`;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(url, { headers: { 'Accept-Language': 'en' }, signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const events: LitEvent[] = (j.litcal as any[]).map((e) => ({ event_key: e.event_key, name: e.name, color: e.color, grade: e.grade, grade_lcl: e.grade_lcl, common_lcl: e.common_lcl, date: String(e.date).slice(0, 10), readings: e.readings }));
    const val: LitYear = { fetched: Date.now(), nation, year, events };
    await db.cache.put({ key, value: val, ts: Date.now() });
    return val;
  } catch {
    return (row?.value as LitYear) ?? null;
  }
}

/** Events for one day from the civil-year files (a liturgical year spans two civil years, so load both when needed). */
export async function litDay(nation: string, isoDate: string): Promise<LitEvent[] | null> {
  const y = +isoDate.slice(0, 4);
  const yr = await loadLitYear(nation, y);
  if (!yr) return null;
  return yr.events.filter((e) => e.date === isoDate);
}
