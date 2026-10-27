import { describe, expect, it } from 'vitest';
import { PLANS, MORE_PLANS } from '../src/data/novenas';
import { EXTRA_PLANS } from '../src/data/novenas2';
import { MORE_PLANS3 } from '../src/data/novenas3';
import { parseRefs } from '../src/lib/refs';

const all = [...PLANS, ...MORE_PLANS, ...EXTRA_PLANS, ...MORE_PLANS3];
describe('novenas and short plans', () => {
  it('has unique ids and a prayer and a passage that parses for every day', () => {
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
    for (const p of all) for (const d of p.days) {
      if (EXTRA_PLANS.includes(p) || MORE_PLANS3.includes(p)) expect(d.prayer && d.prayer.length > 40, `${p.id} ${d.title}`).toBe(true);
      expect(parseRefs(d.refs).ok, `${p.id} ${d.refs}`).toBe(true);
    }
  });
  it('has at least sixteen plans', () => expect(all.length).toBeGreaterThanOrEqual(22));
});
