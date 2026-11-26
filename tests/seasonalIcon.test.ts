import { describe, expect, it } from 'vitest';
import { iconForDate } from '../src/lib/seasonalIcon';

const d = (s: string) => new Date(`${s}T12:00:00`);

describe('seasonal icon', () => {
  it('is violet in Advent and Lent', () => {
    expect(iconForDate(d('2026-12-10'))).toBe('violet'); // Advent
    expect(iconForDate(d('2027-03-10'))).toBe('violet'); // Lent
    expect(iconForDate(d('2027-03-26'))).toBe('violet'); // Good Friday: the Triduum keeps Lent's violet
  });
  it('is the primary icon at Christmas and Easter', () => {
    expect(iconForDate(d('2026-12-28'))).toBe('primary'); // within the Octave of Christmas
    expect(iconForDate(d('2027-04-15'))).toBe('primary'); // Easter season
    expect(iconForDate(d('2027-05-15'))).toBe('primary'); // the day before Pentecost is still Easter white
  });
  it('is red on Pentecost', () => {
    expect(iconForDate(d('2027-05-16'))).toBe('red'); // Pentecost Sunday 2027
  });
  it('is green in Ordinary Time', () => {
    expect(iconForDate(d('2027-01-20'))).toBe('green'); // after the Baptism of the Lord, before Lent
    expect(iconForDate(d('2027-08-15'))).toBe('green'); // the long summer stretch
  });
});
