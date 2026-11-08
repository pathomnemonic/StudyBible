import { describe, expect, it } from 'vitest';
import { alignVerses, diffWords, sameness, type Cell } from '../src/lib/compareDiff';

const cell = (text: string, native = ''): Cell => ({ text, native, exact: true });

describe('diffWords', () => {
  it('marks nothing when the texts match, ignoring case and punctuation', () => {
    expect(diffWords('In the beginning, God', 'in the beginning God').every((p) => !p.changed)).toBe(true);
  });
  it('marks only the words that differ', () => {
    const p = diffWords('the Word was with God', 'the Word was toward God');
    expect(p.filter((x) => x.changed).map((x) => x.text)).toEqual(['toward']);
    expect(p.map((x) => x.text).join(' ')).toBe('the Word was toward God');
  });
  it('marks added words and handles empty input', () => {
    expect(diffWords('a b', 'a x b').filter((x) => x.changed).map((x) => x.text)).toEqual(['x']);
    expect(diffWords('', 'a b').every((x) => x.changed)).toBe(true);
    expect(diffWords('a b', '')).toEqual([]);
  });
  it('sameness is 1 for equal text', () => {
    expect(sameness('a b c', 'a b c')).toBe(1);
    expect(sameness('a b c d', 'a x c d')).toBe(0.75);
  });
});

describe('alignVerses', () => {
  it('orders rows by chapter then verse and leaves gaps as null', () => {
    const a = new Map([['1.1', cell('a1')], ['1.2', cell('a2')], ['1.3', cell('a3')]]);
    const b = new Map([['1.1', cell('b1')], ['1.3', cell('b3')]]);
    const { rows } = alignVerses({ book: 'JHN', c1: 1, v1: 1, c2: 1, v2: 3 }, [a, b]);
    expect(rows.map((r) => r.v)).toEqual([1, 2, 3]);
    expect(rows[1].cells[0]?.text).toBe('a2');
    expect(rows[1].cells[1]).toBeNull();
  });
  it('keeps only the asked range, across chapters', () => {
    const a = new Map([['1.9', cell('x')], ['1.10', cell('y')], ['2.1', cell('z')], ['2.2', cell('w')]]);
    const { rows } = alignVerses({ book: 'GEN', c1: 1, v1: 10, c2: 2, v2: 1 }, [a]);
    expect(rows.map((r) => `${r.c}.${r.v}`)).toEqual(['1.10', '2.1']);
  });
  it('lines up a verse the other edition numbers differently (same anchor key)', () => {
    const webc = new Map([['22.1', cell('The Lord is my shepherd', '23:1')]]);
    const drb = new Map([['22.1', cell('The Lord ruleth me', '22:1')]]);
    const { rows } = alignVerses({ book: 'PSA', c1: 22, c2: 22 }, [webc, drb]);
    expect(rows).toHaveLength(1);
    expect(rows[0].cells.map((c) => c?.native)).toEqual(['23:1', '22:1']);
  });
  it('truncates long passages and says so', () => {
    const big = new Map(Array.from({ length: 100 }, (_, i) => [`1.${i + 1}`, cell('x')] as const));
    const r = alignVerses({ book: 'PSA', c1: 1, c2: 1 }, [big], 60);
    expect(r.rows).toHaveLength(60);
    expect(r.truncated).toBe(true);
  });
});
