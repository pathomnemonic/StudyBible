import { describe, expect, it } from 'vitest';
import { addDays, adventStart, easter, iso, liturgicalDay, parseIso, sundayCycle } from '../src/liturgy/compute';

describe('liturgical computation', () => {
  it('computes Easter correctly for known years', () => {
    expect(iso(easter(2024))).toBe('2024-03-31');
    expect(iso(easter(2025))).toBe('2025-04-20');
    expect(iso(easter(2026))).toBe('2026-04-05');
    expect(iso(easter(2027))).toBe('2027-03-28');
  });
  it('finds the first Sunday of Advent', () => {
    expect(iso(adventStart(2025))).toBe('2025-11-30');
    expect(iso(adventStart(2026))).toBe('2026-11-29');
  });
  it('assigns Sunday cycles (Year A began Advent 2025)', () => {
    expect(sundayCycle(parseIso('2025-12-07'))).toBe('A');
    expect(sundayCycle(parseIso('2026-10-19'))).toBe('A');
    expect(sundayCycle(parseIso('2026-12-06'))).toBe('B');
    expect(sundayCycle(parseIso('2027-12-05'))).toBe('C');
  });
  it('labels seasons and weeks like the General Roman Calendar', () => {
    expect(liturgicalDay(parseIso('2026-10-19')).dayName).toBe('Monday of the 29th week in Ordinary Time');
    expect(liturgicalDay(parseIso('2026-02-18')).dayName).toBe('Ash Wednesday');
    expect(liturgicalDay(parseIso('2026-04-05')).dayName).toMatch(/Easter Sunday/);
    expect(liturgicalDay(parseIso('2026-05-24')).dayName).toBe('Pentecost Sunday');
    expect(liturgicalDay(parseIso('2026-11-22')).dayName).toMatch(/King of the Universe/);
    expect(liturgicalDay(parseIso('2026-12-25')).season).toBe('christmas');
    expect(liturgicalDay(parseIso('2026-12-02')).season).toBe('advent');
    expect(liturgicalDay(addDays(easter(2026), -1)).dayName).toBe('Holy Saturday');
  });
  it('knows the weekday cycle (Year I in odd years)', () => {
    expect(liturgicalDay(parseIso('2026-10-19')).weekdayCycle).toBe('II');
    expect(liturgicalDay(parseIso('2027-03-01')).weekdayCycle).toBe('I');
  });
});
