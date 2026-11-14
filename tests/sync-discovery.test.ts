// Sync discovery (audit item 1): the server being reachable is one fact, who is signed in is another.
// A failed session check must be retried; only a clear 401/403 means "nobody"; a deliberate sign-out must never be undone by a leftover server session.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class ApiErr extends Error { constructor(public status: number, m = 'x') { super(m); } }
const user = { id: 'u1', email: 'a@b.c', name: null, createdAt: 1 };
const calls = { health: 0, me: 0, logout: 0 };
let meImpl: () => Promise<any>;
let healthImpl: () => Promise<any>;
let logoutImpl: () => Promise<any>;

vi.mock('../src/sync/api', () => ({
  ApiError: ApiErr,
  api: {
    health: () => { calls.health++; return healthImpl(); },
    me: () => { calls.me++; return meImpl(); },
    logout: () => { calls.logout++; return logoutImpl(); },
    login: async () => ({ user }),
    register: async () => ({ user }),
    deleteAccount: async () => ({ ok: true }),
  },
}));
vi.mock('../src/sync/engine', () => ({
  localDataCount: async () => 0, resetSyncState: () => undefined, runSync: vi.fn(async () => ({ rejected: 0 })), touchSettings: () => undefined, wipeLocalUserData: async () => undefined,
}));
vi.mock('../src/lib/accountsFlag', () => ({ accountsEnabled: () => true, applyPreviewSwitch: () => undefined }));
vi.mock('../src/db/db', () => ({ syncFlags: { onLocalChange: null, applying: false } }));
vi.mock('../src/lib/store', () => ({ getSettings: () => ({ localOnly: false }), settingsChangeHooks: [] }));

const store = new Map<string, string>();
const handlers: Record<string, (() => void)[]> = {};
let visibility = 'visible';

async function load() {
  vi.resetModules();
  return import('../src/sync/state');
}
const flush = async (n = 6) => { for (let i = 0; i < n; i++) await Promise.resolve(); };

beforeEach(() => {
  vi.useFakeTimers();
  store.clear(); for (const k of Object.keys(handlers)) delete handlers[k];
  calls.health = calls.me = calls.logout = 0; visibility = 'visible';
  healthImpl = async () => ({ ok: true, registration: 'open' });
  meImpl = async () => ({ user });
  logoutImpl = async () => ({ ok: true });
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('location', { search: '', hash: '' });
  const add = (t: string, f: () => void) => { (handlers[t] ??= []).push(f); };
  vi.stubGlobal('window', { addEventListener: add, setInterval: (f: () => void, ms: number) => setInterval(f, ms), setTimeout: (f: () => void, ms: number) => setTimeout(f, ms), clearTimeout: (t: any) => clearTimeout(t) });
  vi.stubGlobal('document', { addEventListener: add, get visibilityState() { return visibility; } });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('session discovery', () => {
  it('finds the session on a normal start', async () => {
    const s = await load();
    await s.initSync();
    expect(s.getSync()).toMatchObject({ server: 'available', session: 'valid', user });
  });

  it('server up but /me answers 500 once: the session is found on the next try (was stuck signed out)', async () => {
    let n = 0; meImpl = async () => { if (n++ === 0) throw new ApiErr(500); return { user }; };
    const s = await load();
    await s.initSync();
    expect(s.getSync()).toMatchObject({ server: 'available', session: 'unknown', user: null });
    await s.retryDiscovery(); await flush();
    expect(s.getSync()).toMatchObject({ session: 'valid', user });
    expect(calls.me).toBe(2);
  });

  it('a timeout on /me (status 0) is retried too, and recovers by itself on the bounded back-off', async () => {
    let n = 0; meImpl = async () => { if (n++ < 2) throw new ApiErr(0); return { user }; };
    const s = await load();
    await s.initSync();
    expect(s.getSync().user).toBeNull();
    await vi.advanceTimersByTimeAsync(400_000); await flush();
    expect(s.getSync()).toMatchObject({ session: 'valid', user });
    expect(calls.me).toBe(3);
  });

  it('an unreadable /me answer is treated as a transient failure, not as "signed out for good"', async () => {
    let n = 0; meImpl = async () => (n++ === 0 ? { nope: true } : { user });
    const s = await load();
    await s.initSync();
    expect(s.getSync()).toMatchObject({ session: 'unknown', user: null });
    await s.retryDiscovery(); await flush();
    expect(s.getSync().user).toEqual(user);
  });

  it('a clear 401 means nobody is signed in, and is not hammered', async () => {
    meImpl = async () => { throw new ApiErr(401); };
    const s = await load();
    await s.initSync();
    expect(s.getSync()).toMatchObject({ server: 'available', session: 'none', user: null });
    await vi.advanceTimersByTimeAsync(300_000); await flush();
    expect(calls.me).toBe(1);
  });

  it('coming back online or returning to the tab looks again straight away', async () => {
    let n = 0; meImpl = async () => { if (n++ === 0) throw new ApiErr(503); return { user }; };
    const s = await load();
    await s.initSync();
    expect(s.getSync().user).toBeNull();
    handlers['online'].forEach((f) => f()); await flush();
    expect(s.getSync().user).toEqual(user);
  });

  it('a 401 after being signed out elsewhere is looked at again when the tab is shown (signed in from another tab)', async () => {
    let signedIn = false; meImpl = async () => { if (!signedIn) throw new ApiErr(401); return { user }; };
    const s = await load();
    await s.initSync();
    expect(s.getSync().session).toBe('none');
    signedIn = true;
    handlers['visibilitychange'].forEach((f) => f()); await flush();
    expect(s.getSync().user).toEqual(user);
  });

  it('server down at start, then up: found without a reload', async () => {
    let up = false; healthImpl = async () => { if (!up) throw new ApiErr(0); return { ok: true, registration: 'open' }; };
    const s = await load();
    await s.initSync();
    expect(s.getSync().server).toBe('unavailable');
    up = true;
    handlers['online'].forEach((f) => f()); await flush();
    expect(s.getSync()).toMatchObject({ server: 'available', user });
  });

  it('a static host answering 404 for /me is "no server here", not a session failure to retry', async () => {
    meImpl = async () => { throw new ApiErr(404); };
    const s = await load();
    await s.initSync();
    expect(s.getSync().server).toBe('unavailable');
  });
});

describe('deliberate sign-out and overlapping answers', () => {
  it('after signing out on purpose, a leftover server session (logout failed offline) never signs the person back in', async () => {
    const s = await load();
    await s.initSync();
    expect(s.getSync().user).toEqual(user);
    logoutImpl = async () => { throw new ApiErr(0); };
    await s.signOut(false);
    expect(s.getSync()).toMatchObject({ user: null, session: 'none' });
    // the server still honours the old cookie
    handlers['online'].forEach((f) => f()); handlers['visibilitychange'].forEach((f) => f()); await flush();
    await s.retryDiscovery(); await flush();
    expect(s.getSync().user).toBeNull();
    // ... and a fresh start of the app does not restore it either
    const s2 = await load(); await s2.initSync();
    expect(s2.getSync().user).toBeNull();
  });

  it('signing in again after a sign-out works and clears the sign-out memory', async () => {
    const s = await load();
    await s.initSync();
    await s.signOut(false);
    await s.signIn('a@b.c', 'pw', async () => 'merge');
    expect(s.getSync().user).toEqual(user);
    const s2 = await load(); await s2.initSync();
    expect(s2.getSync().user).toEqual(user);
  });

  it('a slow /me answer that arrives after a sign-out does not overwrite it (stale response)', async () => {
    let release!: () => void;
    meImpl = () => new Promise((res) => { release = () => res({ user }); });
    const s = await load();
    const starting = s.initSync(); await flush();
    await s.signOut(false);
    release(); await starting; await flush();
    expect(s.getSync()).toMatchObject({ user: null, session: 'none' });
  });

  it('overlapping retries make one request, not many', async () => {
    let release!: () => void;
    meImpl = () => new Promise((res) => { release = () => res({ user }); });
    const s = await load();
    const a = s.initSync(); await flush();
    void s.retryDiscovery(); void s.retryDiscovery(); void s.retryDiscovery(); await flush();
    expect(calls.me).toBe(1);
    release(); await a; await flush();
    expect(s.getSync().user).toEqual(user);
  });

  it('an expired session found while syncing is shown as signed out and is not silently restored by the next check', async () => {
    const s = await load();
    await s.initSync();
    const eng: any = await import('../src/sync/engine');
    eng.runSync.mockImplementationOnce(async () => { throw new ApiErr(401); });
    await s.syncNow(); await flush();
    expect(s.getSync()).toMatchObject({ user: null, session: 'none' });
  });
});
