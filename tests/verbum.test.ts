import { describe, expect, it } from 'vitest';
import { ANSWERS } from '../src/data/verbum';
import { mark } from '../src/pages/play/VerbumPage';

describe('Verbum', () => {
  it('answers are five distinct letters-only words', () => {
    expect(new Set(ANSWERS).size).toBe(ANSWERS.length);
    for (const w of ANSWERS) expect(w).toMatch(/^[a-z]{5}$/);
  });
  it('marks repeated letters only as often as the answer has them', () => {
    expect(mark('altar', 'altar')).toEqual(['hit', 'hit', 'hit', 'hit', 'hit']);
    expect(mark('abbey', 'bible')).toEqual(['miss', 'near', 'hit', 'near', 'miss']);
    expect(mark('eerie', 'angel')).toEqual(['near', 'miss', 'miss', 'miss', 'miss']);
  });
});
