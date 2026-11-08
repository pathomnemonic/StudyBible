import { describe, expect, it } from 'vitest';
import { WHO_AM_I } from '../src/data/whoami';
import { WHO_AM_I_2 } from '../src/data/whoami2';
import { WS_THEMES } from '../src/data/wordsearch';
import { MORE_WS_THEMES } from '../src/data/wordsearch2';
import { CHARADES_DECKS } from '../src/data/charades';
import { EVEN_MORE_DECKS } from '../src/data/charades3';
import { makeGrid } from '../src/pages/play/WordsearchPage';

const GRID_SIZE = 11;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

describe('Who Am I? content', () => {
  it('has the extra people appended', () => {
    expect(WHO_AM_I_2.length).toBe(70);
    expect(WHO_AM_I.length).toBe(44 + 70);
    for (const p of WHO_AM_I_2) expect(WHO_AM_I).toContain(p);
  });
  it('has unique names, and no name or alias is shared between people', () => {
    const seen = new Map<string, string>();
    for (const p of WHO_AM_I) for (const n of [p.name, ...(p.also ?? [])]) {
      const k = norm(n);
      if (n === p.name) expect(seen.has(k), `duplicate ${n}`).toBe(false);
      else if (seen.has(k)) expect(seen.get(k), `alias ${n}`).toBe(p.name);
      seen.set(k, p.name);
    }
    expect(new Set(WHO_AM_I.map((p) => norm(p.name))).size).toBe(WHO_AM_I.length);
  });
  it('has five non-empty clues and never names the person in a clue', () => {
    for (const p of WHO_AM_I_2) { // new entries only: the original set is left as it was
      expect(p.clues.length, p.name).toBe(5);
      for (const c of p.clues) expect(c.trim().length, p.name).toBeGreaterThan(5);
      expect(new Set(p.clues).size, p.name).toBe(5);
      for (const n of [p.name, ...(p.also ?? [])]) {
        const re = new RegExp(`(^|[^a-z])${esc(norm(n))}([^a-z]|$)`);
        for (const c of p.clues) expect(re.test(norm(c)), `${p.name}: "${c}" contains "${n}"`).toBe(false);
      }
    }
  });
  it('does not use above or below in user-facing text', () => {
    for (const p of WHO_AM_I_2) for (const c of [p.name, ...(p.also ?? []), ...p.clues]) expect(/\b(above|below)\b/i.test(c), c).toBe(false);
  });
});

describe('wordsearch content', () => {
  it('has the extra themes appended with unique ids', () => {
    expect(MORE_WS_THEMES.length).toBe(40);
    expect(new Set(WS_THEMES.map((t) => t.id)).size).toBe(WS_THEMES.length);
    for (const t of MORE_WS_THEMES) expect(WS_THEMES).toContain(t);
  });
  it('has letters-only, unique words that fit the grid, and every word places', () => {
    for (const [ti, t] of WS_THEMES.entries()) {
      if (!MORE_WS_THEMES.includes(t)) continue; // the original themes are left as they were
      expect(t.words.length, t.id).toBeGreaterThanOrEqual(8);
      expect(t.words.length, t.id).toBeLessThanOrEqual(14);
      expect(new Set(t.words).size, t.id).toBe(t.words.length);
      for (const w of t.words) {
        expect(/^[A-Z]+$/.test(w), `${t.id}: ${w}`).toBe(true);
        expect(w.length, `${t.id}: ${w}`).toBeLessThanOrEqual(GRID_SIZE);
      }
      const { placed } = makeGrid(t.words, GRID_SIZE, ti * 97 + 13);
      expect(placed.length, t.id).toBe(t.words.length);
    }
  });
  it('has no above or below in titles', () => {
    for (const t of MORE_WS_THEMES) expect(/\b(above|below)\b/i.test(t.title)).toBe(false);
  });
});

describe('charades content', () => {
  it('has ten more decks appended with unique ids', () => {
    expect(EVEN_MORE_DECKS.length).toBe(10);
    expect(new Set(CHARADES_DECKS.map((d) => d.id)).size).toBe(CHARADES_DECKS.length);
    for (const d of EVEN_MORE_DECKS) expect(CHARADES_DECKS).toContain(d);
  });
  it('has 40 or more unique words per deck', () => {
    for (const d of CHARADES_DECKS) {
      expect(new Set(d.words.map((w) => w.toLowerCase())).size, d.id).toBe(d.words.length);
    }
    for (const d of EVEN_MORE_DECKS) {
      expect(d.words.length, d.id).toBeGreaterThanOrEqual(40);
      expect(/\b(above|below)\b/i.test([d.name, d.blurb, ...d.words].join(' ')), d.id).toBe(false);
    }
  });
});
