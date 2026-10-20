import { describe, expect, it } from 'vitest';
import { expandNote, plainNumerals, readableText } from '../src/lib/readable';

describe('expandNote', () => {
  it('spells out manuscript shorthand', () => {
    expect(expandNote('TR adds “You shall listen to him.”')).toBe('The Textus Receptus (the traditional Greek text) adds “You shall listen to him.”');
    expect(expandNote('TR and NU omit “Jesus”')).toContain('Nestle-Aland');
    expect(expandNote('LXX reads “from the east”.')).toMatch(/^The Septuagint \(the ancient Greek translation/);
    expect(expandNote('Gr. heavy.')).toBe('In Greek: “heavy”.');
    expect(expandNote('or, seed')).toBe('Alternative translation: seed');
    expect(expandNote('See ver. 9.')).toBe('See verse 9.');
    expect(expandNote('The LXX reads Meunites . Heb. reads Ammonites .')).toContain('Hebrew reads');
  });
  it('leaves "I AM" alone', () => {
    expect(expandNote('or, “I AM!”')).toBe('Alternative translation: “I AM!”');
  });
});

describe('plainNumerals', () => {
  it('converts headings', () => {
    expect(plainNumerals('Book III — Chapter XXI.—A vindication', { title: true })).toBe('Book 3 — Chapter 21.—A vindication');
    expect(plainNumerals('Expositions on the Psalms: Psalm CXXV 9.', { title: true })).toContain('Psalm 125 9');
    expect(plainNumerals('Conferences XI-XVII', { title: true })).toBe('Conferences 11–17');
    expect(plainNumerals('Matthew VIII. 23, 24')).toBe('Matthew 8:23, 24');
    expect(plainNumerals('Homily XLII')).toBe('Homily 42');
  });
  it('leaves ordinary prose and the pronoun alone', () => {
    expect(plainNumerals('I will say it. Mix the dim light.')).toBe('I will say it. Mix the dim light.');
    expect(plainNumerals('Pope Pius X wrote')).toBe('Pope Pius X wrote');
  });
  it('uses full book names', () => {
    expect(readableText('See Matt. xvi. 18 and Rom. viii. 28.')).toBe('See Matthew 16:18 and Romans 8:28.');
  });
});

describe('names keep their numerals', () => {
  it('leaves popes and councils', () => {
    expect(plainNumerals('Mediator Dei, Pius XII, 1947', { title: true })).toBe('Mediator Dei, Pius XII, 1947');
    expect(plainNumerals('Vatican II and Pope John Paul II', { title: true })).toBe('Vatican II and Pope John Paul II');
    expect(plainNumerals('Against Heresies — II', { title: true })).toBe('Against Heresies — 2');
  });
});

describe('more numerals', () => {
  it('handles numbered books and comma citations', () => {
    expect(plainNumerals('utter II Cor. 12.')).toBe('utter 2 Cor. 12.');
    expect(plainNumerals('Against Faustus, XIX, 26: Moses')).toBe('Against Faustus, 19, 26: Moses');
    expect(plainNumerals('CHAPTER III.')).toBe('CHAPTER 3.');
  });
});
