import { describe, expect, it } from 'vitest';
import { doctrineItems, numberItems, peopleItems, place, shuffleWith } from '../src/lib/quizBank';

const r = (() => { let s = 5; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; })();
describe('quiz bank', () => {
  it('puts the right answer where it says, with distinct wrong ones', () => {
    for (const set of [doctrineItems(r), peopleItems(r), numberItems(r)]) {
      expect(set.length).toBeGreaterThan(30);
      for (const q of set) { expect(q.opts.length, q.q).toBe(4); expect(new Set(q.opts).size, q.q).toBe(4); expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.answer).toBeLessThan(4); }
    }
  });
  it('keeps the right numeric answer among the choices', () => {
    const q = numberItems(r).find((x) => /did the Council of Nicaea meet/.test(x.q))!;
    expect(q.opts[q.answer]).toBe('325 AD');
  });
  it('place and shuffle keep every item', () => {
    const p = place('a', ['b', 'c', 'd', 'e'], r);
    expect(p.opts.length).toBe(4); expect(p.opts[p.answer]).toBe('a');
    expect(shuffleWith([1, 2, 3, 4], r).sort()).toEqual([1, 2, 3, 4]);
  });
});
