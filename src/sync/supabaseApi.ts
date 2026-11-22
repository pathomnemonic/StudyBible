import type { AccountUser, DeviceSession, SignInProvider, WireChange } from './api';
import { ApiError } from './errors';

/**
 * Accounts and sync on the shared Supabase project: the same surface the app already uses for the self-hosted server (`api`), so the sync engine and the account
 * screens work unchanged. Sign-in is Supabase Auth (PKCE flow, because this app's routes use "#"); the library is loaded on first use, in its own chunk, so it
 * costs nothing for anyone who never opens the account page. Data lives in the `studybible` schema and is reached only through its functions
 * (supabase/migrations/…_studybible_schema.sql). The app holds only the project address and the public (anon) key; no secret key is ever in the app.
 */
const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const KEY_ = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
export const supabaseConfigured = () => /^https:\/\//.test(URL_) && KEY_.length > 20;

/** the small part of the Supabase client this file uses (so tests can stand one in) */
type Sb = any;
type GetClient = () => Promise<Sb>;

const realClient: GetClient = (() => {
  let p: Promise<Sb> | null = null;
  return () => (p ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(URL_, KEY_, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'sb-studybible-auth' },
  })));
})();

/** the address Supabase's emails send people back to: this app's own address (it must be on the project's redirect list) */
const here = () => (typeof location === 'undefined' ? '' : location.origin + location.pathname);

/** the message the app recognises as "signed in, but no StudyBible account" */
export const NO_ACCOUNT = 'You do not have a StudyBible account yet. Create one to sync.';

/** plain wording for the messages Supabase sends, and an ApiError with a code the account screens already understand */
function fail(e: any): never {
  if (e instanceof ApiError) throw e;
  const msg: string = String(e?.message ?? e ?? '');
  const code: string = String(e?.code ?? '');
  const status = Number(e?.status ?? 0);
  if (!status && /fetch|network|failed to fetch|load failed/i.test(msg)) throw new ApiError(0, 'Could not reach the account service.');
  if (/invalid login credentials/i.test(msg)) throw new ApiError(401, 'Email or password is incorrect.');
  if (/email not confirmed/i.test(msg)) throw new ApiError(401, 'Confirm your email first: open the link we sent you, then sign in.');
  if (code === 'over_email_send_rate_limit' || /email rate limit/i.test(msg)) throw new ApiError(429, 'Too many emails have been sent just now. Try again in an hour.');
  if (code === 'over_request_rate_limit' || status === 429) throw new ApiError(429, 'Too many attempts. Wait a few minutes and try again.');
  if (/weak_password|password should be/i.test(code + msg)) throw new ApiError(400, 'Use a longer, less common password (at least 10 characters).');
  // the account was deleted (for instance on another device) or never created: the app turns this into "create your StudyBible account"
  if (code === 'P0002' || /no studybible account/i.test(msg)) throw new ApiError(409, NO_ACCOUNT);
  if (code === '28000' || /not signed in|jwt expired|invalid jwt|PGRST301/i.test(msg + code)) throw new ApiError(401, 'Not signed in.');
  if (code === '42501' || /sign in with an email/i.test(msg)) throw new ApiError(403, msg.includes('sign in with an email') ? 'Sign in with an email to use sync.' : 'Not allowed.');
  if (code === '22023') throw new ApiError(413, msg);
  throw new ApiError(status >= 400 ? status : 500, msg || 'That did not work.');
}

const mapUser = (u: any, name?: string | null): AccountUser => ({ id: u.id, email: u.email ?? '', name: name ?? u.user_metadata?.name ?? null, createdAt: Date.parse(u.created_at) || 0 });

export function createSupabaseApi(getClient: GetClient = realClient) {
  let pendingFactor: string | null = null;
  /** the person whose StudyBible account was last seen to exist (so `me` does not ask the database every time) */
  let accountKnown: string | null = null;

  async function rpc<T = any>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    let r: { data: T; error: any };
    try { r = await (await getClient()).schema('studybible').rpc(fn, args); } catch (e) { return fail(e); }
    if (r.error) return fail(r.error);
    return r.data;
  }
  const auth = async () => (await getClient()).auth;
  const session = async () => {
    const { data, error } = await (await auth()).getSession();
    if (error) fail(error);
    return data?.session ?? null;
  };
  const needSession = async () => { const s = await session(); if (!s) throw new ApiError(401, 'Not signed in.'); return s; };
  /** re-check the password before a sensitive change, as the self-hosted server did */
  async function verifyPassword(password: string) {
    const s = await needSession();
    const { error } = await (await auth()).signInWithPassword({ email: s.user.email, password });
    if (error) throw new ApiError(401, 'Password is incorrect.');
  }

  return {
    backend: 'supabase' as 'server' | 'supabase',
    /** which sign-in services the project has switched on (the public settings page; no sign-in needed). Nothing else is contacted. */
    health: async () => {
      let oauth: SignInProvider[] = [];
      try {
        const r = await fetch(`${URL_}/auth/v1/settings`, { headers: { apikey: KEY_ } });
        const ext = ((await r.json()) as { external?: Record<string, boolean> }).external ?? {};
        oauth = (['google', 'apple'] as const).filter((id) => ext[id]).map((id) => ({ id, name: id === 'google' ? 'Google' : 'Apple' }));
      } catch { /* none offered */ }
      return { ok: true, registration: 'open' as const, oauth };
    },
    /** "Continue with Google": the browser leaves for the provider and comes back to this app's address (it must be on the project's redirect list) */
    signInWithProvider: async (id: string) => {
      const { error } = await (await auth()).signInWithOAuth({ provider: id, options: { redirectTo: here() } });
      if (error) return fail(error);
    },
    /** who is signed in, and whether they have a StudyBible account yet (a person signed in through another app does not, until they create one) */
    me: async () => {
      const s = await needSession();
      const user = mapUser(s.user);
      if (accountKnown === s.user.id) return { user };
      let status: { exists: boolean; name?: string | null };
      try { status = await rpc('account_status'); } catch (e) { if (e instanceof ApiError && e.status === 0) return { user }; throw e; } // offline: carry on as before
      if (!status.exists && s.user.user_metadata?.signed_up_via === 'studybible') status = await rpc('create_account', { p_name: s.user.user_metadata?.name ?? null }); // they signed up here: the account is part of signing up
      if (!status.exists) return { user: { ...user, needsAccount: true } };
      accountKnown = s.user.id;
      return { user: { ...user, name: status.name ?? user.name } };
    },
    /** the person chose to create their StudyBible account */
    createAccount: async (name?: string) => {
      const s = await needSession();
      const r = await rpc<{ exists: boolean; name?: string | null }>('create_account', { p_name: name ?? s.user.user_metadata?.name ?? null });
      accountKnown = s.user.id;
      return { user: { ...mapUser(s.user), name: r.name ?? mapUser(s.user).name } };
    },

    register: async (email: string, password: string, name?: string, _invite?: string) => {
      let r;
      try { r = await (await auth()).signUp({ email, password, options: { data: { ...(name ? { name } : {}), signed_up_via: 'studybible' }, emailRedirectTo: here() } }); } catch (e) { return fail(e); }
      if (r.error) return fail(r.error);
      if (r.data.user && r.data.user.identities && r.data.user.identities.length === 0) throw new ApiError(409, 'That email already has a sign-in. It may have been made in another app: sign in with the same password, then create your StudyBible account. Or use “Forgot your password?”.');
      if (!r.data.session) throw new ApiError(202, 'Check your email: we sent a confirmation link. Open it, then come back and sign in.');
      await rpc('create_account', { p_name: name ?? null }); // signing up here includes creating the StudyBible account
      accountKnown = r.data.user.id;
      return { user: mapUser(r.data.user) };
    },

    login: async (email: string, password: string, code?: string) => {
      const a = await auth();
      let r;
      try { r = await a.signInWithPassword({ email, password }); } catch (e) { return fail(e); }
      if (r.error) return fail(r.error);
      const aal = await a.mfa.getAuthenticatorAssuranceLevel();
      if (aal.data && aal.data.nextLevel === 'aal2' && aal.data.currentLevel !== 'aal2') {
        if (!code) { await a.signOut({ scope: 'local' }); throw new ApiError(401, 'Enter the six-digit code from your authenticator app.'); }
        const factor = (await a.mfa.listFactors()).data?.totp?.[0];
        const v = factor ? await a.mfa.challengeAndVerify({ factorId: factor.id, code: code.replace(/\s/g, '') }) : { error: true };
        if (v.error) { await a.signOut({ scope: 'local' }); throw new ApiError(401, 'That code is not right. Check the time on your phone and try again.'); }
      }
      return { user: mapUser(r.data.user) };
    },

    logout: async () => { try { await (await auth()).signOut({ scope: 'local' }); } catch { /* signed out here either way */ } return { ok: true }; },

    updateProfile: async (name: string) => {
      const clean = name.trim().slice(0, 80);
      await rpc('set_display_name', { p_name: clean });
      const { data, error } = await (await auth()).updateUser({ data: { name: clean || null } });
      if (error) return fail(error);
      return { user: mapUser(data.user, clean || null) };
    },
    changeEmail: async (email: string, password: string) => {
      await verifyPassword(password);
      const { data, error } = await (await auth()).updateUser({ email }, { emailRedirectTo: here() });
      if (error) return fail(error);
      return { user: mapUser(data.user) }; // the address changes once the new one is confirmed by email
    },
    changePassword: async (current: string, next: string) => {
      await verifyPassword(current);
      const a = await auth();
      const { error } = await a.updateUser({ password: next });
      if (error) return fail(error);
      await a.signOut({ scope: 'others' });
      return { ok: true };
    },

    /** forgotten password: an email link, then `setNewPassword` once the person is back in the app */
    requestPasswordReset: async (email: string) => {
      const { error } = await (await auth()).resetPasswordForEmail(email, { redirectTo: here() });
      if (error) return fail(error);
      return { ok: true };
    },
    setNewPassword: async (password: string) => {
      const { error } = await (await auth()).updateUser({ password });
      if (error) return fail(error);
      return { ok: true };
    },
    onPasswordRecovery: (cb: () => void) => {
      let off = () => undefined as void;
      void getClient().then((c) => { const { data } = c.auth.onAuthStateChange((event: string) => { if (event === 'PASSWORD_RECOVERY') cb(); }); off = () => data.subscription.unsubscribe(); });
      return () => off();
    },
    /** the operator-code reset belongs to the self-hosted server and does not exist here */
    resetPassword: async (_code: string, _password: string): Promise<{ ok: boolean }> => { throw new ApiError(404, 'Use the email link instead.'); },

    // second step: Supabase's authenticator-app (TOTP) factor. It has no recovery codes: email reset is the way back in.
    twoFactor: async () => { const f = (await (await auth()).mfa.listFactors()).data?.totp ?? []; return { enabled: f.length > 0, recoveryCodesLeft: 0 }; },
    twoFactorStart: async (password: string) => {
      await verifyPassword(password);
      const a = await auth();
      for (const f of (await a.mfa.listFactors()).data?.all ?? []) if (f.status === 'unverified') await a.mfa.unenroll({ factorId: f.id });
      const { data, error } = await a.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator' });
      if (error) return fail(error);
      pendingFactor = data.id;
      return { secret: data.totp.secret as string, otpauth: data.totp.uri as string };
    },
    twoFactorConfirm: async (code: string) => {
      if (!pendingFactor) throw new ApiError(400, 'Start again: set up the authenticator first.');
      const { error } = await (await auth()).mfa.challengeAndVerify({ factorId: pendingFactor, code: code.replace(/\s/g, '') });
      if (error) throw new ApiError(401, 'That code is not right. Check the time on your phone and try again.');
      pendingFactor = null;
      return { ok: true, recoveryCodes: [] as string[] };
    },
    twoFactorRecovery: async (_password: string): Promise<{ recoveryCodes: string[] }> => { throw new ApiError(404, 'Recovery codes are not available. If you lose your phone, reset your password by email.'); },
    twoFactorDisable: async (password: string, code: string) => {
      await verifyPassword(password);
      const a = await auth();
      const factor = (await a.mfa.listFactors()).data?.totp?.[0];
      if (!factor) return { ok: true };
      const v = await a.mfa.challengeAndVerify({ factorId: factor.id, code: code.replace(/\s/g, '') });
      if (v.error) throw new ApiError(401, 'That code is not right.');
      const { error } = await a.mfa.unenroll({ factorId: factor.id });
      if (error) return fail(error);
      return { ok: true };
    },

    /** Supabase does not give the browser a list of the person's other sessions, so this shows this device and can sign the others out */
    sessions: async (): Promise<{ sessions: DeviceSession[] }> => {
      const s = await needSession();
      return { sessions: [{ id: 'this-device', current: true, createdAt: Date.parse(s.user.last_sign_in_at ?? '') || Date.now(), lastSeen: Date.now(), expiresAt: (s.expires_at ?? 0) * 1000, device: 'This device' }] };
    },
    revokeSession: async (_id: string): Promise<{ ok: boolean }> => { throw new ApiError(404, 'Not available.'); },
    revokeOthers: async () => { const { error } = await (await auth()).signOut({ scope: 'others' }); if (error) return fail(error); return { ok: true, revoked: 0 }; },
    /** the app asked for a security log; this service keeps none (an accepted loss; Supabase's own dashboard has the sign-in log) */
    securityLog: async () => ({ events: [] as { at: number; event: string; detail: string | null }[] }),

    sync: async (cursor: number, changes: WireChange[]) => rpc<{ cursor: number; more: boolean; rejected: number; changes: WireChange[] }>('sync', { p_protocol: 1, p_cursor: cursor, p_changes: changes }),
    exportAccount: async () => rpc<any>('export_all'),
    stats: async () => rpc<{ tables: { table: string; records: number; deleted: number }[]; bytes: number; limits: { records: number; bytes: number } }>('stats'),

    /** "Delete my StudyBible account": the account and everything stored for it. The shared sign-in and every other app's data are left alone. */
    deleteStudyBibleAccount: async () => { await rpc('delete_account'); accountKnown = null; return { ok: true }; },
    /** Optional, and separate: also remove the shared sign-in itself, through a function that holds the key the browser must never have. Any other app that uses the same sign-in loses it too. */
    deleteAccount: async (password: string) => {
      await verifyPassword(password);
      const c = await getClient();
      const { error, data } = await c.functions.invoke('studybible-delete-account', { body: { confirm: 'delete-everywhere' } });
      if (error) return fail(error);
      if (data && data.ok === false) throw new ApiError(500, data.error ?? 'The account could not be deleted.');
      try { await c.auth.signOut({ scope: 'local' }); } catch { /* the session is gone with the account */ }
      return { ok: true };
    },

    // signing in with another service goes through Supabase's own providers, none of which are set up yet
    identities: async () => ({ identities: [] as { provider: string; name: string; email: string | null; createdAt: number }[], hasPassword: true, available: [] as SignInProvider[] }),
    unlinkIdentity: async (_p: string): Promise<{ ok: boolean }> => { throw new ApiError(404, 'Not available.'); },
    setPassword: async (_p: string): Promise<{ ok: boolean }> => { throw new ApiError(404, 'Not available.'); },
  };
}
