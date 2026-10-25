import { easter } from '../liturgy/compute';

/**
 * Which Catholic Church the reader belongs to. The app began with the Roman Rite; this lets other Churches see their own terms and dates
 * and be told plainly where the app does not yet follow their rite. We never guess an Eastern calendar we cannot compute.
 */
export type TraditionId = 'latin' | 'ordinariate' | 'byzantine' | 'syro-malabar' | 'syro-malankara' | 'maronite' | 'chaldean' | 'armenian' | 'alexandrian';

export interface Tradition {
  id: TraditionId;
  name: string;
  /** what the main liturgy is called there */
  liturgy: string;
  /** a link to the Church's own site, checked when added */
  site?: { label: string; url: string };
  /** whether the Roman lectionary, Office and calendar in this app match the rite */
  roman: boolean;
}

export const TRADITIONS: Tradition[] = [
  { id: 'latin', name: 'Latin (Roman) Church', liturgy: 'Mass', roman: true },
  { id: 'ordinariate', name: 'A Personal Ordinariate (Anglican Use)', liturgy: 'Mass (Divine Worship)', roman: true },
  { id: 'byzantine', name: 'Byzantine Churches (Ukrainian, Ruthenian, Melkite, Romanian, Greek, Slovak…)', liturgy: 'Divine Liturgy', roman: false, site: { label: 'Melkite Greek Catholic Church', url: 'https://melkite.org' } },
  { id: 'syro-malabar', name: 'Syro-Malabar Church', liturgy: 'Holy Qurbana', roman: false, site: { label: 'Syro-Malabar Church', url: 'https://syromalabarchurch.in' } },
  { id: 'syro-malankara', name: 'Syro-Malankara Church', liturgy: 'Holy Qurbana', roman: false },
  { id: 'maronite', name: 'Maronite Church', liturgy: 'Holy Qurbono', roman: false, site: { label: 'Maronite Eparchy of St Maron (USA)', url: 'https://stmaron.org' } },
  { id: 'chaldean', name: 'Chaldean Church', liturgy: 'Holy Qurbana', roman: false },
  { id: 'armenian', name: 'Armenian Catholic Church', liturgy: 'Holy Badarak', roman: false },
  { id: 'alexandrian', name: 'Coptic, Ethiopian and Eritrean Catholic Churches', liturgy: 'Divine Liturgy', roman: false },
];

export const traditionOf = (id: string | undefined): Tradition => TRADITIONS.find((t) => t.id === id) ?? TRADITIONS[0];

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

/** Easter by the Julian reckoning (Meeus), as a Gregorian civil date. The 13-day gap holds from 1900 to 2099. */
export function julianEaster(year: number): Date {
  const a = year % 4, b = year % 7, c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return addDays(utc(year, month, day), 13);
}

export interface FeastDate { label: string; date: Date; note?: string }

/** Movable days of the Byzantine year, from Pascha. `julian` chooses the Julian date of Pascha (as the Orthodox) instead of Rome's. */
export function byzantineMovable(year: number, julian: boolean): FeastDate[] {
  const p = julian ? julianEaster(year) : easter(year);
  return [
    { label: 'Clean Monday: the beginning of the Great Fast', date: addDays(p, -48) },
    { label: 'Lazarus Saturday', date: addDays(p, -8) },
    { label: 'Palm Sunday (Entry into Jerusalem)', date: addDays(p, -7) },
    { label: 'Holy and Great Pascha', date: p },
    { label: 'Thomas Sunday', date: addDays(p, 7) },
    { label: 'Mid-Pentecost', date: addDays(p, 25) },
    { label: 'Ascension of the Lord', date: addDays(p, 39) },
    { label: 'Pentecost', date: addDays(p, 49) },
    { label: 'All Saints', date: addDays(p, 56) },
  ];
}

/** The great fixed feasts. On the Julian ("old") calendar they fall 13 days later in the civil calendar. */
const FIXED: [number, number, string][] = [
  [9, 8, 'Nativity of the Theotokos'], [9, 14, 'Exaltation of the Holy Cross'], [11, 21, 'Entrance of the Theotokos into the Temple'], [12, 25, 'Nativity of the Lord'],
  [1, 6, 'Theophany'], [2, 2, 'Meeting of the Lord'], [3, 25, 'Annunciation'], [8, 6, 'Transfiguration'], [8, 15, 'Dormition of the Theotokos'],
];
export function byzantineFixed(year: number, oldCalendar: boolean): FeastDate[] {
  return FIXED.map(([m, d, label]) => ({ label, date: addDays(utc(year, m, d), oldCalendar ? 13 : 0) })).sort((a, b) => a.date.getTime() - b.date.getTime());
}
