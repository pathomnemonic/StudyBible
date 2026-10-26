import { describe, expect, it } from 'vitest';
import { lifeStats, parseBirthday, lineOfTheDay } from '../src/lib/memento';

describe('memento mori', () => {
  const now = new Date('2026-06-15T12:00:00');
  it('computes weeks and percent from a birthday and an estimate', () => {
    const s = lifeStats('1986-06-15', 80, now);
    expect(s.valid).toBe(true);
    expect(s.yearsLived).toBe(40);
    expect(s.pct).toBe(50);
    expect(s.weeksLived + s.weeksLeft).toBe(s.totalWeeks);
    expect(s.beyond).toBe(false);
  });
  it('says so when the person is past their own estimate', () => {
    const s = lifeStats('1930-01-01', 80, now);
    expect(s.beyond).toBe(true);
    expect(s.pct).toBe(100);
    expect(s.weeksLeft).toBe(0);
  });
  it('rejects a missing, future or absurd birthday', () => {
    expect(parseBirthday('', now)).toBeNull();
    expect(parseBirthday('2030-01-01', now)).toBeNull();
    expect(parseBirthday('1800-01-01', now)).toBeNull();
    expect(lifeStats('', 80, now).valid).toBe(false);
  });
  it('clamps a silly estimate and has a line for every day', () => {
    expect(lifeStats('1990-01-01', 5000, now).totalWeeks).toBe(Math.round(120 * 52.1775));
    expect(lineOfTheDay(now).text.length).toBeGreaterThan(10);
  });
});
