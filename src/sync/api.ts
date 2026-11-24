/** Thin client for the Study Bible sync server (see server/). Same-origin by default; set VITE_API_BASE for a separate origin. */
const BASE: string = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

import { ApiError } from './errors';
import { createSupabaseApi, supabaseConfigured } from './supabaseApi';
export { ApiError };

const TIMEOUT_MS = 20_000;

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  // a request that never answers must not hold the app's "checking" state for ever
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : 0;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: BASE ? 'include' : 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-StudyBible': '1' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl?.signal,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the sync server.');
  } finally {
    clearTimeout(timer as number);
  }
  let text: string;
  try { text = await res.text(); } catch { throw new ApiError(0, 'The sync server stopped answering.'); }
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // A static host answers /api/* with the app's index.html: treat that as "no server".
    throw new ApiError(res.status === 200 ? 404 : res.status, 'No sync server is available here.');
  }
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status}).`);
  return data as T;
}

/** A service the server lets people sign in with (empty until the operator turns it on). */
export interface SignInProvider { id: string; name: string }
/** Where the browser goes to start signing in with a provider (a full page visit, not a fetch: the provider takes over the page). */
export const providerStartUrl = (id: string, link = false) => `${BASE}/api/auth/oauth/${encodeURIComponent(id)}/start${link ? '?link=1' : ''}`;

export interface AccountUser {
  /** true when the person is signed in but has not created a StudyBible account yet (the account is made on purpose, in StudyBible) */
  needsAccount?: boolean;
  id: string;
  email: string;
  name: string | null;
  createdAt: number;
}

export interface DeviceSession {
  id: string;
  current: boolean;
  createdAt: number;
  lastSeen: number;
  expiresAt: number;
  device: string;
}

export interface WireChange {
  table: string;
  uid: string;
  updatedAt: number;
  deleted?: boolean;
  payload: any;
}

/** the self-hosted server's API (server/); used unless the build is configured for Supabase */
const serverApi = {
  health: () => call<{ ok: boolean; registration: 'open' | 'closed'; oauth?: SignInProvider[] }>('GET', '/api/health'),
  identities: () => call<{ identities: { provider: string; name: string; email: string | null; createdAt: number }[]; hasPassword: boolean; available: SignInProvider[] }>('GET', '/api/account/identities'),
  unlinkIdentity: (provider: string) => call<{ ok: boolean }>('DELETE', `/api/account/identities/${encodeURIComponent(provider)}`),
  setPassword: (password: string) => call<{ ok: boolean }>('POST', '/api/account/password/set', { password }),
  me: () => call<{ user: AccountUser }>('GET', '/api/auth/me'),
  register: (email: string, password: string, name?: string, invite?: string) => call<{ user: AccountUser }>('POST', '/api/auth/register', { email, password, name, invite }),
  login: (email: string, password: string, code?: string) => call<{ user: AccountUser }>('POST', '/api/auth/login', { email, password, code }),
  /** finish a forgotten-password reset with the one-time code the operator gave you */
  resetPassword: (code: string, password: string) => call<{ ok: boolean }>('POST', '/api/auth/reset', { code, password }),
  updateProfile: (name: string) => call<{ user: AccountUser }>('PATCH', '/api/account/profile', { name }),
  changeEmail: (email: string, password: string) => call<{ user: AccountUser }>('POST', '/api/account/email', { email, password }),
  twoFactor: () => call<{ enabled: boolean; recoveryCodesLeft: number }>('GET', '/api/account/2fa'),
  twoFactorStart: (password: string) => call<{ secret: string; otpauth: string }>('POST', '/api/account/2fa/start', { password }),
  twoFactorConfirm: (code: string) => call<{ ok: boolean; recoveryCodes: string[] }>('POST', '/api/account/2fa/confirm', { code }),
  twoFactorRecovery: (password: string) => call<{ recoveryCodes: string[] }>('POST', '/api/account/2fa/recovery', { password }),
  twoFactorDisable: (password: string, code: string) => call<{ ok: boolean }>('POST', '/api/account/2fa/disable', { password, code }),
  securityLog: () => call<{ events: { at: number; event: string; detail: string | null }[] }>('GET', '/api/account/security-log'),
  logout: () => call<{ ok: boolean }>('POST', '/api/auth/logout', {}),
  changePassword: (current: string, next: string) => call<{ ok: boolean }>('POST', '/api/auth/password', { current, next }),
  deleteAccount: (password: string) => call<{ ok: boolean }>('DELETE', '/api/account', { password }),
  exportAccount: () => call<any>('GET', '/api/account/export'),
  sync: (cursor: number, changes: WireChange[]) => call<{ cursor: number; more: boolean; rejected: number; changes: WireChange[] }>('POST', '/api/sync', { protocol: 1, cursor, changes }),
  sessions: () => call<{ sessions: DeviceSession[] }>('GET', '/api/auth/sessions'),
  revokeSession: (id: string) => call<{ ok: boolean }>('DELETE', `/api/auth/sessions/${id}`),
  revokeOthers: () => call<{ ok: boolean; revoked: number }>('POST', '/api/auth/sessions/revoke-others', {}),
  stats: () => call<{ tables: { table: string; records: number; deleted: number }[]; bytes: number; limits: { records: number; bytes: number } }>('GET', '/api/account/stats'),
  /** the native iOS Apple sheet: the server checks the identity token, finishes the sign in (or the link, with link set), and keeps a revocable refresh token */
  appleNativeSignIn: (body: { identityToken: string; nonce: string; code: string; link?: boolean }) => call<{ user: AccountUser }>('POST', '/api/auth/oauth/apple/native', body),
  /** hand over a one time code from the Apple sheet so the server can keep a revocable refresh token for this account */
  appleCode: (code: string) => call<{ ok: boolean }>('POST', '/api/account/apple-code', { code }),
  // only the Supabase backend has these (see supabaseApi.ts)
  backend: 'server' as 'server' | 'supabase',
  deleteStudyBibleAccount: async (): Promise<{ ok: boolean }> => { throw new ApiError(404, 'Not available on this server.'); },
  createAccount: async (_name?: string): Promise<{ user: AccountUser }> => { throw new ApiError(404, 'Not available on this server.'); },
  signInWithProvider: async (_id: string): Promise<void> => { throw new ApiError(404, 'Not available on this server.'); },
  requestPasswordReset: async (_email: string): Promise<{ ok: boolean }> => { throw new ApiError(404, 'Not available on this server.'); },
  setNewPassword: async (_password: string): Promise<{ ok: boolean }> => { throw new ApiError(404, 'Not available on this server.'); },
  onPasswordRecovery: (_cb: () => void): (() => void) => () => undefined,
  recoveryPending: (): boolean => false,
  recoveryDone: (): void => undefined,
};

/** The account and sync service in use: Supabase when the build has its address and public key, otherwise the self-hosted server. */
export const api: typeof serverApi = supabaseConfigured() ? (createSupabaseApi() as unknown as typeof serverApi) : serverApi;
