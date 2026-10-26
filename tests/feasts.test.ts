import { describe, expect, it } from 'vitest';
import { FEASTS } from '../src/data/feasts';
import { parseRefs } from '../src/lib/refs';

describe('feasts guide', () => {
  it('has unique entries that explain themselves and cite Scripture that parses', () => {
    expect(new Set(FEASTS.map((f) => f.id)).size).toBe(FEASTS.length);
    for (const f of FEASTS) {
      expect(f.about.length, f.id).toBeGreaterThan(80);
      expect(f.scripture.length, f.id).toBeGreaterThanOrEqual(1);
      for (const r of f.scripture) expect(parseRefs(r).ok, `${f.id} ${r}`).toBe(true);
    }
  });
  it('lists the six holy days of obligation of the Roman calendar in the United States', () => {
    expect(FEASTS.filter((f) => f.obligation).map((f) => f.id).sort()).toEqual(['all-saints', 'ascension', 'assumption', 'christmas', 'immaculate-conception', 'mary-mother-of-god']);
  });
  it('covers every season', () => {
    for (const s of ['Advent', 'Christmas', 'Lent', 'Triduum', 'Easter', 'Ordinary Time']) expect(FEASTS.some((f) => f.season === s), s).toBe(true);
  });
});
