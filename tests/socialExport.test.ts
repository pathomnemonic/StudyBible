import { describe, expect, it } from 'vitest';
import { adventDayOf, adventLength, buildDay, feastOf, MAX_VERSE_CHARS } from '../scripts/social/lib';
import { ADVENT_EVE, ADVENT_REFS, ADVENT_WALK } from '../src/plans/adventRefs';
import { readFileSync } from 'node:fs';
import { parseRefId } from '../src/lib/refs';
import { verseCard } from '../scripts/social/lib';

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
  it('names and shows the Advent days as planned: Come, The sign, Comfort on the day of Isaiah 40', () => {
    const at = (n: number) => buildDay(new Date(Date.UTC(2026, 10, 28 + n)).toISOString().slice(0, 10)).advent!;
    expect([at(1).theme, at(1).verse?.label]).toEqual(['Come', 'Isaiah 2:5']);
    expect([at(2).theme, at(2).verse?.label]).toEqual(['The sign', 'Isaiah 7:14']);
    expect(at(2).verse?.text).toMatch(/virgin shall conceive/);
    expect([at(11).theme, at(11).passage]).toEqual(['Comfort', 'ISA.40.1-11']);
    expect(at(11).verse?.text).toMatch(/^Be comforted/);
  });
  it('shows no verse twice in the 26 days, and no card shouts in capitals', () => {
    const seen = new Set<string>();
    for (let n = 1; n <= 26; n++) {
      const a = buildDay(new Date(Date.UTC(2026, 10, 28 + n)).toISOString().slice(0, 10)).advent!;
      expect(a.verse, `day ${n}`).not.toBeNull();
      expect(seen.has(a.verse!.label), `day ${n} repeats ${a.verse!.label}`).toBe(false);
      seen.add(a.verse!.label);
      expect(a.verse!.text.replace(/JESUS/g, '')).not.toMatch(/\b[A-Z]{3,}\b/);
    }
    expect(ADVENT_WALK).toHaveLength(ADVENT_REFS.length);
    expect(ADVENT_EVE).toHaveLength(2);
  });
  it('quotes the Daily Word slate exactly as the Douay-Rheims has it', () => {
    const slate = JSON.parse(readFileSync('src/data/dailyWords.json', 'utf8')) as { word: string; ref: string }[];
    const want: Record<string, string> = {
      'MRK.13.37': 'And what I say to you, I say to all: Watch.',
      'JHN.14.27': 'Peace I leave with you, my peace I give unto you: not as the world giveth, do I give unto you. Let not your heart be troubled, nor let it be afraid.',
      '1CO.13.4': 'Charity is patient, is kind: charity envieth not, dealeth not perversely; is not puffed up;',
    };
    expect(slate).toHaveLength(7);
    for (const s of slate) { const v = verseCard(parseRefId(s.ref)!)!; expect(v.trimmed).toBe(false); if (want[s.ref]) expect(v.text).toBe(want[s.ref]); }
  });
});

import { jobsFor } from '../scripts/social/cards';
describe('every card carries the day’s question', () => {
  it('uses the hand-written question when there is one, else the date’s own question from the daily data, on the word cards and the Advent Walk cards', () => {
    const watch = jobsFor(buildDay('2026-11-29'));
    expect(watch.find((j) => j.name === 'word-watch')!.inputs.question).toBe('Where is your attention already being asked for today?');
    const mercy = jobsFor(buildDay('2026-12-01'));
    expect(mercy.find((j) => j.name === 'word-mercy')!.inputs.question).toBe(buildDay('2026-12-01').dailyWord!.reflectionQuestion);
    for (let n = 0; n < 26; n++) {
      const d = new Date(Date.UTC(2026, 10, 29 + n)).toISOString().slice(0, 10);
      for (const j of jobsFor(buildDay(d))) expect(j.inputs.question, `${d} ${j.name}`).toBeTruthy();
    }
  });
});
