import { describe, expect, it } from 'vitest';
import { DEEP_WATERS } from '../src/data/deepWaters';
import { GENERATED_DEEP_CANDIDATES } from '../src/lib/deepWatersBankGenerator';
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

  it('simulates 365 days with unique daily prompts and balanced bank rotation', () => {
    const counts = new Map(DEEP_WATERS.map((p) => [p.id, 0]));
    let previous = new Set<string>();
    for (let day = 1; day <= 365; day++) {
      const current = dailyDeepPrompts(day);
      const ids = current.map((p) => p.id);
      expect(new Set(ids).size, `duplicate on day ${day}`).toBe(DEEP_ROUNDS);
      for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
      if (day > 1) {
        const overlap = ids.filter((id) => previous.has(id)).length;
        expect(overlap).toBe(Math.max(0, DEEP_ROUNDS * 2 - DEEP_WATERS.length));
      }
      previous = new Set(ids);
    }
    const frequencies = [...counts.values()];
    expect(Math.max(...frequencies) - Math.min(...frequencies)).toBeLessThanOrEqual(1);
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

  it('recognizes common valid answers from player review and labels the key as curated', () => {
    const byId = (id: string) => DEEP_WATERS.find((p) => p.id === id)!;
    const cases: Array<[string, string, string]> = [
      ['scripture', 'Mary Magdalene', 'Mary Magdalene'],
      ['scripture', 'Martha', 'Martha'],
      ['scripture', 'Rachel', 'Rachel'],
      ['scripture', 'Rebecca', 'Rebekah'],
      ['scripture', 'Leah', 'Leah'],
      ['councils', 'Lateran I', 'Lateran I'],
      ['councils', 'Lateran V', 'Lateran V'],
      ['councils', 'Vienne', 'Vienne'],
      ['councils', 'Constantinople IV', 'Constantinople IV'],
      ['places', 'Damascus', 'Damascus'],
      ['places', 'Athens', 'Athens'],
      ['places', 'Rome', 'Rome'],
      ['places', 'Cana', 'Cana'],
      ['fathers', 'Polycarp', 'Polycarp'],
      ['fathers', 'Ignatius of Antioch', 'Ignatius of Antioch'],
      ['marian', 'Our Lady of Perpetual Help', 'Our Lady of Perpetual Help'],
      ['marian', 'Theotokos', 'Theotokos'],
    ];
    for (const [id, guess, expected] of cases) {
      expect(findDeepAnswer(byId(id), guess)?.answer, id + ': ' + guess).toBe(expected);
    }
  });

  it('generates a provenance-backed candidate bank without inventing rarity tiers', () => {
    expect(GENERATED_DEEP_CANDIDATES.length).toBeGreaterThan(100);
    const keys = GENERATED_DEEP_CANDIDATES.map((row) => row.category + ':' + normalizeDeepAnswer(row.answer));
    expect(new Set(keys).size).toBe(keys.length);
    for (const row of GENERATED_DEEP_CANDIDATES) {
      expect(row.answer.trim().length).toBeGreaterThan(1);
      expect(row.source.trim().length).toBeGreaterThan(0);
      expect(row.sourceId.trim().length).toBeGreaterThan(0);
      expect(row.evidence.trim().length).toBeGreaterThan(0);
      expect(row.reviewStatus).toBe('needs-review');
      expect(row.tier).toBeNull();
    }
  });

  it('uses an explicit increasing editorial score ladder', () => {
    expect([1, 2, 3, 4, 5].map((n) => DEEP_POINTS[n as 1 | 2 | 3 | 4 | 5])).toEqual([1, 2, 4, 8, 16]);
  });
});
