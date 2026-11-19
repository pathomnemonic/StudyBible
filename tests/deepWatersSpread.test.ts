import { describe, expect, it } from 'vitest';
import { DEEP_PLAYABLE } from '../src/data/deepWaters';
import { DEEP_POINTS, matchDeepAnswer, spreadTiers } from '../src/lib/deepWaters';
import type { DeepPrompt } from '../src/data/deepWaters';

const find = (id: string) => DEEP_PLAYABLE.find((p) => p.id === id)!;

describe('scores spread over every open list', () => {
  it('gives every open list of 8 or more answers a top score and an easy one', () => {
    for (const p of DEEP_PLAYABLE.filter((x) => !x.closed && !x.derived && x.answers.length >= 8)) {
      const tiers = new Set(p.answers.map((a) => a.tier));
      expect(tiers.has(6), p.id).toBe(true);
      expect(tiers.has(1), p.id).toBe(true);
      expect(tiers.size, p.id).toBeGreaterThanOrEqual(5);
    }
  });
  it('keeps the order the authors gave (rarer stays rarer) and changes no answer text', () => {
    const p: DeepPrompt = { id: 't', theme: 'saints', prompt: 'x', context: '', basis: '', answers: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((answer, i) => ({ answer, tier: (i < 5 ? 1 : 2) as 1 | 2 })) };
    const s = spreadTiers(p);
    expect(s.answers.map((a) => a.answer)).toEqual(p.answers.map((a) => a.answer));
    for (let i = 1; i < s.answers.length; i++) expect(s.answers[i].tier).toBeGreaterThanOrEqual(s.answers[i - 1].tier);
    expect(s.answers[7].tier).toBe(6);
  });
  it('leaves a list with a fixed set of answers alone', () => {
    const p: DeepPrompt = { id: 't', theme: 'scripture', prompt: 'x', context: '', basis: '', closed: 4, answers: ['a', 'b', 'c', 'd'].map((answer) => ({ answer, tier: 1 as const })) };
    expect(spreadTiers(p)).toBe(p);
  });
});

describe('everyday answers people type are accepted', () => {
  const poor = find('authored7-ways-catholics-help-the-poor');
  it.each(['visit the sick', 'visiting the sick', 'pray', 'prayer', 'pray for the poor', 'feed the hungry', 'feeding the hungry', 'give money', 'donate to charity', 'volunteer', 'volunteering'])('"%s" counts for helping the poor', (guess) => {
    expect(matchDeepAnswer(poor, guess).status, guess).toBe('match');
  });
  it('still refuses what is not an answer', () => {
    expect(matchDeepAnswer(poor, 'play video games').status).toBe('none');
  });
});

describe('one top answer per category', () => {
  it('has exactly one answer worth 100 in every open list that is played', async () => {
    const { DEEP_ALL } = await import('../src/data/deepWatersPacks');
    for (const p of [...DEEP_PLAYABLE, ...DEEP_ALL].filter((x) => !x.closed && x.answers.length >= 3)) {
      expect(p.answers.filter((a) => a.tier === 6).length, p.id).toBe(1);
    }
  });
  it('pays 20 to 100 points, with a typical answer worth about 50', () => {
    expect(DEEP_POINTS).toEqual({ 1: 20, 2: 35, 3: 50, 4: 65, 5: 80, 6: 100 });
    const pts = DEEP_PLAYABLE.filter((p) => !p.closed && p.answers.length >= 8 && !p.derived).flatMap((p) => p.answers.map((a) => DEEP_POINTS[a.tier]));
    const mean = pts.reduce((x, y) => x + y, 0) / pts.length;
    expect(mean).toBeGreaterThan(40);
  });
});

describe('no vague questions', () => {
  // "Name a big word or idea from the New Testament letters" has no clear edge: anything could be argued. A question must name a kind of thing a player can picture.
  const VAGUE = /\b(idea|ideas|concept|concepts|topic|topics)\b|\b(big|important|main|key|major) (word|thing|theme)\b/i;
  it('asks nothing in the daily bank or the packs that is about an "idea", "concept" or "topic"', async () => {
    const { DEEP_ALL } = await import('../src/data/deepWatersPacks');
    expect([...DEEP_PLAYABLE, ...DEEP_ALL].filter((p) => VAGUE.test(p.prompt)).map((p) => `${p.id}: ${p.prompt}`)).toEqual([]);
  });
});
