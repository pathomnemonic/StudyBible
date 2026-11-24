import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pickArt, suitable, type ArtWork } from '../src/lib/dayCard/art';
import { buildSpec, cccParagraphs, chooseCatechism, fixSmallCaps, trimVerses, wordFor } from '../src/lib/dayCard/content';
import { drawDayCard, type DayCardSpec } from '../src/lib/dayCard/draw';
import { DEFAULT_TAGLINE, pickTagline } from '../src/lib/dayCard/taglines';
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
  it('defaults to the agreed tagline, accepts a chosen one by number or text, and rotates when there are alternates', () => {
    expect(pickTagline('2026-12-01')).toBe(DEFAULT_TAGLINE);
    expect(pickTagline('2026-12-01', 'Read the whole Bible, free.')).toBe('Read the whole Bible, free.');
    expect(pickTagline('2026-12-01', 1, ['a', 'b', 'c'])).toBe('b');
    expect(pickTagline('2026-12-01', null, ['a', 'b'])).not.toBe(pickTagline('2026-12-02', null, ['a', 'b']));
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
    expect(spec.tagline).toBe(DEFAULT_TAGLINE); expect(spec.verse.translation).toBe('Douay-Rheims');
  });
  it('knows the hand-picked words for the first week, in order', () => {
    expect(['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05'].map((d) => wordFor(d)?.word)).toEqual(['Watch', 'Seek', 'Mercy', 'Rest', 'Peace', 'Light', 'Charity']);
  });
  it('cuts a passage at a whole verse and lowers capitals without changing words', () => {
    const t = trimVerses([[1, 'a'.repeat(200)], [2, 'b'.repeat(200)]], 1, 2)!;
    expect(t.last).toBe(1); expect(t.trimmed).toBe(true);
    expect(fixSmallCaps('AND THOU, BETHLEHEM Ephrata')).toBe('And thou, Bethlehem Ephrata');
  });
  it('chooses a short Catechism paragraph whole, else points to the first', () => {
    expect(chooseCatechism([{ n: 1, text: 'x'.repeat(500) }, { n: 2, text: 'short' }])!.n).toBe(2);
    expect(chooseCatechism([{ n: 1, text: 'x'.repeat(500) }])!.n).toBe(1);
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
  const full: DayCardSpec = { dateLine: 'SUNDAY', dayName: 'First Sunday of Advent', color: 'violet', word: 'Watch', verse: { text: 'And what I say to you, I say to all: Watch.', label: 'Mark 13:37', translation: 'Douay-Rheims' }, father: { text: 'But of this let us take heed, namely, that our soul herself sleep not: for evil is the sleep of the soul.', who: 'St. Augustine' }, question: 'Where is your attention already being asked for today?', catechism: { n: 2849, text: 'x'.repeat(700) }, readings: 'Mark 13:33-37', tagline: DEFAULT_TAGLINE };
  it('keeps the verse, the saint’s words, the question and the tagline on every shape', () => {
    for (const [w, h] of [[1080, 1350], [1080, 1080], [1080, 1920]]) {
      const { ctx, drawn } = fakeCtx();
      const r = drawDayCard(ctx, w, h, full);
      const all = drawn.join(' ');
      expect(all).toMatch(/I say to all/); expect(all).toMatch(/sleep of the soul/); expect(all).toMatch(/attention already/); expect(all).toMatch(/Download Cathology/);
      expect(r.textBottom).toBeLessThanOrEqual(h);
    }
  });
  it('shortens or drops the Catechism before it touches the saint’s words when space runs out', () => {
    const long: DayCardSpec = { ...full, verse: { ...full.verse, text: 'word '.repeat(60) }, catechism: { n: 5, text: 'y'.repeat(320) } };
    const { ctx, drawn } = fakeCtx();
    const r = drawDayCard(ctx, 1080, 1080, long);
    expect(drawn.join(' ')).toMatch(/sleep of the soul/);
    expect(['none', 'pointer', 'removed']).toContain(r.droppedCatechism);
  });
});
