import { describe, expect, it, vi } from 'vitest';
import { createSupabaseApi, supabaseConfigured } from '../src/sync/supabaseApi';
import { ApiError } from '../src/sync/errors';

/** a stand-in for the Supabase client that records what it is asked and answers from a script */
function fake(over: Record<string, any> = {}) {
  const calls: { fn: string; args: any }[] = [];
  const user = { id: 'u1', email: 'a@example.org', created_at: '2026-01-01T00:00:00Z', user_metadata: { name: 'Alex' }, last_sign_in_at: '2026-02-01T00:00:00Z', identities: [{}] };
  const sess = { user, expires_at: 2_000_000_000 };
  const rec = <T>(fn: string, out: T) => (args?: any) => { calls.push({ fn, args }); return Promise.resolve(out); };
  const client: any = {
    auth: {
      getSession: rec('getSession', { data: { session: sess }, error: null }),
      signUp: rec('signUp', { data: { user, session: sess }, error: null }),
      signInWithPassword: rec('signInWithPassword', { data: { user, session: sess }, error: null }),
      signOut: rec('signOut', { error: null }),
      updateUser: rec('updateUser', { data: { user }, error: null }),
      resetPasswordForEmail: rec('resetPasswordForEmail', { error: null }),
      onAuthStateChange: (cb: any) => { calls.push({ fn: 'onAuthStateChange', args: cb }); return { data: { subscription: { unsubscribe() {} } } }; },
      mfa: {
        getAuthenticatorAssuranceLevel: rec('aal', { data: { currentLevel: 'aal1', nextLevel: 'aal1' } }),
        listFactors: rec('listFactors', { data: { totp: [], all: [] } }),
        challengeAndVerify: rec('challengeAndVerify', { error: null }),
        enroll: rec('enroll', { data: { id: 'f1', totp: { secret: 'SECRET', uri: 'otpauth://x' } }, error: null }),
        unenroll: rec('unenroll', { error: null }),
      },
    },
    schema: (name: string) => ({ rpc: (fn: string, args: any) => { calls.push({ fn: `${name}.${fn}`, args }); return Promise.resolve(over[`rpc:${fn}`] ?? (fn === 'account_status' ? { data: { exists: true, name: null }, error: null } : { data: { ok: true }, error: null })); } }),
    functions: { invoke: (fn: string, o: any) => { calls.push({ fn: `functions.${fn}`, args: o }); return Promise.resolve(over.invoke ?? { data: { ok: true }, error: null }); } },
  };
  for (const [k, v] of Object.entries(over)) if (k.startsWith('auth.')) { const [, group, name] = k.split('.'); if (name) client.auth[group][name] = v; else client.auth[group] = v; }
  return { api: createSupabaseApi(async () => client), calls, client };
}
const names = (calls: { fn: string }[]) => calls.map((c) => c.fn);

describe('configuration', () => {
  it('is off without a project address and public key, so the self-hosted server stays the default', () => { expect(supabaseConfigured()).toBe(false); });
});

describe('sign in and out', () => {
  it('reads the person from the stored session without any network call', async () => {
    const { api, calls } = fake();
    const r = await api.me();
    expect(r.user).toEqual({ id: 'u1', email: 'a@example.org', name: 'Alex', createdAt: Date.parse('2026-01-01T00:00:00Z') });
    expect(names(calls)).toEqual(['getSession', 'studybible.account_status']); // the only question put to the database
    await api.me();
    expect(names(calls)).toHaveLength(3); // once an account is known to exist it is not asked again
  });
  it('tells the app when someone is signed in through another app but has no StudyBible account yet, and makes none behind their back', async () => {
    const f = fake({ 'rpc:account_status': { data: { exists: false }, error: null } });
    const r = await f.api.me();
    expect(r.user.needsAccount).toBe(true);
    expect(names(f.calls)).not.toContain('studybible.create_account');
  });
  it('makes the account when the person signed up through StudyBible (it is part of signing up), but only then', async () => {
    const mine = fake({ 'rpc:account_status': { data: { exists: false }, error: null }, 'auth.getSession': () => Promise.resolve({ data: { session: { user: { id: 'u9', email: 'n@example.org', created_at: '2026-01-01T00:00:00Z', user_metadata: { name: 'Nia', signed_up_via: 'studybible' } }, expires_at: 2e9 } }, error: null }) });
    await mine.api.me();
    expect(mine.calls.find((c) => c.fn === 'studybible.create_account')!.args).toEqual({ p_name: 'Nia' });
  });
  it('creates the account when the person chooses to', async () => {
    const f = fake({ 'rpc:create_account': { data: { exists: true, name: 'Alex' }, error: null } });
    const r = await f.api.createAccount('Alex');
    expect(r.user.name).toBe('Alex');
    expect(f.calls.find((c) => c.fn === 'studybible.create_account')!.args).toEqual({ p_name: 'Alex' });
  });
  it('says "not signed in" with the code the app already understands when there is no session', async () => {
    const { api } = fake({ 'auth.getSession': () => Promise.resolve({ data: { session: null }, error: null }) });
    await expect(api.me()).rejects.toMatchObject({ status: 401 });
  });
  it('asks the person to confirm their email after sign-up instead of pretending they are signed in', async () => {
    const { api, calls } = fake({ 'auth.signUp': () => Promise.resolve({ data: { user: { id: 'u2', identities: [{}] }, session: null }, error: null }) });
    await expect(api.register('n@example.org', 'a long passphrase', 'Nia')).rejects.toThrow(/confirmation link/);
    expect(names(calls)).not.toContain('studybible.create_account'); // nothing is made until they are confirmed and signed in
  });
  it('sends the confirmation link back to this app’s own address', async () => {
    const calls: any[] = [];
    vi.stubGlobal('location', { origin: 'https://pathomnemonic.github.io', pathname: '/StudyBible/' });
    const f = fake({ 'auth.signUp': (a: any) => { calls.push(a); return Promise.resolve({ data: { user: { id: 'u3', identities: [{}] }, session: { user: { id: 'u3' } } }, error: null }); } });
    await f.api.register('n@example.org', 'a long passphrase');
    expect(calls[0].options.emailRedirectTo).toBe('https://pathomnemonic.github.io/StudyBible/');
    expect(calls[0].options.data.signed_up_via).toBe('studybible');
    expect(names(f.calls)).toContain('studybible.create_account'); // an immediate session: the account is created as part of signing up
    vi.unstubAllGlobals();
  });
  it('treats an existing address as "may already exist", not as a new account', async () => {
    const { api } = fake({ 'auth.signUp': () => Promise.resolve({ data: { user: { id: 'u2', identities: [] }, session: null }, error: null }) });
    await expect(api.register('a@example.org', 'a long passphrase')).rejects.toMatchObject({ status: 409 });
  });
  it('turns Supabase’s messages into plain ones, including the email limit', async () => {
    const bad = (e: any) => fake({ 'auth.signInWithPassword': () => Promise.resolve({ data: {}, error: e }) }).api.login('a@example.org', 'x');
    await expect(bad({ message: 'Invalid login credentials', status: 400 })).rejects.toThrow('Email or password is incorrect.');
    await expect(bad({ message: 'Email not confirmed', status: 400 })).rejects.toThrow(/Confirm your email first/);
    await expect(bad({ message: 'email rate limit exceeded', status: 429, code: 'over_email_send_rate_limit' })).rejects.toThrow(/Too many emails/);
    await expect(bad({ message: 'Failed to fetch', status: 0 })).rejects.toMatchObject({ status: 0 });
  });
  it('asks for the second-step code when the account has one, and refuses a wrong code', async () => {
    const needs = { 'auth.mfa.getAuthenticatorAssuranceLevel': () => Promise.resolve({ data: { currentLevel: 'aal1', nextLevel: 'aal2' } }), 'auth.mfa.listFactors': () => Promise.resolve({ data: { totp: [{ id: 'f1' }], all: [{ id: 'f1' }] } }) };
    const noCode = fake(needs);
    await expect(noCode.api.login('a@example.org', 'pw')).rejects.toThrow(/six-digit code/); // the wording the form looks for
    expect(names(noCode.calls)).toContain('signOut'); // no half-signed-in session is left behind
    const wrong = fake({ ...needs, 'auth.mfa.challengeAndVerify': () => Promise.resolve({ error: { message: 'bad' } }) });
    await expect(wrong.api.login('a@example.org', 'pw', '000000')).rejects.toMatchObject({ status: 401 });
    const right = fake(needs);
    expect((await right.api.login('a@example.org', 'pw', '123 456')).user.email).toBe('a@example.org');
    expect(right.calls.find((c) => c.fn === 'challengeAndVerify')!.args).toEqual({ factorId: 'f1', code: '123456' });
  });
});

describe('sensitive changes re-check the password', () => {
  it('changes a password only after the current one checks out, then signs the other devices out', async () => {
    const ok = fake();
    await ok.api.changePassword('old pass phrase', 'new pass phrase');
    expect(names(ok.calls).slice(-3)).toEqual(['signInWithPassword', 'updateUser', 'signOut']);
    expect(ok.calls.at(-1)!.args).toEqual({ scope: 'others' });
    const bad = fake({ 'auth.signInWithPassword': () => Promise.resolve({ data: {}, error: { message: 'Invalid login credentials' } }) });
    await expect(bad.api.changePassword('wrong', 'new pass phrase')).rejects.toThrow('Password is incorrect.');
    expect(names(bad.calls)).not.toContain('updateUser');
  });
  it('does not delete the sign-in when the password is wrong', async () => {
    const bad = fake({ 'auth.signInWithPassword': () => Promise.resolve({ data: {}, error: { message: 'Invalid login credentials' } }) });
    await expect(bad.api.deleteAccount('wrong')).rejects.toThrow('Password is incorrect.');
    expect(names(bad.calls).some((n) => n.startsWith('functions.'))).toBe(false);
  });
});

describe('signing in with Google', () => {
  it('offers only the services the project has switched on, from its public settings', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ external: { google: true, apple: false, github: true } }), { status: 200 }));
    expect((await fake().api.health()).oauth).toEqual([{ id: 'google', name: 'Google' }]);
    vi.stubGlobal('fetch', async () => { throw new Error('offline'); });
    expect((await fake().api.health()).oauth).toEqual([]);
    vi.unstubAllGlobals();
  });
  it('sends the person to the provider and back to this app’s address', async () => {
    vi.stubGlobal('location', { origin: 'https://pathomnemonic.github.io', pathname: '/StudyBible/' });
    const got: any[] = [];
    const f = fake({ 'auth.signInWithOAuth': (a: any) => { got.push(a); return Promise.resolve({ error: null }); } });
    await f.api.signInWithProvider('google');
    expect(got[0]).toEqual({ provider: 'google', options: { redirectTo: 'https://pathomnemonic.github.io/StudyBible/' } });
    vi.unstubAllGlobals();
  });
});

describe('data: sync, download and the two deletions', () => {
  it('calls the studybible sync function with the cursor and changes, and returns what it answers', async () => {
    const answer = { cursor: 7, more: false, rejected: 0, changes: [{ table: 'notes', uid: 'n', updatedAt: 1, payload: {} }] };
    const f = fake({ 'rpc:sync': { data: answer, error: null } });
    const r = await f.api.sync(3, [{ table: 'notes', uid: 'n', updatedAt: 2, payload: { body: 'x' } }]);
    expect(r).toEqual(answer);
    expect(f.calls[0]).toEqual({ fn: 'studybible.sync', args: { p_protocol: 1, p_cursor: 3, p_changes: [{ table: 'notes', uid: 'n', updatedAt: 2, payload: { body: 'x' } }] } });
  });
  it('turns a "not signed in" or an anonymous refusal from the database into the codes the app handles', async () => {
    await expect(fake({ 'rpc:sync': { data: null, error: { message: 'not signed in', code: '28000' } } }).api.sync(0, [])).rejects.toMatchObject({ status: 401 });
    await expect(fake({ 'rpc:sync': { data: null, error: { message: 'JWT expired', code: 'PGRST301' } } }).api.sync(0, [])).rejects.toMatchObject({ status: 401 });
    await expect(fake({ 'rpc:sync': { data: null, error: { message: 'sign in with an email to use sync', code: '42501' } } }).api.sync(0, [])).rejects.toMatchObject({ status: 403 });
  });
  it('downloads through the export function and reads usage through stats', async () => {
    const f = fake({ 'rpc:export_all': { data: { format: 'studybible-supabase-export', records: [] }, error: null } });
    expect((await f.api.exportAccount()).format).toBe('studybible-supabase-export');
    await f.api.stats();
    expect(names(f.calls)).toEqual(['studybible.export_all', 'studybible.stats']);
  });
  it('"delete my StudyBible account" calls only the account function: no sign-in is touched', async () => {
    const f = fake();
    await f.api.deleteStudyBibleAccount();
    expect(names(f.calls)).toEqual(['studybible.delete_account']);
  });
  it('the separate "also remove my sign-in" re-checks the password, calls the server-side function with an explicit confirmation, and signs out here', async () => {
    const f = fake();
    await f.api.deleteAccount('right password');
    expect(names(f.calls)).toEqual(['getSession', 'signInWithPassword', 'functions.studybible-delete-account', 'signOut']);
    expect(f.calls[2].args).toEqual({ body: { confirm: 'delete-everywhere' } });
  });
  it('reports a failed account deletion instead of signing the person out as if it worked', async () => {
    const f = fake({ invoke: { data: { ok: false, error: 'The account could not be deleted.' }, error: null } });
    await expect(f.api.deleteAccount('right password')).rejects.toThrow(/could not be deleted/);
    expect(names(f.calls)).not.toContain('signOut');
  });
});

describe('what has no equivalent', () => {
  it('has no recovery codes and no security log, and says so', async () => {
    const { api } = fake();
    await expect(api.twoFactorRecovery('x')).rejects.toBeInstanceOf(ApiError);
    expect(await api.securityLog()).toEqual({ events: [] });
    expect(await api.twoFactor()).toEqual({ enabled: false, recoveryCodesLeft: 0 });
  });
  it('sends a reset link by email, and lets a returning person choose a new password', async () => {
    vi.stubGlobal('location', { origin: 'https://pathomnemonic.github.io', pathname: '/StudyBible/' });
    const f = fake();
    await f.api.requestPasswordReset('a@example.org');
    expect(f.calls[0]).toEqual({ fn: 'resetPasswordForEmail', args: 'a@example.org' });
    await f.api.setNewPassword('a new long passphrase');
    expect(names(f.calls)).toContain('updateUser');
    vi.unstubAllGlobals();
  });
});
