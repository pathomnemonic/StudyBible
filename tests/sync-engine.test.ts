import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../server/app';
import { openDb } from '../server/db';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });

let server: Server;
let base = '';
let cookie = '';
beforeAll(async () => {
  server = createApp({ db: openDb(':memory:'), registration: 'open', sessionDays: 1, allowedOrigins: [], secureCookies: false, registerLimitPerHour: 1000 });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const real = globalThis.fetch;
  // the app's client calls same-origin paths; point them at the test server and carry the session cookie
  vi.stubGlobal('fetch', async (url: string, init: any = {}) => {
    const res = await real(url.startsWith('/') ? base + url : url, { ...init, headers: { ...(init.headers ?? {}), ...(cookie ? { Cookie: cookie } : {}) } });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0].endsWith('=') ? '' : sc.split(';')[0];
    return res;
  });
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

const freshDevice = async () => { await Dexie.delete('studybible'); vi.resetModules(); for (const k of [...store.keys()]) if (k.startsWith('studybible.sync')) store.delete(k); };

describe('sync engine against the real server', () => {
  it('restores notes, highlights and journal entries on a new device, and survives many large notes', async () => {
    const { api } = await import('../src/sync/api');
    const user = (await api.register('sync-engine@example.com', 'correct horse battery', 'T')) as any;
    const uid = user.user?.id ?? user.id;
    {
      const { db } = await import('../src/db/db');
      const { runSync } = await import('../src/sync/engine');
      await db.notes.add({ kind: 'note', title: 'Hello ✝', body: 'first', tags: ['t'], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 1 } as any);
      await db.highlights.add({ ref: 'JHN.3.16', book: 'JHN', c: 3, color: 'yellow', createdAt: 2 } as any);
      await db.journal.add({ date: '2026-10-25', kind: 'journal', body: 'prayed', refs: [], createdAt: 3, updatedAt: 3 } as any);
      // 30 notes of ~150 KB each: more than one request-sized batch
      for (let i = 0; i < 30; i++) await db.notes.add({ kind: 'note', title: `big ${i}`, body: 'x'.repeat(150_000), tags: [], chapterKeys: [], targets: [], createdAt: 10 + i, updatedAt: 10 + i } as any);
      const r = await runSync(uid);
      expect(r.rejected).toBe(0);
      expect(r.pushed).toBe(33);
      db.close();
    }
    await freshDevice(); // the browser's data was cleared
    {
      const { db } = await import('../src/db/db');
      const { runSync } = await import('../src/sync/engine');
      const r = await runSync(uid);
      expect(r.pulled).toBeGreaterThanOrEqual(33);
      expect(await db.notes.count()).toBe(31);
      expect(((await db.notes.toArray()).find((x) => x.title === 'Hello ✝'))?.body).toBe('first');
      expect(await db.highlights.count()).toBe(1);
      expect(await db.journal.count()).toBe(1);
      // a second sync with nothing changed sends nothing
      expect((await runSync(uid)).pushed).toBe(0);
      // a deletion travels as a tombstone
      const n = ((await db.notes.toArray()).find((x) => x.title === 'Hello ✝'))!;
      await db.notes.delete(n.id!);
      await new Promise((r) => setTimeout(r, 400));
      const del = await runSync(uid);
      expect(del.rejected).toBe(0);
      db.close();
    }
    await freshDevice();
    {
      const { db } = await import('../src/db/db');
      const { runSync } = await import('../src/sync/engine');
      await runSync(uid);
      expect((await db.notes.toArray()).filter((x) => x.title === 'Hello ✝').length).toBe(0);
      expect(await db.notes.count()).toBe(30);
    }
  }, 60000);

  it('keeps both versions when two devices edit the same note before syncing', async () => {
    await freshDevice();
    const { api } = await import('../src/sync/api');
    const uid = ((await api.login('sync-engine@example.com', 'correct horse battery')) as any).user.id;
    const { db } = await import('../src/db/db');
    const { runSync } = await import('../src/sync/engine');
    await runSync(uid); // device B has the 30 notes
    const mine = (await db.notes.toArray())[0];
    // this device edits the note, unsynced
    await db.notes.update(mine.id!, { body: 'edited on this device' });
    // another device edited the same note and synced first, with a later time
    const cur = (await api.sync(0, [])).cursor;
    await api.sync(cur, [{ table: 'notes', uid: mine.uid!, updatedAt: Date.now() + 1000, payload: { ...mine, id: undefined, body: 'edited on the other device', updatedAt: Date.now() + 1000 } } as any]);
    await runSync(uid);
    const bodies = (await db.notes.toArray()).map((n) => n.body);
    expect(bodies).toContain('edited on the other device');
    expect(bodies).toContain('edited on this device');
  }, 60000);

  it('recovers from a network failure between batches: nothing lost, nothing duplicated, nothing left pending', async () => {
    await freshDevice();
    const { api } = await import('../src/sync/api');
    const user = (await api.register('sync-fail@example.com', 'correct horse battery', 'F')) as any;
    const uid = user.user.id;
    const { db } = await import('../src/db/db');
    const { runSync, pendingCount } = await import('../src/sync/engine');
    for (let i = 0; i < 25; i++) await db.notes.add({ kind: 'note', title: `n${i}`, body: 'y'.repeat(120_000), tags: [], chapterKeys: [], targets: [], createdAt: i, updatedAt: i } as any);
    // the connection drops on the second request
    const real = globalThis.fetch;
    let calls = 0;
    vi.stubGlobal('fetch', async (...a: any[]) => { if (++calls === 2) throw new TypeError('network down'); return (real as any)(...a); });
    await expect(runSync(uid)).rejects.toThrow(/reach/i);
    expect(await pendingCount(uid)).toBeGreaterThan(0); // the failed sync did not mark anything as sent
    vi.stubGlobal('fetch', real);
    const r = await runSync(uid);
    expect(r.rejected).toBe(0);
    expect(await pendingCount(uid)).toBe(0);
    // a clean device sees exactly 25 notes
    db.close();
    await freshDevice();
    const again = await import('../src/db/db');
    const eng = await import('../src/sync/engine');
    await eng.runSync(uid);
    expect(await again.db.notes.count()).toBe(25);
  }, 60000);

  it('reports rejected records and keeps them queued instead of calling the sync complete', async () => {
    await freshDevice();
    const { api } = await import('../src/sync/api');
    const uid = ((await api.login('sync-fail@example.com', 'correct horse battery')) as any).user.id;
    const { db } = await import('../src/db/db');
    const { runSync, pendingCount } = await import('../src/sync/engine');
    await runSync(uid);
    // a bookmark with a shape the server refuses
    await db.userLinks.add({ ref: 'JHN.3.16', url: 'javascript:alert(1)', title: 'bad', createdAt: 1 } as any);
    const r = await runSync(uid);
    expect(r.rejected).toBe(1);
    expect(await pendingCount(uid)).toBeGreaterThan(0);
  }, 60000);
});
