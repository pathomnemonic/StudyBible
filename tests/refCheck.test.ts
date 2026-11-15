import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chapterAlignmentNote, chapterToAnchorRefs, convertRef, loadVersification } from '../src/lib/versification';
import { anchorToNativeRef, checkRefIn, pooledCounts, resolveRef, type CountsEdition } from '../src/lib/refCheck';
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

  it('does not claim exact whole-chapter alignment for an unaligned book', () => {
    expect(chapterToAnchorRefs('kjv', 'TOB', 1)[0].exact).toBe(false);
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


  it('preserves chapter-only range endpoints and refuses exactness for a split Psalm chapter', () => {
    const ordinary = convertRef('english', 'vulgate', { book: 'GEN', c1: 1, c2: 2 });
    expect(ordinary.ref).toMatchObject({ book: 'GEN', c1: 1, c2: 2 });
    expect(ordinary.exact).toBe(true);
    const verseRange = convertRef('english', 'vulgate', { book: 'GEN', c1: 1, v1: 31, c2: 2, v2: 3 });
    expect(verseRange.exact).toBe(true);
    expect(verseRange.ref).toMatchObject({ book: 'GEN', c1: 1, c2: 2, v1: 31, v2: 3 });
    const split = convertRef('english', 'vulgate', { book: 'PSA', c1: 10, c2: 10 });
    expect(split.exact).toBe(false);
    const spanningSplit = convertRef('english', 'vulgate', { book: 'PSA', c1: 9, v1: 1, c2: 11, v2: 7 });
    expect(spanningSplit.exact).toBe(false);
    const splitEndChapter = convertRef('english', 'vulgate', { book: 'PSA', c1: 9, c2: 10 });
    expect(splitEndChapter.exact).toBe(false);
    const splitPsalm = chapterToAnchorRefs('english', 'PSA', 10);
    expect(splitPsalm).toEqual([{ ref: { book: 'PSA', c1: 9, v1: 22, c2: 9, v2: 39 }, exact: true }]);
    // Vulgate Psalms 114 and 115 are merged into English Psalm 116; a single
    // Vulgate chapter must not be reported as an exact whole-English-chapter match.
    const mergedTarget = convertRef('vulgate', 'english', { book: 'PSA', c1: 114, c2: 114 });
    expect(mergedTarget.exact).toBe(false);
  });


  it('checks every intermediate chapter when resolving a cross-chapter anchor range', () => {
    const ordinary = anchorToNativeRef(english, { book: 'GEN', c1: 1, v1: 31, c2: 2, v2: 3 });
    expect(ordinary.exact).toBe(true);
    const crossesUnverified = anchorToNativeRef(english, { book: 'GEN', c1: 48, v1: 31, c2: 51, v2: 1 });
    expect(crossesUnverified.exact).toBe(false);
    expect(crossesUnverified.note).toMatch(/chapter whose verse alignment is not verified/i);
  });

  it('downgrades a known one-verse source/anchor mismatch to a verified chapter-only anchor', () => {
    expect(chapterAlignmentNote('kjv', 'MRK', 4)).toBeTruthy();
    const r = resolveRef(english, english, { book: 'MRK', c1: 4, v1: 41, c2: 4, v2: 41 }, 'kjv', anchor);
    expect(r.status).toBe('approximate');
    expect(r.anchor).toEqual({ book: 'MRK', c1: 4, c2: 4 });
  });

  it('downgrades a known verse-count mismatch to a verified chapter-only anchor', () => {
    const r = resolveRef(english, anchor, { book: 'MRK', c1: 4, v1: 41, c2: 4, v2: 41 }, 'kjv', anchor);
    expect(r.status).toBe('approximate');
    expect(r.anchor).toEqual({ book: 'MRK', c1: 4, c2: 4 });
    expect(r.reason).toMatch(/only the chapter range can be verified/i);
  });

  it('uses intermediate target-chapter caveats when downgrading a known endpoint mismatch', () => {
    const target = {
      ...english,
      id: 'fixture-kjv',
      scheme: 'kjv',
      verseCounts: { ...english.verseCounts, GEN: [...english.verseCounts.GEN] },
    };
    target.verseCounts.GEN[50] = 1; // force a one-verse endpoint mismatch in Genesis 51
    const ref: Ref = { book: 'GEN', c1: 48, v1: 31, c2: 51, v2: 2 };
    const result = resolveRef(anchor, target, ref, 'vulgate', anchor);
    expect(result.status).toBe('approximate');
    expect(result.native).toEqual({ book: 'GEN', c1: 48, c2: 51 });
    expect(result.reason).toMatch(/only the verified chapter range/i);
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


  it('does not treat an unaligned Catholic book as same-tradition merely because both editions use English numbering', () => {
    const webc = editions.find((e) => e.id === 'webc')!;
    const tob: Ref = { book: 'TOB', c1: 1, v1: 1, c2: 1, v2: 1 };
    expect(resolveRef(english, webc, tob, 'kjv', anchor).status).toBe('approximate');
  });

  it('reports a book absent from the target edition instead of inventing a location', () => {
    const brenton = editions.find((e) => e.id === 'brenton')!;
    const ref: Ref = { book: 'JHN', c1: 3, v1: 16, c2: 3, v2: 16 };
    expect(resolveRef(english, brenton, ref, 'english', anchor).status).toBe('absent');
  });
});
