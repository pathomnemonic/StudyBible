import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
// Google's sign-in script, faked: it hands out a token at once
vi.stubGlobal('window', { google: { accounts: { oauth2: { initTokenClient: (o: any) => ({ requestAccessToken: () => o.callback({ access_token: 'tok', expires_in: 3600 }) }), revoke: () => undefined } } }, dispatchEvent: () => true, addEventListener: () => undefined, removeEventListener: () => undefined });
vi.stubGlobal('navigator', { language: 'en-US', storage: undefined });

describe('Google Drive backup tells the truth', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); vi.restoreAllMocks(); });

  it('a failed upload is an error and does not record a successful backup', async () => {
    const { db } = await import('../src/db/db');
    await db.notes.add({ kind: 'note', body: 'precious', tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 1 } as any);
    const { getSettings } = await import('../src/lib/store');
    const { backupNow } = await import('../src/sync/drive');
    vi.stubGlobal('fetch', async (url: string, init: any = {}) => {
      if (init.method === 'POST' || init.method === 'PATCH') return new Response('boom', { status: 500 });
      return new Response(JSON.stringify({ files: [] }), { status: 200 }); // listing works, the upload does not
    });
    await expect(backupNow(true)).rejects.toThrow(/500/);
    expect(getSettings().drive.lastOk).toBe(0);
    expect(getSettings().lastBackup).toBe(0);
  });

  it('an expired Google session is reported, not swallowed', async () => {
    const { backupNow } = await import('../src/sync/drive');
    vi.stubGlobal('fetch', async () => new Response('', { status: 401 }));
    await expect(backupNow(false)).rejects.toThrow(/sign in again/i);
  });

  it('a good upload records the time', async () => {
    const { db } = await import('../src/db/db');
    await db.notes.add({ kind: 'note', body: 'precious', tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 1 } as any);
    const { getSettings } = await import('../src/lib/store');
    const { backupNow } = await import('../src/sync/drive');
    vi.stubGlobal('fetch', async (url: string, init: any = {}) => (init.method === 'POST' ? new Response('{}', { status: 200 }) : new Response(JSON.stringify({ files: [] }), { status: 200 })));
    await backupNow(true);
    expect(getSettings().drive.lastOk).toBeGreaterThan(0);
  });
});
