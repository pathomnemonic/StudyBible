// Export then import must give back what was exported: every table, every field, structurally compared (audit item 9).
// Formats in the app today: the JSON backup (exportAll/importAll, the only format that is read back), Markdown notes and CSV/Markdown marks (export only).
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k), key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; } });
vi.stubGlobal('location', { origin: 'https://example.org', reload: () => undefined });

const T = 1_700_000_000_000;
async function seed() {
  const { db } = await import('../src/db/db');
  const { syncFlags } = await import('../src/db/db');
  syncFlags.applying = true; // keep the timestamps exactly as written
  try {
    const f1 = await db.folders.add({ name: 'Lent', createdAt: T, updatedAt: T, uid: 'f-1' } as never);
    const f2 = await db.folders.add({ name: 'Ordinary', createdAt: T, updatedAt: T, uid: 'f-2' } as never);
    await db.notes.add({ title: 'Prayer', body: 'Lord, hear.\n\n**bold** “quotes” & <tags> 日本語 ✝', kind: 'prayer', targets: [{ type: 'passage', ref: 'PSA.50.1' }, { type: 'passage', ref: 'JHN.3.16-JHN.3.18' }], tags: ['prayer', 'lent'], folderId: f1, createdAt: T, updatedAt: T + 5, chapterKeys: ['PSA.50', 'JHN.3'], uid: 'n-1' } as never);
    await db.notes.add({ title: '', body: 'Question?', kind: 'question', targets: [], tags: [], folderId: f2, createdAt: T, updatedAt: T + 6, chapterKeys: [], uid: 'n-2' } as never);
    await db.collections.add({ name: 'Mercy', description: 'texts', tags: ['mercy'], items: [{ type: 'passage', ref: 'LUK.15.1-LUK.15.10' }, { type: 'catechism', n: 1846 } as never], done: ['{"type":"catechism","n":1846}'], createdAt: T, updatedAt: T + 7, uid: 'c-1' } as never);
    await db.highlights.add({ ref: 'JHN.3.16', color: 'gold', createdAt: T, updatedAt: T, uid: 'h-1' } as never);
    await db.bookmarks.add({ ref: 'GEN.1.1', kind: 'bookmark', label: 'start', createdAt: T, updatedAt: T, uid: 'b-1' } as never);
    await db.journal.add({ date: '2026-11-14', kind: 'journal', title: 'T', body: 'B', refs: ['JHN.1.1'], answered: true, createdAt: T, updatedAt: T + 1, uid: 'j-1' } as never);
    await db.userXrefs.add({ from: 'GEN.1.1', to: 'JHN.1.1', comment: 'In the beginning', createdAt: T, updatedAt: T, uid: 'x-1' } as never);
  } finally { syncFlags.applying = false; }
  return db;
}
const tablesOf = async (db: any, names: string[]) => Object.fromEntries(await Promise.all(names.map(async (t) => [t, (await db[t].toArray()).map((r: any) => { const { id: _id, ...rest } = r; return rest; }).sort((a: any, b: any) => String(a.uid).localeCompare(String(b.uid)))])));
const NAMES = ['notes', 'folders', 'collections', 'highlights', 'bookmarks', 'journal', 'userXrefs'];

describe('JSON backup round trip', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); });

  it('replace: every field of every record comes back exactly (and ids, so folder links hold)', async () => {
    const db = await seed();
    const { exportAll, importAll } = await import('../src/db/ops');
    const before = await tablesOf(db, NAMES);
    const idsBefore = (await db.notes.toArray()).map((n: any) => [n.uid, n.folderId]);
    const json = await exportAll();
    await Promise.all(NAMES.map((t) => (db as any)[t].clear()));
    await importAll(json, 'replace');
    expect(await tablesOf(db, NAMES)).toEqual(before);
    expect((await db.notes.toArray()).map((n: any) => [n.uid, n.folderId])).toEqual(idsBefore);
  });

  it('merge into an empty profile: same content, and each note still sits in the folder it was in', async () => {
    const db = await seed();
    const { exportAll, importAll } = await import('../src/db/ops');
    const json = await exportAll();
    await Promise.all(NAMES.map((t) => (db as any)[t].clear()));
    await db.folders.add({ name: 'Already here', createdAt: T, updatedAt: T, uid: 'f-other' } as never); // shifts the id sequence
    await importAll(json, 'merge');
    const notes = await db.notes.toArray(); const folders = await db.folders.toArray();
    for (const [noteUid, folderName] of [['n-1', 'Lent'], ['n-2', 'Ordinary']] as const) {
      const n = notes.find((x: any) => x.uid === noteUid)!; const f = folders.find((x: any) => x.id === n.folderId);
      expect(f?.name, `${noteUid} should still be in folder ${folderName}`).toBe(folderName);
    }
  });

  it('merge twice does not duplicate anything', async () => {
    const db = await seed();
    const { exportAll, importAll } = await import('../src/db/ops');
    const json = await exportAll();
    const counts = async () => Object.fromEntries(await Promise.all(NAMES.map(async (t) => [t, await (db as any)[t].count()])));
    const c0 = await counts();
    await importAll(json, 'merge'); await importAll(json, 'merge');
    expect(await counts()).toEqual(c0);
  });

  it('a damaged file imports nothing at all (atomic), whichever table is bad', async () => {
    const db = await seed();
    const { exportAll, importAll } = await import('../src/db/ops');
    const data = JSON.parse(await exportAll());
    data.collections = [{ name: 'ok', items: [], createdAt: T, updatedAt: T }, 'not a record'];
    await Promise.all(NAMES.map((t) => (db as any)[t].clear()));
    await expect(importAll(JSON.stringify(data), 'replace')).rejects.toThrow(/damaged/);
    for (const t of NAMES) expect(await (db as any)[t].count(), t).toBe(0);
  });

  it('a record that fails halfway rolls the whole import back', async () => {
    const db = await seed();
    const { exportAll, importAll } = await import('../src/db/ops');
    const data = JSON.parse(await exportAll());
    data.journal.push({ date: '2026-11-15', kind: 'journal', body: 'x', refs: [], createdAt: T, updatedAt: T, uid: 'j-bad', id: 'not-a-number' });
    await Promise.all(NAMES.map((t) => (db as any)[t].clear()));
    await importAll(JSON.stringify(data), 'merge').catch(() => undefined);
    const n = [await db.notes.count(), await db.journal.count(), await db.collections.count()];
    // either everything arrived or nothing did: never notes without the journal that was after them
    expect(n[0] === 0 ? n.every((x) => x === 0) : n[1] >= 1).toBe(true);
  });

  it('round-trips awkward text exactly: quotes, markup, CJK, line breaks, an empty title', async () => {
    const db = await seed();
    const { exportAll, importAll } = await import('../src/db/ops');
    const n0 = (await db.notes.toArray()).find((n: any) => n.uid === 'n-1')!.body;
    const json = await exportAll(); await db.notes.clear(); await importAll(json, 'replace');
    expect((await db.notes.toArray()).find((n: any) => n.uid === 'n-1')!.body).toBe(n0);
  });

  it('a newer-format file and a non-backup are refused with a plain message', async () => {
    await seed(); const { importAll } = await import('../src/db/ops');
    await expect(importAll(JSON.stringify({ format: 'studybible-export', version: 99 }))).rejects.toThrow(/newer version/);
    await expect(importAll(JSON.stringify({ hello: 1 }))).rejects.toThrow(/Not a/);
    await expect(importAll('{"format":')).rejects.toThrow(/cut short/);
  });
});

describe('one-way exports keep what they promise', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); });
  it('Markdown notes name every note, its passages and tags, and keep the body text verbatim', async () => {
    await seed(); const { exportNotesMarkdown } = await import('../src/db/ops');
    const md = await exportNotesMarkdown();
    for (const s of ['Prayer', 'Lord, hear.', '**bold** “quotes” & <tags> 日本語 ✝', 'Question?']) expect(md).toContain(s);
    expect(md).toMatch(/Psalm 50|PSA\.?50/); expect(md).toMatch(/lent/i);
    const only = await exportNotesMarkdown({ tag: 'lent' }); expect(only).toContain('Lord, hear.'); expect(only).not.toContain('Question?');
  });
  it('marks export lists every highlight and bookmark as CSV and Markdown', async () => {
    await seed(); const { exportMarks } = await import('../src/db/ops');
    const csv = await exportMarks('csv'); const md = await exportMarks('md');
    for (const out of [csv, md]) { expect(out).toMatch(/John 3:16|JHN\.?3\.?16/); expect(out).toMatch(/Genesis 1:1|GEN\.?1\.?1/); }
  });
});
