import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ANSWERS } from '../src/data/verbum';
import { THEMED } from '../src/data/cloister';
import { mark } from '../src/pages/play/VerbumPage';

describe('Creedle', () => {
  it('answers are five distinct letters-only words', () => {
    expect(new Set(ANSWERS).size).toBe(ANSWERS.length);
    for (const w of ANSWERS) expect(w).toMatch(/^[a-z]{5}$/);
  });
  it('accepts ordinary five-letter words and the game’s own words as guesses, and rejects non-words', () => {
    // the guess list the page builds (VerbumPage): the shipped word list's five-letter words, plus
    // the themed words and the answers themselves, each cut to five letters
    const words = (JSON.parse(readFileSync('public/data/play/words.json', 'utf8')).words as string[]).filter((w) => w.length === 5);
    expect(words.length).toBeGreaterThan(1000);
    const valid = new Set([...words, ...THEMED, ...ANSWERS].filter((w) => w.length === 5));
    for (const w of ANSWERS) expect(valid.has(w), `answer ${w} must be a legal guess`).toBe(true);
    expect(valid.has('abate')).toBe(true); // an ordinary word from the list
    for (const fake of ['zzzzz', 'xqzvk', 'aaaaa', 'bcdfg']) expect(valid.has(fake), fake).toBe(false); // letter strings that are not words are refused
  });
  it('marks repeated letters only as often as the answer has them', () => {
    expect(mark('altar', 'altar')).toEqual(['hit', 'hit', 'hit', 'hit', 'hit']);
    expect(mark('abbey', 'bible')).toEqual(['miss', 'near', 'hit', 'near', 'miss']);
    expect(mark('eerie', 'angel')).toEqual(['near', 'miss', 'miss', 'miss', 'miss']);
  });
});
