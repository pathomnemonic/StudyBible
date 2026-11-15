import { describe, expect, it } from 'vitest';
import { memoizeMapPromise, memoizePromise } from '../src/lib/promiseCache';

describe('retryable promise caches', () => {
  it('evicts a rejected singleton promise and caches the next success', async () => {
    let calls = 0;
    const load = memoizePromise(async () => {
      calls++;
      if (calls === 1) throw new Error('temporary fetch failure');
      return 'recovered';
    });
    await expect(load()).rejects.toThrow('temporary fetch failure');
    await expect(load()).resolves.toBe('recovered');
    await expect(load()).resolves.toBe('recovered');
    expect(calls).toBe(2);
  });

  it('shares concurrent loads for one key but retries a rejected key', async () => {
    const cache = new Map<string, Promise<string>>();
    let calls = 0;
    const load = () => memoizeMapPromise(cache, 'editions', async () => {
      calls++;
      if (calls === 1) throw new Error('offline');
      return 'loaded';
    });
    const first = load();
    const concurrent = load();
    expect(first).toBe(concurrent);
    await expect(first).rejects.toThrow('offline');
    await expect(load()).resolves.toBe('loaded');
    expect(calls).toBe(2);
  });

  it('keeps independent keyed resources separate', async () => {
    const cache = new Map<string, Promise<string>>();
    const a = memoizeMapPromise(cache, 'a', async () => 'A');
    const b = memoizeMapPromise(cache, 'b', async () => 'B');
    await expect(a).resolves.toBe('A');
    await expect(b).resolves.toBe('B');
    expect(cache.size).toBe(2);
  });
});
