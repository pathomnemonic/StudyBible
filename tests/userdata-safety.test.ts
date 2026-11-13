import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
const note = (body: string) => ({ kind: 'note', body, tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 1 }) as any;

describe('your writing survives', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); vi.restoreAllMocks(); });

  it('closing and reopening the browser keeps notes, edits and deletions', async () => {
    let { db } = await import('../src/db/db');
    const a = await db.notes.add(note('first'));
    const b = await db.notes.add(note('second'));
    await db.notes.update(a, { body: 'first, edited' });
    await db.notes.delete(b);
    db.close(); vi.resetModules(); // the browser is closed and opened again
    ({ db } = await import('../src/db/db'));
    const all = await db.notes.toArray();
    expect(all.map((n) => n.body)).toEqual(['first, edited']);
  });

  it('restores an older (version 1) backup: rows without ids or times get them', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    const old = { format: 'studybible-export', version: 1, notes: [{ kind: 'note', body: 'from long ago', tags: [], chapterKeys: [], targets: [], createdAt: 5 }] };
    expect(await ops.importAll(JSON.stringify(old), 'merge')).toBeGreaterThan(0);
    const n = (await db.notes.toArray())[0];
    expect(n.body).toBe('from long ago');
    expect(n.uid).toBeTruthy();
    expect(n.updatedAt).toBe(5);
  });

  it('refuses an oversized file before opening it', async () => {
    const ops = await import('../src/db/ops');
    await expect(ops.importAll('x'.repeat(ops.MAX_IMPORT_CHARS + 1), 'replace')).rejects.toThrow(/far larger/);
  });

  it('a restore that hits a full disk part-way changes nothing, and says so', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    await db.notes.add(note('precious'));
    await db.journal.add({ date: '2026-01-01', kind: 'entry', body: 'private', createdAt: 1, updatedAt: 1 } as any);
    const backup = JSON.stringify({ format: 'studybible-export', version: 2, notes: [note('a'), note('b'), note('c')], journal: [{ date: '2026-02-02', kind: 'entry', body: 'x', createdAt: 1, updatedAt: 1 }] });
    const proto = Object.getPrototypeOf(db.notes) as any;
    const real = proto.add;
    let n = 0;
    vi.spyOn(proto, 'add').mockImplementation(function (this: any, ...a: any[]) {
      if (this.name === 'notes' && ++n === 2) return Promise.reject(Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError' }));
      return real.apply(this, a);
    });
    await expect(ops.importAll(backup, 'replace')).rejects.toThrow();
    vi.restoreAllMocks();
    expect((await db.notes.toArray()).map((x) => x.body)).toEqual(['precious']); // nothing was lost
    expect(await db.journal.count()).toBe(1);
  });

  it('a safety copy that cannot be stored reports the failure instead of pretending', async () => {
    const { db } = await import('../src/db/db');
    const safety = await import('../src/lib/safety');
    await db.notes.add(note('keep me'));
    vi.spyOn(db.cache, 'put').mockRejectedValue(Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError' }));
    await expect(safety.snapshotIfDue(true)).rejects.toThrow();
  });
});
