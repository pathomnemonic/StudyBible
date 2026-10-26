import { addDays, easter, iso, liturgicalDay, type CalendarVariant } from './compute';

/** The Church's obligations on a day: Mass, fasting and abstinence. Dates and rules follow the universal law and the U.S. bishops' norms; a diocese or country may differ. */
export interface Duty { kind: 'mass' | 'fast' | 'abstain' | 'penance'; title: string; text: string }
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const same = (a: Date, b: Date) => iso(a) === iso(b);
const dow = (d: Date) => d.getUTCDay();

interface Holy { name: string; date: (y: number) => Date; note?: string }
const USA: Holy[] = [
  { name: 'Mary, Mother of God', date: (y) => utc(y, 1, 1), note: 'Not an obligation when it falls on a Saturday or Monday.' },
  { name: 'The Ascension of the Lord', date: (y) => addDays(easter(y), 39), note: 'Thursday of the sixth week of Easter; moved to the following Sunday in many U.S. provinces.' },
  { name: 'The Assumption of Mary', date: (y) => utc(y, 8, 15), note: 'Not an obligation when it falls on a Saturday or Monday.' },
  { name: 'All Saints', date: (y) => utc(y, 11, 1), note: 'Not an obligation when it falls on a Saturday or Monday.' },
  { name: 'The Immaculate Conception', date: (y) => utc(y, 12, 8), note: 'If it falls on a Sunday it moves to Monday and the obligation does not apply.' },
  { name: 'The Nativity of the Lord (Christmas)', date: (y) => utc(y, 12, 25) },
];
const UNIVERSAL: Holy[] = [
  { name: 'Mary, Mother of God', date: (y) => utc(y, 1, 1) },
  { name: 'The Epiphany of the Lord', date: (y) => utc(y, 1, 6), note: 'Many countries celebrate it on the Sunday.' },
  { name: 'St Joseph', date: (y) => utc(y, 3, 19), note: 'Many countries have removed the obligation.' },
  { name: 'The Ascension of the Lord', date: (y) => addDays(easter(y), 39), note: 'Many countries celebrate it on the Sunday.' },
  { name: 'Corpus Christi', date: (y) => addDays(easter(y), 60), note: 'Many countries celebrate it on the Sunday.' },
  { name: 'Sts Peter and Paul', date: (y) => utc(y, 6, 29), note: 'Many countries have removed the obligation.' },
  { name: 'The Assumption of Mary', date: (y) => utc(y, 8, 15) },
  { name: 'All Saints', date: (y) => utc(y, 11, 1) },
  { name: 'The Immaculate Conception', date: (y) => utc(y, 12, 8) },
  { name: 'The Nativity of the Lord (Christmas)', date: (y) => utc(y, 12, 25) },
];

/** Is this a day of obligation, and which one? (Sundays are separate.) */
export function holyDayOn(date: Date, variant: CalendarVariant): Holy | null {
  const list = variant === 'usa' ? USA : UNIVERSAL;
  const y = date.getUTCFullYear();
  for (const h of list) {
    if (!same(h.date(y), date)) continue;
    if (variant === 'usa') {
      const d = dow(date);
      if ((h.name.startsWith('Mary') || h.name.startsWith('The Assumption') || h.name === 'All Saints') && (d === 6 || d === 1)) return null;
      if (h.name === 'The Immaculate Conception' && d === 0) return null;
    }
    return h;
  }
  return null;
}

export function dutiesOn(date: Date, variant: CalendarVariant): Duty[] {
  const out: Duty[] = [];
  const y = date.getUTCFullYear();
  const E = easter(y);
  const day = liturgicalDay(date, variant);
  if (dow(date) === 0) out.push({ kind: 'mass', title: 'Sunday Mass', text: 'Catholics attend Mass on Sundays and holy days unless excused by serious reason, such as illness or caring for infants (CCC 2180–2183).' });
  const h = holyDayOn(date, variant);
  if (h && dow(date) !== 0) out.push({ kind: 'mass', title: `Holy day of obligation: ${h.name}`, text: `Mass is required today. ${h.note ?? ''}`.trim() });
  if (same(date, addDays(E, -46))) out.push({ kind: 'fast', title: 'Ash Wednesday: fast and abstinence', text: 'Abstain from meat (age 14 and over) and fast (ages 18 to 59): one full meal and two smaller ones that together do not equal it, with nothing between meals except drink. Those who are ill or pregnant are not bound.' });
  else if (same(date, addDays(E, -2))) out.push({ kind: 'fast', title: 'Good Friday: fast and abstinence', text: 'Abstain from meat (age 14 and over) and fast (ages 18 to 59). The Church encourages the fast to continue until the Easter Vigil.' });
  else if (dow(date) === 5) {
    const lent = day.season === 'lent' && day.rank !== 'solemnity';
    if (lent) out.push({ kind: 'abstain', title: 'Friday of Lent: abstain from meat', text: 'Catholics aged 14 and over abstain from meat on every Friday of Lent (CCC 2043, canon 1251).' });
    else if (day.season !== 'christmas' && day.rank !== 'solemnity' && !(day.season === 'easter' && E && iso(date) <= iso(addDays(E, 7)))) out.push({ kind: 'penance', title: 'Friday: a day of penance', text: variant === 'usa' ? 'In the United States, Catholics abstain from meat on Fridays or choose another penance, such as prayer, almsgiving or a fast (U.S. bishops, 1966; canon 1253).' : 'Every Friday is a day of penance in memory of the Passion. Abstaining from meat is the usual form, unless the bishops’ conference allows another (canons 1250–1253).' });
  }
  return out;
}

export function nextHolyDays(from: Date, variant: CalendarVariant, count = 5): { date: Date; name: string; note?: string }[] {
  const out: { date: Date; name: string; note?: string }[] = [];
  for (let n = 0; n < 420 && out.length < count; n++) {
    const d = addDays(from, n);
    const h = holyDayOn(d, variant);
    if (h) out.push({ date: d, name: h.name, note: h.note });
  }
  return out;
}
