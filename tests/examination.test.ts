import { describe, expect, it } from 'vitest';
import { LENSES } from '../src/data/examination';

describe('examination of conscience', () => {
  it('has several ways in, each with sections that have questions and unique ids', () => {
    expect(LENSES.length).toBeGreaterThanOrEqual(6);
    const ids = new Set<string>();
    let questions = 0;
    for (const l of LENSES) for (const s of l.sections) {
      expect(ids.has(s.id), `duplicate id ${s.id}`).toBe(false);
      ids.add(s.id);
      expect(s.qs.length, s.id).toBeGreaterThan(0);
      questions += s.qs.length;
    }
    expect(questions).toBeGreaterThan(120);
  });
  it('numbers the Ten Commandments as the Catechism does (ninth: the neighbor’s wife, tenth: his goods)', () => {
    const c = LENSES[0].sections;
    expect(c.length).toBe(10);
    expect(c[8].title).toMatch(/wife/);
    expect(c[9].title).toMatch(/goods/);
  });
});
