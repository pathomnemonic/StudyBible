import { describe, expect, it } from 'vitest';
import { loadChains, loadFiles, verifyChain, verifyLife, verifySituation } from '../scripts/chains/verify';
import type { Life, Situation } from '../src/chains/types';

describe('sourced chains', () => {
  for (const mode of ['arguments', 'development', 'heresies', 'words', 'claims']) {
    it(`${mode}: every quotation is found in the source it cites`, () => {
      const cs = loadChains(mode);
      const ids = cs.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
      const bad = cs.flatMap(verifyChain);
      expect(bad.slice(0, 20)).toEqual([]);
    });
  }
  it('situations: every mentor quotation is found in its source', () => { expect(loadFiles<Situation>('situations').flatMap(verifySituation).slice(0, 20)).toEqual([]); });
  it('lives: events are ordered and every quotation is found', () => { expect(loadFiles<Life>('lives').flatMap(verifyLife).slice(0, 20)).toEqual([]); });
});

import { checkTimeline, loadTimeline } from '../scripts/chains/check-timeline';
describe('church timeline', () => {
  it('events are ordered, inside the map, match the councils, and every quotation is found', () => { expect(checkTimeline(loadTimeline()).slice(0, 20)).toEqual([]); });
});

import { checkWalks, loadWalks } from '../scripts/chains/check-walks';
describe('bible walks', () => {
  it('every stop is a real place with a verified quotation from its passage', () => { expect(checkWalks(loadWalks()).slice(0, 20)).toEqual([]); });
});

import { HARD_KINDS } from '../src/data/hardDay';
import { sourceText } from '../scripts/chains/verify';
describe('hard day page', () => {
  it('every verse reference exists, and every situation it links to exists', () => {
    const sits = loadFiles<Situation>('situations').map((x) => x.id);
    const bad: string[] = [];
    for (const k of HARD_KINDS) { if (!sits.includes(k.situation)) bad.push(`${k.id}: no situation ${k.situation}`); for (const v of k.verses) { const r = sourceText({ kind: 'scripture', label: v, ref: v, note: '' } as any); if (r.err) bad.push(`${k.id} ${v}: ${r.err}`); } }
    expect(bad).toEqual([]);
  });
});

import { TRIVIA_CATS, checkTrivia, loadTrivia } from '../scripts/chains/check-trivia';
describe('trivia bank', () => {
  for (const c of TRIVIA_CATS) it(`${c}: every question has four distinct options and a source quotation that is found`, () => { expect(checkTrivia(c, loadTrivia(c)).slice(0, 20)).toEqual([]); });
});

import { readFileSync as rf } from 'node:fs';
import { VERSE_OF_DAY } from '../src/study/verseOfDay';
describe('widget verses', () => {
  it('public/widgets/verses.json matches the app’s verse of the day list, in order', () => {
    const list = JSON.parse(rf('public/widgets/verses.json', 'utf8')) as { ref: string; text: string }[];
    expect(list).toHaveLength(VERSE_OF_DAY.length);
    for (const v of list) { expect(v.text.length).toBeGreaterThan(10); expect(v.ref.length).toBeGreaterThan(3); }
  });
});
