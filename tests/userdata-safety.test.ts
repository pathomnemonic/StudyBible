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

  it('restores a snapshot as a point-in-time replacement, including older versions of existing notes', async () => {
    const { db } = await import('../src/db/db');
    const safety = await import('../src/lib/safety');
    await db.notes.add({ ...note('current, later edit'), updatedAt: 200 });
    const snapshot = {
      format: 'studybible-export', version: 2,
      notes: [{ ...note('snapshot version'), uid: 'snapshot-note', updatedAt: 10 }],
    };
    await db.cache.put({ key: 'snap:fixture', value: JSON.stringify(snapshot), ts: 10 });
    await safety.restoreSnapshot('snap:fixture');
    expect((await db.notes.toArray()).map((row) => row.body)).toEqual(['snapshot version']);
    expect(await db.cache.where('key').startsWith('snap:').count()).toBeGreaterThan(1);
  });

  it('does not replace existing data when its required safety copy fails', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    const safety = await import('../src/lib/safety');
    await db.notes.add(note('precious'));
    vi.spyOn(safety, 'snapshotIfDue').mockRejectedValue(new Error('quota exceeded'));
    const backup = JSON.stringify({ format: 'studybible-export', version: 2, notes: [note('incoming')] });
    await expect(ops.importAll(backup, 'replace')).rejects.toThrow(/safety copy could not be made.*no data was replaced/i);
    expect((await db.notes.toArray()).map((x) => x.body)).toEqual(['precious']);
  });

  it('a merge does not roll keyed progress backwards, but accepts newer records and new rows', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    await db.episodeProgress.put({ episodeId: 'episode-old', position: 90, completed: false, heard: 140, updatedAt: 50 } as never);
    await db.planProgress.put({ planId: 'plan-1', startedAt: 1, status: 'active', done: [0], offsetDays: 0, updatedAt: 50 } as never);
    await db.libraryProgress.put({ workId: 'work-1', section: '3', scroll: 60, status: 'reading', updatedAt: 50 } as never);
    const backup = {
      format: 'studybible-export', version: 2,
      episodeProgress: [
        { episodeId: 'episode-old', position: 10, completed: false, heard: 20, updatedAt: 20 },
        { episodeId: 'episode-new', position: 15, completed: false, heard: 15, updatedAt: 10 },
      ],
      planProgress: [{ planId: 'plan-1', startedAt: 1, status: 'active', done: [0, 1, 2], offsetDays: 0, updatedAt: 80 }],
      libraryProgress: [{ workId: 'work-1', section: '1', scroll: 5, status: 'want', updatedAt: 20 }],
    };
    await ops.importAll(JSON.stringify(backup), 'merge');
    expect(await db.episodeProgress.get('episode-old')).toMatchObject({ position: 90, heard: 140 });
    expect(await db.episodeProgress.get('episode-new')).toMatchObject({ position: 15, heard: 15 });
    expect(await db.planProgress.get('plan-1')).toMatchObject({ done: [0, 1, 2], updatedAt: 80 });
    expect(await db.libraryProgress.get('work-1')).toMatchObject({ section: '3', scroll: 60, status: 'reading' });
  });

  it('tombstones keyed progress omitted by a replace restore so sync cannot resurrect it', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    await db.episodeProgress.put({ episodeId: 'episode-removed', position: 90, completed: false, heard: 140, updatedAt: 50 } as never);
    await db.planProgress.put({ planId: 'plan-removed', startedAt: 1, status: 'active', done: [0], offsetDays: 0, updatedAt: 50 } as never);
    const backup = JSON.stringify({ format: 'studybible-export', version: 2, notes: [] });
    await ops.importAll(backup, 'replace');
    expect(await db.episodeProgress.get('episode-removed')).toBeUndefined();
    expect(await db.planProgress.get('plan-removed')).toBeUndefined();
    expect(await db.tombs.filter((row) => row.tbl === 'episodeProgress' && row.uid === 'episode-removed').count()).toBe(1);
    expect(await db.tombs.filter((row) => row.tbl === 'planProgress' && row.uid === 'plan-removed').count()).toBe(1);
  });

  it('uses the natural key as the sync uid when restoring keyed progress', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    const backup = JSON.stringify({
      format: 'studybible-export', version: 2,
      episodeProgress: [{ episodeId: 'episode-kept', uid: 'stale-uid', position: 12, completed: false, heard: 12, updatedAt: 10 }],
    });
    await ops.importAll(backup, 'replace');
    expect(await db.episodeProgress.get('episode-kept')).toMatchObject({ uid: 'episode-kept', position: 12 });
    expect(await db.tombs.filter((row) => row.tbl === 'episodeProgress' && row.uid === 'episode-kept').count()).toBe(0);
  });

  it('rolls back a replace if its deletion tombstones cannot be written', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    await db.episodeProgress.put({ episodeId: 'keep-local', position: 40, completed: false, heard: 80, updatedAt: 30 } as never);
    const backup = JSON.stringify({ format: 'studybible-export', version: 2, notes: [] });
    vi.spyOn(db.tombs, 'bulkAdd').mockRejectedValue(new Error('tombstone write failed'));
    await expect(ops.importAll(backup, 'replace')).rejects.toThrow(/tombstone write failed/);
    expect(await db.episodeProgress.get('keep-local')).toMatchObject({ position: 40, heard: 80 });
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
