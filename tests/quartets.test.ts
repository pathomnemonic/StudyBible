import { describe, expect, it } from 'vitest';
import { QUARTETS } from '../src/data/quartets';

describe('quartets', () => {
  it('every puzzle has sixteen different tiles, four sets of four, and one set at each level', () => {
    expect(QUARTETS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(QUARTETS.map((q) => q.id)).size).toBe(QUARTETS.length);
    for (const q of QUARTETS) {
      const all = q.groups.flatMap((g) => g.words);
      expect(all.length, q.id).toBe(16);
      expect(new Set(all.map((w) => w.toLowerCase())).size, `${q.id} repeats a tile`).toBe(16);
      expect(q.groups.map((g) => g.level).sort(), q.id).toEqual([0, 1, 2, 3]);
    }
  });
});
