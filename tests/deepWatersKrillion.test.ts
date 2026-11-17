import { describe, expect, it } from 'vitest';
import { KRILLION_PROMPTS } from '../src/data/deepWatersKrillion';
import { matchDeepAnswer } from '../src/lib/deepWaters';

describe('Krillion-style Deep Waters expansion', () => {
  it('adds 2,000 distinct, short, accessible prompts with complete answer lists', () => {
    expect(KRILLION_PROMPTS).toHaveLength(2003);
    expect(new Set(KRILLION_PROMPTS.map((p) => p.id)).size).toBe(2003);
    expect(new Set(KRILLION_PROMPTS.map((p) => p.prompt)).size).toBe(2000);
    for (const p of KRILLION_PROMPTS) {
      expect(p.prompt.trim().split(/\s+/).length, p.id).toBeGreaterThanOrEqual(4);
      expect(p.prompt.trim().split(/\s+/).length, p.id).toBeLessThanOrEqual(14);
      expect(p.prompt, p.id).toMatch(/^Name /);
      expect(p.answers.length, p.id).toBeGreaterThanOrEqual(25);
      expect(p.answers.some((a) => a.tier === 1), p.id).toBe(true);
      expect(p.answers.some((a) => a.tier === 5 || a.tier === 6), p.id).toBe(true);
      expect(new Set(p.answers.map((a) => a.answer.toLowerCase())).size, p.id).toBe(p.answers.length);
      expect(p.answers.every((a) => a.answer.trim().split(/\s+/).length <= 4), p.id).toBe(true);
      expect(p.answers.some((a) => (a.aliases ?? []).length > 0), p.id).toBe(true);
      expect(p.status).toBe('draft');
      const accepted = p.answers.slice(0, 3);
      for (const a of accepted) expect(matchDeepAnswer(p, a.answer).status, p.id).toBe('match');
      const alias = p.answers.find((a) => a.aliases?.length)?.aliases?.[0];
      expect(alias, p.id).toBeTruthy();
      expect(matchDeepAnswer(p, alias!).status, p.id).toBe('match');
      const wrongCategory = p.theme === 'saints' ? 'Jerusalem' : 'Saint Augustine';
      expect(matchDeepAnswer(p, wrongCategory).status, p.id).toBe('none');
      expect(matchDeepAnswer(p, p.answers[0].answer + 'zz').status, p.id).toBe('none');
    }
  });
});
