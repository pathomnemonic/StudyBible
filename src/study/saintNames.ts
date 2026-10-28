import { butlerNames } from './butler';

export interface NameHit { name: string; dates: string[] }
const pretty = (k: string) => k.replace(/\b[a-zà-ÿ]/g, (c) => c.toUpperCase());
const clean = (k: string) => !/\d/.test(k) && k.length > 2;

/** Saints in Butler's calendar whose name has a word that starts with what was typed, with the days of their lives. */
export async function searchNames(q: string, limit = 60): Promise<NameHit[]> {
  const t = q.trim().toLowerCase().replace(/[^a-zà-ÿ ]/g, '');
  if (t.length < 2) return [];
  const names = await butlerNames();
  if (!names) return [];
  const out: (NameHit & { rank: number })[] = [];
  for (const [k, dates] of Object.entries(names)) {
    if (!clean(k)) continue;
    const words = k.split(' ');
    const rank = words[0] === t ? 0 : words.includes(t) ? 1 : words.some((w) => w.startsWith(t)) ? 2 : k.includes(t) ? 3 : 9;
    if (rank < 9) out.push({ name: pretty(k), dates, rank });
  }
  out.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  return out.slice(0, limit).map(({ name, dates }) => ({ name, dates }));
}
export const dayLabel = (md: string) => new Date(Date.UTC(2024, +md.slice(0, 2) - 1, +md.slice(3))).toLocaleDateString(undefined, { month: 'long', day: 'numeric', timeZone: 'UTC' });
