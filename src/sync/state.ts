import { useSyncExternalStore } from 'react';
import { api, ApiError, type AccountUser } from './api';
import { syncFlags } from '../db/db';
import { getSettings, settingsChangeHooks } from '../lib/store';
import { localDataCount, resetSyncState, runSync, touchSettings, wipeLocalUserData } from './engine';

export type ServerState = 'unknown' | 'available' | 'unavailable';
export type SyncStatus = 'signed-out' | 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  server: ServerState;
  registration: 'open' | 'closed';
  user: AccountUser | null;
  status: SyncStatus;
  lastSyncAt: number | null;
  error: string | null;
}

let state: SyncState = { server: 'unknown', registration: 'open', user: null, status: 'signed-out', lastSyncAt: null, error: null };
const listeners = new Set<() => void>();
const emit = (patch: Partial<SyncState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export function useSync(): SyncState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}
export const getSync = () => state;

let timer: number | undefined;
let running = false;
let again = false;

export function scheduleSync(delay = 2500) {
  if (!state.user) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncNow(), delay);
}

export async function syncNow(): Promise<void> {
  const user = state.user;
  if (!user) return;
  if (!navigator.onLine) return emit({ status: 'offline' });
  if (running) {
    again = true;
    return;
  }
  running = true;
  emit({ status: 'syncing', error: null });
  try {
    const r = await runSync(user.id);
    if (r.rejected) emit({ status: 'error', lastSyncAt: Date.now(), error: `${r.rejected} change${r.rejected === 1 ? ' was' : 's were'} not accepted by the server and will be retried. Your data is still on this device.` });
    else emit({ status: 'idle', lastSyncAt: Date.now() });
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 401) {
      emit({ user: null, status: 'signed-out', error: 'Your session expired. Sign in again to keep syncing.' });
    } else emit({ status: e instanceof ApiError && e.status === 0 ? 'offline' : 'error', error: e.message ?? 'Sync failed.' });
  } finally {
    running = false;
    if (again) {
      again = false;
      scheduleSync(500);
    }
  }
}

const LAST_USER = 'studybible.sync.lastUser';
const remember = (id: string) => {
  try {
    localStorage.setItem(LAST_USER, id);
  } catch {
    /* ignore */
  }
};
const lastUser = () => {
  try {
    return localStorage.getItem(LAST_USER);
  } catch {
    return null;
  }
};

/** Call once at start-up: probe the server and resume a session if there is one. */
export async function initSync() {
  if (getSettings().localOnly) {
    // local-only mode: never contact a server
    emit({ server: 'unavailable', status: 'signed-out' });
    return;
  }
  syncFlags.onLocalChange = () => scheduleSync();
  settingsChangeHooks.push(() => {
    if (state.user && !syncFlags.applying) noteSettingsChanged();
  });
  // listeners go in first, so a server that is down at start-up is found later without reloading the app
  window.addEventListener('online', () => void discover());
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void discover());
  window.setInterval(() => document.visibilityState === 'visible' && void discover(), 90_000);
  await discover();
}

let discovering = false;
let failures = 0;
let nextTry = 0;
/** Find the server and resume a session, or (when the server is already known) just sync. Failed probes back off, with jitter, up to ten minutes. */
async function discover() {
  if (state.server === 'available') return void syncNow();
  if (discovering || Date.now() < nextTry) return;
  discovering = true;
  try {
    const h = await api.health();
    failures = 0;
    emit({ server: 'available', registration: h.registration });
    try {
      const { user } = await api.me();
      emit({ user, status: 'idle' });
      remember(user.id);
      void syncNow();
    } catch {
      emit({ user: null, status: 'signed-out' });
    }
  } catch {
    failures++;
    nextTry = Date.now() + Math.min(600_000, 5_000 * 2 ** Math.min(failures, 7)) * (0.75 + Math.random() * 0.5);
    emit({ server: 'unavailable' });
  } finally {
    discovering = false;
  }
}
/** Try again now, whatever the back-off says (for a "retry" button). */
export const retryDiscovery = () => { nextTry = 0; return discover(); };

export type AuthDecision = 'merge' | 'wipe';

/** After a successful login/registration: decide what to do with data already on this device, then sync. */
async function afterAuth(user: AccountUser, decide: (n: number) => Promise<AuthDecision>) {
  const prev = lastUser();
  if (prev && prev !== user.id) {
    const n = await localDataCount();
    if (n > 0 && (await decide(n)) === 'wipe') {
      await wipeLocalUserData();
      resetSyncState(user.id);
    }
  }
  remember(user.id);
  touchSettings(user.id);
  emit({ user, status: 'idle', error: null });
  await syncNow();
}

export async function signIn(email: string, password: string, decide: (n: number) => Promise<AuthDecision>) {
  const { user } = await api.login(email, password);
  await afterAuth(user, decide);
}

export async function signUp(email: string, password: string, name: string | undefined, decide: (n: number) => Promise<AuthDecision>) {
  const { user } = await api.register(email, password, name);
  await afterAuth(user, decide);
}

export async function signOut(clearLocal: boolean) {
  const u = state.user;
  try {
    await api.logout();
  } catch {
    /* offline: session will simply expire */
  }
  if (u) resetSyncState(u.id);
  if (clearLocal) await wipeLocalUserData();
  emit({ user: null, status: 'signed-out', lastSyncAt: null });
}

export async function deleteAccount(password: string, clearLocal: boolean) {
  await api.deleteAccount(password);
  const u = state.user;
  if (u) resetSyncState(u.id);
  if (clearLocal) await wipeLocalUserData();
  emit({ user: null, status: 'signed-out', lastSyncAt: null });
}

/** Settings changes made on this device are stamped so they sync. */
export function noteSettingsChanged() {
  touchSettings(state.user?.id ?? null);
  scheduleSync();
}
void getSettings;
