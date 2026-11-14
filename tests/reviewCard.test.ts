import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubGlobal('location', { origin: 'https://example.org' });

const SRC = { sourceRef: 'PSA.23.1', sourceScheme: 'kjv' as const };

describe('adding a lesson verse to the memorize list', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); });

  it('adds one card and keeps the passage as the lesson wrote it', async () => {
    const { addReviewCard } = await import('../src/curriculum/addReview');
    const { db } = await import('../src/db/db');
    expect(await addReviewCard('PSA.22.1', SRC)).toBe('added');
    const all = await db.memory.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ ref: 'PSA.22.1', source: 'PSA.23.1', sourceScheme: 'kjv' });
    expect(all[0].approximate).toBeUndefined();
  });
  it('marks a card whose mapping was not verified', async () => {
    const { addReviewCard } = await import('../src/curriculum/addReview');
    const { db } = await import('../src/db/db');
    await addReviewCard('JHN.6.53', { sourceRef: 'JHN.6.53', sourceScheme: 'kjv', approximate: true });
    expect((await db.memory.toArray())[0].approximate).toBe(true);
  });
  it('twenty rapid calls leave exactly one card', async () => {
    const { addReviewCard } = await import('../src/curriculum/addReview');
    const { db } = await import('../src/db/db');
    const results = await Promise.all(Array.from({ length: 20 }, () => addReviewCard('PSA.22.1', SRC)));
    expect(results.filter((r) => r === 'added')).toHaveLength(1);
    expect(results.filter((r) => r === 'exists')).toHaveLength(19);
    expect(await db.memory.count()).toBe(1);
  });
  it('leaves an existing card untouched', async () => {
    const { addReviewCard } = await import('../src/curriculum/addReview');
    const { db } = await import('../src/db/db');
    const id = await db.memory.add({ ref: 'PSA.22.1', ease: 2.1, interval: 9, reps: 4, lapses: 1, due: 5, createdAt: 1 });
    expect(await addReviewCard('PSA.22.1', SRC)).toBe('exists');
    expect(await db.memory.get(id)).toMatchObject({ reps: 4, interval: 9, createdAt: 1 });
    expect(await db.memory.count()).toBe(1);
  });
  it('a failed write rejects, writes nothing, and can be retried', async () => {
    const { addReviewCard } = await import('../src/curriculum/addReview');
    const { db } = await import('../src/db/db');
    const real = db.memory.add.bind(db.memory);
    const spy = vi.spyOn(db.memory, 'add').mockRejectedValueOnce(new Error('disk full'));
    await expect(addReviewCard('PSA.22.1', SRC)).rejects.toThrow(/disk full/);
    expect(await db.memory.count()).toBe(0);
    spy.mockImplementation(real as never);
    expect(await addReviewCard('PSA.22.1', SRC)).toBe('added');
    expect(await db.memory.count()).toBe(1);
  });
  it('a different passage is never substituted for the one asked for', async () => {
    const { addReviewCard } = await import('../src/curriculum/addReview');
    const { db } = await import('../src/db/db');
    await db.memory.add({ ref: 'PSA.22.2', ease: 2.5, interval: 0, reps: 0, lapses: 0, due: 0, createdAt: 1 });
    expect(await addReviewCard('PSA.22.1', SRC)).toBe('added'); // the neighbouring verse does not count as "already there"
    expect((await db.memory.toArray()).map((c) => c.ref).sort()).toEqual(['PSA.22.1', 'PSA.22.2']);
  });
});
