import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { DEEP_WATERS, type DeepPrompt } from '../src/data/deepWaters';
import { matchDeepAnswer } from '../src/lib/deepWaters';

const regions = DEEP_WATERS.filter((p) => p.id.startsWith('places-x-'));
const get = (id: string) => regions.find((p) => p.id === `places-x-${id}`) as DeepPrompt;
const has = (p: DeepPrompt, a: string) => matchDeepAnswer(p, a).status === 'match';

describe('place questions worked out from the map data', () => {
  it('are the ones the script produces now', () => {
    expect(() => execSync('npx tsx scripts/deepwaters/regions.ts --check', { stdio: 'pipe', timeout: 120000 })).not.toThrow();
  }, 130000);
  it('each name 60 or more places, none a letter rule', () => {
    expect(regions.length).toBeGreaterThan(60);
    for (const p of regions) { expect(p.answers.length, p.id).toBeGreaterThanOrEqual(60); expect(p.prompt, p.id).not.toMatch(/letter|vowel|starts with|ends with/i); }
  });
  it('put well-known places where a reader knows them to be', () => {
    const near = get('near-jerusalem-25');
    for (const a of ['Bethlehem', 'Bethany', 'Jericho']) expect(has(near, a), a).toBe(true);
    expect(has(near, 'Nazareth')).toBe(false);
    expect(has(near, 'Damascus')).toBe(false);
    expect(has(get('dir-north'), 'Nazareth')).toBe(true);
    expect(has(get('dir-north'), 'Beersheba')).toBe(false);
    expect(has(get('dir-south'), 'Beersheba')).toBe(true);
    expect(has(get('dir-abroad'), 'Babylon')).toBe(true);
    expect(has(get('dir-abroad'), 'Bethlehem')).toBe(false);
  });
  it('name the New Testament and the Law correctly', () => {
    expect(has(get('in-nt'), 'Capernaum')).toBe(true);
    expect(has(get('in-nt'), 'Sodom')).toBe(true);
    expect(has(get('in-law'), 'Egypt')).toBe(true);
    expect(has(get('in-law'), 'Capernaum')).toBe(false);
  });
});
