import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { generateKeyPairSync, createSign, type KeyObject } from 'node:crypto';
import { createApp } from '../server/app';
import { openDb } from '../server/db';
import { clearKeyCache, isIosToken, markIosToken, providersFromEnv, rawRefreshToken, revokeTarget, type OAuthConfig, type Provider } from '../server/oauth';

const b64u = (x: Buffer | string) => Buffer.from(x).toString('base64url');
const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwkOf = (k: KeyObject, kid: string, alg: string) => ({ ...(k.export({ format: 'jwk' }) as object), kid, alg, use: 'sig' });
function makeToken(claims: Record<string, unknown>) {
  const head = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' }));
  const body = b64u(JSON.stringify(claims));
  const input = `${head}.${body}`;
  return `${input}.${b64u(createSign('sha256').update(input).sign(rsa.privateKey))}`;
}

const ISSUER = 'https://issuer.test';
const SERVICES_ID = 'com.example.signin';
const BUNDLE_ID = 'com.pathomnemonic.cathology';

/* a pretend Apple: publishes keys, swaps codes (a web swap carries a PKCE verifier, a native swap does not), and records revocations */
let provider: Server; let pbase = '';
let nextClaims: Record<string, unknown> = {};
let tokenRequests: URLSearchParams[] = [];
let revokeRequests: URLSearchParams[] = [];

beforeAll(async () => {
  provider = createServer((req, res) => {
    if (req.url === '/auth/keys') { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ keys: [jwkOf(rsa.publicKey, 'k1', 'RS256')] })); return; }
    if ((req.url === '/auth/token' || req.url === '/auth/revoke') && req.method === 'POST') {
      const chunks: Buffer[] = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => {
        const form = new URLSearchParams(Buffer.concat(chunks).toString());
        res.setHeader('content-type', 'application/json');
        if (req.url === '/auth/revoke') { revokeRequests.push(form); res.end('{}'); return; }
        tokenRequests.push(form);
        if (form.get('code_verifier')) {
          const claims = { iss: ISSUER, aud: SERVICES_ID, exp: Math.floor(Date.now() / 1000) + 600, iat: Math.floor(Date.now() / 1000), ...nextClaims };
          res.end(JSON.stringify({ id_token: makeToken(claims), refresh_token: 'web-refresh-token' }));
        } else {
          res.end(JSON.stringify({ refresh_token: 'native-refresh-token' }));
        }
      }); return;
    }
    res.statusCode = 404; res.end();
  });
  await new Promise<void>((r) => provider.listen(0, '127.0.0.1', r));
  pbase = `http://127.0.0.1:${(provider.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => provider.close(() => r())));

const appleProvider = (clientId: string): Provider => ({
  id: 'apple', name: 'Apple', issuerOk: (iss) => iss === ISSUER, authorizationEndpoint: 'https://issuer.test/authorize', tokenEndpoint: `${pbase}/auth/token`, jwksUri: `${pbase}/auth/keys`,
  clientId, clientSecret: () => 'secret', scopes: ['openid', 'email', 'name'], trustsEmailClaim: (c) => c.email_verified === true || c.email_verified === 'true',
});
const cfgFor = (withNative = true): OAuthConfig => ({ enabled: true, publicUrl: 'http://127.0.0.1:9', providers: [appleProvider(SERVICES_ID)], appleNative: withNative ? appleProvider(BUNDLE_ID) : null, allowInsecure: true });

let app: Server; let base = ''; let db: ReturnType<typeof openDb>;
async function boot(oauth: OAuthConfig) {
  db = openDb(':memory:');
  app = createApp({ db, registration: 'open', sessionDays: 1, allowedOrigins: [], secureCookies: false, registerLimitPerHour: 1000, oauth });
  await new Promise<void>((r) => app.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(app.address() as AddressInfo).port}`;
}
const stop = () => new Promise<void>((r) => app.close(() => r()));
const api = async (method: string, path: string, cookie = '', body?: unknown) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-StudyBible': '1', ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any, cookie: (res.headers.get('set-cookie') ?? '').split(';')[0] };
};
const storedToken = (userId: string) => (db.prepare('SELECT token FROM apple_refresh_tokens WHERE user_id = ?').get(userId) as any)?.token as string | undefined;

/** an identity token straight from the pretend sheet, plus the raw nonce the server is told */
const sheet = (claims: Record<string, unknown>, nonce = 'raw-nonce') => ({
  identityToken: makeToken({ iss: ISSUER, aud: BUNDLE_ID, exp: Math.floor(Date.now() / 1000) + 600, iat: Math.floor(Date.now() / 1000), nonce, ...claims }),
  nonce, code: 'native-code',
});
const register = async (email: string) => {
  const reg = await api('POST', '/api/auth/register', '', { email, password: 'correct horse battery' });
  expect(reg.status).toBe(201);
  return { cookie: reg.cookie, id: reg.body.user.id as string };
};

describe('the stored token marking', () => {
  it('marks native tokens, reads them back bare, and picks the revocation client id from the mark', () => {
    const marked = markIosToken('tok');
    expect(marked).toBe('ios:tok');
    expect(isIosToken(marked)).toBe(true);
    expect(isIosToken('tok')).toBe(false);
    expect(rawRefreshToken(marked)).toBe('tok');
    expect(rawRefreshToken('tok')).toBe('tok');
    expect(revokeTarget(marked, SERVICES_ID, BUNDLE_ID)).toBe(BUNDLE_ID);
    expect(revokeTarget('tok', SERVICES_ID, BUNDLE_ID)).toBe(SERVICES_ID);
  });
  it('builds the native provider from the key material alone, with the bundle id as its client id', () => {
    const ec = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const pem = (ec.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string).replace(/\n/g, '\\n');
    const built = providersFromEnv({ APPLE_TEAM_ID: 'TEAM', APPLE_KEY_ID: 'KEY', APPLE_PRIVATE_KEY: pem });
    expect(built.providers).toEqual([]);
    expect(built.appleNative?.clientId).toBe('com.pathomnemonic.cathology');
    const overridden = providersFromEnv({ APPLE_TEAM_ID: 'TEAM', APPLE_KEY_ID: 'KEY', APPLE_PRIVATE_KEY: pem, APPLE_BUNDLE_ID: 'com.example.other' });
    expect(overridden.appleNative?.clientId).toBe('com.example.other');
  });
});

describe('the native sheet flow through the server', () => {
  beforeAll(() => boot(cfgFor()));
  afterAll(stop);
  beforeEach(() => { clearKeyCache(); tokenRequests = []; revokeRequests = []; });

  it('creates an account, starts a session, and stores a marked token swapped with the bundle id', async () => {
    const r = await api('POST', '/api/auth/oauth/apple/native', '', sheet({ sub: 'a-1', email: 'Native@Example.org', email_verified: 'true', name: 'Nat' }));
    expect(r.status).toBe(200);
    expect(r.body.user).toMatchObject({ email: 'native@example.org', name: 'Nat' });
    expect(r.cookie).toContain('sb_session=');
    expect((await api('GET', '/api/auth/me', r.cookie)).body.user.id).toBe(r.body.user.id);
    expect(storedToken(r.body.user.id)).toBe('ios:native-refresh-token');
    expect(tokenRequests).toHaveLength(1);
    expect(tokenRequests[0].get('client_id')).toBe(BUNDLE_ID);
    expect(tokenRequests[0].get('redirect_uri')).toBeNull();
    expect(tokenRequests[0].get('grant_type')).toBe('authorization_code');
  });

  it('refuses a token whose nonce does not match the attempt, and creates nothing', async () => {
    const before = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as any).n;
    const bad = sheet({ sub: 'a-2', email: 'bad@example.org', email_verified: 'true' }, 'token-nonce');
    bad.nonce = 'different-nonce';
    expect((await api('POST', '/api/auth/oauth/apple/native', '', bad)).status).toBe(401);
    expect((db.prepare('SELECT COUNT(*) AS n FROM users').get() as any).n).toBe(before);
  });

  it('links to a signed in account, and deleting the account revokes with the bundle id', async () => {
    const { cookie, id } = await register('linker@example.org');
    const r = await api('POST', '/api/auth/oauth/apple/native', cookie, { ...sheet({ sub: 'a-3', email: 'other@example.org', email_verified: 'true' }), link: true });
    expect(r.status).toBe(200);
    expect((await api('GET', '/api/account/identities', cookie)).body.identities.map((i: any) => i.provider)).toEqual(['apple']);
    expect(storedToken(id)).toBe('ios:native-refresh-token');
    expect((await api('DELETE', '/api/account', cookie, { password: 'correct horse battery' })).status).toBe(200);
    expect(revokeRequests).toHaveLength(1);
    expect(revokeRequests[0].get('client_id')).toBe(BUNDLE_ID);
    expect(revokeRequests[0].get('token')).toBe('native-refresh-token');
    expect(revokeRequests[0].get('token_type_hint')).toBe('refresh_token');
    expect(storedToken(id)).toBeUndefined();
  });

  it('removing the Apple link revokes with the bundle id and drops the stored token', async () => {
    const { cookie, id } = await register('unlinker@example.org');
    await api('POST', '/api/auth/oauth/apple/native', cookie, { ...sheet({ sub: 'a-4', email: 'u@example.org', email_verified: 'true' }), link: true });
    expect(storedToken(id)).toBe('ios:native-refresh-token');
    expect((await api('DELETE', '/api/account/identities/apple', cookie)).status).toBe(200);
    expect(revokeRequests).toHaveLength(1);
    expect(revokeRequests[0].get('client_id')).toBe(BUNDLE_ID);
    expect(storedToken(id)).toBeUndefined();
  });

  it('stores a web token bare, and deleting the account revokes it with the Services ID', async () => {
    const { cookie, id } = await register('web@example.org');
    const start = await fetch(`${base}/api/auth/oauth/apple/start?link=1`, { redirect: 'manual', headers: { Cookie: cookie } });
    expect(start.status).toBe(302);
    const to = new URL(start.headers.get('location')!);
    nextClaims = { nonce: to.searchParams.get('nonce'), sub: 'a-5', email: 'web@example.org', email_verified: 'true' };
    const end = await fetch(`${base}/api/auth/oauth/apple/callback`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: 'good', state: to.searchParams.get('state')! }).toString() });
    expect(end.headers.get('location')).toMatch(/linked=apple/);
    expect(storedToken(id)).toBe('web-refresh-token');
    expect((await api('DELETE', '/api/account', cookie, { password: 'correct horse battery' })).status).toBe(200);
    expect(revokeRequests).toHaveLength(1);
    expect(revokeRequests[0].get('client_id')).toBe(SERVICES_ID);
    expect(revokeRequests[0].get('token')).toBe('web-refresh-token');
  });

  it('lets a signed in account hand over a sheet code, which replaces the stored token with a marked one', async () => {
    const { cookie, id } = await register('attach@example.org');
    const start = await fetch(`${base}/api/auth/oauth/apple/start?link=1`, { redirect: 'manual', headers: { Cookie: cookie } });
    const to = new URL(start.headers.get('location')!);
    nextClaims = { nonce: to.searchParams.get('nonce'), sub: 'a-6', email: 'attach@example.org', email_verified: 'true' };
    await fetch(`${base}/api/auth/oauth/apple/callback`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: 'good', state: to.searchParams.get('state')! }).toString() });
    expect(storedToken(id)).toBe('web-refresh-token');
    expect((await api('POST', '/api/account/apple-code', cookie, { code: 'native-code' })).status).toBe(200);
    expect(storedToken(id)).toBe('ios:native-refresh-token');
    expect((await api('DELETE', '/api/account', cookie, { password: 'correct horse battery' })).status).toBe(200);
    expect(revokeRequests[0].get('client_id')).toBe(BUNDLE_ID);
  });
});

describe('when the native provider is not configured', () => {
  beforeAll(() => boot(cfgFor(false)));
  afterAll(stop);
  it('has no native route, so the button stays hidden and the endpoint answers 404', async () => {
    expect((await api('POST', '/api/auth/oauth/apple/native', '', sheet({ sub: 'a-9' }))).status).toBe(404);
  });
});
