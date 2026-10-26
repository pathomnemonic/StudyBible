import { describe, expect, it } from 'vitest';
import { dutiesOn, holyDayOn, nextHolyDays } from '../src/liturgy/discipline';

const d = (s: string) => { const [y, m, dd] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd)); };
describe('obligations', () => {
  it('knows Ash Wednesday, Lenten Fridays and Good Friday in 2026', () => {
    expect(dutiesOn(d('2026-02-18'), 'usa').map((x) => x.kind)).toContain('fast');
    expect(dutiesOn(d('2026-02-20'), 'usa').map((x) => x.kind)).toContain('abstain');
    const gf = dutiesOn(d('2026-04-03'), 'usa');
    expect(gf[0].title).toMatch(/Good Friday/);
  });
  it('treats other Fridays as penance and a plain Tuesday as nothing', () => {
    expect(dutiesOn(d('2026-07-10'), 'usa').map((x) => x.kind)).toEqual(['penance']);
    expect(dutiesOn(d('2026-07-07'), 'usa')).toEqual([]);
  });
  it('asks for Mass on Sundays and the U.S. holy days, with the Saturday and Monday exceptions', () => {
    expect(dutiesOn(d('2026-07-05'), 'usa')[0].kind).toBe('mass');
    expect(holyDayOn(d('2026-12-25'), 'usa')?.name).toMatch(/Christmas/);
    expect(holyDayOn(d('2026-12-08'), 'usa')?.name).toMatch(/Immaculate/); // a Tuesday
    expect(holyDayOn(d('2026-08-15'), 'usa')).toBeNull(); // a Saturday
    expect(holyDayOn(d('2027-11-01'), 'usa')).toBeNull(); // a Monday
    expect(holyDayOn(d('2027-01-01'), 'usa')?.name).toMatch(/Mother of God/); // a Friday
    expect(holyDayOn(d('2026-05-14'), 'usa')?.name).toMatch(/Ascension/);
  });
  it('lists the next holy days in order', () => {
    const n = nextHolyDays(d('2026-10-26'), 'usa', 3).map((x) => x.name);
    expect(n[0]).toMatch(/All Saints|Immaculate/);
    expect(n.length).toBe(3);
  });
});
