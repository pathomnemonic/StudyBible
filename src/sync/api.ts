/** Thin client for the Study Bible sync server (see server/). Same-origin by default; set VITE_API_BASE for a separate origin. */
const BASE: string = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

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

export interface AccountUser {
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

export const api = {
  health: () => call<{ ok: boolean; registration: 'open' | 'closed' }>('GET', '/api/health'),
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
};
