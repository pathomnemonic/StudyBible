import 'fake-indexeddb/auto';
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
    expect(repairPassageId('Jn 6:51-58')?.length).toBe(1);
    expect(repairPassageId('not a passage at all')).toBeNull();
    expect(repairPassageId('')).toBeNull();
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

  it('lists collection items that Recently deleted can bring back', async () => {
    const { restorableItems } = await import('../src/lib/dataRepair');
    const out = restorableItems([{ id: 1, name: 'C', items: [{ type: 'note', uid: 'u1' }, { type: 'note', uid: 'u2' }] }], [{ id: 7, tbl: 'notes', data: { uid: 'u1' } }, { id: 8, tbl: 'highlights', data: { uid: 'u2' } }]);
    expect(out).toEqual([{ collection: 'C', collectionId: 1, what: 'a note', trashId: 7 }]);
  });
});
