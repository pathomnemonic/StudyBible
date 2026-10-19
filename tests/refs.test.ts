import { describe, expect, it } from 'vitest';
import { BOOKS, CANON_SIZE, DEUTEROCANONICAL_BOOKS } from '../src/lib/canon';
import { formatRef, lookupBook, parseRefId, parseRefs, refId, refsOverlap, suggestBooks } from '../src/lib/refs';

describe('canon', () => {
  it('has the 73 books of the Catholic canon including the deuterocanon', () => {
    expect(CANON_SIZE).toBe(73);
    expect(BOOKS.filter((b) => b.testament === 'OT')).toHaveLength(46);
    expect(BOOKS.filter((b) => b.testament === 'NT')).toHaveLength(27);
    for (const id of ['TOB', 'JDT', 'WIS', 'SIR', 'BAR', '1MA', '2MA', 'EST', 'DAN']) expect(DEUTEROCANONICAL_BOOKS).toContain(id);
    expect(new Set(BOOKS.map((b) => b.id)).size).toBe(73);
  });
});

describe('reference parsing', () => {
  const one = (s: string) => {
    const r = parseRefs(s);
    if (!r.ok) throw new Error(r.error);
    return r.refs.map((x) => refId(x.ref));
  };
  it('parses common shorthand', () => {
    expect(one('Jn 3:16')).toEqual(['JHN.3.16']);
    expect(one('john 6:51-58')).toEqual(['JHN.6.51-58']);
    expect(one('1 cor 13')).toEqual(['1CO.13']);
    expect(one('1Cor 11:23-26')).toEqual(['1CO.11.23-26']);
    expect(one('Gen 1:1–2:3')).toEqual(['GEN.1.1-2.3']);
    expect(one('ps23')).toEqual(['PSA.23']);
    expect(one('Jude 5-7')).toEqual(['JUD.1.5-7']);
    expect(one('Jn 6:51-58; 1 Cor 11:23-26, 29')).toEqual(['JHN.6.51-58', '1CO.11.23-26', '1CO.11.29']);
  });
  it('understands Douay-Rheims names', () => {
    expect(lookupBook('Osee')).toBe('HOS');
    expect(lookupBook('3 Kings')).toBe('1KI');
    expect(lookupBook('Canticle of Canticles')).toBe('SNG');
    expect(lookupBook('Apocalypse')).toBe('REV');
    expect(lookupBook('Ecclesiasticus')).toBe('SIR');
    expect(lookupBook('Machabees')).toBeNull();
    expect(lookupBook('2 Machabees')).toBe('2MA');
  });
  it('suggests books for misspellings', () => {
    expect(suggestBooks('Mathew')).toContain('MAT');
    expect(suggestBooks('Revalations')).toContain('REV');
    expect(suggestBooks('Corinthans')[0]).toMatch(/CO/);
  });
  it('rejects impossible chapters and unknown books', () => {
    expect(parseRefs('Jude 2:1').ok).toBe(false);
    expect(parseRefs('Jn 99').ok).toBe(false);
    expect(parseRefs('Foo 3:1').ok).toBe(false);
  });
  it('round-trips ids and formats', () => {
    for (const id of ['JHN.6.51-58', 'GEN.1.1-2.3', 'PSA.22', 'JUD.1.5-7', 'ISA.1-3']) expect(refId(parseRefId(id)!)).toBe(id);
    expect(formatRef(parseRefId('JHN.6.51-58')!)).toBe('John 6:51–58');
    expect(formatRef(parseRefId('PSA.22')!)).toBe('Psalms 22 (Heb. 23)');
    expect(formatRef(parseRefId('PSA.22')!, { noDual: true })).toBe('Psalms 22');
    expect(formatRef(parseRefId('JUD.1.5-7')!)).toBe('Jude 5–7');
  });
  it('detects overlap', () => {
    expect(refsOverlap(parseRefId('JHN.6.51-58')!, parseRefId('JHN.6.55')!)).toBe(true);
    expect(refsOverlap(parseRefId('JHN.6.1-10')!, parseRefId('JHN.6.51')!)).toBe(false);
    expect(refsOverlap(parseRefId('JHN.6')!, parseRefId('JHN.6.51')!)).toBe(true);
  });
});
