import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k), key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; } });
vi.stubGlobal('location', { origin: 'https://example.org', reload: () => undefined });

async function seed() {
  const { db } = await import('../src/db/db');
  await db.notes.add({ kind: 'note', title: 'Bread', body: 'text', targets: [], tags: [], chapterKeys: [], createdAt: 1, updatedAt: 1, uid: 'n-1' } as never);
  await db.notes.add({ kind: 'note', title: 'Other', body: 'not in a collection', targets: [], tags: [], chapterKeys: [], createdAt: 1, updatedAt: 1, uid: 'n-2' } as never);
  const item = { type: 'catechism', para: 1324 };
  await db.collections.add({ name: 'Eucharist', description: 'd', tags: ['mass'], items: [{ type: 'passage', ref: 'JHN.6.51-58' }, item, { type: 'note', uid: 'n-1' }], done: [JSON.stringify(item)], createdAt: 1, updatedAt: 5, uid: 'c-1' } as never);
  await db.collections.add({ name: 'Mercy', items: [{ type: 'passage', ref: 'LUK.15.1-10' }], createdAt: 1, updatedAt: 5, uid: 'c-2' } as never);
  return db;
}

describe('collections to a file and back', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); });

  it('one collection carries only itself and the notes it points at', async () => {
    await seed();
    const { exportCollections } = await import('../src/db/ops');
    const { db } = await import('../src/db/db');
    const c1 = (await db.collections.where('uid').equals('c-1').first())!;
    const f = JSON.parse(await exportCollections([c1.id!]));
    expect(f.format).toBe('studybible-export');
    expect(f.collections.map((c: any) => c.name)).toEqual(['Eucharist']);
    expect(f.notes.map((n: any) => n.uid)).toEqual(['n-1']);
  });

  it('assigns a stable sync uid to a legacy collection that has none', async () => {
    const ops = await import('../src/db/ops');
    const { db } = await import('../src/db/db');
    const file = JSON.stringify({
      format: 'studybible-export', version: 2,
      collections: [{ name: 'Legacy', items: [{ type: 'passage', ref: 'JHN.3.16' }] }],
    });
    await ops.importCollections(file);
    const row = await db.collections.toCollection().first();
    expect(row?.uid).toEqual(expect.any(String));
    expect(row?.uid?.length).toBeGreaterThan(0);
  });

  it('on a fresh device it brings items, done marks, tags and the pointed-at note', async () => {
    await seed();
    const { exportCollections } = await import('../src/db/ops');
    const file = await exportCollections();
    await Dexie.delete('studybible'); vi.resetModules();
    const ops = await import('../src/db/ops');
    const { db } = await import('../src/db/db');
    const r = await ops.importCollections(file);
    expect(r.added).toBe(2);
    const c = (await db.collections.where('uid').equals('c-1').first())!;
    expect(c.items).toHaveLength(3);
    expect(c.tags).toEqual(['mass']);
    expect(c.done).toHaveLength(1);
    expect((await db.notes.where('uid').equals('n-1').first())?.title).toBe('Bread');
    expect(await db.notes.count()).toBe(1);
  });

  it('importing the same file twice duplicates nothing; a copy with extra work is merged in', async () => {
    const db = await seed();
    const ops = await import('../src/db/ops');
    const file = await ops.exportCollections();
    const again = await ops.importCollections(file);
    expect(again).toMatchObject({ added: 0, merged: 2 });
    expect(await db.collections.count()).toBe(2);
    expect(await db.notes.count()).toBe(2);
    const c = (await db.collections.where('uid').equals('c-1').first())!;
    expect(c.items).toHaveLength(3);
    // the file's copy has one more item and one more tick that this device lacks
    const data = JSON.parse(file);
    const extra = { type: 'catechism', para: 1374 };
    data.collections[0].items.push(extra);
    data.collections[0].done.push(JSON.stringify(extra));
    data.collections[0].tags.push('Lent');
    await ops.importCollections(JSON.stringify(data));
    const m = (await db.collections.where('uid').equals('c-1').first())!;
    expect(m.items).toHaveLength(4);
    expect(m.done).toHaveLength(2);
    expect(m.tags).toEqual(['mass', 'Lent']);
  });

  it('stops a collection import when its safety copy cannot be written', async () => {
    const ops = await import('../src/db/ops');
    const { db } = await import('../src/db/db');
    await db.notes.add({ kind: 'note', body: 'existing', tags: [], targets: [], chapterKeys: [], createdAt: 1, updatedAt: 1, uid: 'existing' } as never);
    vi.spyOn(db.cache, 'put').mockRejectedValue(new Error('snapshot storage failed'));
    const file = {
      format: 'studybible-export', version: 2,
      notes: [{ kind: 'note', body: 'must not import', tags: [], targets: [], chapterKeys: [], createdAt: 2, updatedAt: 2, uid: 'incoming' }],
      collections: [{ name: 'Incoming', items: [] }],
    };
    await expect(ops.importCollections(JSON.stringify(file))).rejects.toThrow(/safety copy could not be made.*nothing was imported/i);
    expect(await db.notes.where('uid').equals('incoming').count()).toBe(0);
    expect(await db.collections.count()).toBe(0);
  });

  it('rolls back pointed-at records if a collection write fails', async () => {
    const ops = await import('../src/db/ops');
    const { db } = await import('../src/db/db');
    await db.notes.add({ kind: 'note', body: 'existing must survive', tags: [], targets: [], chapterKeys: [], createdAt: 1, updatedAt: 1, uid: 'existing-note' } as never);
    vi.spyOn(db.collections, 'add').mockRejectedValue(new Error('collection write failed'));
    const file = {
      format: 'studybible-export', version: 2,
      notes: [{ kind: 'note', body: 'must roll back', tags: [], targets: [], chapterKeys: [], createdAt: 2, updatedAt: 2, uid: 'atomic-note' }],
      collections: [{ name: 'Atomic', uid: 'atomic-collection', items: [], createdAt: 1, updatedAt: 1 }],
    };
    await expect(ops.importCollections(JSON.stringify(file))).rejects.toThrow(/collection write failed/);
    expect(await db.notes.where('uid').equals('existing-note').count()).toBe(1);
    expect(await db.notes.where('uid').equals('atomic-note').count()).toBe(0);
    expect(await db.collections.count()).toBe(0);
    expect(await db.cache.where('key').startsWith('snap:').count()).toBe(1);
  });

  it('rejects unsafe external URLs before importing pointed-at records', async () => {
    const ops = await import('../src/db/ops');
    const { db } = await import('../src/db/db');
    const file = {
      format: 'studybible-export', version: 2,
      notes: [{ kind: 'note', body: 'must not import', tags: [], targets: [], chapterKeys: [], createdAt: 1, updatedAt: 1, uid: 'unsafe-note' }],
      collections: [{ name: 'Unsafe', items: [{ type: 'link', url: 'javascript:alert(1)', label: 'bad' }] }],
    };
    await expect(ops.importCollections(JSON.stringify(file))).rejects.toThrow(/file is damaged.*nothing was imported/i);
    expect(await db.notes.count()).toBe(0);
  });

  it('rejects a collection with a malformed passage reference before importing linked records', async () => {
    const ops = await import('../src/db/ops');
    const { db } = await import('../src/db/db');
    const malformed = {
      format: 'studybible-export', version: 2,
      notes: [{ kind: 'note', body: 'must not partially import', tags: [], targets: [], chapterKeys: [], createdAt: 1, updatedAt: 1, uid: 'partial-note' }],
      collections: [{ name: 'Bad passage', items: [{ type: 'passage', ref: 'not-a-passage-id' }] }],
    };
    await expect(ops.importCollections(JSON.stringify(malformed))).rejects.toThrow(/file is damaged.*nothing was imported/i);
    expect(await db.notes.count()).toBe(0);
    expect(await db.collections.count()).toBe(0);
  });

  it('rejects a malformed collection before importing its pointed-at records', async () => {
    const ops = await import('../src/db/ops');
    const { db } = await import('../src/db/db');
    const malformed = {
      format: 'studybible-export', version: 2,
      notes: [{ kind: 'note', body: 'must not partially import', tags: [], targets: [], chapterKeys: [], createdAt: 1, updatedAt: 1, uid: 'partial-note' }],
      collections: [null],
    };
    await expect(ops.importCollections(JSON.stringify(malformed))).rejects.toThrow(/file is damaged.*nothing was imported/i);
    expect(await db.notes.count()).toBe(0);
    expect(await db.collections.count()).toBe(0);
  });

  it('refuses to be used as a replace-everything restore, and rejects other files', async () => {
    await seed();
    const ops = await import('../src/db/ops');
    const { db } = await import('../src/db/db');
    const file = await ops.exportCollections();
    await expect(ops.importAll(file, 'replace')).rejects.toThrow(/only some collections/);
    expect(await db.notes.count()).toBe(2);
    await expect(ops.importCollections('{"format":"nope"}')).rejects.toThrow();
    await expect(ops.importCollections('not json')).rejects.toThrow();
  });
});
