import { beforeEach, describe, expect, it, vi } from 'vitest';
const mem = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear() });
vi.stubGlobal('window', { addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true });
vi.stubGlobal('CustomEvent', class { constructor(public type: string, public init?: unknown) {} });
import { dailyDone, loadPlays, loadTrophies, markDailyDone, recordPlay, setPractice } from '../src/lib/dailyGame';

beforeEach(() => { localStorage.clear(); setPractice(false); });

describe('practice mode', () => {
  it('counts nothing while on: no daily mark, play, day or trophy', () => {
    setPractice(true);
    markDailyDone('verbum', '3/6', true);
    expect(recordPlay('quartets', { perfect: true })).toEqual([]);
    expect(dailyDone('verbum')).toBeNull();
    expect(loadPlays().days).toEqual([]);
    expect(loadPlays().games).toEqual({});
    expect(loadTrophies()).toEqual({});
  });
  it('counts again once it is turned off', () => {
    setPractice(true); recordPlay('verbum'); setPractice(false);
    const fresh = recordPlay('verbum');
    expect(fresh.map((t) => t.id)).toContain('first');
    expect(loadPlays().games.verbum).toBe(1);
  });
});
