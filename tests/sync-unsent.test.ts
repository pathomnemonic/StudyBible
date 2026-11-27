// The sync engine must not guess what is unsent from clocks, and must not silence the reader's own writes while it works.
// Each test here failed before the change described in docs/CYCLE4_LOG.md (items S1 to S6).
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../server/app';
import { openDb } from '../server/db';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k), key: () => null, length: 0 });

let server: Server;
let cookie = '';
beforeAll(async () => {
  server = createApp({ db: openDb(':memory:'), registration: 'open', sessionDays: 1, allowedOrigins: [], secureCookies: false, registerLimitPerHour: 1000 });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const real = globalThis.fetch;
  vi.stubGlobal('fetch', async (url: string, init: any = {}) => {
    const res = await real(url.startsWith('/') ? base + url : url, { ...init, headers: { ...(init.headers ?? {}), ...(cookie ? { Cookie: cookie } : {}) } });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0].endsWith('=') ? '' : sc.split(';')[0];
    return res;
  });
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

let seq = 0;
/** a new account on a device with nothing on it */
const fresh = async () => {
  await Dexie.delete('studybible'); vi.resetModules(); store.clear(); cookie = '';
  const { api } = await import('../src/sync/api');
  const uid = ((await api.register(`unsent-${++seq}@example.com`, 'correct horse battery', 'U')) as any).user.id as string;
  const dbm = await import('../src/db/db');
  const eng = await import('../src/sync/engine');
  return { api, uid, db: dbm.db, dbm, eng };
};
const note = (body: string, extra: Record<string, unknown> = {}) => ({ kind: 'note', title: '', body, tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 1, ...extra }) as any;
const wire = (uid: string, body: string, updatedAt: number) => ({ table: 'notes', uid, updatedAt, payload: { kind: 'note', title: '', body, tags: [], chapterKeys: [], targets: [], createdAt: 1 } });
/** wait until an assertion about committed side effects (tombstones, trash) holds, instead of sleeping a fixed 30 ms and hoping */
const until = async (fn: () => Promise<void>) => { await vi.waitFor(fn, { timeout: 2000, interval: 10 }); };

describe('S1: what the reader writes while a sync is being applied is still a local change', () => {
  it('a note created, a note edited and a note deleted during an apply are stamped, marked unsent, tombstoned and kept in Recently deleted', async () => {
    const { db, eng } = await fresh();
    const editId = await db.notes.add(note('to edit'));
    const delId = await db.notes.add(note('to delete'));
    const before = (await db.notes.get(editId))!;
    await db.notes.update(editId, { _unsent: 0 } as any); // pretend it is in step with the server (the hook re-marks it; reset quietly below)
    const { quietly, quietTables } = await import('../src/db/db');
    await quietly(quietTables(), async () => { await db.notes.where('id').anyOf(editId, delId).modify({ _unsent: 0 } as any); });
    // a large page from the server, applied while the reader keeps working
    const page = Array.from({ length: 300 }, (_, i) => wire(`remote-${i}`, `from another device ${i}`, 5000 + i));
    const applying = eng.applyRemote('u', page as any);
    const created = db.notes.add(note('written during the sync'));
    const edited = db.notes.update(editId, { body: 'edited during the sync' });
    const deleted = db.notes.delete(delId);
    await Promise.all([applying, created, edited, deleted]);
    await until(async () => {
      expect(await db.tombs.filter((t) => t.tbl === 'notes' && t._unsent === 1).count()).toBe(1);
      expect(await db.trash.count()).toBe(1);
    });
    const mine = (await db.notes.toArray()).find((n) => n.body === 'written during the sync')!;
    expect(mine.uid, 'a note made during a sync must get an identity, or it can never sync').toBeTruthy();
    expect(mine._unsent).toBe(1);
    const e = (await db.notes.get(editId))!;
    expect(e._unsent).toBe(1);
    expect(e.updatedAt).toBeGreaterThan(before.updatedAt);
    expect(await db.tombs.filter((t) => t.tbl === 'notes' && t._unsent === 1).count(), 'the deletion must leave a tombstone').toBe(1);
    expect(await db.trash.count(), 'the deleted note must be restorable').toBe(1);
    // and the page itself arrived whole, as the server sent it
    const remote = (await db.notes.toArray()).filter((n) => n.uid?.startsWith('remote-'));
    expect(remote.length).toBe(300);
    expect(remote.every((n) => n._unsent === 0 && n.updatedAt >= 5000 && n.updatedAt < 5300)).toBe(true);
  });

  it('a page is applied whole or not at all', async () => {
    const { db, eng } = await fresh();
    const bad = [wire('ok-1', 'fine', 10), { table: 'saved', uid: 's1', updatedAt: 10, payload: { key: 'k', type: 'reading', label: 'a', createdAt: 1 } }, { table: 'saved', uid: 's2', updatedAt: 10, payload: { key: 'k', type: 'reading', label: 'same unique key', createdAt: 1 } }];
    await db.saved.add({ key: 'other', type: 'reading', label: 'x', createdAt: 1 } as any);
    // the second "saved" row has the same unique key under another uid; it is matched to the first by key, so this page is fine
    await eng.applyRemote('u', bad as any);
    expect(await db.notes.count()).toBe(1);
    expect((await db.notes.where('uid').equals('ok-1').first())!.body).toBe('fine'); // the note itself, not only the count
    // and the two saved rows that share the key k have become the one row that holds it
    expect((await db.saved.toArray()).filter((s: any) => s.key === 'k').length).toBe(1);
    expect(await db.saved.count()).toBe(2); // that row, plus the unrelated one seeded above
    // a page that truly cannot be written (a row the store refuses) leaves nothing behind
    const impossible = [wire('ok-2', 'must not stay', 10), { table: 'planProgress', uid: 'p', updatedAt: 10, payload: { startedAt: 1 } }];
    await expect(eng.applyRemote('u', impossible as any)).rejects.toBeTruthy();
    expect((await db.notes.toArray()).map((n) => n.uid)).toEqual(['ok-1']);
  });
});

describe('S2: another device whose clock runs ahead', () => {
  it('its second edit replaces its first without a needless "other version" copy, and its deletion is not undone', async () => {
    const { api, uid, db, eng } = await fresh();
    await eng.runSync(uid); // this device has pushed once: its last push time is "now"
    const ahead = Date.now() + 3 * 60 * 1000; // the other device is three minutes fast
    let cur = (await api.sync(0, [])).cursor;
    await api.sync(cur, [wire('n-skew', 'first version from the fast device', ahead)] as any);
    await eng.runSync(uid);
    expect((await db.notes.toArray()).map((n) => n.body)).toEqual(['first version from the fast device']);
    await api.sync(0, [wire('n-skew', 'second version from the fast device', ahead + 1000)] as any);
    await eng.runSync(uid);
    expect((await db.notes.toArray()).map((n) => n.body), 'nothing was edited here, so there is nothing to keep a copy of').toEqual(['second version from the fast device']);
    await api.sync(0, [{ table: 'notes', uid: 'n-skew', updatedAt: ahead + 2000, deleted: true, payload: {} }] as any);
    await eng.runSync(uid);
    expect(await db.notes.count(), 'a note deleted on the other device must not come back from here').toBe(0);
    void cur;
  });
});

describe('S3: this device\'s clock is set back', () => {
  it('an edit made after the clock went back is still newer than what it replaces, and is sent', async () => {
    const { api, uid, db, eng } = await fresh();
    const id = await db.notes.add(note('before'));
    await eng.runSync(uid);
    const was = (await db.notes.get(id))!;
    const realNow = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => realNow - 3600_000); // an hour back
    await db.notes.update(id, { body: 'written after the clock was set back' });
    const now = (await db.notes.get(id))!;
    expect(now.updatedAt).toBeGreaterThan(was.updatedAt);
    vi.restoreAllMocks(); // the server in this test shares the process clock; only the device's clock was wrong
    const r = await eng.runSync(uid);
    expect(r.pushed).toBe(1);
    const all = (await api.sync(0, [])).changes.filter((c) => c.table === 'notes');
    expect(all.map((c) => c.payload.body)).toEqual(['written after the clock was set back']);
  });

  it('a deletion is never older than the row it deletes', async () => {
    const { db } = await fresh();
    const id = await db.notes.add(note('x'));
    const row = (await db.notes.get(id))!;
    const realNow = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => realNow - 3600_000);
    await db.notes.delete(id);
    vi.restoreAllMocks();
    await until(async () => { expect(await db.tombs.count()).toBe(1); });
    const tomb = (await db.tombs.toArray())[0];
    expect(tomb.updatedAt).toBeGreaterThan(row.updatedAt);
  });
});

describe('S4: a backup imported while signed in', () => {
  it('sends what it brought in, however old the dates in the file are', async () => {
    const { api, uid, db, eng } = await fresh();
    await db.notes.add(note('already here'));
    await eng.runSync(uid);
    const { importAll } = await import('../src/db/ops');
    const backup = { format: 'studybible-export', version: 2, notes: [{ uid: 'old-1', kind: 'note', title: 'From 2019', body: 'an old note', tags: [], targets: [], chapterKeys: [], createdAt: 1546300800000, updatedAt: 1546300800000 }] };
    await importAll(JSON.stringify(backup), 'merge');
    expect((await db.notes.where('uid').equals('old-1').first())!.updatedAt, 'the file\'s own date is kept').toBe(1546300800000);
    const r = await eng.runSync(uid);
    expect(r.pushed).toBe(1);
    const onServer = (await api.sync(0, [])).changes.filter((c) => c.table === 'notes').map((c) => c.uid);
    expect(onServer).toContain('old-1');
    expect((await eng.runSync(uid)).pushed, 'and only once').toBe(0);
  });

  it('the exported file does not carry this device\'s sent/unsent bookkeeping', async () => {
    const { db } = await fresh();
    await db.notes.add(note('x'));
    await db.notes.delete((await db.notes.toArray())[0].id!);
    await db.notes.add(note('y'));
    // the tombstone must actually be recorded before exporting, or the check below could pass on an empty export
    await until(async () => { expect(await db.tombs.count()).toBe(1); });
    const { exportAll } = await import('../src/db/ops');
    expect(await exportAll()).not.toContain('_unsent');
  });
});

describe('S5: a deletion that was rolled back', () => {
  it('leaves no tombstone and no copy in Recently deleted', async () => {
    const { db } = await fresh();
    const id = await db.notes.add(note('still here'));
    await expect(db.transaction('rw', db.notes, async () => { await db.notes.delete(id); throw new Error('changed my mind'); })).rejects.toThrow('changed my mind');
    // an absence can only be trusted once the commit pipeline has run past the rolled-back delete:
    // a second delete, committed, lands its tombstone first (the callbacks run in transaction order)
    const probe = await db.notes.add(note('probe'));
    await db.notes.delete(probe);
    await until(async () => { expect(await db.tombs.count()).toBe(1); });
    expect((await db.notes.toArray()).map((n) => n.body)).toEqual(['still here']);
    const tombs = await db.tombs.toArray();
    expect(tombs.length, 'a tombstone here would delete the note on every other device').toBe(1);
    expect(tombs[0].uid).not.toBe((await db.notes.toArray())[0].uid); // the one tombstone is the probe's, not the rolled-back note's
    expect(await db.trash.count()).toBe(1); // likewise, only the probe is restorable
  });

  it('a deletion inside a larger transaction is recorded once that transaction commits', async () => {
    const { db } = await fresh();
    const id = await db.notes.add(note('going'));
    await db.transaction('rw', db.notes, db.bookmarks, async () => { await db.transaction('rw', db.notes, async () => { await db.notes.delete(id); }); await db.bookmarks.add({ ref: 'GEN.1.1', kind: 'bookmark', createdAt: 1 } as any); });
    await until(async () => { expect(await db.tombs.count()).toBe(1); expect(await db.trash.count()).toBe(1); });
  });
});

describe('S6: signing in again on a device that already holds the account\'s data', () => {
  it('a note changed elsewhere meanwhile simply updates; a note changed here meanwhile is kept', async () => {
    const { api, uid, db, eng } = await fresh();
    const a = await db.notes.add(note('untouched here'));
    const b = await db.notes.add(note('edited here while signed out'));
    await eng.runSync(uid);
    const ua = (await db.notes.get(a))!.uid!, ub = (await db.notes.get(b))!.uid!;
    eng.resetSyncState(uid); // signed out
    await db.notes.update(b, { body: 'my offline edit' });
    const later = Date.now() + 2000;
    await api.sync(0, [wire(ua, 'changed on the other device', later), wire(ub, 'also changed on the other device', later)] as any);
    await eng.runSync(uid); // signed in again
    const bodies = (await db.notes.toArray()).map((n) => n.body).sort();
    expect(bodies).toEqual(['also changed on the other device', 'changed on the other device', 'my offline edit']);
    expect((await db.notes.toArray()).filter((n) => n.uid!.includes('~conflict~')).length).toBe(1);
  });
});

describe('unsent bookkeeping', () => {
  it('a row edited again while its push is in the air stays unsent', async () => {
    const { api, uid, db, eng } = await fresh();
    const id = await db.notes.add(note('v1'));
    const realSync = api.sync;
    let once = true;
    vi.spyOn(api, 'sync').mockImplementation(async (cursor: number, changes: any[]) => {
      const res = await realSync(cursor, changes);
      if (once && changes.length) { once = false; await db.notes.update(id, { body: 'v2, typed while the request was out' }); }
      return res;
    });
    expect((await eng.runSync(uid)).pushed).toBe(1);
    expect((await db.notes.get(id))!._unsent).toBe(1);
    expect((await eng.runSync(uid)).pushed).toBe(1);
    expect((await db.notes.get(id))!._unsent).toBe(0);
    vi.restoreAllMocks();
    expect((await api.sync(0, [])).changes.find((c) => c.table === 'notes')!.payload.body).toBe('v2, typed while the request was out');
  });

  it('joined tags go back to the server so every device ends with the same note', async () => {
    const { api, uid, db, eng } = await fresh();
    const id = await db.notes.add(note('same text', { tags: ['here'] }));
    await eng.runSync(uid);
    const u = (await db.notes.get(id))!.uid!;
    await db.notes.update(id, { tags: ['here', 'local-tag'] });
    const later = Date.now() + 2000;
    await api.sync(0, [{ table: 'notes', uid: u, updatedAt: later, payload: { kind: 'note', title: '', body: 'same text', tags: ['here', 'remote-tag'], chapterKeys: [], targets: [], createdAt: 1 } }] as any);
    await eng.runSync(uid);
    expect((await db.notes.get(id))!.tags.sort()).toEqual(['here', 'local-tag', 'remote-tag']);
    await eng.runSync(uid);
    const server = (await api.sync(0, [])).changes.find((c) => c.uid === u)!;
    expect([...server.payload.tags].sort()).toEqual(['here', 'local-tag', 'remote-tag']);
    expect(server.updatedAt).toBeGreaterThan(later);
    expect(server.payload._unsent).toBeUndefined();
  });

  it('rows from before the marker existed are classified once, by the last push time', async () => {
    const { uid, db, dbm, eng } = await fresh();
    await db.notes.add(note('sent long ago'));
    await eng.runSync(uid);
    const lastPush = Number(store.get(`studybible.sync.${uid}.lastPush`));
    await dbm.quietly(dbm.quietTables(), async () => {
      await db.notes.toCollection().modify((r: any) => { delete r._unsent; });
      await db.notes.add({ ...note('legacy, edited after the last push'), uid: 'legacy-new', updatedAt: lastPush + 5 });
    });
    const r = await eng.runSync(uid);
    expect(r.pushed).toBe(1);
    expect((await db.notes.toArray()).every((n) => n._unsent === 0)).toBe(true);
  });
});
