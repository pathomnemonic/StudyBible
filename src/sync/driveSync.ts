import { db } from '../db/db';
import { getSettings, settingsChangeHooks, updateSettings } from '../lib/store';
import { syncFlags } from '../db/db';
import { driveSyncEnabled } from '../lib/driveSyncFlag';
import { clientId, driveAvailable } from './drive';
import { realDriveFiles } from './driveFiles';
import { COMPACT_AT, DriveSyncBackend, newDeviceId, type SeenStore } from './driveSyncBackend';
import { runSync, touchSettings } from './engine';
import { getSync } from './state';

/**
 * Keeps this device's notes, highlights, bookmarks, journal, plans, progress and some settings in step with the reader's other devices, through the hidden app
 * folder of their own Google Drive. It uses the same engine as account sync, with Drive standing in for the server (driveSyncBackend.ts), and it is exclusive
 * with an account: while signed in to an account, that account is the sync.
 *
 * Off unless the build has the switch (src/lib/driveSyncFlag.ts) and the reader has connected Drive and turned this on. Google's sign-in gives a one-hour key and no
 * way to renew it without a tap, so a background sync that finds the key gone stops and says "reconnect"; a tap on Sync now renews it.
 */
const USER = 'drive'; // the engine keeps its per-source bookmarks under this name
const DEVICE_KEY = 'studybible.drive.device';
const SEEN_KEY = 'studybible.drive.seen';

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };
export function deviceId(): string { let d = read(DEVICE_KEY); if (!d) { d = newDeviceId(); write(DEVICE_KEY, d); } return d; }
const seenStore: SeenStore = {
  load: () => { try { return new Set<string>(JSON.parse(read(SEEN_KEY) ?? '[]')); } catch { return new Set(); } },
  save: (s) => write(SEEN_KEY, JSON.stringify([...s])),
};

export const driveSyncOn = () => driveSyncEnabled() && driveAvailable() && getSettings().drive.connected && getSettings().drive.sync === true;
export const accountIsSyncing = () => !!getSync().user;

let running: Promise<{ pushed: number; pulled: number }> | null = null;

/** One round: send what changed here, take what changed elsewhere. `interactive` may open Google's sign-in window (only from a tap). */
export function driveSyncNow(interactive = false): Promise<{ pushed: number; pulled: number }> {
  if (running) return running;
  running = (async () => {
    try {
      if (!driveSyncEnabled()) throw new Error('Syncing through Google Drive is not switched on in this copy of the app.');
      if (!clientId()) throw new Error('Google Drive is not set up in this copy of the app.');
      if (accountIsSyncing()) throw new Error('You are signed in to an account, which already syncs your library. Sign out of it to sync through Google Drive instead.');
      const backend = new DriveSyncBackend(realDriveFiles(interactive), deviceId(), seenStore);
      const r = await runSync(USER, backend);
      // keep the log short; a failure here changes nothing the reader can see
      try { if ((await backend.logLength()) >= COMPACT_AT) await backend.compact(); } catch { /* try again next time */ }
      updateSettings({ drive: { ...getSettings().drive, syncOk: Date.now(), syncError: '' } });
      return { pushed: r.pushed, pulled: r.pulled };
    } catch (e: any) {
      updateSettings({ drive: { ...getSettings().drive, syncError: e?.message ?? 'Sync did not work.' } });
      throw e;
    } finally { running = null; }
  })();
  return running;
}

/** Turn it on: connect Drive if needed (a tap), send everything on this device, and take what is already there. */
export async function enableDriveSync(): Promise<{ pushed: number; pulled: number }> {
  updateSettings({ drive: { ...getSettings().drive, sync: true, syncError: '' } });
  touchSettings(USER);
  return driveSyncNow(true);
}

/** Turn it off. The copies on Drive stay unless `deleteRemote` is true. */
export async function disableDriveSync(deleteRemote: boolean): Promise<number> {
  let n = 0;
  if (deleteRemote) n = await new DriveSyncBackend(realDriveFiles(true), deviceId(), seenStore).deleteAll();
  updateSettings({ drive: { ...getSettings().drive, sync: false, syncError: '' } });
  return n;
}

// ---- keep it current: shortly after a change, when the app comes back to the front, and when it opens
let timer = 0;
let started = false;
export function startDriveSync() {
  if (started || !driveSyncEnabled()) return;
  started = true;
  const run = () => { if (driveSyncOn() && !accountIsSyncing() && navigator.onLine !== false) void driveSyncNow(false).catch(() => undefined); };
  const schedule = (delay = 20_000) => { window.clearTimeout(timer); timer = window.setTimeout(run, delay); };
  for (const t of ['notes', 'highlights', 'bookmarks', 'journal', 'memory', 'planProgress', 'userLinks', 'media', 'folders', 'collections', 'userXrefs']) {
    const table = (db as any)[t];
    if (!table?.hook) continue;
    for (const h of ['creating', 'updating', 'deleting']) table.hook(h, () => { if (driveSyncOn() && !syncFlags.applying) setTimeout(() => schedule(), 0); });
  }
  settingsChangeHooks.push(() => { if (driveSyncOn() && !syncFlags.applying) { touchSettings(USER); schedule(); } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') schedule(1500); });
  window.addEventListener('online', () => schedule(1500));
  schedule(3000);
}
