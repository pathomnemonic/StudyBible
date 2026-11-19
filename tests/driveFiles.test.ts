import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubGlobal('window', { google: { accounts: { oauth2: { initTokenClient: (o: any) => ({ requestAccessToken: () => o.callback({ access_token: 'tok', expires_in: 3600 }) }) } } } });
vi.stubGlobal('navigator', { language: 'en-US', storage: undefined });

describe('the real Drive file access', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); vi.restoreAllMocks(); });

  it('lists every page, only our files, with creation times as numbers, from the hidden app folder', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url);
      const second = url.includes('pageToken=p2');
      return new Response(JSON.stringify(second
        ? { files: [{ id: '3', name: 'sbs-chg-aaaa-xyz.json', createdTime: '2026-01-02T00:00:00.000Z', size: '20' }] }
        : { nextPageToken: 'p2', files: [{ id: '1', name: 'sbs-chg-aaaa-abc.json', createdTime: '2026-01-01T00:00:00.000Z', size: '10' }, { id: '2', name: 'studybible-backup-20260101-0000.json', createdTime: '2026-01-01T00:00:00.000Z' }] }), { status: 200 });
    });
    const { realDriveFiles } = await import('../src/sync/driveFiles');
    const { getSettings, updateSettings } = await import('../src/lib/store');
    updateSettings({ drive: { ...getSettings().drive, clientId: 'cid' } });
    const files = await realDriveFiles().list();
    expect(files.map((f) => f.id)).toEqual(['1', '3']); // the backup file is not ours
    expect(files[0].createdTime).toBe(Date.parse('2026-01-01T00:00:00.000Z'));
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('spaces=appDataFolder');
  });

  it('creates a file inside the app folder only, and reads it back by id', async () => {
    let sent: { url: string; init: any } | null = null;
    vi.stubGlobal('fetch', async (url: string, init: any = {}) => {
      if (init.method === 'POST') { sent = { url, init }; return new Response(JSON.stringify({ id: 'n1', name: 'sbs-chg-a-b.json', createdTime: '2026-01-01T00:00:00Z', size: '5' }), { status: 200 }); }
      return new Response('{"v":1}', { status: 200 });
    });
    const { realDriveFiles } = await import('../src/sync/driveFiles');
    const { getSettings, updateSettings } = await import('../src/lib/store');
    updateSettings({ drive: { ...getSettings().drive, clientId: 'cid' } });
    const f = await realDriveFiles().create('sbs-chg-a-b.json', '{"v":1}');
    expect(f.id).toBe('n1');
    expect(sent!.url).toContain('/upload/drive/v3/files');
    expect(sent!.init.body).toContain('"parents":["appDataFolder"]');
    expect(sent!.init.headers.Authorization).toBe('Bearer tok');
    expect(await realDriveFiles().read('n1')).toBe('{"v":1}');
  });
});

describe('the switch', () => {
  beforeEach(() => { vi.resetModules(); store.clear(); });
  it('is off in a normal build, and the address cannot turn it on', async () => {
    const { driveSyncEnabled, applyDriveSyncPreviewSwitch } = await import('../src/lib/driveSyncFlag');
    expect(driveSyncEnabled()).toBe(false);
    applyDriveSyncPreviewSwitch('?drivesync=on');
    expect(driveSyncEnabled()).toBe(false);
  });
  it('refuses to sync, with a plain message, while the switch is off', async () => {
    const { driveSyncNow, driveSyncOn } = await import('../src/sync/driveSync');
    expect(driveSyncOn()).toBe(false);
    await expect(driveSyncNow(false)).rejects.toThrow(/not switched on/);
  });
});
