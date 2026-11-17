import { beforeEach, describe, expect, it } from 'vitest';
import { bombTargets, canUse, claimDaily, COINS, costOf, loadWallet, POWER_UPS, saveWallet } from '../src/lib/triviaPowerUps';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as unknown as { localStorage: Storage }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear(), key: () => null, length: 0 } as Storage;
});

describe('Trivia Chrism power-ups', () => {
  it('a Bomb removes exactly two wrong answers and never the right one', () => {
    for (let a = 0; a < 4; a++) for (const r of [0, 0.3, 0.7, 0.99]) {
      const t = bombTargets(4, a, () => r);
      expect(t).toHaveLength(2); expect(new Set(t).size).toBe(2); expect(t).not.toContain(a);
    }
  });
  it('costs are positive and each power-up is listed once', () => {
    expect(new Set(POWER_UPS.map((p) => p.id)).size).toBe(POWER_UPS.length);
    for (const p of POWER_UPS) expect(costOf(p.id)).toBeGreaterThan(0);
  });
  it('rules for using one', () => {
    const base = { coins: 100, used: new Set<'bomb'>(), hearts: 3, solo: false, mode: 'question' as const };
    expect(canUse('bomb', base).ok).toBe(true);
    expect(canUse('bomb', { ...base, coins: 10 }).ok).toBe(false);
    expect(canUse('bomb', { ...base, used: new Set(['bomb']) }).ok).toBe(false);
    expect(canUse('bomb', { ...base, mode: 'other' }).ok).toBe(false);
    expect(canUse('life', { ...base, solo: true, hearts: 3 }).ok).toBe(false);
    expect(canUse('life', { ...base, solo: true, hearts: 1 }).ok).toBe(true);
    expect(canUse('life', { ...base, solo: false, hearts: 1 }).ok).toBe(false);
  });
  it('the wallet starts with a gift, survives bad data, and the daily gift comes once a day', () => {
    expect(loadWallet().coins).toBe(COINS.start);
    mem.set('sb:trivia:wallet:v1', '{oops'); expect(loadWallet().coins).toBe(COINS.start);
    saveWallet({ coins: 7, lastDaily: -1 }); expect(loadWallet().coins).toBe(7);
    const w = claimDaily({ coins: 7, lastDaily: -1 }, 100)!;
    expect(w.coins).toBe(7 + COINS.daily);
    expect(claimDaily(w, 100)).toBeNull();
    expect(claimDaily(w, 101)).not.toBeNull();
  });
});
