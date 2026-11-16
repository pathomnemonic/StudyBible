// The offline calendar against dates anyone can check in a printed ordo. Every block here failed before the fourth-cycle fix
// (docs/CYCLE4_LOG.md, section 3) unless marked "unchanged".
import { describe, expect, it } from 'vitest';
import { addDays, easter, fixedDate, iso, liturgicalDay, parseIso, type CalendarVariant } from '../src/liturgy/compute';
import { dutiesOn } from '../src/liturgy/discipline';

const day = (d: string, v: CalendarVariant = 'universal') => liturgicalDay(parseIso(d), v);
const name = (d: string, v: CalendarVariant = 'universal') => day(d, v).dayName;

describe('Corpus Christi is the Thursday after Trinity Sunday (or the Sunday after it)', () => {
  it.each([[2024, '2024-05-30', '2024-06-02'], [2025, '2025-06-19', '2025-06-22'], [2026, '2026-06-04', '2026-06-07'], [2027, '2027-05-27', '2027-05-30']])('%i', (_y, thu, sun) => {
    expect(name(thu)).toMatch(/Corpus Christi/);
    expect(name(sun, 'usa')).toMatch(/Corpus Christi/);
    expect(name(thu, 'usa')).not.toMatch(/Corpus Christi/);
    expect(day(thu).color).toBe('white');
  });
  it('and never anywhere else in the year', () => {
    for (const v of ['universal', 'usa'] as const) for (let y = 2020; y <= 2060; y++) {
      const hits: string[] = [];
      for (let d = parseIso(`${y}-01-01`); d.getUTCFullYear() === y; d = addDays(d, 1)) if (/Corpus Christi/.test(liturgicalDay(d, v).dayName)) hits.push(iso(d));
      expect(hits).toEqual([iso(addDays(easter(y), v === 'usa' ? 63 : 60))]);
    }
  });
  it('Trinity, the Sacred Heart and Christ the King are white, on their days', () => {
    expect(day('2026-05-31')).toMatchObject({ dayName: 'The Most Holy Trinity', color: 'white', rank: 'solemnity' });
    expect(day('2026-06-12')).toMatchObject({ dayName: 'The Most Sacred Heart of Jesus', color: 'white' });
    expect(day('2026-11-22')).toMatchObject({ color: 'white', week: 34 });
  });
});

describe('Ordinary Time after a Monday Baptism of the Lord (United States, Epiphany on 7 or 8 January)', () => {
  it('2024: week one starts on Tuesday 9 January and the next Sunday is the Second', () => {
    expect(name('2024-01-07', 'usa')).toBe('The Epiphany of the Lord');
    expect(name('2024-01-08', 'usa')).toBe('The Baptism of the Lord');
    expect(name('2024-01-09', 'usa')).toBe('Tuesday of the First week in Ordinary Time');
    expect(name('2024-01-14', 'usa')).toBe('Second Sunday in Ordinary Time');
    expect(name('2024-02-11', 'usa')).toBe('Sixth Sunday in Ordinary Time');
  });
  it('both calendars agree on every Sunday in Ordinary Time, every year', () => {
    for (let y = 2018; y <= 2060; y++) for (let d = parseIso(`${y}-01-14`); d.getUTCFullYear() === y; d = addDays(d, 1)) {
      const u = liturgicalDay(d, 'universal'), a = liturgicalDay(d, 'usa');
      if (u.season === 'ordinary' && a.season === 'ordinary') expect(`${iso(d)} week ${a.week}`).toBe(`${iso(d)} week ${u.week}`);
      if (u.season === 'ordinary') expect(u.week).toBeGreaterThanOrEqual(1);
    }
  });
  it('the weeks before Lent and after Pentecost join up as the Lectionary numbers them', () => {
    // 2026: Ash Wednesday 18 February falls in week 6; Ordinary Time resumes on Monday 25 May in week 8
    expect(name('2026-02-15')).toBe('Sixth Sunday in Ordinary Time');
    expect(name('2026-05-25')).toBe('Monday of the Eighth week in Ordinary Time');
    // 2025: week 8 before Lent (Ash Wednesday 5 March), week 10 after Pentecost (9 June)
    expect(name('2025-03-02')).toBe('Eighth Sunday in Ordinary Time');
    expect(name('2025-06-09')).toBe('Monday of the Tenth week in Ordinary Time');
  });
});

describe('fixed solemnities and feasts of the Lord are known offline', () => {
  it('on their own dates, replacing a Sunday in Ordinary Time', () => {
    expect(day('2026-08-15')).toMatchObject({ dayName: 'The Assumption of the Blessed Virgin Mary', rank: 'solemnity', color: 'white' });
    expect(day('2026-11-01')).toMatchObject({ dayName: 'All Saints', rank: 'solemnity' }); // a Sunday in 2026
    expect(day('2025-11-02').dayName).toMatch(/All Souls/); // a Sunday in 2025
    expect(day('2025-06-29')).toMatchObject({ dayName: 'Saints Peter and Paul, Apostles', color: 'red' }); // a Sunday in 2025
    expect(day('2025-09-14')).toMatchObject({ dayName: 'The Exaltation of the Holy Cross', rank: 'feast', color: 'red' }); // a Sunday in 2025
    expect(day('2025-11-09').dayName).toBe('The Dedication of the Lateran Basilica'); // a Sunday in 2025
    expect(day('2025-02-02').dayName).toBe('The Presentation of the Lord'); // a Sunday in 2025
    expect(day('2026-08-06').dayName).toBe('The Transfiguration of the Lord');
    expect(day('2026-06-24').dayName).toBe('The Nativity of Saint John the Baptist');
  });
  it('a Sunday of Advent or Lent outranks a solemnity, which moves to Monday', () => {
    expect(name('2024-12-08')).toBe('Second Sunday of Advent');
    expect(name('2024-12-09')).toBe('The Immaculate Conception of the Blessed Virgin Mary');
    expect(name('2023-03-19')).toMatch(/Fourth Sunday of Lent/);
    expect(name('2023-03-20')).toMatch(/Saint Joseph/);
    expect(name('2029-03-25')).toMatch(/Palm Sunday/);
  });
  it('Saint Joseph in Holy Week is kept on the Saturday before Palm Sunday (2008: 15 March)', () => {
    expect(iso(fixedDate({ m: 3, d: 19 }, 2008))).toBe('2008-03-15');
    expect(name('2008-03-15')).toMatch(/Saint Joseph/);
    expect(name('2008-03-19')).toBe('Wednesday of Holy Week');
    expect(iso(fixedDate({ m: 3, d: 19 }, 2035))).toBe('2035-03-17'); // Easter 25 March 2035: 19 March is Monday of Holy Week
  });
  it('the Annunciation in Holy Week or the Easter octave is kept on the Monday after the Second Sunday of Easter', () => {
    expect(iso(fixedDate({ m: 3, d: 25 }, 2024))).toBe('2024-04-08'); // Easter 31 March 2024
    expect(name('2024-04-08')).toBe('The Annunciation of the Lord');
    expect(name('2024-03-25')).toBe('Monday of Holy Week');
    expect(iso(fixedDate({ m: 3, d: 25 }, 2016))).toBe('2016-04-04'); // 25 March 2016 was Good Friday
    expect(iso(fixedDate({ m: 3, d: 25 }, 2027))).toBe('2027-04-05'); // Easter 28 March 2027: Thursday of Holy Week
    expect(iso(fixedDate({ m: 3, d: 25 }, 2026))).toBe('2026-03-25'); // an ordinary Wednesday of Lent
  });
  it('the Birth of John the Baptist meeting the Sacred Heart is kept on 23 June (2022)', () => {
    expect(name('2022-06-24')).toBe('The Most Sacred Heart of Jesus');
    expect(name('2022-06-23')).toBe('The Nativity of Saint John the Baptist');
  });
  it('no solemnity is ever lost or doubled in a year', () => {
    for (const v of ['universal', 'usa'] as const) for (let y = 2000; y <= 2100; y++) {
      const seen = new Map<string, number>();
      for (let d = parseIso(`${y}-01-01`); d.getUTCFullYear() === y; d = addDays(d, 1)) { const n = liturgicalDay(d, v).dayName; seen.set(n, (seen.get(n) ?? 0) + 1); }
      for (const n of ['Saint Joseph, Spouse of the Blessed Virgin Mary', 'The Annunciation of the Lord', 'The Nativity of Saint John the Baptist', 'Saints Peter and Paul, Apostles', 'The Assumption of the Blessed Virgin Mary', 'All Saints', 'The Immaculate Conception of the Blessed Virgin Mary', 'The Most Sacred Heart of Jesus', 'The Most Holy Trinity', 'Pentecost Sunday', 'The Ascension of the Lord', 'The Epiphany of the Lord', 'The Baptism of the Lord', 'The Holy Family of Jesus, Mary and Joseph', 'Ash Wednesday', 'Our Lord Jesus Christ, King of the Universe'])
        expect(`${v} ${y} ${n}: ${seen.get(n) ?? 0}`).toBe(`${v} ${y} ${n}: 1`);
    }
  });
});

describe('the Christmas season', () => {
  it('the Holy Family is kept on 30 December when Christmas is a Sunday (2022), otherwise on the Sunday in the octave', () => {
    expect(name('2022-12-30')).toBe('The Holy Family of Jesus, Mary and Joseph');
    expect(name('2026-12-27')).toBe('The Holy Family of Jesus, Mary and Joseph');
    expect(day('2026-12-27').rank).toBe('feast');
    expect(name('2026-12-30')).toBe('Wednesday within the Octave of Christmas');
  });
  it('the Baptism of the Lord is a feast; the Epiphany is a solemnity', () => {
    expect(day('2026-01-11')).toMatchObject({ dayName: 'The Baptism of the Lord', rank: 'feast' });
    expect(day('2026-01-06')).toMatchObject({ dayName: 'The Epiphany of the Lord', rank: 'solemnity' });
    expect(day('2026-01-04', 'usa')).toMatchObject({ dayName: 'The Epiphany of the Lord', rank: 'solemnity' });
  });
});

describe('Friday penance (canon 1251: lifted only by a solemnity)', () => {
  const kinds = (d: string, v: CalendarVariant = 'universal') => dutiesOn(parseIso(d), v).map((x) => x.kind);
  it('Saint Joseph on a Friday of Lent (19 March 2027): no abstinence', () => {
    expect(name('2027-03-19')).toMatch(/Saint Joseph/);
    expect(kinds('2027-03-19')).not.toContain('abstain');
    expect(kinds('2027-03-12')).toContain('abstain'); // the Friday before is an ordinary Friday of Lent (unchanged)
  });
  it('the Annunciation on a Friday of Lent (25 March 2022): no abstinence', () => expect(kinds('2022-03-25')).toEqual([]));
  it('the Assumption (2025), All Saints (2024) and the Sacred Heart on a Friday: no penance', () => {
    expect(kinds('2025-08-15', 'usa').filter((k) => k !== 'mass')).toEqual([]);
    expect(kinds('2024-11-01').filter((k) => k !== 'mass')).toEqual([]);
    expect(kinds('2026-06-12')).toEqual([]);
  });
  it('a Friday in the Christmas octave is an ordinary Friday (26 December 2025, 2 January 2026); Christmas Day on a Friday is not', () => {
    expect(kinds('2025-12-26')).toEqual(['penance']);
    expect(kinds('2026-01-02')).toEqual(['penance']);
    expect(kinds('2026-12-25').filter((k) => k !== 'mass')).toEqual([]);
  });
  it('the Friday in the Easter octave is exempt; the next Friday is not (unchanged)', () => {
    expect(kinds('2026-04-10')).toEqual([]);
    expect(kinds('2026-04-17')).toEqual(['penance']);
  });
  it('in the United States the Thursday of the Ascension is an obligation only in some provinces, and says so', () => {
    const d = dutiesOn(parseIso('2026-05-14'), 'usa');
    expect(d[0].title).toMatch(/in some places/);
    expect(d[0].text).not.toMatch(/^Mass is required today/);
    expect(dutiesOn(parseIso('2026-05-14'), 'universal')[0].title).toBe('Holy day of obligation: The Ascension of the Lord');
  });
});
