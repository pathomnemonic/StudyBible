import { describe, expect, it } from 'vitest';
import { DAY, clozeIndexes, newCard, normalize, schedule } from '../src/lib/srs';

describe('spaced repetition', () => {
  const t = 1_000_000;
  it('grows intervals with successful reviews and resets on a lapse', () => {
    let c = newCard(t);
    c = schedule(c, 2, t);
    expect(c.interval).toBe(1);
    c = schedule(c, 2, t + DAY);
    expect(c.interval).toBe(6);
    c = schedule(c, 2, t + 7 * DAY);
    expect(c.interval).toBeGreaterThanOrEqual(14);
    const lapsed = schedule(c, 0, t + 30 * DAY);
    expect(lapsed.reps).toBe(0);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.due - (t + 30 * DAY)).toBeLessThan(DAY);
  });
  it('keeps ease within bounds', () => {
    let c = newCard(t);
    for (let i = 0; i < 30; i++) c = schedule(c, 0, t);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
    for (let i = 0; i < 30; i++) c = schedule(c, 3, t);
    expect(c.ease).toBeLessThanOrEqual(3);
  });
  it('blanks more words as the card matures, never short words', () => {
    const words = 'For God so loved the world that he gave his only Son'.split(' ');
    expect(clozeIndexes(words, 0).size).toBeLessThan(clozeIndexes(words, 6).size);
    for (const i of clozeIndexes(words, 6)) expect(words[i].length).toBeGreaterThan(2);
  });
  it('compares answers ignoring case, accents and punctuation', () => {
    expect(normalize('Éli,')).toBe('eli');
    expect(normalize('World!')).toBe(normalize('world'));
  });
});
