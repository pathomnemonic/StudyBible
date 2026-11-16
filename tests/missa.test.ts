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

// Sundays after Epiphany resumed before the last Sunday after Pentecost (Code of Rubrics 1960, no. 18). Before the fourth-cycle
// fix the 24th Sunday of a 25- to 28-Sunday year got the Mass of the Last Sunday (so it was said twice), the others were counted
// from the wrong end, and the resumed Sunday's own page had no English texts at all.
import { readFileSync } from 'node:fs';
import { resumedSunday } from '../src/liturgy/missaEF';
import { addDays, adventStart, easter, iso } from '../src/liturgy/compute';

describe('Extraordinary Form: the Sundays between the 23rd and the last after Pentecost', () => {
  it('2026 has 26 Sundays: the Fifth and Sixth after Epiphany, then the Last', () => {
    expect(key('2026-11-01')).toBe('Pent23-0');
    expect(key('2026-11-08')).toBe('PentEpi5-0');
    expect(key('2026-11-15')).toBe('PentEpi6-0');
    expect(key('2026-11-16')).toBe('PentEpi6-1');
    expect(key('2026-11-22')).toBe('Pent24-0');
    expect(key('2026-11-28')).toBe('Pent24-6');
  });
  it('2027 has 27: the Fourth, Fifth and Sixth; 2025 has 24: none; 2024 has 27', () => {
    expect(['2027-10-24', '2027-10-31', '2027-11-07', '2027-11-14', '2027-11-21'].map(key)).toEqual(['Pent23-0', 'PentEpi4-0', 'PentEpi5-0', 'PentEpi6-0', 'Pent24-0']);
    expect(['2025-11-09', '2025-11-16', '2025-11-23'].map(key)).toEqual(['Pent22-0', 'Pent23-0', 'Pent24-0']);
    expect(['2024-11-03', '2024-11-10', '2024-11-17', '2024-11-24'].map(key)).toEqual(['PentEpi4-0', 'PentEpi5-0', 'PentEpi6-0', 'Pent24-0']);
  });
  it('every year: Sundays 1 to 23 in order, the resumed ones end with the Sixth after Epiphany, the last is always the 24th', () => {
    for (let y = 1962; y <= 2100; y++) {
      const first = addDays(easter(y), 56), adv = adventStart(y);
      const keys: string[] = [];
      for (let d = first; d < adv; d = addDays(d, 7)) keys.push(key(iso(d)));
      const n = keys.length;
      expect(n).toBeGreaterThanOrEqual(23); expect(n).toBeLessThanOrEqual(28);
      expect(keys[n - 1]).toBe('Pent24-0');
      const plain = Math.min(23, n - 1);
      expect(keys.slice(0, plain)).toEqual(Array.from({ length: plain }, (_, i) => `Pent${String(i + 1).padStart(2, '0')}-0`));
      const resumed = keys.slice(23, n - 1);
      expect(resumed).toEqual(resumed.map((_, i) => `PentEpi${6 - (resumed.length - 1 - i)}-0`));
    }
  });
  it('a resumed Sunday has the prayers and readings of the Sunday after Epiphany and the chants of the 23rd after Pentecost', () => {
    const T = JSON.parse(readFileSync('public/data/missa/tempora.json', 'utf8'));
    for (const n of [3, 4, 5, 6]) {
      const d = resumedSunday(T, `PentEpi${n}-0`)!;
      expect(d.name).toMatch(/resumed/);
      for (const k of ['Oratio', 'Lectio', 'Evangelium', 'Secreta', 'Postcommunio']) expect(d.p[k], `${n} ${k}`).toBe(T[`Epi${n}-0`].p[k]);
      for (const k of ['Introitus', 'Graduale', 'Offertorium', 'Communio']) expect(d.p[k], `${n} ${k}`).toBe(T['Pent23-0'].p[k]);
      // the source's own (Latin-slot) copy of the chants agrees with this choice
      for (const k of ['Introitus', 'Offertorium', 'Communio']) expect(T[`PentEpi${n}-0`].lat[k]).toBe(T['Pent23-0'].p[k]);
    }
  });
});
