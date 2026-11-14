import { describe, expect, it } from 'vitest';
import { countWords, fingerprint, wordsOf, searchWords, FINGERPRINT_DEFINITIONS } from '../src/lib/fingerprint';

describe('book fingerprint', () => {
  it('leaves out small common words and keeps the rest', () => {
    expect(wordsOf('In the beginning God created the heaven and the earth.')).toEqual(['beginning', 'god', 'created', 'heaven', 'earth']);
  });
  it('lists the most used words, most first', () => {
    const b = countWords(['grace grace grace peace', 'peace grace law']);
    expect(fingerprint(b, countWords(['x']), 3, 1).frequent.map((f) => f.word)).toEqual(['grace', 'peace', 'law']);
  });
  it('picks out the words a book uses far more than the rest of the Bible', () => {
    const book = countWords(Array(10).fill('faith faith faith lord lord'));
    const base = countWords(Array(100).fill('lord lord lord lord king king faith'));
    const d = fingerprint(book, base, 5, 5).distinctive.map((f) => f.word);
    expect(d[0]).toBe('faith');
    expect(d.indexOf('lord')).toBeGreaterThan(d.indexOf('faith'));
  });
});

describe('fingerprint search and definitions', () => {
  it('searches within the listed words, ignoring case', () => {
    const l = [{ word: 'faith' }, { word: 'faithful' }, { word: 'love' }];
    expect(searchWords(l, ' FAITH ').map((x) => x.word)).toEqual(['faith', 'faithful']);
    expect(searchWords(l, '')).toBe(l);
    expect(searchWords(l, 'zzz')).toEqual([]);
  });
  it('a chosen range counts only its own words', () => {
    const whole = countWords(['faith faith love', 'hope hope hope']);
    const part = countWords(['faith faith love']);
    expect(part.counts.get('hope')).toBeUndefined();
    expect(whole.counts.get('hope')).toBe(3);
  });
  it('defines every measure the page shows, with the real thresholds', () => {
    const t = FINGERPRINT_DEFINITIONS.map((d) => d.term).join('|');
    expect(t).toMatch(/Counted words/); expect(t).toMatch(/Most used/); expect(t).toMatch(/Times more/); expect(t).toMatch(/apart/);
    expect(FINGERPRINT_DEFINITIONS.find((d) => /apart/.test(d.term))!.meaning).toMatch(/at least five times/);
  });
});
