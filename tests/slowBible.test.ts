import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SLOW_DAYS, SLOW_TOTAL, YEAR_DAYS, dayLabel, daysBetween, overview, segmentsOf, versesIn, yearOf } from '../src/lib/slowBible';
import { BOOKS } from '../src/lib/canon';

describe('the slow Bible', () => {
  it('runs about seven years, a few verses a day, from Genesis 1:1 to the end of Revelation', () => {
    expect(SLOW_TOTAL).toBeGreaterThan(2300); expect(SLOW_TOTAL).toBeLessThanOrEqual(7 * YEAR_DAYS);
    expect(dayLabel(0)).toMatch(/^Genesis 1:1/); expect(dayLabel(SLOW_TOTAL - 1)).toMatch(/Revelation 22:/);
    const sizes = SLOW_DAYS.map((_, i) => versesIn(i));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(3); expect(Math.max(...sizes)).toBeLessThanOrEqual(32);
  });
  it('covers every verse of the Catholic Bible exactly once, in order, and never crosses books in a day', () => {
    const seen = new Map<string, number>(); let last = [-1, 0, 0];
    SLOW_DAYS.forEach((d, i) => {
      expect(new Set(d.map((s) => s[0])).size, `day ${i}`).toBe(1);
      for (const [b, c, v1, v2] of d) { expect(v2).toBeGreaterThanOrEqual(v1); const pos = [b, c, v1]; expect(pos[0] > last[0] || (pos[0] === last[0] && (pos[1] > last[1] || (pos[1] === last[1] && pos[2] > last[2]))), `order at day ${i}`).toBe(true); last = [b, c, v2]; for (let v = v1; v <= v2; v++) { const k = `${b}.${c}.${v}`; expect(seen.has(k), k).toBe(false); seen.set(k, i); } }
    });
    // every verse in the text is in some day
    let verses = 0, missing: string[] = [];
    BOOKS.forEach((bk, bi) => { const d = JSON.parse(readFileSync(`public/data/bible/webc/${bk.id}.json`, 'utf8')); for (const ch of d.chapters) { const vs = new Set<number>(); for (const blk of ch.blocks) for (const x of blk[1] ?? []) if (Array.isArray(x) && x[0] > 0) vs.add(x[0]); for (const v of vs) { verses++; if (!seen.has(`${bi}.${ch.n}.${v}`)) missing.push(`${bk.id} ${ch.n}:${v}`); } } });
    expect(verses).toBeGreaterThan(35000); expect(missing.slice(0, 5)).toEqual([]);
  });
  it('has helpers that agree', () => {
    expect(segmentsOf(0)[0].book).toBe('GEN'); expect(yearOf(0)).toBe(1); expect(yearOf(365)).toBe(2);
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30);
    expect(overview()).toHaveLength(Math.ceil(SLOW_TOTAL / 365));
  });
});
