import { describe, expect, it } from 'vitest';
import { DEEP_PLAYABLE } from '../src/data/deepWaters';
import { matchDeepAnswer, spreadTiers, type DeepPrompt } from '../src/lib/deepWaters';

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
    const p: DeepPrompt = { id: 't', theme: 'bible', prompt: 'x', context: '', basis: '', closed: 4, answers: ['a', 'b', 'c', 'd'].map((answer) => ({ answer, tier: 1 as const })) };
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
