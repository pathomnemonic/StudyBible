import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { convertRef, loadVersification } from '../src/lib/versification';
import { checkRefIn, pooledCounts, resolveRef, type CountsEdition } from '../src/lib/refCheck';
import type { Ref } from '../src/lib/refs';

const editions = (JSON.parse(readFileSync('public/data/editions.json', 'utf8')) as { editions: CountsEdition[] }).editions;
const schemes = JSON.parse(readFileSync('public/data/versification.json', 'utf8'));
loadVersification(schemes);
const english = pooledCounts(editions, 'english')!;
const anchor = editions.find((e) => e.id === 'vulgate')!;

describe('semantic Scripture reference validation', () => {
  it('withholds the KJV John 6:51–58 conversion because its chapter is unverified', () => {
    const ref: Ref = { book: 'JHN', c1: 6, v1: 51, c2: 6, v2: 58 };
    expect(convertRef('kjv', 'vulgate', ref).exact).toBe(false);
    expect(resolveRef(english, anchor, ref, 'kjv', anchor).status).toBe('approximate');
  });

  it('does not claim exact verse alignment for any unaligned English-tradition book', () => {
    const unaligned = Object.keys(schemes.schemes.english.unalignedBooks) as string[];
    expect(unaligned.length).toBeGreaterThan(0);
    for (const book of unaligned) {
      const ref: Ref = { book, c1: 1, v1: 1, c2: 1, v2: 1 };
      expect(convertRef('english', 'vulgate', ref).exact, `English: ${book}`).toBe(false);
      expect(convertRef('kjv', 'vulgate', ref).exact, `KJV source: ${book}`).toBe(false);
    }
  });

  it('does not claim exact verse alignment for an unverified Psalm chapter', () => {
    const ref: Ref = { book: 'PSA', c1: 2, v1: 1, c2: 2, v2: 1 };
    expect(convertRef('kjv', 'vulgate', ref).exact).toBe(false);
    expect(resolveRef(english, anchor, ref, 'kjv', anchor).status).toBe('approximate');
  });

  it('converts a verified passage exactly', () => {
    const ref: Ref = { book: 'PSA', c1: 23, v1: 1, c2: 23, v2: 6 };
    const result = convertRef('english', 'vulgate', ref);
    expect(result.exact).toBe(true);
    expect(result.ref).toMatchObject({ book: 'PSA', c1: 22, c2: 22, v1: 1, v2: 6 });
  });

  it('rejects unknown books, chapters and verses against real edition counts', () => {
    expect(checkRefIn(anchor, { book: 'NOPE', c1: 1, c2: 1 })).toMatchObject({ kind: 'invalid', scope: 'book' });
    expect(checkRefIn(anchor, { book: 'JHN', c1: 99, c2: 99 })).toMatchObject({ kind: 'invalid', scope: 'chapter' });
    expect(checkRefIn(anchor, { book: 'JHN', c1: 1, v1: 999, c2: 1, v2: 999 })).toMatchObject({ kind: 'invalid', scope: 'verse' });
  });

  it('checks both endpoints of single-chapter and cross-chapter ranges', () => {
    expect(checkRefIn(anchor, { book: 'JHN', c1: 3, v1: 16, c2: 3, v2: 16 })).toBeNull();
    expect(checkRefIn(anchor, { book: 'JHN', c1: 3, v1: 1, c2: 3, v2: 5 })).toBeNull();
    expect(checkRefIn(anchor, { book: 'GEN', c1: 1, v1: 31, c2: 2, v2: 3 })).toBeNull();
    expect(checkRefIn(anchor, { book: 'GEN', c1: 1, v1: 31, c2: 2, v2: 999 })).toMatchObject({ kind: 'invalid', scope: 'verse' });
  });

  it('reports a book absent from the target edition instead of inventing a location', () => {
    const brenton = editions.find((e) => e.id === 'brenton')!;
    const ref: Ref = { book: 'JHN', c1: 3, v1: 16, c2: 3, v2: 16 };
    expect(resolveRef(english, brenton, ref, 'english', anchor).status).toBe('absent');
  });
});
