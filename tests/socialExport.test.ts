import { describe, expect, it } from 'vitest';
import { adventDayOf, adventLength, buildDay, feastOf, MAX_VERSE_CHARS } from '../scripts/social/lib';
import { ADVENT_REFS } from '../src/plans/adventRefs';

describe('the social export', () => {
  it('takes the verse from the Douay-Rheims and says so', () => {
    const d = buildDay('2026-11-29');
    expect(d.dailyWord?.verse?.translation).toBe('Douay-Rheims');
    expect(d.dailyWord?.verse?.text).toMatch(/^And that knowing the season/);
    expect(d.attribution).toMatch(/Douay-Rheims/);
  });
  it('holds Mass readings as citations only, never lectionary text', () => {
    const d = buildDay('2026-11-29');
    expect(d.massReadings?.citations.gospel).toBe('Mark 13:33-37');
    for (const v of Object.values(d.massReadings!.citations)) expect(v.length).toBeLessThan(60);
  });
  it('keeps every verse card within one card and cuts only at a whole verse', () => {
    for (let i = 0; i < 26; i++) {
      const date = new Date(Date.UTC(2026, 10, 29 + i)).toISOString().slice(0, 10);
      const v = buildDay(date).advent?.verse;
      if (v) expect(v.text.length).toBeLessThanOrEqual(MAX_VERSE_CHARS + 200);
    }
  });
  it('numbers the Advent walk from the first Sunday to December 24', () => {
    expect(adventDayOf('2026-11-28')).toBeNull();
    expect(adventDayOf('2026-11-29')).toBe(1);
    expect(adventDayOf('2026-12-24')).toBe(26);
    expect(adventDayOf('2026-12-25')).toBeNull();
    expect(adventLength(2026)).toBe(26);
    expect(buildDay('2026-12-02').advent?.passage).toBe(ADVENT_REFS[3]);
  });
  it('does not pair a Father line with a reading it was not written for', () => {
    expect(buildDay('2026-11-29').advent?.father).toBeNull();
  });
  it('finds the feast quotes on their days', () => {
    expect(buildDay('2026-12-08').feastFather?.feast).toMatch(/Immaculate Conception/);
    expect(buildDay('2026-12-25').feastFather?.author).toMatch(/Leo/);
    expect(feastOf('2026-11-30', 'Monday of the First week of Advent')).toBeNull();
  });
  it('gives the same seven Climb questions for the same day, with no answers in the export', () => {
    const a = buildDay('2026-12-01').todaysClimb, b = buildDay('2026-12-01').todaysClimb;
    expect(a).toEqual(b);
    expect(a.questions).toHaveLength(7);
    expect(JSON.stringify(a)).not.toMatch(/answers/);
  });
});
