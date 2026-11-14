import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
// @ts-expect-error plain ES module shared with the browser checks
import { parseShard, parseConcurrency, pickSizes, pickRoutes } from '../e2e/lib/config.mjs';

const ALL = [{ name: '320' }, { name: '390' }, { name: '320-big' }];
describe('crawler configuration guards', () => {
  it('rejects malformed or out-of-range shards', () => {
    for (const bad of ['', '0/3', '4/3', '1/0', 'a/b', '2', '1/2/3', '-1/3']) expect(() => parseShard(bad), bad).toThrow();
    expect(parseShard('2/4')).toEqual([2, 4]);
    expect(parseShard()).toEqual([1, 1]);
  });
  it('rejects bad concurrency', () => {
    for (const bad of ['0', '-2', 'x', '1.5', '99', '']) expect(() => parseConcurrency(bad), bad).toThrow();
    expect(parseConcurrency('3')).toBe(3);
  });
  it('rejects empty and unknown size lists, names the unknown ones', () => {
    expect(() => pickSizes('', ALL)).toThrow(/names no size/);
    expect(() => pickSizes(' , ', ALL)).toThrow(/names no size/);
    expect(() => pickSizes('320,999', ALL)).toThrow(/999/);
    expect(pickSizes('390,320-big', ALL).map((s: { name: string }) => s.name)).toEqual(['390', '320-big']);
  });
  it('rejects a selection of zero routes (ONLY matches nothing, or more shards than routes)', () => {
    const all = ['/a', '/b', '/c'];
    expect(() => pickRoutes([], undefined, [1, 1])).toThrow(/empty/);
    expect(() => pickRoutes(all, '/zzz', [1, 1])).toThrow(/matches no route/);
    expect(() => pickRoutes(all, undefined, [4, 5])).toThrow(/is empty/);
    expect(pickRoutes(all, undefined, [2, 2])).toEqual(['/b']);
  });
  const sweep = (env: Record<string, string | undefined>) => spawnSync('node', ['e2e/sweep.mjs'], { env: { ...process.env, ...env }, encoding: 'utf8', timeout: 30000 });
  it('the sweep itself exits non-zero, before opening a browser, on an invalid configuration', () => {
    for (const env of [{ SWEEP_SIZES: '' }, { SWEEP_SIZES: '999' }, { SWEEP_SHARD: '9/3' }, { SWEEP_CONCURRENCY: '0' }, { ONLY: '/no/such/route' }, { SWEEP_MODE: 'huge' }]) {
      const r = sweep(env);
      expect(r.status, JSON.stringify(env)).toBe(2);
      expect(r.stderr).toMatch(/FAIL sweep configuration/);
    }
  });
  it('the runner exits non-zero on a bad or empty shard', () => {
    for (const SHARD of ['0/2', '3/2', 'x', '99/99']) {
      const r = spawnSync('node', ['e2e/run-all.mjs'], { env: { ...process.env, SHARD }, encoding: 'utf8', timeout: 30000 });
      expect(r.status, SHARD).toBe(2);
      expect(r.stderr).toMatch(/FAIL runner configuration/);
    }
  });
});
