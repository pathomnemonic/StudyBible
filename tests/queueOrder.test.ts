import { describe, expect, it } from 'vitest';
import { moveInQueue, moveMessage } from '../src/lib/queueOrder';

// rows arrive in the order the reader sees them (orderBy('order')); two share an order number on purpose
const rows = [{ id: 1, order: 5 }, { id: 2, order: 5 }, { id: 3, order: 9 }];
const apply = (u: { id: number; order: number }[]) => rows.map((r) => ({ ...r, order: u.find((x) => x.id === r.id)?.order ?? r.order })).sort((a, b) => a.order - b.order).map((r) => r.id);

describe('queue reorder', () => {
  it('moves an item down and up, renumbering from zero', () => {
    expect(apply(moveInQueue(rows, 0, 1))).toEqual([2, 1, 3]);
    expect(apply(moveInQueue(rows, 2, -1))).toEqual([1, 3, 2]);
  });
  it('works even when two rows share an order number', () => {
    const u = moveInQueue(rows, 1, -1);
    expect(u.map((x) => x.order).sort()).toEqual([0, 1, 2]);
    expect(apply(u)).toEqual([2, 1, 3]);
  });
  it('refuses moves off either end', () => {
    expect(moveInQueue(rows, 0, -1)).toEqual([]);
    expect(moveInQueue(rows, 2, 1)).toEqual([]);
    expect(moveInQueue(rows, 5, 1)).toEqual([]);
  });
  it('says where it went', () => { expect(moveMessage('Day 4', 0, 3)).toBe('Moved Day 4 to position 1 of 3'); });
});
