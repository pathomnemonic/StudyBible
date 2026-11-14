import { useSyncExternalStore } from 'react';
import { api, ApiError, type AccountUser } from './api';
import { syncFlags } from '../db/db';
import { getSettings, settingsChangeHooks } from '../lib/store';
import { accountsEnabled, applyPreviewSwitch } from '../lib/accountsFlag';
import { localDataCount, resetSyncState, runSync, touchSettings, wipeLocalUserData } from './engine';

export type ServerState = 'unknown' | 'available' | 'unavailable';
export type SyncStatus = 'signed-out' | 'idle' | 'syncing' | 'error' | 'offline';

/** What is known about who is signed in, apart from whether the server can be reached: 'unknown' while a check is pending or failed in a way that may pass. */
export type SessionState = 'unknown' | 'none' | 'valid';

export interface SyncState {
  server: ServerState;
  session: SessionState;
  registration: 'open' | 'closed';
  user: AccountUser | null;
  status: SyncStatus;
  lastSyncAt: number | null;
  error: string | null;
}

let state: SyncState = { server: 'unknown', session: 'unknown', registration: 'open', user: null, status: 'signed-out', lastSyncAt: null, error: null };
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

/** A plain-language reason for a failed sync, by kind of failure. */
export function explain(e: any): string {
  if (e instanceof ApiError) {
    if (e.status === 0) return 'The sync server cannot be reached. Your changes are safe on this device and will be sent when it is back.';
    if (e.status === 429) return 'The server asked us to slow down. Syncing will try again in a few minutes.';
    if (e.status === 413) return 'Some of your data is too large for the server to accept in one go. Try shortening very long notes.';
    if (e.status === 426) return 'This app is newer than the sync server. Ask whoever runs the server to update it.';
    if (e.status >= 500) return 'The sync server had a problem. Your changes are safe on this device and will be retried.';
  }
  return e?.message ?? 'Sync failed.';
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
      epoch++;
      emit({ session: 'none', user: null, status: 'signed-out', error: 'You were signed out (your session expired, or you signed out from another device). Everything is still on this device; sign in again to carry on syncing.' });
    } else emit({ status: e instanceof ApiError && e.status === 0 ? 'offline' : 'error', error: explain(e) });
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
/** Set when the person chose to sign out here: a leftover server session (the sign-out call may have failed offline) must never sign them back in. */
const SIGNED_OUT = 'studybible.sync.signedOut';
const intentionallySignedOut = () => { try { return localStorage.getItem(SIGNED_OUT) === '1'; } catch { return false; } };
const setSignedOut = (v: boolean) => { try { if (v) localStorage.setItem(SIGNED_OUT, '1'); else localStorage.removeItem(SIGNED_OUT); } catch { /* ignore */ } };
const lastUser = () => {
  try {
    return localStorage.getItem(LAST_USER);
  } catch {
    return null;
  }
};

/** Call once at start-up: probe the server and resume a session if there is one. */
let started = false;
export async function initSync() {
  // accounts are switched off unless the build turns them on (src/lib/accountsFlag.ts): never look for a server
  applyPreviewSwitch(location.search + (location.hash.includes('?') ? location.hash.slice(location.hash.indexOf('?')) : ''));
  if (!accountsEnabled()) { emit({ server: 'unavailable', status: 'signed-out' }); return; }
  // React's strict mode runs start-up twice in development; listeners and timers must only be installed once
  if (started) return;
  started = true;
  // this build was made for a host with no sync server (GitHub Pages): never look for one
  if (getSettings().localOnly || (import.meta.env.VITE_LOCAL_ONLY === '1' && !import.meta.env.VITE_API_BASE)) {
    // local-only mode: never contact a server
    emit({ server: 'unavailable', status: 'signed-out' });
    return;
  }
  syncFlags.onLocalChange = () => scheduleSync();
  settingsChangeHooks.push(() => {
    if (state.user && !syncFlags.applying) noteSettingsChanged();
  });
  // listeners go in first, so a server that is down at start-up is found later without reloading the app
  // coming back online, or returning to the app, is a reason to look again straight away, whatever the back-off says
  window.addEventListener('online', () => { nextTry = 0; sessionNextTry = 0; void discover(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { sessionNextTry = 0; if (sessionKnown === 'none') sessionKnown = 'unknown'; void discover(); } });
  window.setInterval(() => document.visibilityState === 'visible' && void discover(), 90_000);
  await discover();
}

let discovering = false;
let failures = 0;
let nextTry = 0;
let epoch = 0; // bumped whenever who is signed in is decided (sign in, sign out, expiry): an answer to an older question is dropped
let sessionKnown: SessionState = 'unknown';
let sessionFailures = 0;
let sessionNextTry = 0;
let retryTimer: number | undefined;
const backoff = (n: number, capMs: number) => Math.min(capMs, 5_000 * 2 ** Math.min(n, 7)) * (0.75 + Math.random() * 0.5);

/** Ask the server who is signed in. Only a clear "no" (401/403) is remembered as "nobody": a timeout, a 5xx or an unreadable answer is retried. */
async function checkSession() {
  if (intentionallySignedOut()) { sessionKnown = 'none'; emit({ session: 'none', user: null, status: 'signed-out' }); return; }
  if (sessionKnown === 'none' || Date.now() < sessionNextTry) return;
  const mine = epoch;
  try {
    const { user } = await api.me();
    if (mine !== epoch) return;
    if (!user || typeof user.id !== 'string') throw new ApiError(502, 'The sync server sent an answer this app cannot read.');
    sessionKnown = 'valid'; sessionFailures = 0;
    emit({ session: 'valid', user, status: 'idle', error: null });
    remember(user.id);
    void syncNow();
  } catch (e: any) {
    if (mine !== epoch) return;
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      sessionKnown = 'none'; sessionFailures = 0;
      emit({ session: 'none', user: null, status: 'signed-out' });
    } else if (e instanceof ApiError && e.status === 404) {
      emit({ server: 'unavailable', session: 'unknown' }); // an app server that is not the sync server (a static host)
    } else {
      sessionFailures++;
      const wait = backoff(sessionFailures, 300_000);
      sessionNextTry = Date.now() + wait;
      emit({ session: 'unknown', user: null, status: 'signed-out' });
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => void discover(), wait + 50);
    }
  }
}

/** Find the server and resume a session, or (when the server is already known) just sync. Failed probes back off, with jitter, up to ten minutes. */
async function discover() {
  if (discovering) return;
  if (state.server === 'available') {
    if (state.user) return void syncNow();
    // the server is up but nobody is known to be signed in: the session is checked again (on its own back-off), never assumed
    discovering = true;
    try { await checkSession(); } finally { discovering = false; }
    return;
  }
  if (Date.now() < nextTry) return;
  discovering = true;
  try {
    const h = await api.health();
    failures = 0;
    emit({ server: 'available', registration: h.registration });
    await checkSession();
  } catch {
    failures++;
    nextTry = Date.now() + backoff(failures, 600_000);
    emit({ server: 'unavailable' });
  } finally {
    discovering = false;
  }
}
/** Try again now, whatever the back-off says (for a "retry" button). */
export const retryDiscovery = () => { nextTry = 0; sessionNextTry = 0; if (!intentionallySignedOut() && sessionKnown === 'none') sessionKnown = 'unknown'; return discover(); };

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
  epoch++; setSignedOut(false); sessionKnown = 'valid';
  emit({ session: 'valid', user, status: 'idle', error: null });
  await syncNow();
}

export async function signIn(email: string, password: string, decide: (n: number) => Promise<AuthDecision>, code?: string) {
  const { user } = await api.login(email, password, code);
  await afterAuth(user, decide);
}

export async function signUp(email: string, password: string, name: string | undefined, decide: (n: number) => Promise<AuthDecision>, invite?: string) {
  const { user } = await api.register(email, password, name, invite);
  await afterAuth(user, decide);
}

export async function signOut(clearLocal: boolean) {
  const u = state.user;
  epoch++; sessionKnown = 'none'; setSignedOut(true);
  try {
    await api.logout();
  } catch {
    /* offline: session will simply expire */
  }
  if (u) resetSyncState(u.id);
  if (clearLocal) await wipeLocalUserData();
  emit({ session: 'none', user: null, status: 'signed-out', lastSyncAt: null });
}

export async function deleteAccount(password: string, clearLocal: boolean) {
  await api.deleteAccount(password);
  const u = state.user;
  if (u) resetSyncState(u.id);
  if (clearLocal) await wipeLocalUserData();
  epoch++; sessionKnown = 'none'; setSignedOut(true);
  emit({ session: 'none', user: null, status: 'signed-out', lastSyncAt: null });
}

/** Settings changes made on this device are stamped so they sync. */
export function noteSettingsChanged() {
  touchSettings(state.user?.id ?? null);
  scheduleSync();
}
void getSettings;

/** the signed-in person changed their name or email: show it everywhere */
export function updateUser(user: AccountUser) {
  emit({ user });
}
