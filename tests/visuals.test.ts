import { describe, expect, it } from 'vitest';
import { VISUALS } from '../src/data/visuals';
import { MORE_VISUALS } from '../src/data/visuals2';

const all = [...VISUALS, ...MORE_VISUALS];
describe('visual catechism content', () => {
  it('has unique diagram and node ids', () => {
    expect(new Set(all.map((v) => v.id)).size).toBe(all.length);
    for (const v of all) expect(new Set(v.nodes.map((n) => n.id)).size, v.id).toBe(v.nodes.length);
  });
  it('gives every part a real statement and valid Catechism numbers', () => {
    const bad: string[] = [];
    for (const v of all) for (const n of v.nodes) {
      if (n.detail.length < 40) bad.push(`${v.id}/${n.id}: thin`);
      for (const m of (n.ccc ?? '').match(/\d+/g) ?? []) if (+m < 1 || +m > 2865) bad.push(`${v.id}/${n.id}: ccc ${m}`);
    }
    expect(bad).toEqual([]);
  });
  it('lists grouped nodes that exist, and every node once', () => {
    for (const v of all) {
      if (!v.groups) continue;
      const ids = new Set(v.nodes.map((n) => n.id));
      const used = v.groups.flatMap((g) => g.ids);
      for (const i of used) expect(ids.has(i), `${v.id}: ${i}`).toBe(true);
      expect(new Set(used).size, `${v.id} repeats a node`).toBe(used.length);
    }
  });
  it('has at least twenty diagrams', () => expect(all.length).toBeGreaterThanOrEqual(20));
});
