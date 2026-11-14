import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k), key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; } });
vi.stubGlobal('location', { origin: 'https://example.org', reload: () => undefined });

describe('repairing passage addresses', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); });

  it('knows the same passage written another way, and refuses to guess otherwise', async () => {
    const { repairPassageId } = await import('../src/lib/dataRepair');
    expect(repairPassageId('JHN.6.51-58')).toBeNull(); // already fine
    expect(repairPassageId('jhn.6.51-58')).toEqual(['JHN.6.51-58']);
    expect(repairPassageId(' JHN.6.51–58 ')).toEqual(['JHN.6.51-58']);
    expect(repairPassageId('Jn 6:51-58')).toBeNull(); // syntactically valid, but the verse mapping is unverified
    expect(repairPassageId('Jn 3:16')).toEqual(['JHN.3.16']);
    expect(repairPassageId('not a passage at all')).toBeNull();
    expect(repairPassageId('')).toBeNull();
  });


  it('does not repair a parseable address without semantic proof from edition counts', async () => {
    const { repairPassageId } = await import('../src/lib/dataRepair');
    const editions = (JSON.parse(readFileSync('public/data/editions.json', 'utf8')) as { editions: import('../src/lib/refCheck').CountsEdition[] }).editions;
    expect(repairPassageId('JHN.99.1', editions)).toBeNull();
    expect(repairPassageId('JHN.6.51-58', editions)).toBeNull();
    expect(repairPassageId('Jn 6:51-58', editions)).toBeNull();
    expect(repairPassageId('Jn 3:16', editions)).toEqual(['JHN.3.16']);
  });

  it('plans a repair only for what is certain, changes nothing by itself, and can be undone', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    const dr = await import('../src/lib/dataRepair');
    const n = await db.notes.add({ kind: 'note', body: 'b', title: 'T', targets: [{ type: 'passage', ref: 'jhn.3.16' }, { type: 'passage', ref: 'gibberish' }], tags: [], chapterKeys: [], createdAt: 1, updatedAt: 1 } as never);
    const c = await db.collections.add({ name: 'C', items: [{ type: 'passage', ref: 'jhn.3.16' }, { type: 'passage', ref: 'JHN.3.16' }, { type: 'passage', ref: 'xx yy' }], createdAt: 1, updatedAt: 1 } as never);
    const h = await db.highlights.add({ ref: 'jhn.1.1', book: 'jhn', c: 1, color: 'yellow', createdAt: 1 } as never);
    const input = { notes: await db.notes.toArray(), highlights: await db.highlights.toArray(), bookmarks: [], collections: await db.collections.toArray(), userPlans: [] } as never;
    const repairs = dr.planRepairs(input, ops.chapterKeysOf);
    expect(repairs.map((r) => r.tbl).sort()).toEqual(['collections', 'highlights', 'notes']);
    // planning touched nothing
    expect((await db.notes.get(n))!.targets[0]).toEqual({ type: 'passage', ref: 'jhn.3.16' });

    const undo = await dr.applyRepairs(repairs);
    const note = (await db.notes.get(n))!;
    expect(note.targets).toEqual([{ type: 'passage', ref: 'JHN.3.16' }, { type: 'passage', ref: 'gibberish' }]); // the unreadable one is left for the reader
    expect(note.chapterKeys).toEqual(['JHN.3']);
    const col = (await db.collections.get(c))!;
    expect(col.items).toEqual([{ type: 'passage', ref: 'JHN.3.16' }, { type: 'passage', ref: 'xx yy' }]); // no duplicate made
    expect(await db.highlights.get(h)).toMatchObject({ ref: 'JHN.1.1', book: 'JHN', c: 1 });
    expect(await db.cache.where('key').startsWith('snap:').count()).toBe(1); // a safety copy was kept first

    await dr.undoRepairs(undo);
    expect((await db.notes.get(n))!.targets[0]).toEqual({ type: 'passage', ref: 'jhn.3.16' });
    expect((await db.collections.get(c))!.items).toHaveLength(3);
    expect((await db.highlights.get(h))!.ref).toBe('jhn.1.1');
  });


  it('stops before any write when the required safety snapshot fails', async () => {
    const { db } = await import('../src/db/db');
    const safety = await import('../src/lib/safety');
    const { applyRepairs } = await import('../src/lib/dataRepair');
    const id = await db.notes.add({ kind: 'note', body: 'unchanged', targets: [], tags: [], createdAt: 1, updatedAt: 1 } as never);
    vi.spyOn(safety, 'snapshotIfDue').mockResolvedValue(false);
    await expect(applyRepairs([{ key: `notes:${id}`, tbl: 'notes', id, where: 'test note', changes: [], patch: { body: 'changed' }, before: { body: 'unchanged' } }])).rejects.toThrow(/safety copy/i);
    expect((await db.notes.get(id))?.body).toBe('unchanged');
  });

  it('rolls back the entire repair batch when a later record cannot be updated', async () => {
    const { db } = await import('../src/db/db');
    const { applyRepairs } = await import('../src/lib/dataRepair');
    const id = await db.notes.add({ kind: 'note', body: 'first', targets: [], tags: [], createdAt: 1, updatedAt: 1 } as never);
    const repairs = [
      { key: `notes:${id}`, tbl: 'notes' as const, id, where: 'first note', changes: [], patch: { body: 'changed' }, before: { body: 'first' } },
      { key: 'notes:999999', tbl: 'notes' as const, id: 999999, where: 'missing note', changes: [], patch: { body: 'changed' }, before: { body: 'missing' } },
    ];
    await expect(applyRepairs(repairs)).rejects.toThrow(/could not update/i);
    expect((await db.notes.get(id))?.body).toBe('first');
  });

  it('rolls back Undo when a later original record is missing', async () => {
    const { db } = await import('../src/db/db');
    const { undoRepairs } = await import('../src/lib/dataRepair');
    const id = await db.notes.add({ kind: 'note', body: 'repaired', targets: [], tags: [], createdAt: 1, updatedAt: 1 } as never);
    await expect(undoRepairs([
      { tbl: 'notes', id, before: { body: 'original' }, after: { body: 'repaired' } },
      { tbl: 'notes', id: 999999, before: { body: 'missing' }, after: { body: 'missing' } },
    ])).rejects.toThrow(/undo could not restore/i);
    expect((await db.notes.get(id))?.body).toBe('repaired');
  });


  it('refuses to apply a stale repair over an edit made after the check', async () => {
    const { db } = await import('../src/db/db');
    const { applyRepairs } = await import('../src/lib/dataRepair');
    const id = await db.notes.add({ kind: 'note', body: 'original', targets: [], tags: [], createdAt: 1, updatedAt: 1 } as never);
    await db.notes.update(id, { body: 'newer user edit' });
    await expect(applyRepairs([{ key: `notes:${id}`, tbl: 'notes', id, where: 'note', changes: [], patch: { body: 'repair' }, before: { body: 'original' } }])).rejects.toThrow(/changed after the check/i);
    expect((await db.notes.get(id))?.body).toBe('newer user edit');
  });

  it('refuses to Undo over a later user edit', async () => {
    const { db } = await import('../src/db/db');
    const { undoRepairs } = await import('../src/lib/dataRepair');
    const id = await db.notes.add({ kind: 'note', body: 'later edit', targets: [], tags: [], createdAt: 1, updatedAt: 1 } as never);
    await expect(undoRepairs([{ tbl: 'notes', id, before: { body: 'original' }, after: { body: 'repaired' } }])).rejects.toThrow(/changed after the fix/i);
    expect((await db.notes.get(id))?.body).toBe('later edit');
  });

  it('lists collection items that Recently deleted can bring back', async () => {
    const { restorableItems } = await import('../src/lib/dataRepair');
    const out = restorableItems([{ id: 1, name: 'C', items: [{ type: 'note', uid: 'u1' }, { type: 'note', uid: 'u2' }] }], [{ id: 7, tbl: 'notes', data: { uid: 'u1' } }, { id: 8, tbl: 'highlights', data: { uid: 'u2' } }]);
    expect(out).toEqual([{ collection: 'C', collectionId: 1, what: 'a note', trashId: 7 }]);
  });
});
