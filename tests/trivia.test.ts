import { describe, expect, it } from 'vitest';
import { CATS, NEED, SLICE, WHEEL, bestPick, botRight, hasWon, newPlayer, nextQuestion, pickDifficulty, shuffleOptions, wheelRotation, type TQ } from '../src/lib/trivia';

const seeded = (s: number) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
const mk = (id: string, d: 1 | 2 | 3): TQ => ({ id, d, q: 'Q ' + id, o: ['a', 'b', 'c', 'd'], a: 2, why: 'because', src: { kind: 'catechism', label: 'x' } });
describe('Crown Quest rules', () => {
  it('has a wheel with every category and a free pick', () => { expect(WHEEL).toHaveLength(CATS.length + 1); expect(WHEEL.at(-1)).toBe('pick'); expect(SLICE * WHEEL.length).toBeCloseTo(360); expect(NEED).toBe(3); });
  it('stops each slice under the pointer', () => {
    for (let k = 0; k < WHEEL.length; k++) {
      const r = wheelRotation(123.4, k, 4);
      const under = ((360 - (r % 360)) + 360) % 360; // angle of the wheel that sits at the top
      expect(Math.floor(under / SLICE)).toBe(k);
      expect(r).toBeGreaterThan(123.4 + 3 * 360);
    }
  });
  it('picks a difficulty by weight', () => { expect(pickDifficulty([0.7, 0.3, 0], 0.5)).toBe(1); expect(pickDifficulty([0.7, 0.3, 0], 0.9)).toBe(2); expect(pickDifficulty([0, 0.35, 0.65], 0.9)).toBe(3); });
  it('never repeats a question until the category is used up, then starts over', () => {
    const pool = [mk('a', 1), mk('b', 2), mk('c', 3)]; const used = new Set<string>(); const rnd = seeded(5); const seen: string[] = [];
    for (let i = 0; i < 3; i++) { const q = nextQuestion(pool, used, 'mixed', rnd)!; seen.push(q.id); used.add(q.id); }
    expect(new Set(seen).size).toBe(3);
    expect(nextQuestion(pool, used, 'mixed', rnd)).toBeTruthy();
  });
  it('shuffles options and tracks the right answer', () => {
    for (let s = 1; s < 20; s++) { const r = shuffleOptions(mk('x', 1), seeded(s)); expect(r.options[r.answer]).toBe('c'); expect(new Set(r.options).size).toBe(4); }
  });
  it('the bot is better on easier questions and at higher levels', () => {
    const rate = (level: any, d: number) => { const r = seeded(9); let n = 0; for (let i = 0; i < 2000; i++) if (botRight(level, d, r)) n++; return n / 2000; };
    expect(rate('hard', 1)).toBeGreaterThan(rate('easy', 1));
    expect(rate('medium', 1)).toBeGreaterThan(rate('medium', 3));
  });
  it('wins at six crowns and the bot picks the category it is closest to finishing', () => {
    const p = newPlayer('A'); expect(hasWon(p)).toBe(false);
    p.crowns = CATS.map((c) => c.id); expect(hasWon(p)).toBe(true);
    const q = newPlayer('B'); q.crowns = ['scripture']; q.progress = { saints: 2, doctrine: 1 }; expect(bestPick(q)).toBe('saints');
  });
});
