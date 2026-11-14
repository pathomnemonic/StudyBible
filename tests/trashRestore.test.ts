import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined, removeItem: () => undefined });
vi.stubGlobal('location', { origin: 'https://example.org' });

describe('a collection item whose original was deleted', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); });

  it('is found in Recently deleted and comes back under the same identity', async () => {
    const { db } = await import('../src/db/db');
    const { trashedFor, restoreFromTrash } = await import('../src/lib/trash');
    const { resolveItem } = await import('../src/lib/collections');
    const id = await db.notes.add({ kind: 'note', title: 'Gone soon', body: 'b', targets: [], tags: [], chapterKeys: [], createdAt: 1, updatedAt: 1 } as never);
    const uid = (await db.notes.get(id))!.uid!;
    const target = { type: 'note' as const, uid };
    await db.notes.delete(id);
    await vi.waitFor(async () => expect(await db.trash.count()).toBe(1));
    const ed = {} as never;
    expect((await resolveItem(target, 0, ed)).missing).toBe(true);
    const tid = await trashedFor(target);
    expect(tid).toBeDefined();
    await restoreFromTrash(tid!);
    const back = await resolveItem(target, 0, ed);
    expect(back.missing).toBeFalsy();
    expect(back.title).toBe('Gone soon');
    expect(await trashedFor(target)).toBeUndefined();
  });

  it('has no trash entry for something that was never kept', async () => {
    const { trashedFor } = await import('../src/lib/trash');
    expect(await trashedFor({ type: 'note', uid: 'nothing' })).toBeUndefined();
    expect(await trashedFor({ type: 'catechism', para: 5 })).toBeUndefined();
  });
});
