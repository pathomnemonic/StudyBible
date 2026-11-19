import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createPrivateKey, createPublicKey, createSign, createVerify, generateKeyPairSync, sign as nodeSign, type KeyObject } from 'node:crypto';
import { createApp } from '../server/app';
import { openDb } from '../server/db';
import { checkEnv } from '../server/config';
import { OAuthError, accountEmail, appleClientSecret, authorizationUrl, clearKeyCache, pkceChallenge, providersFromEnv, verifyIdToken, type OAuthConfig, type Provider } from '../server/oauth';

const b64u = (x: Buffer | string) => Buffer.from(x).toString('base64url');
const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ec = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const jwkOf = (k: KeyObject, kid: string, alg: string) => ({ ...(k.export({ format: 'jwk' }) as object), kid, alg, use: 'sig' });
function makeToken(claims: Record<string, unknown>, o: { kid?: string; alg?: 'RS256' | 'ES256' | 'none' | 'HS256'; key?: KeyObject } = {}) {
  const alg = o.alg ?? 'RS256';
  const head = b64u(JSON.stringify({ alg, kid: o.kid ?? 'k1', typ: 'JWT' }));
  const body = b64u(JSON.stringify(claims));
  if (alg === 'none') return `${head}.${body}.`;
  if (alg === 'HS256') return `${head}.${body}.${b64u('x'.repeat(32))}`;
  const input = `${head}.${body}`;
  const sig = alg === 'ES256' ? nodeSign('sha256', Buffer.from(input), { key: o.key ?? ec.privateKey, dsaEncoding: 'ieee-p1363' }) : createSign('sha256').update(input).sign(o.key ?? rsa.privateKey);
  return `${input}.${b64u(sig)}`;
}

/* a pretend sign-in provider: publishes keys, and answers the token request with whatever the test set up */
let provider: Server; let pbase = '';
let nextClaims: Record<string, unknown> = {};
let tokenKey: KeyObject = rsa.privateKey;
let lastTokenRequest: URLSearchParams | null = null;
const CLIENT_ID = 'client-123';

beforeAll(async () => {
  provider = createServer((req, res) => {
    if (req.url === '/jwks') { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ keys: [jwkOf(rsa.publicKey, 'k1', 'RS256'), jwkOf(ec.publicKey, 'k2', 'ES256')] })); return; }
    if (req.url === '/token' && req.method === 'POST') {
      const chunks: Buffer[] = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => {
        lastTokenRequest = new URLSearchParams(Buffer.concat(chunks).toString());
        res.setHeader('content-type', 'application/json');
        if (lastTokenRequest.get('code') === 'bad') { res.statusCode = 400; res.end('{"error":"invalid_grant"}'); return; }
        const claims = { iss: 'https://issuer.test', aud: CLIENT_ID, exp: Math.floor(Date.now() / 1000) + 600, iat: Math.floor(Date.now() / 1000), ...nextClaims };
        res.end(JSON.stringify({ id_token: makeToken(claims, { key: tokenKey, alg: tokenKey === rsa.privateKey ? 'RS256' : 'ES256', kid: tokenKey === rsa.privateKey ? 'k1' : 'k2' }) }));
      }); return;
    }
    res.statusCode = 404; res.end();
  });
  await new Promise<void>((r) => provider.listen(0, '127.0.0.1', r));
  pbase = `http://127.0.0.1:${(provider.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => provider.close(() => r())));

const fake = (extra: Partial<Provider> = {}): Provider => ({
  id: 'test', name: 'Test', issuerOk: (iss) => iss === 'https://issuer.test', authorizationEndpoint: 'https://issuer.test/authorize', tokenEndpoint: `${pbase}/token`, jwksUri: `${pbase}/jwks`,
  clientId: CLIENT_ID, clientSecret: () => 'secret', scopes: ['openid', 'email', 'profile'], trustsEmailClaim: (c) => c.email_verified === true, ...extra,
});
const cfgFor = (p: Provider, enabled = true): OAuthConfig => ({ enabled, publicUrl: 'http://127.0.0.1:9', providers: [p], allowInsecure: true });

describe('the ID token is checked', () => {
  beforeEach(() => clearKeyCache());
  const good = () => ({ iss: 'https://issuer.test', aud: CLIENT_ID, sub: 'u1', nonce: 'n1', exp: Math.floor(Date.now() / 1000) + 600, iat: Math.floor(Date.now() / 1000) });
  const check = (claims: Record<string, unknown>, o?: Parameters<typeof makeToken>[1], nonce = 'n1') => verifyIdToken(cfgFor(fake()), fake(), makeToken(claims, o), nonce);
  it('accepts a good RS256 token and a good ES256 token', async () => {
    expect((await check(good())).sub).toBe('u1');
    expect((await check(good(), { alg: 'ES256', kid: 'k2' })).sub).toBe('u1');
  });
  it.each([
    ['the wrong audience', { ...good(), aud: 'someone-else' }],
    ['the wrong issuer', { ...good(), iss: 'https://evil.test' }],
    ['an expired token', { ...good(), exp: Math.floor(Date.now() / 1000) - 3600 }],
    ['an issue time far in the future', { ...good(), iat: Math.floor(Date.now() / 1000) + 3600 }],
    ['a missing account id', { ...good(), sub: '' }],
  ])('refuses %s', async (_n, claims) => { await expect(check(claims as Record<string, unknown>)).rejects.toBeInstanceOf(OAuthError); });
  it('refuses another sign-in attempt’s nonce', async () => { await expect(check(good(), undefined, 'different')).rejects.toThrow(/did not match/); });
  it('refuses "none", a shared-secret algorithm, an unknown key and a bad signature', async () => {
    await expect(check(good(), { alg: 'none' })).rejects.toThrow(/algorithm/);
    await expect(check(good(), { alg: 'HS256' })).rejects.toThrow(/algorithm/);
    await expect(check(good(), { kid: 'nope' })).rejects.toThrow(/unknown key/);
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
    await expect(check(good(), { key: other.privateKey })).rejects.toThrow(/signature/);
    const t = makeToken(good()).split('.'); t[1] = b64u(JSON.stringify({ ...good(), sub: 'someone-else' }));
    await expect(verifyIdToken(cfgFor(fake()), fake(), t.join('.'), 'n1')).rejects.toThrow(/signature/);
  });
  it('accepts an audience list that includes this app', async () => { expect((await check({ ...good(), aud: ['x', CLIENT_ID] })).sub).toBe('u1'); });
});

describe('providers, secrets and placeholders', () => {
  it('builds a provider only when all of its settings are present, and reports half-set ones', () => {
    expect(providersFromEnv({}).providers).toEqual([]);
    const half = providersFromEnv({ GOOGLE_CLIENT_ID: 'a' });
    expect(half.providers).toEqual([]); expect(half.errors[0]).toMatch(/GOOGLE_CLIENT_SECRET/);
    const ok = providersFromEnv({ GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b' });
    expect(ok.providers.map((p) => p.id)).toEqual(['google']);
  });
  it('makes an Apple client secret that verifies with the matching public key', () => {
    const pem = ec.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    const t = appleClientSecret({ teamId: 'TEAM', keyId: 'KEY', clientId: 'svc.id', privateKeyPem: pem, now: 1_700_000_000_000 });
    const [h, b, s] = t.split('.');
    expect(JSON.parse(Buffer.from(h, 'base64url').toString())).toMatchObject({ alg: 'ES256', kid: 'KEY' });
    expect(JSON.parse(Buffer.from(b, 'base64url').toString())).toMatchObject({ iss: 'TEAM', sub: 'svc.id', aud: 'https://appleid.apple.com' });
    expect(createVerify('sha256').update(`${h}.${b}`).verify({ key: ec.publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))).toBe(true);
    expect(() => createPrivateKey(pem)).not.toThrow();
  });
  it('only stores an email the provider vouches for; otherwise a placeholder nobody can sign up with', () => {
    const p = fake();
    expect(accountEmail(p, { sub: '1', email: 'A@B.org', email_verified: true })).toEqual({ email: 'a@b.org', verified: true });
    const un = accountEmail(p, { sub: '1', email: 'a@b.org', email_verified: false });
    expect(un.verified).toBe(false); expect(un.email).toMatch(/@sign-in\.invalid$/);
    expect(accountEmail(p, { sub: '1', email: 'a@b.org', email_verified: false }).email).toBe(un.email); // stable
    expect(providersFromEnv({ MICROSOFT_CLIENT_ID: 'a', MICROSOFT_CLIENT_SECRET: 'b' }).providers[0].trustsEmailClaim({ email: 'a@b.org', email_verified: true })).toBe(false);
  });
  it('builds a PKCE authorization address and a known challenge', () => {
    expect(pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'); // the RFC 7636 example
    const u = new URL(authorizationUrl(cfgFor(fake()), fake(), { state: 's', nonce: 'n', verifier: 'v' }));
    expect(u.searchParams.get('code_challenge_method')).toBe('S256'); expect(u.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:9/api/auth/oauth/test/callback');
    expect(u.searchParams.get('code_challenge')).toBe(pkceChallenge('v'));
  });
  it('is off by default, and start-up checks refuse a half-set or insecure setup', () => {
    expect(checkEnv({}).errors).toEqual([]);
    expect(checkEnv({ GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b' }).warnings.join(' ')).toMatch(/ignored/);
    expect(checkEnv({ OAUTH: 'on' }).errors.join(' ')).toMatch(/PUBLIC_URL/);
    expect(checkEnv({ OAUTH: 'on', PUBLIC_URL: 'http://study.example.org', GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b' }).errors.join(' ')).toMatch(/https/);
    expect(checkEnv({ OAUTH: 'on', PUBLIC_URL: 'https://study.example.org' }).errors.join(' ')).toMatch(/no provider/);
    expect(checkEnv({ OAUTH: 'on', PUBLIC_URL: 'https://study.example.org', GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b' }).errors).toEqual([]);
  });
});

/* the whole sign-in through the real server */
let app: Server; let base = ''; let db: ReturnType<typeof openDb>;
async function boot(oauth: OAuthConfig, registration: 'open' | 'closed' = 'open') {
  db = openDb(':memory:');
  app = createApp({ db, registration, sessionDays: 1, allowedOrigins: [], secureCookies: false, registerLimitPerHour: 1000, oauth });
  await new Promise<void>((r) => app.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(app.address() as AddressInfo).port}`;
}
const stop = () => new Promise<void>((r) => app.close(() => r()));
const get = (path: string, cookie = '') => fetch(base + path, { redirect: 'manual', headers: cookie ? { Cookie: cookie } : {} });
const api = async (method: string, path: string, cookie = '', body?: unknown) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-StudyBible': '1', ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any, cookie: (res.headers.get('set-cookie') ?? '').split(';')[0] };
};
/** start a sign-in, let the pretend provider approve it, and come back: returns where the browser ends up and the session cookie, if any */
async function signInWith(claims: Record<string, unknown>, o: { link?: string; code?: string; mutateState?: (s: string) => string } = {}) {
  const start = await get(`/api/auth/oauth/test/start${o.link !== undefined ? '?link=1' : ''}`, o.link ?? '');
  if (start.status !== 302) return { start, location: '', cookie: '', end: start };
  const to = new URL(start.headers.get('location')!);
  if (to.origin !== 'https://issuer.test') return { start, location: to.toString(), cookie: '', end: start }; // turned back before reaching the provider
  nextClaims = { nonce: to.searchParams.get('nonce'), ...claims };
  const state = o.mutateState ? o.mutateState(to.searchParams.get('state')!) : to.searchParams.get('state')!;
  const end = await get(`/api/auth/oauth/test/callback?code=${o.code ?? 'good'}&state=${state}`);
  return { start, location: end.headers.get('location') ?? '', cookie: (end.headers.get('set-cookie') ?? '').split(';')[0], end, state, nonce: to.searchParams.get('nonce') };
}

describe('sign in through the server', () => {
  describe('when it is off', () => {
    beforeAll(() => boot(cfgFor(fake(), false))); afterAll(stop);
    it('has no routes and offers no providers', async () => {
      expect((await get('/api/auth/oauth/test/start')).status).toBe(404);
      expect((await get('/api/auth/oauth/test/callback?code=x&state=y')).status).toBe(404);
      expect((await api('GET', '/api/health')).body.oauth).toEqual([]);
    });
  });
  describe('when it is on', () => {
    beforeAll(() => boot(cfgFor(fake()))); afterAll(stop);
    beforeEach(() => clearKeyCache());
    it('lists the providers, and sends the person to the provider with PKCE, a state and a nonce', async () => {
      expect((await api('GET', '/api/health')).body.oauth).toEqual([{ id: 'test', name: 'Test' }]);
      const s = await get('/api/auth/oauth/test/start');
      const u = new URL(s.headers.get('location')!);
      expect(u.origin).toBe('https://issuer.test');
      for (const k of ['state', 'nonce', 'code_challenge']) expect(u.searchParams.get(k)!.length).toBeGreaterThan(20);
    });
    it('creates a password-less account on first sign-in, signs the same person into it later, and never lets a typed password in', async () => {
      const first = await signInWith({ sub: 'g-1', email: 'Sam@Example.org', email_verified: true, name: 'Sam' });
      expect(first.location).toBe('http://127.0.0.1:9/#/account?signed_in=test');
      expect(lastTokenRequest!.get('code_verifier')!.length).toBeGreaterThan(40);
      const me = await api('GET', '/api/auth/me', first.cookie);
      expect(me.body.user).toMatchObject({ email: 'sam@example.org', name: 'Sam' });
      const again = await signInWith({ sub: 'g-1', email: 'sam@example.org', email_verified: true });
      expect((await api('GET', '/api/auth/me', again.cookie)).body.user.id).toBe(me.body.user.id);
      expect((await api('POST', '/api/auth/login', '', { email: 'sam@example.org', password: 'anything at all' })).status).toBe(401);
      expect((await api('POST', '/api/auth/login', '', { email: 'sam@example.org', password: 'oauth$none' })).status).toBe(401);
    });
    it('uses a state only once', async () => {
      const r = await signInWith({ sub: 'g-2', email: 'two@example.org', email_verified: true });
      const replay = await get(`/api/auth/oauth/test/callback?code=good&state=${r.state}`);
      expect(replay.headers.get('location')).toMatch(/sign_in_error=expired/); expect(replay.headers.get('set-cookie')).toBeNull();
    });
    it('refuses an invented or altered state, a cancelled sign-in and a rejected code', async () => {
      expect((await signInWith({ sub: 'x' }, { mutateState: (s) => s + 'x' })).location).toMatch(/expired/);
      expect((await get('/api/auth/oauth/test/callback?error=access_denied&state=zzz')).headers.get('location')).toMatch(/expired|cancelled/);
      const s = await get('/api/auth/oauth/test/start'); const st = new URL(s.headers.get('location')!).searchParams.get('state');
      expect((await get(`/api/auth/oauth/test/callback?error=access_denied&state=${st}`)).headers.get('location')).toMatch(/cancelled/);
      expect((await signInWith({ sub: 'x' }, { code: 'bad' })).location).toMatch(/exchange_failed/);
    });
    it('refuses a token for another sign-in attempt (a nonce mix-up)', async () => {
      const start = await get('/api/auth/oauth/test/start'); const u = new URL(start.headers.get('location')!);
      nextClaims = { sub: 'g-3', nonce: 'someone-elses', email: 'n@example.org', email_verified: true };
      const end = await get(`/api/auth/oauth/test/callback?code=good&state=${u.searchParams.get('state')}`);
      expect(end.headers.get('location')).toMatch(/bad_token/); expect(end.headers.get('set-cookie')).toBeNull();
    });
    it('does not join an existing account by email alone', async () => {
      const reg = await api('POST', '/api/auth/register', '', { email: 'owner@example.org', password: 'correct horse battery' });
      expect(reg.status).toBe(201);
      const r = await signInWith({ sub: 'g-4', email: 'owner@example.org', email_verified: true });
      expect(r.location).toMatch(/sign_in_error=email_in_use/); expect(r.cookie).toBe('');
    });
    it('gives an unverified email a placeholder, so it cannot claim anyone’s address', async () => {
      const r = await signInWith({ sub: 'g-5', email: 'owner@example.org', email_verified: false });
      const me = await api('GET', '/api/auth/me', r.cookie);
      expect(me.body.user.email).toMatch(/@sign-in\.invalid$/);
    });
    it('links a provider to a signed-in account, refuses one already linked elsewhere, and keeps a last way in', async () => {
      const reg = await api('POST', '/api/auth/register', '', { email: 'linker@example.org', password: 'correct horse battery' });
      const linked = await signInWith({ sub: 'g-6', email: 'whatever@example.org', email_verified: true }, { link: reg.cookie });
      expect(linked.location).toMatch(/linked=test/);
      const list = await api('GET', '/api/account/identities', reg.cookie);
      expect(list.body.identities).toHaveLength(1); expect(list.body.hasPassword).toBe(true);
      // the same provider account cannot also be linked to a different user
      const other = await api('POST', '/api/auth/register', '', { email: 'other@example.org', password: 'correct horse battery' });
      expect((await signInWith({ sub: 'g-6' }, { link: other.cookie })).location).toMatch(/already_linked_elsewhere/);
      // linking without being signed in does nothing
      expect((await signInWith({ sub: 'g-7' }, { link: '' })).location).toMatch(/not_signed_in/);
      // it can be removed while a password remains
      expect((await api('DELETE', '/api/account/identities/test', reg.cookie)).status).toBe(200);
      expect((await api('GET', '/api/account/identities', reg.cookie)).body.identities).toHaveLength(0);
    });
    it('will not remove the only way in, and lets a provider-only account set a password', async () => {
      const r = await signInWith({ sub: 'g-8', email: 'solo@example.org', email_verified: true });
      const del = await api('DELETE', '/api/account/identities/test', r.cookie);
      expect(del.status).toBe(409);
      expect((await api('POST', '/api/account/password/set', r.cookie, { password: 'short' })).status).toBe(400);
      expect((await api('POST', '/api/account/password/set', r.cookie, { password: 'a long enough passphrase' })).status).toBe(200);
      expect((await api('POST', '/api/account/password/set', r.cookie, { password: 'another long passphrase' })).status).toBe(409); // it has one now
      expect((await api('DELETE', '/api/account/identities/test', r.cookie)).status).toBe(200);
      expect((await api('POST', '/api/auth/login', '', { email: 'solo@example.org', password: 'a long enough passphrase' })).status).toBe(200);
    });
    it('keeps a second step: an account with an authenticator is not signed in by the provider alone', async () => {
      const r = await signInWith({ sub: 'g-9', email: 'secure@example.org', email_verified: true });
      db.prepare("UPDATE users SET totp_enabled = 1 WHERE email = 'secure@example.org'").run();
      const again = await signInWith({ sub: 'g-9', email: 'secure@example.org', email_verified: true });
      expect(again.location).toMatch(/second_step_required/); expect(again.cookie).toBe('');
      expect(r.cookie).not.toBe('');
    });
    it('deleting the account removes its linked identities', async () => {
      const r = await signInWith({ sub: 'g-10', email: 'gone@example.org', email_verified: true });
      const set = await api('POST', '/api/account/password/set', r.cookie, { password: 'a long enough passphrase' });
      expect(set.status).toBe(200);
      expect((await api('DELETE', '/api/account', r.cookie, { password: 'a long enough passphrase' })).status).toBe(200);
      expect((db.prepare("SELECT COUNT(*) AS n FROM identities WHERE subject = 'g-10'").get() as any).n).toBe(0);
    });
  });
  describe('on a closed server', () => {
    beforeAll(() => boot(cfgFor(fake()), 'closed')); afterAll(stop);
    it('lets the first account in, then no one else without an invite', async () => {
      expect((await signInWith({ sub: 'c-1', email: 'first@example.org', email_verified: true })).location).toMatch(/signed_in/);
      expect((await signInWith({ sub: 'c-2', email: 'second@example.org', email_verified: true })).location).toMatch(/registration_closed/);
    });
  });
});
