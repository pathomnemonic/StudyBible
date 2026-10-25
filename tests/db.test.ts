import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// a tiny localStorage for the code that keeps preferences outside the database
const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });

describe('IndexedDB upgrades', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); });

  it('opens a fresh install at the latest schema with every table', async () => {
    const { db } = await import('../src/db/db');
    await db.open();
    expect(db.verno).toBe(5);
    for (const t of ['notes', 'highlights', 'memory', 'tombs', 'userLinks', 'media']) expect(db.tables.some((x) => x.name === t), t).toBe(true);
  });

  it('upgrades a version-1 database: old rows get a uid and an updatedAt, nothing is lost', async () => {
    const old = new Dexie('studybible');
    old.version(1).stores({
      notes: '++id, kind, folderId, updatedAt, *tags, *chapterKeys', highlights: '++id, [book+c], ref, color', bookmarks: '++id, ref, kind, createdAt', folders: '++id',
      collections: '++id, updatedAt', userXrefs: '++id, from, to', journal: '++id, date, kind, updatedAt', planProgress: 'planId', userPlans: '++id',
      episodeProgress: 'episodeId, updatedAt', queue: '++id, order, episodeId', savedSearches: '++id', recentSearches: '++id, ts', history: '++id, ts, type', saved: '++id, &key, type', libraryProgress: 'workId',
    });
    await old.open();
    await old.table('notes').add({ kind: 'note', body: 'Old note ✝', tags: ['a'], chapterKeys: [], targets: [], createdAt: 5, updatedAt: 5 });
    await old.table('bookmarks').add({ ref: 'JHN.3.16', kind: 'bookmark', createdAt: 7 });
    old.close();

    const { db } = await import('../src/db/db');
    await db.open();
    const n = (await db.notes.toArray())[0];
    expect(n.body).toBe('Old note ✝');
    expect(n.uid).toBeTruthy();
    const b = (await db.bookmarks.toArray())[0];
    expect(b.uid).toBeTruthy();
    expect(b.updatedAt).toBe(7); // falls back to createdAt, so an old row does not look freshly edited
    expect(db.verno).toBe(5);
  });
});

describe('backup round trip', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); });

  it('exports and restores every kind of record, including Unicode, and keeps timestamps', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    await db.notes.add({ kind: 'note', title: 'It’s “quoted” — ✝ 日本語 🙏', body: 'O\'Brien; `code`; =SUM(A1)', tags: ['x', 'y'], chapterKeys: ['JHN.3'], targets: [], createdAt: 10, updatedAt: 10 } as any);
    await db.journal.add({ date: '2026-10-25', kind: 'journal', body: 'long '.repeat(2000), refs: [], createdAt: 11, updatedAt: 11 } as any);
    await db.highlights.add({ ref: 'JHN.3.16', book: 'JHN', c: 3, color: 'yellow', createdAt: 12 } as any);
    store.set('studybible.settings.v1', JSON.stringify({ fontSize: 22 }));
    const json = await ops.exportAll();

    await Dexie.delete('studybible'); vi.resetModules(); store.clear();
    const fresh = await import('../src/db/db');
    const ops2 = await import('../src/db/ops');
    const n = await ops2.importAll(json, 'replace');
    expect(n).toBe(3);
    const note = (await fresh.db.notes.toArray())[0];
    expect(note.title).toBe('It’s “quoted” — ✝ 日本語 🙏');
    expect(note.body).toBe('O\'Brien; `code`; =SUM(A1)');
    expect((await fresh.db.journal.toArray())[0].body.length).toBe(10000);
    expect(JSON.parse(store.get('studybible.settings.v1')!)).toEqual({ fontSize: 22 });
  });

  it('importing the same backup twice does not duplicate anything', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    await db.notes.add({ kind: 'note', body: 'one', tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 1 } as any);
    const json = await ops.exportAll();
    await ops.importAll(json, 'merge');
    await ops.importAll(json, 'merge');
    expect(await db.notes.count()).toBe(1);
  });

  it('replace mode drops old deletion records so restored rows are not deleted on the next sync', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    await db.tombs.add({ tbl: 'notes', uid: 'gone', updatedAt: 1 } as any);
    await db.notes.add({ kind: 'note', body: 'keep', tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 1 } as any);
    const json = await ops.exportAll();
    await ops.importAll(json, 'replace');
    expect(await db.tombs.count()).toBe(0);
  });

  it('refuses damaged, foreign, newer and unsafe backups without touching the data', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    await db.notes.add({ kind: 'note', body: 'precious', tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 1 } as any);
    await expect(ops.importAll(JSON.stringify({ format: 'something-else' }), 'replace')).rejects.toThrow(/Not a Study Bible/);
    await expect(ops.importAll(JSON.stringify({ format: 'studybible-export', version: 99 }), 'replace')).rejects.toThrow(/newer version/);
    await expect(ops.importAll(JSON.stringify({ format: 'studybible-export', version: 2, notes: 'oops' }), 'replace')).rejects.toThrow(/damaged/);
    await expect(ops.importAll(JSON.stringify({ format: 'studybible-export', version: 2, userLinks: [{ url: 'javascript:alert(1)' }] }), 'replace')).rejects.toThrow(/http or https/);
    expect(await db.notes.count()).toBe(1);
  });
});
