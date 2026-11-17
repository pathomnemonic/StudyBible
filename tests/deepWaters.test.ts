import { describe, expect, it } from 'vitest';
import { DEEP_WATERS } from '../src/data/deepWaters';
import { dailyDeepPrompts, DEEP_POINTS, DEEP_ROUNDS, DEEP_SECONDS, findDeepAnswer, normalizeDeepAnswer, practiceDeepPrompts } from '../src/lib/deepWaters';

describe('Deep Waters content and rules', () => {
  it('has enough Catholic prompts for a seven-round daily set', () => {
    expect(DEEP_WATERS.length).toBeGreaterThanOrEqual(10);
    expect(DEEP_ROUNDS).toBe(7);
    expect(DEEP_SECONDS).toBe(30);
    expect(new Set(DEEP_WATERS.map((p) => p.id)).size).toBe(DEEP_WATERS.length);
    for (const p of DEEP_WATERS) {
      expect(p.prompt.trim().length, p.id).toBeGreaterThan(12);
      expect(p.hint.trim().length, p.id).toBeGreaterThan(20);
      expect(p.answers.length, p.id).toBeGreaterThanOrEqual(10);
      expect(new Set(p.answers.map((a) => normalizeDeepAnswer(a.answer))).size, p.id).toBe(p.answers.length);
      for (const a of p.answers) expect([1, 2, 3, 4, 5]).toContain(a.tier);
    }
  });

  it('daily prompts are stable, unique and change with the seed', () => {
    const a = dailyDeepPrompts(20600), b = dailyDeepPrompts(20600), c = dailyDeepPrompts(20601);
    expect(a).toEqual(b);
    expect(a).toHaveLength(DEEP_ROUNDS);
    expect(new Set(a.map((p) => p.id)).size).toBe(DEEP_ROUNDS);
    expect(c.map((p) => p.id)).not.toEqual(a.map((p) => p.id));
  });

  it('practice sets are reproducible without changing the daily set', () => {
    expect(practiceDeepPrompts(123)).toEqual(practiceDeepPrompts(123));
    expect(dailyDeepPrompts(123)).not.toEqual(practiceDeepPrompts(123));
  });

  it('matches normalized answers and aliases, but does not guess at partial strings', () => {
    const orders = DEEP_WATERS.find((p) => p.id === 'orders')!;
    expect(findDeepAnswer(orders, '  SOCIETY of JESUS ' )?.answer).toBe('Jesuits');
    expect(findDeepAnswer(orders, 'Norbertines')?.answer).toBe('Premonstratensians');
    expect(findDeepAnswer(orders, 'Jesuit')).toBeNull();
    expect(findDeepAnswer(orders, '')).toBeNull();
  });

  it('uses an explicit increasing editorial score ladder', () => {
    expect([1, 2, 3, 4, 5].map((n) => DEEP_POINTS[n as 1 | 2 | 3 | 4 | 5])).toEqual([1, 2, 4, 8, 16]);
  });
});
