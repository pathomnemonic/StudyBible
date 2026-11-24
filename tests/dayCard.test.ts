import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pickArt, suitable, type ArtWork } from '../src/lib/dayCard/art';
import { buildSpec, cccParagraphs, fixSmallCaps, trimVerses, wordFor } from '../src/lib/dayCard/content';
import { drawDayCard, type DayCardSpec } from '../src/lib/dayCard/draw';
import { ADVENT_ONLY, DEFAULT_TAGLINE, TAGLINES, pickTagline } from '../src/lib/dayCard/taglines';
import { library, bookOf } from '../scripts/social/art';

const works = library();
const hints = (over = {}) => ({ words: ['Mercy', 'Be ye merciful'], season: 'advent' as const, seed: '2026-12-01', ...over });

describe('the picture behind a card', () => {
  it('is drawn from the app’s own library of 646 works, all with a file on disk', () => {
    expect(works.length).toBe(646);
  });
  it('never offers a scene of violence or death automatically', () => {
    for (const bad of ['Herod’s Daughter Receives the Head of John the Baptist', 'The World Is Destroyed by Water', 'The Death of Jezebel', 'Isaiah: initial V, the martyrdom of Isaiah']) expect(suitable({ id: 1, theme: 'x', title: bad, artist: '', credit: '', file: '' })).toBe(false);
    const auto = new Set<string>();
    for (let d = 1; d <= 30; d++) { const r = pickArt(works, hints({ seed: `2026-12-${d}` }), [...auto], bookOf, 150); if (r) { auto.add(String(r.work.id)); expect(suitable(r.work)).toBe(true); } }
  });
  it('keeps to the season: no Nativity or Crucifixion in Advent unless the word or passage calls for it', () => {
    const used: (string | number)[] = [];
    for (let d = 1; d <= 24; d++) { const r = pickArt(works, hints({ words: ['', 'x'], seed: `s${d}` }), used, bookOf, 150)!; used.push(r.work.id); expect(`${r.work.theme} ${r.work.title}`).not.toMatch(/nativity|crucifixion|passion|resurrection|magi/i); }
  });
  it('does not repeat a picture inside the window, and is the same pick for the same date', () => {
    const used: (string | number)[] = [];
    for (let d = 1; d <= 25; d++) { const r = pickArt(works, hints({ seed: `d${d}` }), used, bookOf, 150)!; expect(used).not.toContain(r.work.id); used.push(r.work.id); }
    const a = pickArt(works, hints(), [], bookOf)!.work.id, b = pickArt(works, hints(), [], bookOf)!.work.id;
    expect(a).toBe(b);
  });
  it('a word that names a scene picks that scene (Mercy: the Prodigal Son)', () => {
    expect(pickArt(works, hints(), [], bookOf)!.work.title).toMatch(/Prodigal/);
  });
  it('prefers a picture of the passage itself', () => {
    const luke: ArtWork[] = [{ id: 'a', theme: 'Annunciation', title: 'The Annunciation', artist: '', credit: '', file: '', refs: ['Luke 1:26-38'] }, { id: 'b', theme: 'Annunciation', title: 'The Annunciation', artist: '', credit: '', file: '', refs: ['Genesis 1:1'] }];
    expect(pickArt(luke, hints({ words: ['', ''], book: 'LUK', chapter: 1 }), [], bookOf)!.work.id).toBe('a');
  });
  it('falls back to the least recently used picture when everything suitable has been used', () => {
    const only: ArtWork[] = [1, 2, 3].map((i) => ({ id: i, theme: 'Annunciation', title: 'The Annunciation', artist: '', credit: '', file: '' }));
    expect(pickArt(only, hints({ words: ['', ''] }), [2, 3, 1], bookOf, 150)!.work.id).toBe(2);
  });
});

describe('the footer line', () => {
  it('keeps the owner\u2019s default verbatim and the agreed alternates in rotation', () => {
    expect(DEFAULT_TAGLINE).toBe('Download Cathology. The Most Comprehensive Free Catholic Study Bible');
    expect(TAGLINES).toEqual([DEFAULT_TAGLINE, 'Scripture, the Catechism, and the Church Fathers, all in one free app: Cathology.', 'Start your morning with Scripture, the saints, and a quiet reflection on Cathology.', 'Your daily companion for Scripture, saints, and Catholic tradition.', 'Free forever. No ads. Just Catholic Bible study on Cathology.']);
    expect(ADVENT_ONLY).toEqual(['Walk through Advent with daily Scripture, saints, and reflections \u2014 free on Cathology.']);
  });
  it('names no translation and does not lean on not-for-profit wording', () => {
    for (const t of [...TAGLINES, ...ADVENT_ONLY]) { expect(t).not.toMatch(/douay|rheims|not.for.profit|nonprofit/i); }
  });
  it('rotates a day at a time, only uses the Advent line in Advent, and accepts a chosen line', () => {
    const eight = Array.from({ length: 8 }, (_, i) => pickTagline(`2027-02-${String(i + 1).padStart(2, '0')}`));
    expect(new Set(eight).size).toBe(5); // all five lines appear in eight days
    expect(eight.filter((x) => x === DEFAULT_TAGLINE).length).toBe(4); // the owner's line every other day
    expect(Array.from({ length: 28 }, (_, i) => pickTagline(`2027-02-${String(i + 1).padStart(2, '0')}`))).not.toContain(ADVENT_ONLY[0]);
    const adv = Array.from({ length: 6 }, (_, i) => pickTagline(`2026-12-0${i + 1}`, null, { advent: true }));
    expect(adv).toContain(ADVENT_ONLY[0]);
    expect(pickTagline('2026-12-01', 1)).toBe(TAGLINES[1]);
    expect(pickTagline('2026-12-01', 'Chosen line.')).toBe('Chosen line.');
  });
});

describe('the card’s content', () => {
  const base = { date: '2026-12-01', dayName: 'Tuesday', color: 'violet' as const, verse: { text: 'v', label: 'Luke 6:36' } };
  it('puts a verified saint line on the card and leaves an unverified one off, flagging the date', () => {
    expect(buildSpec({ ...base, saint: { text: 'q', who: 'St. Augustine', work: 'Confessions', verified: true } }).spec.father).toEqual({ text: 'q', who: 'St. Augustine, Confessions' });
    const bad = buildSpec({ ...base, saint: { text: 'q', who: 'x', verified: false } });
    expect(bad.spec.father).toBeUndefined(); expect(bad.issues[0]).toMatch(/not marked verified/);
    expect(buildSpec({ ...base, saint: null }).issues[0]).toMatch(/no saint line/);
  });
  it('carries the tagline by default and the Douay-Rheims name', () => {
    const { spec } = buildSpec(base);
    expect(TAGLINES).toContain(spec.tagline); expect(buildSpec({ ...base, tagline: 0 }).spec.tagline).toBe(DEFAULT_TAGLINE); expect(spec.verse.translation).toBe('Douay-Rheims');
  });
  it('knows the hand-picked words for the first week, in order', () => {
    expect(['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05'].map((d) => wordFor(d)?.word)).toEqual(['Watch', 'Seek', 'Mercy', 'Rest', 'Peace', 'Light', 'Charity']);
  });
  it('cuts a passage at a whole verse and lowers capitals without changing words', () => {
    const t = trimVerses([[1, 'a'.repeat(200)], [2, 'b'.repeat(200)]], 1, 2)!;
    expect(t.last).toBe(1); expect(t.trimmed).toBe(true);
    expect(fixSmallCaps('AND THOU, BETHLEHEM Ephrata')).toBe('And thou, Bethlehem Ephrata');
  });
  it('finds Catechism paragraphs for a verse (kept for captions; the card no longer shows them)', () => {
    expect(cccParagraphs([[1, 2, 1, 4, 99, 1], [1, 9, 1, 9, 50, 0]], 1, 3, 3)).toEqual([99]);
  });
});

/** a stand-in canvas context: every character is half its font size wide, and it records what is drawn */
function fakeCtx() {
  const drawn: string[] = []; let font = '12px x';
  const ctx: any = { save() {}, restore() {}, fillRect() {}, drawImage() {}, set font(v: string) { font = v; }, get font() { return font; }, measureText: (t: string) => ({ width: t.length * parseInt(font.match(/(\d+)px/)![1]) * 0.5 }), fillText: (t: string) => drawn.push(t), fillStyle: '', globalAlpha: 1, textBaseline: '', textAlign: '' };
  return { ctx: ctx as CanvasRenderingContext2D, drawn };
}
describe('drawing the card', () => {
  const full: DayCardSpec = { dateLine: 'SUNDAY', dayName: 'First Sunday of Advent', color: 'violet', word: 'Watch', verse: { text: 'And what I say to you, I say to all: Watch.', label: 'Mark 13:37', translation: 'Douay-Rheims' }, father: { text: 'But of this let us take heed, namely, that our soul herself sleep not: for evil is the sleep of the soul.', who: 'St. Augustine' }, question: 'Where is your attention already being asked for today?', tagline: DEFAULT_TAGLINE };
  it('keeps the verse, the saint’s words, the question and the tagline on every shape', () => {
    for (const [w, h] of [[1080, 1350], [1080, 1080], [1080, 1920]]) {
      const { ctx, drawn } = fakeCtx();
      const r = drawDayCard(ctx, w, h, full);
      const all = drawn.join(' ');
      expect(all).toMatch(/I say to all/); expect(all).toMatch(/sleep of the soul/); expect(all).toMatch(/attention already/); expect(all).toMatch(/Download Cathology/);
      expect(r.textBottom).toBeLessThanOrEqual(h);
    }
  });
  it('has no Catechism line and no Mass readings line on the card', () => {
    const { ctx, drawn } = fakeCtx();
    drawDayCard(ctx, 1080, 1350, full);
    expect(drawn.join(' ')).not.toMatch(/Catechism|Mass readings/);
  });
  it('shrinks the type together, and keeps the verse, the saint and the question, when the text is long', () => {
    const long: DayCardSpec = { ...full, verse: { ...full.verse, text: 'word '.repeat(70) } };
    const { ctx, drawn } = fakeCtx();
    const r = drawDayCard(ctx, 1080, 1080, long);
    expect(r.fit).toBeLessThan(1);
    expect(drawn.join(' ')).toMatch(/sleep of the soul/); expect(drawn.join(' ')).toMatch(/attention already/);
  });
});
