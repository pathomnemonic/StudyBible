// "Today" is the reader's date, not the date in UTC; and stepping a day must not depend on the time zone.
import { afterEach, describe, expect, it } from 'vitest';
import { isoToday, shiftDay } from '../src/lib/day';

const TZ = process.env.TZ;
afterEach(() => { if (TZ === undefined) delete process.env.TZ; else process.env.TZ = TZ; });

describe('isoToday', () => {
  it('late afternoon in Los Angeles is still today there, though UTC has moved on', () => {
    process.env.TZ = 'America/Los_Angeles';
    const now = new Date('2026-12-25T01:30:00Z'); // 5:30 pm on Christmas Eve in Los Angeles
    expect(now.toISOString().slice(0, 10)).toBe('2026-12-25');
    expect(isoToday(now)).toBe('2026-12-24');
  });
  it('early morning in Auckland is already today there, though UTC is still yesterday', () => {
    process.env.TZ = 'Pacific/Auckland';
    expect(isoToday(new Date('2026-12-24T12:30:00Z'))).toBe('2026-12-25');
  });
});

describe('shiftDay', () => {
  it.each(['Pacific/Auckland', 'Pacific/Kiritimati', 'America/Los_Angeles', 'UTC'])('the day after and the day before, in %s', (tz) => {
    process.env.TZ = tz;
    expect(shiftDay('2026-12-25', 1)).toBe('2026-12-26');
    expect(shiftDay('2026-12-25', -1)).toBe('2026-12-24');
    expect(shiftDay('2027-03-01', -1)).toBe('2027-02-28');
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29');
  });
  it('the old way gave the same day for "day after" thirteen hours ahead of UTC', () => {
    process.env.TZ = 'Pacific/Auckland'; // UTC+13 in December
    const old = new Date(new Date('2026-12-25T12:00').getTime() + 864e5).toISOString().slice(0, 10);
    expect(old).toBe('2026-12-25');
  });
});
