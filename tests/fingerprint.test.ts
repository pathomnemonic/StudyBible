import { describe, expect, it } from 'vitest';
import { countWords, fingerprint, wordsOf } from '../src/lib/fingerprint';

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
