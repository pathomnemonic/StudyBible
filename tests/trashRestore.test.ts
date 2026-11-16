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


  it('serializes simultaneous restore requests so the trash row is consumed once', async () => {
    const { db } = await import('../src/db/db');
    const { restoreFromTrash } = await import('../src/lib/trash');
    const trashId = await db.trash.add({
      tbl: 'notes',
      data: { uid: 'restore-once', kind: 'note', body: 'kept', targets: [], tags: [], createdAt: 1, updatedAt: 1 },
      deletedAt: 2,
    });
    await db.tombs.add({ tbl: 'notes', uid: 'restore-once', updatedAt: 2 });

    const results = await Promise.all([restoreFromTrash(trashId), restoreFromTrash(trashId)]);
    expect(results.sort()).toEqual([false, true]);
    expect(await db.notes.where('uid').equals('restore-once').count()).toBe(1);
    expect(await db.trash.get(trashId)).toBeUndefined();
    expect(await db.tombs.filter((t) => t.uid === 'restore-once').count()).toBe(0);
  });

  it('does not duplicate a record whose uid is already present', async () => {
    const { db } = await import('../src/db/db');
    const { restoreFromTrash } = await import('../src/lib/trash');
    await db.notes.add({ uid: 'already-here', kind: 'note', body: 'current', targets: [], tags: [], createdAt: 1, updatedAt: 3 } as never);
    const trashId = await db.trash.add({ tbl: 'notes', data: { uid: 'already-here', kind: 'note', body: 'old', targets: [], tags: [], createdAt: 1 }, deletedAt: 2 });
    await db.tombs.add({ tbl: 'notes', uid: 'already-here', updatedAt: 2 });

    await expect(restoreFromTrash(trashId)).resolves.toBe(true);
    expect(await db.notes.where('uid').equals('already-here').count()).toBe(1);
    expect((await db.notes.where('uid').equals('already-here').first())?.body).toBe('current');
    expect(await db.trash.get(trashId)).toBeUndefined();
    expect(await db.tombs.filter((t) => t.uid === 'already-here').count()).toBe(0);
  });

  it('bumps an existing stale live row past its newer tombstone and wakes sync', async () => {
    const { db, syncFlags } = await import('../src/db/db');
    const { restoreFromTrash } = await import('../src/lib/trash');
    { const q = await import('../src/db/db'); await q.quietly(q.quietTables(), async () => {
      await db.notes.add({ uid: 'stale-existing', kind: 'note', body: 'keep current content', targets: [], tags: [], createdAt: 1, updatedAt: 10 } as never);
      await db.tombs.add({ tbl: 'notes', uid: 'stale-existing', updatedAt: 50 });
    }); }
    const trashId = await db.trash.add({ tbl: 'notes', data: { uid: 'stale-existing', kind: 'note', body: 'older trashed content', targets: [], tags: [], createdAt: 1, updatedAt: 5 }, deletedAt: 50 });
    const notify = vi.fn();
    syncFlags.onLocalChange = notify;
    await expect(restoreFromTrash(trashId)).resolves.toBe(true);
    const row = await db.notes.where('uid').equals('stale-existing').first();
    expect(row).toMatchObject({ body: 'keep current content' });
    expect(row!.updatedAt).toBeGreaterThan(50);
    expect(await db.tombs.filter((t) => t.tbl === 'notes' && t.uid === 'stale-existing').count()).toBe(0);
    expect(await db.trash.get(trashId)).toBeUndefined();
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('rolls back restore if consuming the trash row fails', async () => {
    const { db } = await import('../src/db/db');
    const { restoreFromTrash } = await import('../src/lib/trash');
    const trashId = await db.trash.add({
      tbl: 'notes',
      data: { uid: 'restore-rollback', kind: 'note', body: 'must remain trashed', targets: [], tags: [], createdAt: 1 },
      deletedAt: 2,
    });
    await db.tombs.add({ tbl: 'notes', uid: 'restore-rollback', updatedAt: 2 });
    vi.spyOn(db.trash, 'delete').mockRejectedValue(new Error('simulated interruption'));

    await expect(restoreFromTrash(trashId)).rejects.toThrow('simulated interruption');
    expect(await db.notes.where('uid').equals('restore-rollback').count()).toBe(0);
    expect(await db.trash.get(trashId)).toBeDefined();
    expect(await db.tombs.filter((t) => t.uid === 'restore-rollback').count()).toBe(1);
  });

  it('has no trash entry for something that was never kept', async () => {
    const { trashedFor } = await import('../src/lib/trash');
    expect(await trashedFor({ type: 'note', uid: 'nothing' })).toBeUndefined();
    expect(await trashedFor({ type: 'catechism', para: 5 })).toBeUndefined();
  });
});
