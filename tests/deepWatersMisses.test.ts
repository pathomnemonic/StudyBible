import { beforeEach, describe, expect, it } from 'vitest';
import { clearDeepMisses, deepMissesText, loadDeepMisses, MAX_MISSES, recordDeepMiss } from '../src/lib/deepWatersMisses';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as unknown as { localStorage: Storage }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear(), key: () => null, length: 0 } as Storage;
});

describe('unrecognised guesses', () => {
  it('records a guess once per question, ignoring case and spacing', () => {
    recordDeepMiss({ promptId: 'a', prompt: 'Q', guess: 'Fish  Gate' });
    recordDeepMiss({ promptId: 'a', prompt: 'Q', guess: 'fish gate' });
    recordDeepMiss({ promptId: 'b', prompt: 'Q2', guess: 'fish gate' });
    expect(loadDeepMisses()).toHaveLength(2);
  });
  it('ignores empty guesses, survives bad stored data, and clears', () => {
    expect(recordDeepMiss({ promptId: 'a', prompt: 'Q', guess: '   ' })).toEqual([]);
    mem.set('sb:deepwaters:misses:v1', '{oops');
    expect(loadDeepMisses()).toEqual([]);
    recordDeepMiss({ promptId: 'a', prompt: 'Q', guess: 'x1' });
    clearDeepMisses();
    expect(loadDeepMisses()).toEqual([]);
  });
  it('keeps only the newest entries', () => {
    for (let i = 0; i < MAX_MISSES + 5; i++) recordDeepMiss({ promptId: 'a', prompt: 'Q', guess: `g${i}` });
    const l = loadDeepMisses();
    expect(l).toHaveLength(MAX_MISSES);
    expect(l[l.length - 1].guess).toBe(`g${MAX_MISSES + 4}`);
  });
  it('formats one line per guess', () => {
    expect(deepMissesText([{ promptId: 'a', prompt: 'Q', guess: 'g', at: '2026-01-01' }])).toBe('a\tg\tQ');
  });
});
