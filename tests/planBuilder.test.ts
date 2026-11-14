import { describe, expect, it } from 'vitest';
import { buildDays, chapterUnits, mergeContiguous, spreadUnits } from '../src/lib/planBuilder';
import { parseRefId } from '../src/lib/refs';

describe('plan builder', () => {
  it('cuts John into days of three chapters and reads each day as one range', () => {
    const days = buildDays(chapterUnits('JHN', 1, 21), { perDay: 3 });
    expect(days).toHaveLength(7);
    expect(days[0].refs).toEqual(['JHN.1-3']);
    expect(days[6].refs).toEqual(['JHN.19-21']);
    for (const d of days) for (const r of d.refs) expect(parseRefId(r)).not.toBeNull();
  });
  it('a last short day and a one-chapter day are kept', () => {
    const d = buildDays(chapterUnits('JHN', 1, 7), { perDay: 3 });
    expect(d.map((x) => x.refs)).toEqual([['JHN.1-3'], ['JHN.4-6'], ['JHN.7']]);
  });
  it('finish-in-N-days spreads evenly, earlier days taking the extra, and never makes empty days', () => {
    const g = spreadUnits([1, 2, 3, 4, 5, 6, 7], { days: 3 });
    expect(g.map((x) => x.length)).toEqual([3, 2, 2]);
    expect(spreadUnits([1, 2], { days: 10 })).toHaveLength(2);
    expect(spreadUnits([], { days: 3 })).toEqual([]);
    expect(spreadUnits([1, 2, 3], { perDay: 0 })).toHaveLength(3);
  });
  it('clamps chapters to the book and only merges neighbouring whole chapters of one book', () => {
    expect(chapterUnits('JHN', 1, 99)).toHaveLength(21);
    expect(chapterUnits('NOPE', 1, 2)).toEqual([]);
    const m = mergeContiguous([{ book: 'JHN', c1: 1, c2: 1 }, { book: 'JHN', c1: 3, c2: 3 }, { book: 'JHN', c1: 4, v1: 1, c2: 4, v2: 5 }, { book: 'ACT', c1: 5, c2: 5 }]);
    expect(m).toHaveLength(4);
    const same = mergeContiguous([{ book: 'JHN', c1: 1, c2: 2 }, { book: 'JHN', c1: 3, c2: 3 }]);
    expect(same).toEqual([{ book: 'JHN', c1: 1, c2: 3 }]);
  });
  it('a list of passages keeps each passage whole, several to a day', () => {
    const units = [{ book: 'JHN', c1: 6, v1: 51, c2: 6, v2: 58 }, { book: 'PSA', c1: 22, c2: 22 }, { book: 'ROM', c1: 8, c2: 8 }];
    expect(buildDays(units, { perDay: 2 })).toEqual([{ refs: ['JHN.6.51-58', 'PSA.22'] }, { refs: ['ROM.8'] }]);
  });
});
