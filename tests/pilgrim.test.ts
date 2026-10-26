import { describe, expect, it } from 'vitest';
import { PILGRIM_SITES } from '../src/data/pilgrim';
import { MORE_SITES } from '../src/data/pilgrim2';
import { parseRefs } from '../src/lib/refs';

const all = [...PILGRIM_SITES, ...MORE_SITES];
describe('pilgrim guides', () => {
  it('has unique ids and complete entries', () => {
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length);
    for (const s of all) {
      expect(s.story.length, s.id).toBeGreaterThan(120);
      expect(s.stops.length, s.id).toBeGreaterThanOrEqual(2);
      if (!/English/.test(s.lang)) expect(s.phrases.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.prayer.text.length, s.id).toBeGreaterThan(80);
      expect(s.site, s.id).toMatch(/^https:\/\//);
    }
  });
  it('cites Scripture that parses', () => {
    for (const s of all) for (const sc of s.scripture) expect(parseRefs(sc.ref).ok, `${s.id} ${sc.ref}`).toBe(true);
  });
  it('covers at least fifteen places', () => expect(all.length).toBeGreaterThanOrEqual(15));
});
