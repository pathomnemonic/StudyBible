import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../server/app';
import { openDb } from '../server/db';
import { hashToken } from '../server/auth';
import { totpAt } from '../server/security';

let server: Server;
let base = '';
const db = openDb(':memory:');
beforeAll(async () => {
  server = createApp({ db, registration: 'closed', sessionDays: 1, allowedOrigins: [], secureCookies: false, registerLimitPerHour: 1000 });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

class Client {
  cookie = '';
  async call(method: string, path: string, body?: unknown) {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-StudyBible': '1', ...(this.cookie ? { Cookie: this.cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const sc = res.headers.get('set-cookie');
    if (sc) this.cookie = sc.split(';')[0].endsWith('=') ? '' : sc.split(';')[0];
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }
}
const PW = 'correct horse battery';
const nowCode = (secret: string, offset = 0) => totpAt(secret, Math.floor(Date.now() / 30_000) + offset);

describe('invites on a closed server', () => {
  it('the first account needs no invite; later ones need an unused, unexpired one', async () => {
    const owner = new Client();
    expect((await owner.call('POST', '/api/auth/register', { email: 'owner@example.com', password: PW })).status).toBe(201);
    const other = new Client();
    expect((await other.call('POST', '/api/auth/register', { email: 'a@example.com', password: PW })).status).toBe(403);
    expect((await other.call('POST', '/api/auth/register', { email: 'a@example.com', password: PW, invite: 'nope' })).status).toBe(403);
    db.prepare('INSERT INTO invites (code_hash, created_at, expires_at) VALUES (?, ?, ?)').run(hashToken('GOODCODE'), Date.now(), Date.now() + 1e6);
    expect((await other.call('POST', '/api/auth/register', { email: 'a@example.com', password: PW, invite: 'GOODCODE' })).status).toBe(201);
    const third = new Client();
    expect((await third.call('POST', '/api/auth/register', { email: 'b@example.com', password: PW, invite: 'GOODCODE' })).status).toBe(403);
    db.prepare('INSERT INTO invites (code_hash, created_at, expires_at) VALUES (?, ?, ?)').run(hashToken('OLDCODE'), Date.now() - 2e6, Date.now() - 1e6);
    expect((await third.call('POST', '/api/auth/register', { email: 'b@example.com', password: PW, invite: 'OLDCODE' })).status).toBe(403);
  });
});

describe('two-factor sign-in', () => {
  it('turns on with a real code, then asks for one at sign-in, and each code works once', async () => {
    const c = new Client();
    await c.call('POST', '/api/auth/login', { email: 'owner@example.com', password: PW });
    expect((await c.call('POST', '/api/account/2fa/start', { password: 'wrong wrong wrong' })).status).toBe(401);
    const start = await c.call('POST', '/api/account/2fa/start', { password: PW });
    expect(start.status).toBe(200);
    expect(start.body.otpauth).toMatch(/^otpauth:\/\/totp\//);
    const secret = start.body.secret as string;
    expect((await c.call('POST', '/api/account/2fa/confirm', { code: '000000' })).status).toBe(400);
    const confirm = await c.call('POST', '/api/account/2fa/confirm', { code: nowCode(secret) });
    expect(confirm.status).toBe(200);
    const recovery = confirm.body.recoveryCodes as string[];
    expect(recovery).toHaveLength(10);
    expect((await c.call('GET', '/api/account/2fa')).body).toEqual({ enabled: true, recoveryCodesLeft: 10 });

    const d = new Client();
    const noCode = await d.call('POST', '/api/auth/login', { email: 'owner@example.com', password: PW });
    expect(noCode.status).toBe(401);
    expect(noCode.body.error ?? noCode.body.message ?? '').toMatch(/code/i);
    expect((await d.call('POST', '/api/auth/login', { email: 'owner@example.com', password: PW, code: '123456' })).status).toBe(401);
    // the code used to turn it on cannot be replayed at once; the next step's code is fine
    expect((await d.call('POST', '/api/auth/login', { email: 'owner@example.com', password: PW, code: nowCode(secret, 1) })).status).toBe(200);
    expect((await d.call('GET', '/api/auth/me')).status).toBe(200);

    // a recovery code works exactly once
    const e = new Client();
    expect((await e.call('POST', '/api/auth/login', { email: 'owner@example.com', password: PW, code: recovery[0] })).status).toBe(200);
    const f = new Client();
    expect((await f.call('POST', '/api/auth/login', { email: 'owner@example.com', password: PW, code: recovery[0] })).status).toBe(401);
    expect((await c.call('GET', '/api/account/2fa')).body.recoveryCodesLeft).toBe(9);

    // renewing codes needs the password, and old codes stop working
    expect((await c.call('POST', '/api/account/2fa/recovery', { password: 'bad bad bad bad' })).status).toBe(401);
    const renewed = await c.call('POST', '/api/account/2fa/recovery', { password: PW });
    expect(renewed.body.recoveryCodes).toHaveLength(10);
    const g = new Client();
    expect((await g.call('POST', '/api/auth/login', { email: 'owner@example.com', password: PW, code: recovery[1] })).status).toBe(401);

    // turning it off needs the password and a code
    expect((await c.call('POST', '/api/account/2fa/disable', { password: PW, code: '111111' })).status).toBe(401);
    expect((await c.call('POST', '/api/account/2fa/disable', { password: PW, code: renewed.body.recoveryCodes[0] })).status).toBe(200);
    const h = new Client();
    expect((await h.call('POST', '/api/auth/login', { email: 'owner@example.com', password: PW })).status).toBe(200);
  });
});

describe('lock-out, reset codes, profile and the security log', () => {
  it('locks an account after repeated wrong passwords and releases it when the time passes', async () => {
    const c = new Client();
    await c.call('POST', '/api/auth/register', { email: 'a@example.com', password: PW }); // already exists: harmless
    for (let i = 0; i < 8; i++) expect((await c.call('POST', '/api/auth/login', { email: 'a@example.com', password: 'wrong wrong wrong' })).status).toBe(401);
    const locked = await c.call('POST', '/api/auth/login', { email: 'a@example.com', password: PW });
    expect(locked.status).toBe(429);
    db.prepare('UPDATE users SET locked_until = 0 WHERE email = ?').run('a@example.com');
    expect((await c.call('POST', '/api/auth/login', { email: 'a@example.com', password: PW })).status).toBe(200);
  });

  it('resets a password with an operator code once, signing out every device', async () => {
    const dev = new Client();
    await dev.call('POST', '/api/auth/login', { email: 'a@example.com', password: PW });
    const uid = (db.prepare('SELECT id FROM users WHERE email = ?').get('a@example.com') as any).id;
    db.prepare('INSERT INTO reset_tokens (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(hashToken('RESETME'), uid, Date.now(), Date.now() + 1e6);
    const anon = new Client();
    expect((await anon.call('POST', '/api/auth/reset', { code: 'WRONG', password: 'a brand new passphrase' })).status).toBe(400);
    expect((await anon.call('POST', '/api/auth/reset', { code: 'RESETME', password: 'short' })).status).toBe(400);
    expect((await anon.call('POST', '/api/auth/reset', { code: 'RESETME', password: 'a brand new passphrase' })).status).toBe(200);
    expect((await anon.call('POST', '/api/auth/reset', { code: 'RESETME', password: 'another new passphrase' })).status).toBe(400);
    expect((await dev.call('GET', '/api/auth/me')).status).toBe(401);
    expect((await new Client().call('POST', '/api/auth/login', { email: 'a@example.com', password: 'a brand new passphrase' })).status).toBe(200);
  });

  it('changes the display name and the email (with the password), and keeps a log that holds no secrets', async () => {
    const c = new Client();
    await c.call('POST', '/api/auth/login', { email: 'a@example.com', password: 'a brand new passphrase' });
    expect((await c.call('PATCH', '/api/account/profile', { name: '  Anna  ' })).body.user.name).toBe('Anna');
    expect((await c.call('POST', '/api/account/email', { email: 'new@example.com', password: 'bad bad bad bad' })).status).toBe(401);
    expect((await c.call('POST', '/api/account/email', { email: 'owner@example.com', password: 'a brand new passphrase' })).status).toBe(409);
    expect((await c.call('POST', '/api/account/email', { email: 'New@Example.com', password: 'a brand new passphrase' })).body.user.email).toBe('new@example.com');
    const log = await c.call('GET', '/api/account/security-log');
    const events = (log.body.events as { event: string; detail?: string }[]).map((e) => e.event);
    expect(events).toEqual(expect.arrayContaining(['signed-in', 'email-changed', 'password-reset', 'wrong-password']));
    expect(JSON.stringify(log.body)).not.toMatch(/passphrase|RESETME/);
  });
});
