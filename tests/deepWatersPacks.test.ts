import { describe, expect, it } from 'vitest';
import { DEEP_PLAYABLE } from '../src/data/deepWaters';
import { DEEP_ALL, PACKS, packById, packDeepPrompts, packPrompts } from '../src/data/deepWatersPacks';
import { DEEP_ROUNDS, dailyDeepPrompts, matchDeepAnswer } from '../src/lib/deepWaters';

describe('the special packs', () => {
  it('hold the questions the daily game does not ask, each in one pack only', () => {
    const playable = new Set(DEEP_PLAYABLE.map((p) => p.id));
    const seen = new Map<string, string>();
    for (const k of PACKS) for (const p of packPrompts(k.id)) {
      expect(playable.has(p.id), `${p.id} is in the daily bank and in ${k.id}`).toBe(false);
      expect(seen.get(p.id), p.id).toBeUndefined();
      seen.set(p.id, k.id);
    }
    // nothing the game holds is lost: every question is asked daily or sits in a pack
    expect(DEEP_ALL.filter((p) => !playable.has(p.id) && !seen.has(p.id)).map((p) => p.id)).toEqual([]);
  });
  it('are big enough to deal many climbs, and the old compound letter questions are kept in the puzzle pack', () => {
    for (const k of PACKS) if (k.id !== 'more') expect(packPrompts(k.id).length, k.id).toBeGreaterThanOrEqual(50);
    const puzzles = packPrompts('puzzles');
    expect(puzzles.some((p) => /but no /.test(p.prompt))).toBe(true);
    expect(puzzles.some((p) => /with both /.test(p.prompt))).toBe(true);
    expect(puzzles.length).toBeGreaterThan(1500);
  });
  it('never put a puzzle, a book-of-the-Bible place list or a Curia document in the daily game', () => {
    for (let d = 20400; d < 20400 + 40; d++) for (const p of dailyDeepPrompts(d)) {
      expect(p.prompt, p.id).not.toMatch(/ but no | with both | exactly \d+ |Curia|archdiocese|apostolic/i);
      expect(p.id, p.id).not.toMatch(/^(places-[A-Z0-9]{3}|gpt-(?!saint-patronages))/);
    }
  });
  it('deal seven different questions from one pack, the same for the same seed and a new deal for a new one', () => {
    for (const k of PACKS) {
      if (packPrompts(k.id).length < DEEP_ROUNDS) continue;
      const a = packDeepPrompts(k.id, 11), b = packDeepPrompts(k.id, 11), c = packDeepPrompts(k.id, 12);
      expect(a).toHaveLength(DEEP_ROUNDS);
      expect(new Set(a.map((p) => p.id)).size).toBe(DEEP_ROUNDS);
      expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
      expect(a.map((p) => p.id)).not.toEqual(c.map((p) => p.id));
      const own = new Set(packPrompts(k.id).map((p) => p.id));
      for (const p of a) expect(own.has(p.id), `${k.id}: ${p.id}`).toBe(true);
    }
  });
  it('take the useful lists ChatGPT drafted, in the scholar pack, and the patron saints in the daily game', () => {
    const scholar = new Set(packPrompts('scholar').map((p) => p.id));
    for (const id of ['gpt-liturgical-books', 'gpt-church-historians', 'gpt-latin-prayers', 'gpt-archdioceses', 'gpt-apostolic-constitutions']) expect(scholar.has(id), id).toBe(true);
    const patron = DEEP_PLAYABLE.find((p) => p.id === 'gpt-saint-patronages');
    expect(patron?.prompt).toBe('Name a patron saint.');
    expect(matchDeepAnswer(patron!, 'christopher').status).toBe('match');
  });
  it('have a name and a short blurb', () => {
    for (const k of PACKS) { expect(k.name.length).toBeGreaterThan(3); expect(k.blurb.length).toBeGreaterThan(20); expect(`${k.name} ${k.blurb}`).not.toMatch(/\b(above|below)\b/i); }
    expect(packById('scholar')?.name).toBe("Scholar's Pack");
    expect(packById('nope')).toBeNull();
  });
});
