import { getJson } from '../data/loader';
import { addDays, adventStart, easter, parseIso } from './compute';

export interface EfDay {
  name: string; rank: number; cls: string;
  rule: { gloria: boolean; credo: boolean; pref: string | null };
  commune: string | null;
  p: Record<string, string>;
  lat?: Record<string, string>;
}
type Table = Record<string, EfDay>;

let tem: Promise<Table> | null = null;
const tempora = () => (tem ??= getJson<Table>('missa/tempora.json', true).then((x) => x ?? {}));
const sancti = new Map<string, Promise<Table>>();
const month = (mm: string) => { if (!sancti.has(mm)) sancti.set(mm, getJson<Table>(`missa/sancti-${mm}.json`, true).then((x) => x ?? {})); return sancti.get(mm)!; };

const utcDays = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);

/** The Tempora (movable cycle) key of Divinum Officium for a date, e.g. "Pent03-0", "Quad1-3", "Adv2-5". */
export function temporaKey(d: Date): { key: string; sunday: string; epiSundays: number } {
  const y = d.getUTCFullYear();
  const dow = d.getUTCDay();
  const E = easter(y);
  const pent = addDays(E, 49);
  const adv = adventStart(y);
  const sept = addDays(E, -63);
  const n = (k: string, s = k) => ({ key: k, sunday: s, epiSundays: 0 });
  // Sundays after Epiphany (Jan 6): the first Sunday after the 6th is Epi1 in the 1962 calendar (the Holy Family)
  const jan6 = new Date(Date.UTC(y, 0, 6));
  const firstEpiSunday = addDays(jan6, 7 - jan6.getUTCDay());
  const epiSundays = Math.max(0, Math.floor(utcDays(addDays(sept, -1), firstEpiSunday) / 7) + 1);
  const xmas = new Date(Date.UTC(y, 11, 25));
  if (d >= xmas) return n(`Nat1-${dow}`, 'Nat1-0');
  if (d >= adv) { const w = Math.floor(utcDays(d, adv) / 7) + 1; return n(`Adv${w}-${dow}`, `Adv${w}-0`); }
  if (d >= addDays(pent, 7)) {
    const w = Math.floor(utcDays(d, pent) / 7);
    const lastSunday = addDays(adv, -7);
    const wLast = Math.floor(utcDays(lastSunday, pent) / 7);
    let wk = w;
    let epiExtra = -1;
    if (w === wLast) wk = 24;
    else if (w > 24) { epiExtra = w - 25; wk = 25; }
    if (wk === 25) { const k = `PentEpi${epiSundays + 1 + epiExtra}-${dow}`; return { key: k, sunday: `PentEpi${epiSundays + 1 + epiExtra}-0`, epiSundays }; }
    const ww = String(wk).padStart(2, '0');
    return { key: `Pent${ww}-${dow}`, sunday: `Pent${ww}-0`, epiSundays };
  }
  if (d >= E) { const w = Math.floor(utcDays(d, E) / 7); return n(`Pasc${w}-${dow}`, `Pasc${w}-0`); }
  const ash = addDays(E, -46);
  if (d >= addDays(E, -42)) { const w = Math.floor(utcDays(d, addDays(E, -42)) / 7) + 1; return n(`Quad${w}-${dow}`, `Quad${w}-0`); }
  if (d >= ash) return n(`Quadp3-${dow}`, 'Quadp3-0');
  if (d >= sept) { const w = Math.floor(utcDays(d, sept) / 7) + 1; return n(`Quadp${w}-${dow}`, `Quadp${w}-0`); }
  // Christmas and Epiphany seasons
  const dec25 = new Date(Date.UTC(y - 1, 11, 25));
  if (d >= firstEpiSunday) { const w = Math.floor(utcDays(d, firstEpiSunday) / 7) + 1; return { key: `Epi${w}-${dow}`, sunday: `Epi${w}-0`, epiSundays }; }
  if (d > jan6) return { key: `Epi1-${dow}`, sunday: 'Epi1-0', epiSundays };
  if (d > dec25) return n(dow === 0 ? 'Nat2-0' : `Nat2-${dow}`, 'Nat2-0');
  return n(`Nat1-${dow}`, 'Nat1-0');
}

export interface EfResult { day: EfDay; source: 'tempora' | 'sancti'; key: string; notes: string[]; passiontide: boolean; sunday: boolean }

/** The Mass of a date in the Extraordinary Form (1962 books), chosen by rank between the season and the saint of the day. */
export async function efDay(iso: string): Promise<EfResult | null> {
  const d = parseIso(iso);
  const tk = temporaKey(d);
  const [T, S] = await Promise.all([tempora(), month(iso.slice(5, 7))]);
  const notes: string[] = [];
  let tDay = T[tk.key];
  let fell = false;
  if (!tDay || !tDay.p.Introitus) {
    const base = T[tk.sunday] ?? (tk.sunday.startsWith('PentEpi') ? T[tk.sunday.replace('PentEpi', 'Epi')] : undefined);
    if (base) { tDay = tDay ? { ...tDay, p: { ...base.p, ...tDay.p }, rule: tDay.rule.gloria || tDay.rule.credo ? tDay.rule : base.rule } : { ...base, rank: 1.0, name: `Feria (Mass of ${base.name})`, cls: 'Feria' }; fell = !T[tk.key]; }
  }
  const sDay = S[iso.slice(8, 10)];
  if (!tDay && !sDay) return null;
  const sunday = d.getUTCDay() === 0;
  const tRank = tDay ? (fell ? 1.0 : tDay.rank) : -1;
  const useS = !!sDay && (!tDay || sDay.rank > tRank);
  const day = (useS ? sDay : tDay)!;
  if (useS && tDay && tDay.rank >= 1.5) notes.push(`Commemoration: ${tDay.name}.`);
  if (!useS && sDay) notes.push(`Commemoration of ${sDay.name}.`);
  if (fell && !useS) notes.push('An ordinary weekday: the Mass of the preceding Sunday is used.');
  const missing = ['Introitus', 'Oratio', 'Lectio', 'Evangelium', 'Secreta', 'Postcommunio'].filter((n) => !day.p[n] && !day.lat?.[n]);
  if (missing.length) notes.push('Some texts of this Mass are not in the source; use your missal for: ' + missing.join(', ').toLowerCase() + '.');
  return { day, source: useS ? 'sancti' : 'tempora', key: useS ? iso.slice(5) : tk.key, notes, passiontide: /^Quad[56]-/.test(tk.key), sunday };
}

const DEFAULT_PREFACE = (r: EfResult): string => {
  if (r.day.rule.pref) return r.day.rule.pref;
  const k = r.key;
  if (r.source === 'tempora') {
    if (/^Pasc[0-6]-/.test(k)) return k.startsWith('Pasc5-4') || k.startsWith('Pasc6') ? 'Asc' : 'Pasch';
    if (/^Pasc7/.test(k)) return 'Spiritu';
    if (/^Quad[56]/.test(k)) return 'Quad5';
    if (/^Quad/.test(k)) return 'Quad';
    if (/^Epi/.test(k)) return 'Epi';
    if (/^Nat/.test(k)) return 'Nat';
    if (/^Pent01-0/.test(k)) return 'Trinitate';
    if (/^Pent/.test(k) && r.sunday) return 'Trinitate';
  }
  return 'Communis';
};
export const prefaceKey = DEFAULT_PREFACE;
export const getOrdo = () => getJson<{ k: string; t?: string; who?: string; name?: string; if?: string }[]>('missa/ordo.json', true).then((x) => x ?? []);
export const getPrefaces = () => getJson<Record<string, string>>('missa/prefaces.json', true).then((x) => x ?? {});
