import { describe, expect, it } from 'vitest';
import { FEATURES, HUBS, featuresOf, searchFeatures, startHere } from '../src/lib/features';

describe('feature registry', () => {
  it('has unique ids and routes that look like routes', () => {
    const ids = FEATURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FEATURES) { expect(f.to.startsWith('/')).toBe(true); expect(f.title.length).toBeGreaterThan(2); expect(HUBS.some((h) => h.id === f.hub)).toBe(true); }
  });
  it('every hub has something in it', () => { for (const h of HUBS) expect(featuresOf(h.id).length).toBeGreaterThan(0); });
  it('finds things by name, keyword and description', () => {
    expect(searchFeatures('rosary')[0].id).toBe('pray.rosary');
    expect(searchFeatures('friday abstinence')[0].id).toBe('pray.life');
    expect(searchFeatures('rcia').map((f) => f.id)).toContain('study.prepare');
    expect(searchFeatures('zzzz')).toEqual([]);
  });
  it('puts the reader’s interests first', () => {
    expect(startHere(null, ['pray'], 3).every((f) => (f.interest ?? []).includes('pray'))).toBe(true);
    expect(startHere('pray', [], 2).length).toBe(2);
  });
});
