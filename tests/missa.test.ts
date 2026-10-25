import { describe, expect, it } from 'vitest';
import { temporaKey } from '../src/liturgy/missaEF';
import { parseIso } from '../src/liturgy/compute';

const key = (s: string) => temporaKey(parseIso(s)).key;
describe('Extraordinary Form calendar keys', () => {
  it('names the movable days of 2025', () => {
    expect(key('2025-04-20')).toBe('Pasc0-0'); // Easter
    expect(key('2025-04-27')).toBe('Pasc1-0'); // Low Sunday
    expect(key('2025-06-08')).toBe('Pasc7-0'); // Pentecost
    expect(key('2025-06-15')).toBe('Pent01-0'); // Trinity
    expect(key('2025-11-23')).toBe('Pent24-0'); // last Sunday after Pentecost
    expect(key('2025-11-30')).toBe('Adv1-0');
    expect(key('2025-12-14')).toBe('Adv3-0');
    expect(key('2025-03-05')).toBe('Quadp3-3'); // Ash Wednesday
    expect(key('2025-03-09')).toBe('Quad1-0');
    expect(key('2025-04-13')).toBe('Quad6-0'); // Palm Sunday
    expect(key('2025-02-16')).toBe('Quadp1-0'); // Septuagesima
    expect(key('2025-01-12')).toBe('Epi1-0');
    expect(key('2025-12-28')).toBe('Nat1-0');
  });
});
