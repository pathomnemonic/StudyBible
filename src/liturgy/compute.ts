/**
 * Offline liturgical calendar computation (Roman Rite, ordinary form).
 *
 * This gives the season, week, Sunday/weekday cycle and the principal movable days without any network access.
 * It does NOT know every local calendar: saints' days, national solemnities and local transfers come from the
 * LitCal service (see litcal.ts) when online. Results here are therefore labelled "computed" in the UI.
 */

export type Season = 'advent' | 'christmas' | 'lent' | 'triduum' | 'easter' | 'ordinary';
export type Color = 'green' | 'violet' | 'white' | 'red' | 'rose';

export interface LiturgicalDay {
  date: string; // YYYY-MM-DD
  season: Season;
  seasonName: string;
  week?: number; // week of the season (Advent, Lent, Easter, Ordinary)
  dayName: string;
  color: Color;
  sundayCycle: 'A' | 'B' | 'C';
  weekdayCycle: 'I' | 'II';
  rank?: 'solemnity' | 'feast' | 'sunday' | 'weekday' | 'triduum';
  note?: string;
}

export type CalendarVariant = 'universal' | 'usa';

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const dow = (d: Date) => d.getUTCDay(); // 0 = Sunday
const sundayOnOrBefore = (d: Date) => addDays(d, -dow(d));
const diffDays = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);
export const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return utc(y, m, d);
};

/** Gregorian Easter Sunday (Meeus/Jones/Butcher). */
export function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month, day);
}

export function adventStart(year: number): Date {
  // Sunday on or before... the fourth Sunday before Christmas: Sunday nearest Nov 30
  const xmas = utc(year, 12, 25);
  const sundayBefore = addDays(xmas, -((dow(xmas) + 7) % 7 || 7)); // last Sunday strictly before Dec 25 (4th Advent)
  return addDays(sundayBefore, -21);
}

/** Epiphany and the Baptism of the Lord for the year's January. */
export function epiphanyBaptism(year: number, variant: CalendarVariant): { epiphany: Date; baptism: Date } {
  if (variant === 'universal') {
    const epiphany = utc(year, 1, 6);
    const baptism = addDays(epiphany, 7 - dow(epiphany)); // Sunday after Jan 6
    return { epiphany, baptism };
  }
  // USA: Epiphany on the Sunday between Jan 2 and Jan 8; Baptism the following Sunday (Monday if Epiphany is Jan 7 or 8).
  let epi = utc(year, 1, 2);
  while (dow(epi) !== 0) epi = addDays(epi, 1);
  const baptism = epi.getUTCDate() >= 7 ? addDays(epi, 1) : addDays(epi, 7);
  return { epiphany: epi, baptism };
}

/** Liturgical year letter: Year A begins Advent 2019, 2022, 2025, 2028… */
export function sundayCycle(d: Date): 'A' | 'B' | 'C' {
  const advent = adventStart(d.getUTCFullYear());
  const litYear = d >= advent ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
  return (['C', 'A', 'B'] as const)[litYear % 3];
}
export const weekdayCycle = (d: Date): 'I' | 'II' => {
  const advent = adventStart(d.getUTCFullYear());
  const litYear = d >= advent ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
  return litYear % 2 === 1 ? 'I' : 'II';
};

const ORD = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
const ord = (n: number) => {
  if (n <= 10) return ORD[n];
  const t = n % 100;
  const suffix = t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function liturgicalDay(date: Date, variant: CalendarVariant = 'universal'): LiturgicalDay {
  const y = date.getUTCFullYear();
  const E = easter(y);
  const ash = addDays(E, -46);
  const pentecost = addDays(E, 49);
  const advent = adventStart(y);
  const prevAdvent = adventStart(y - 1);
  const { baptism } = epiphanyBaptism(y, variant);
  const base = { date: iso(date), sundayCycle: sundayCycle(date), weekdayCycle: weekdayCycle(date) };
  const dn = DAYS[dow(date)];
  const sun = dow(date) === 0;

  // Christmas season: Dec 25 → Baptism of the Lord
  const xmas = utc(y, 12, 25);
  if (date >= xmas || date <= baptism) {
    const isBaptism = iso(date) === iso(baptism);
    let name = `${dn} in the Christmas season`;
    if (date.getUTCMonth() === 11 && date.getUTCDate() === 25) name = 'The Nativity of the Lord (Christmas)';
    else if (date.getUTCMonth() === 0 && date.getUTCDate() === 1) name = 'Solemnity of Mary, the Holy Mother of God';
    else if (iso(date) === iso(epiphanyBaptism(date.getUTCMonth() === 11 ? y + 1 : y, variant).epiphany)) name = 'The Epiphany of the Lord';
    else if (isBaptism) name = 'The Baptism of the Lord';
    else if (sun && date.getUTCMonth() === 11) name = 'Feast of the Holy Family';
    else if (sun) name = 'Second Sunday after Christmas';
    return { ...base, season: 'christmas', seasonName: 'Christmas', dayName: name, color: 'white', rank: sun || /Nativity|Mary|Epiphany|Baptism/.test(name) ? 'solemnity' : 'weekday' };
  }
  // Advent
  if (date >= advent) {
    const wk = Math.floor(diffDays(date, advent) / 7) + 1;
    const gaudete = sun && wk === 3;
    return { ...base, season: 'advent', seasonName: 'Advent', week: wk, dayName: sun ? `${ord(wk)} Sunday of Advent${gaudete ? ' (Gaudete)' : ''}` : `${dn} of the ${ord(wk)} week of Advent`, color: gaudete ? 'rose' : 'violet', rank: sun ? 'sunday' : 'weekday' };
  }
  // Ordinary Time, first part: after Baptism (Mon) → before Ash Wednesday
  if (date > baptism && date < ash) {
    const S = sundayOnOrBefore(date);
    const wk = 1 + Math.floor(diffDays(S, baptism) / 7);
    const w = iso(baptism) === iso(S) || wk === 1 ? 1 : wk;
    return { ...base, season: 'ordinary', seasonName: 'Ordinary Time', week: w, dayName: sun ? `${ord(w)} Sunday in Ordinary Time` : `${dn} of the ${ord(w)} week in Ordinary Time`, color: 'green', rank: sun ? 'sunday' : 'weekday' };
  }
  // Lent
  const holyThursday = addDays(E, -3);
  if (date >= ash && date < holyThursday) {
    if (diffDays(date, ash) < 4) return { ...base, season: 'lent', seasonName: 'Lent', week: 0, dayName: iso(date) === iso(ash) ? 'Ash Wednesday' : `${dn} after Ash Wednesday`, color: 'violet', rank: iso(date) === iso(ash) ? 'solemnity' : 'weekday' };
    const firstSun = addDays(ash, 4);
    const wk = Math.floor(diffDays(date, firstSun) / 7) + 1;
    const palm = addDays(E, -7);
    if (iso(date) === iso(palm)) return { ...base, season: 'lent', seasonName: 'Holy Week', week: 6, dayName: 'Palm Sunday of the Passion of the Lord', color: 'red', rank: 'solemnity' };
    const holy = date > palm;
    return {
      ...base,
      season: 'lent',
      seasonName: holy ? 'Holy Week' : 'Lent',
      week: holy ? 6 : wk,
      dayName: holy ? `${dn} of Holy Week` : sun ? `${ord(wk)} Sunday of Lent${wk === 4 ? ' (Laetare)' : ''}` : `${dn} of the ${ord(wk)} week of Lent`,
      color: !holy && sun && wk === 4 ? 'rose' : holy ? 'violet' : 'violet',
      rank: sun ? 'sunday' : 'weekday',
    };
  }
  // Triduum
  if (date >= holyThursday && date < E) {
    const names = ['Holy Thursday (Mass of the Lord’s Supper)', 'Good Friday of the Passion of the Lord', 'Holy Saturday'];
    const i = diffDays(date, holyThursday);
    return { ...base, season: 'triduum', seasonName: 'Sacred Paschal Triduum', dayName: names[i], color: i === 1 ? 'red' : i === 0 ? 'white' : 'violet', rank: 'triduum' };
  }
  // Easter
  if (date >= E && date <= pentecost) {
    const n = diffDays(date, E);
    const wk = Math.floor(n / 7) + 1;
    let name = sun ? `${ord(wk)} Sunday of Easter` : `${dn} of the ${ord(wk)} week of Easter`;
    if (n === 0) name = 'Easter Sunday of the Resurrection of the Lord';
    else if (n < 8) name = n === 7 ? 'Second Sunday of Easter (Sunday of Divine Mercy)' : `${dn} within the Octave of Easter`;
    const asc = variant === 'usa' ? 42 : 39;
    if (n === asc) name = 'The Ascension of the Lord';
    if (n === 49) name = 'Pentecost Sunday';
    return { ...base, season: 'easter', seasonName: 'Easter', week: wk, dayName: name, color: n === 49 ? 'red' : 'white', rank: n === 0 || n === 49 || n === asc ? 'solemnity' : sun ? 'sunday' : 'weekday' };
  }
  // Ordinary Time, second part: after Pentecost → Advent
  const week34Sunday = addDays(advent, -7);
  const S = sundayOnOrBefore(date);
  const wk = 34 - Math.round(diffDays(week34Sunday, S) / 7);
  let name = sun ? `${ord(wk)} Sunday in Ordinary Time` : `${dn} of the ${ord(wk)} week in Ordinary Time`;
  let rank: LiturgicalDay['rank'] = sun ? 'sunday' : 'weekday';
  const since = diffDays(date, pentecost);
  const corpus = variant === 'usa' ? 63 : 60;
  if (since === 7) { name = 'The Most Holy Trinity'; rank = 'solemnity'; }
  else if (since === corpus) { name = 'The Most Holy Body and Blood of Christ (Corpus Christi)'; rank = 'solemnity'; }
  else if (since === 19) { name = 'The Most Sacred Heart of Jesus'; rank = 'solemnity'; }
  else if (sun && wk === 34) { name = 'Our Lord Jesus Christ, King of the Universe'; rank = 'solemnity'; }
  void prevAdvent;
  return { ...base, season: 'ordinary', seasonName: 'Ordinary Time', week: wk, dayName: name, color: 'green', rank };
}

export const COLOR_NAME: Record<Color, string> = { green: 'Green', violet: 'Violet', white: 'White', red: 'Red', rose: 'Rose' };
