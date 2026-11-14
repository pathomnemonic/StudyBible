import { describe, expect, it } from 'vitest';
import { collectionSummary, copyOfCollection, matchesCollection } from '../src/lib/collectionsView';

const label = (t: any) => t.ref ?? t.label ?? '';
const c = { name: 'The Eucharist in Scripture', description: 'Bread and the cup.', items: [{ type: 'passage', ref: 'JHN.6.51' }, { type: 'note', id: 1, label: 'My bread note' }] } as any;

describe('collections list helpers', () => {
  it('matches every word against name, description or item labels', () => {
    expect(matchesCollection(c, '', label)).toBe(true);
    expect(matchesCollection(c, 'eucharist cup', label)).toBe(true);
    expect(matchesCollection(c, 'JHN.6', label)).toBe(true);
    expect(matchesCollection(c, 'bread note', label)).toBe(true);
    expect(matchesCollection(c, 'eucharist marian', label)).toBe(false);
  });
  it('summarises items and done count, ignoring ticks for removed items', () => {
    expect(collectionSummary({ items: [] })).toBe('0 items');
    expect(collectionSummary({ items: [c.items[0]] })).toBe('1 item');
    expect(collectionSummary({ items: c.items, done: [JSON.stringify(c.items[0]), '{"gone":1}'] })).toBe('2 items, 1 done');
  });
  it('copies without sharing items or ticks', () => {
    const k = copyOfCollection({ ...c, done: ['x'] }, 5);
    expect(k.name).toBe('The Eucharist in Scripture (copy)');
    expect(k.items).toEqual(c.items);
    expect(k.items[0]).not.toBe(c.items[0]);
    expect((k as any).done).toBeUndefined();
    expect(k.createdAt).toBe(5);
  });
});

import { planDaysFromCollection } from '../src/lib/collectionsView';
describe('reading plan from a collection', () => {
  it('takes passages in order, one per day, and leaves other items out', () => {
    const days = planDaysFromCollection({ items: [{ type: 'passage', ref: 'JHN.6.51-58' }, { type: 'note', id: 1, label: 'x' } as any, { type: 'passage', ref: 'LUK.22.14-20' }] });
    expect(days).toEqual([{ refs: ['JHN.6.51-58'] }, { refs: ['LUK.22.14-20'] }]);
  });
});
