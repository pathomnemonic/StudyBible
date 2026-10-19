import { describe, expect, it } from 'vitest';
import { VERSE_OF_DAY, verseForDay, dayOfYear } from '../src/study/verseOfDay';
import { parseRefs } from '../src/lib/refs';

describe('verse of the day', () => {
  it('every entry parses as a real reference', () => {
    for (const v of VERSE_OF_DAY) expect(parseRefs(v).ok, v).toBe(true);
  });
  it('is stable within a day and rotates across days', () => {
    const a = new Date(2026, 9, 19);
    expect(verseForDay(a)).toBe(verseForDay(new Date(2026, 9, 19, 23)));
    expect(verseForDay(a)).not.toBe(verseForDay(new Date(2026, 9, 20)));
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
  });
});
