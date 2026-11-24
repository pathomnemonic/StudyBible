/**
 * Offline liturgical calendar computation (Roman Rite, ordinary form).
 *
 * This gives the season, week, Sunday/weekday cycle, the movable days, and the celebrations of the General Roman Calendar
 * that change what a Sunday or a Friday is: the fixed-date solemnities, All Souls, and the feasts of the Lord, each with
 * its transfer when a higher day falls on the same date (Universal Norms on the Liturgical Year and the Calendar, 5, 7,
 * 13, 59, 60). It does NOT know every local calendar: memorials, other saints' feasts, national solemnities and local
 * transfers come from the LitCal service (see litcal.ts) when online. Results here are labelled "computed" in the UI.
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

/** The day by the seasons and the movable feasts alone (the Proper of Time). */
function temporal(date: Date, variant: CalendarVariant): LiturgicalDay {
  const y = date.getUTCFullYear();
  const E = easter(y);
  const ash = addDays(E, -46);
  const pentecost = addDays(E, 49);
  const advent = adventStart(y);
  const { baptism } = epiphanyBaptism(y, variant);
  const base = { date: iso(date), sundayCycle: sundayCycle(date), weekdayCycle: weekdayCycle(date) };
  const dn = DAYS[dow(date)];
  const sun = dow(date) === 0;

  // Christmas season: Dec 25 → Baptism of the Lord
  const xmas = utc(y, 12, 25);
  if (date >= xmas || date <= baptism) {
    const isBaptism = iso(date) === iso(baptism);
    const dec = date.getUTCMonth() === 11;
    let name = `${dn} ${dec || date.getUTCDate() === 1 ? 'within the Octave of Christmas' : 'in the Christmas season'}`;
    let rank: LiturgicalDay['rank'] = sun ? 'sunday' : 'weekday';
    if (dec && date.getUTCDate() === 25) { name = 'The Nativity of the Lord (Christmas)'; rank = 'solemnity'; }
    else if (!dec && date.getUTCDate() === 1) { name = 'Solemnity of Mary, the Holy Mother of God'; rank = 'solemnity'; }
    else if (iso(date) === iso(epiphanyBaptism(dec ? y + 1 : y, variant).epiphany)) { name = 'The Epiphany of the Lord'; rank = 'solemnity'; }
    else if (isBaptism) { name = 'The Baptism of the Lord'; rank = 'feast'; }
    // the Sunday within the octave; when Christmas itself is a Sunday there is none, and the feast is kept on 30 December
    else if (dec && (sun || (date.getUTCDate() === 30 && dow(xmas) === 0))) { name = 'The Holy Family of Jesus, Mary and Joseph'; rank = 'feast'; }
    else if (sun) name = 'Second Sunday after Christmas';
    return { ...base, season: 'christmas', seasonName: 'Christmas', dayName: name, color: 'white', rank };
  }
  // Advent
  if (date >= advent) {
    const wk = Math.floor(diffDays(date, advent) / 7) + 1;
    const gaudete = sun && wk === 3;
    return { ...base, season: 'advent', seasonName: 'Advent', week: wk, dayName: sun ? `${ord(wk)} Sunday of Advent${gaudete ? ' (Gaudete)' : ''}` : `${dn} of the ${ord(wk)} week of Advent`, color: gaudete ? 'rose' : 'violet', rank: sun ? 'sunday' : 'weekday' };
  }
  // Ordinary Time, first part: after Baptism (Mon) → before Ash Wednesday
  if (date > baptism && date < ash) {
    // Week 1 begins the day after the Baptism of the Lord, whether that feast is a Sunday or (where the Epiphany is kept on
    // 7 or 8 January) a Monday; the Sunday that follows is always the Second Sunday in Ordinary Time.
    const secondSunday = addDays(baptism, 7 - dow(baptism));
    const w = date < secondSunday ? 1 : 2 + Math.floor(diffDays(sundayOnOrBefore(date), secondSunday) / 7);
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
  let color: Color = 'green';
  const since = diffDays(date, pentecost);
  // counted from Pentecost: Trinity the Sunday after; Corpus Christi the Thursday after that (or the next Sunday); the Sacred Heart the Friday after the second Sunday
  const corpus = variant === 'usa' ? 14 : 11;
  if (since === 7) { name = 'The Most Holy Trinity'; rank = 'solemnity'; color = 'white'; }
  else if (since === corpus) { name = 'The Most Holy Body and Blood of Christ (Corpus Christi)'; rank = 'solemnity'; color = 'white'; }
  else if (since === 19) { name = 'The Most Sacred Heart of Jesus'; rank = 'solemnity'; color = 'white'; }
  else if (sun && wk === 34) { name = 'Our Lord Jesus Christ, King of the Universe'; rank = 'solemnity'; color = 'white'; }
  return { ...base, season: 'ordinary', seasonName: 'Ordinary Time', week: wk, dayName: name, color, rank };
}

/** A celebration with a fixed date that outranks an ordinary Sunday. */
interface Fixed { m: number; d: number; name: string; rank: 'solemnity' | 'feast'; color: Color; /** a feast of a saint: it replaces a weekday but gives way to a Sunday or any higher day */ weekdayOnly?: boolean; /** kept as a feast only in the United States calendar */ usaOnly?: boolean }
const FIXED: Fixed[] = [
  { m: 2, d: 2, name: 'The Presentation of the Lord', rank: 'feast', color: 'white' },
  { m: 3, d: 19, name: 'Saint Joseph, Spouse of the Blessed Virgin Mary', rank: 'solemnity', color: 'white' },
  { m: 3, d: 25, name: 'The Annunciation of the Lord', rank: 'solemnity', color: 'white' },
  { m: 6, d: 24, name: 'The Nativity of Saint John the Baptist', rank: 'solemnity', color: 'white' },
  { m: 6, d: 29, name: 'Saints Peter and Paul, Apostles', rank: 'solemnity', color: 'red' },
  { m: 8, d: 6, name: 'The Transfiguration of the Lord', rank: 'feast', color: 'white' },
  { m: 8, d: 15, name: 'The Assumption of the Blessed Virgin Mary', rank: 'solemnity', color: 'white' },
  { m: 9, d: 14, name: 'The Exaltation of the Holy Cross', rank: 'feast', color: 'red' },
  { m: 11, d: 1, name: 'All Saints', rank: 'solemnity', color: 'white' },
  { m: 11, d: 2, name: 'The Commemoration of All the Faithful Departed (All Souls)', rank: 'solemnity', color: 'violet' },
  // feasts of apostles, evangelists and first martyrs, and Our Lady of Guadalupe in the United States: each replaces a weekday's name and gives way to a Sunday, a solemnity, Holy Week and the Easter octave
  ...([
    [11, 30, 'Saint Andrew, Apostle', 'red'],
    [1, 25, 'The Conversion of Saint Paul, Apostle', 'white'],
    [2, 22, 'The Chair of Saint Peter, Apostle', 'white'],
    [4, 25, 'Saint Mark, Evangelist', 'red'],
    [5, 3, 'Saints Philip and James, Apostles', 'red'],
    [5, 14, 'Saint Matthias, Apostle', 'red'],
    [7, 3, 'Saint Thomas, Apostle', 'red'],
    [7, 25, 'Saint James, Apostle', 'red'],
    [8, 24, 'Saint Bartholomew, Apostle', 'red'],
    [9, 21, 'Saint Matthew, Apostle and Evangelist', 'red'],
    [10, 18, 'Saint Luke, Evangelist', 'red'],
    [10, 28, 'Saints Simon and Jude, Apostles', 'red'],
    [12, 12, 'Our Lady of Guadalupe', 'white', 1],
    [12, 26, 'Saint Stephen, the First Martyr', 'red'],
    [12, 27, 'Saint John, Apostle and Evangelist', 'white'],
    [12, 28, 'The Holy Innocents, Martyrs', 'red'],
  ] as [number, number, string, Color, number?][]).map(([m, d, name, color, usaOnly]): Fixed => ({ m, d, name, rank: 'feast', color, weekdayOnly: true, usaOnly: !!usaOnly })),
  { m: 11, d: 9, name: 'The Dedication of the Lateran Basilica', rank: 'feast', color: 'white' },
  { m: 12, d: 8, name: 'The Immaculate Conception of the Blessed Virgin Mary', rank: 'solemnity', color: 'white' },
];

/**
 * The date a fixed solemnity is actually kept in a year.
 *  - A Sunday of Advent, Lent or Easter outranks it: it moves to the Monday (Norms 5, 60).
 *  - Saint Joseph falling on Palm Sunday or in Holy Week is kept on the Saturday before Palm Sunday; the Annunciation falling
 *    in Holy Week or the Easter octave is kept on the Monday after the Second Sunday of Easter (Norms 60, as amended).
 *  - Meeting a movable solemnity of the Lord, it gives way: the Birth of John the Baptist meeting the Sacred Heart is kept the
 *    day before, 23 June (as the Holy See directed in 2022); any other such meeting moves it to the next day.
 * Solemnities on a Sunday in Ordinary Time, and feasts of the Lord, stay where they are and replace that Sunday.
 */
export function fixedDate(f: { m: number; d: number }, year: number, variant: CalendarVariant = 'universal'): Date {
  const date = utc(year, f.m, f.d);
  const E = easter(year);
  if (f.m === 3 && f.d === 19 && date >= addDays(E, -7)) return addDays(E, -8);
  if (f.m === 3 && f.d === 25 && date >= addDays(E, -7)) return addDays(E, 8); // the latest date for either is before any later season
  const t = temporal(date, variant);
  if (dow(date) === 0 && (t.season === 'advent' || t.season === 'lent' || t.season === 'easter')) return addDays(date, 1);
  if (t.rank === 'solemnity' && t.season === 'ordinary') return f.m === 6 && f.d === 24 && /Sacred Heart/.test(t.dayName) ? addDays(date, -1) : addDays(date, 1);
  return date;
}

/** The fixed celebration kept on this date, if any (after transfers). */
function fixedOn(date: Date, variant: CalendarVariant): Fixed | null {
  const y = date.getUTCFullYear();
  const key = iso(date);
  for (const f of FIXED) if (!(f.usaOnly && variant !== 'usa') && iso(f.rank === 'solemnity' && !(f.m === 11 && f.d === 2) ? fixedDate(f, y, variant) : utc(y, f.m, f.d)) === key) return f;
  return null;
}

export function liturgicalDay(date: Date, variant: CalendarVariant = 'universal'): LiturgicalDay {
  const t = temporal(date, variant);
  const f = fixedOn(date, variant);
  if (!f) return t;
  if (f.weekdayOnly) return t.rank === 'weekday' && !/Holy Week|Octave of Easter|Easter Octave/i.test(t.dayName) ? { ...t, dayName: f.name, rank: f.rank, color: f.color } : t;
  // a transferred solemnity always lands on a free day; a feast of the Lord yields to anything the seasons rank as a solemnity
  if (f.rank === 'feast' && (t.rank === 'solemnity' || t.rank === 'triduum' || t.season !== 'ordinary')) return t;
  if (f.m === 11 && f.d === 2 && t.rank === 'solemnity') return t;
  return { ...t, dayName: f.name, rank: f.rank, color: f.color };
}

export const COLOR_NAME: Record<Color, string> = { green: 'Green', violet: 'Violet', white: 'White', red: 'Red', rose: 'Rose' };
