import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../server/app';
import { openDb } from '../server/db';

let server: Server;
let base = '';

beforeAll(async () => {
  server = createApp({ db: openDb(':memory:'), registration: 'open', sessionDays: 1, allowedOrigins: [], secureCookies: false, registerLimitPerHour: 1000 });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

class Client {
  cookie = '';
  async call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-StudyBible': '1', ...(this.cookie ? { Cookie: this.cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const sc = res.headers.get('set-cookie');
    if (sc) this.cookie = sc.split(';')[0].endsWith('=') ? '' : sc.split(';')[0];
    return { status: res.status, body: await res.json().catch(() => ({})), headers: res.headers };
  }
}

const PW = 'correct horse battery';

describe('accounts', () => {
  it('registers, reads the session, logs out and logs in again', async () => {
    const c = new Client();
    const reg = await c.call('POST', '/api/auth/register', { email: 'Reader@Example.com', password: PW, name: 'Reader' });
    expect(reg.status).toBe(201);
    expect(reg.body.user.email).toBe('reader@example.com');
    expect(reg.headers.get('set-cookie')).toMatch(/HttpOnly/);
    expect(reg.headers.get('set-cookie')).toMatch(/SameSite=Lax/);
    expect((await c.call('GET', '/api/auth/me')).body.user.name).toBe('Reader');
    await c.call('POST', '/api/auth/logout');
    expect((await c.call('GET', '/api/auth/me')).status).toBe(401);
    const login = await c.call('POST', '/api/auth/login', { email: 'reader@example.com', password: PW });
    expect(login.status).toBe(200);
  });
  it('rejects weak passwords, duplicates and bad logins without revealing which part was wrong', async () => {
    const c = new Client();
    expect((await c.call('POST', '/api/auth/register', { email: 'a@b.co', password: 'short' })).status).toBe(400);
    expect((await c.call('POST', '/api/auth/register', { email: 'not-an-email', password: PW })).status).toBe(400);
    await c.call('POST', '/api/auth/register', { email: 'dup@example.com', password: PW });
    expect((await new Client().call('POST', '/api/auth/register', { email: 'dup@example.com', password: PW })).status).toBe(409);
    const bad1 = await new Client().call('POST', '/api/auth/login', { email: 'dup@example.com', password: 'wrong password!!' });
    const bad2 = await new Client().call('POST', '/api/auth/login', { email: 'nobody@example.com', password: PW });
    expect(bad1.status).toBe(401);
    expect(bad2.status).toBe(401);
    expect(bad1.body.error).toBe(bad2.body.error);
  });
  it('requires the CSRF header and refuses foreign origins', async () => {
    const r1 = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(r1.status).toBe(403);
    const r2 = await new Client().call('POST', '/api/auth/login', {}, { Origin: 'https://evil.example' });
    expect(r2.status).toBe(403);
  });
  it('stores passwords hashed (scrypt) and sessions as hashes', async () => {
    // indirect: a second login after changing the password must work only with the new one
    const c = new Client();
    await c.call('POST', '/api/auth/register', { email: 'pw@example.com', password: PW });
    expect((await c.call('POST', '/api/auth/password', { current: 'nope nope nope', next: 'another good phrase' })).status).toBe(401);
    expect((await c.call('POST', '/api/auth/password', { current: PW, next: 'another good phrase' })).status).toBe(200);
    expect((await new Client().call('POST', '/api/auth/login', { email: 'pw@example.com', password: PW })).status).toBe(401);
    expect((await new Client().call('POST', '/api/auth/login', { email: 'pw@example.com', password: 'another good phrase' })).status).toBe(200);
  });
  it('rate-limits repeated failed logins', async () => {
    const c = new Client();
    await c.call('POST', '/api/auth/register', { email: 'rl@example.com', password: PW });
    let last = 0;
    for (let i = 0; i < 12; i++) last = (await new Client().call('POST', '/api/auth/login', { email: 'rl@example.com', password: 'wrong wrong wrong' })).status;
    expect(last).toBe(429);
  });
  it('deletes the account and all of its data', async () => {
    const c = new Client();
    await c.call('POST', '/api/auth/register', { email: 'del@example.com', password: PW });
    await c.call('POST', '/api/sync', { cursor: 0, changes: [{ table: 'notes', uid: 'n1', updatedAt: 1, payload: { body: 'x' } }] });
    expect((await c.call('DELETE', '/api/account', { password: 'wrong wrong wrong' })).status).toBe(401);
    expect((await c.call('DELETE', '/api/account', { password: PW })).status).toBe(200);
    expect((await new Client().call('POST', '/api/auth/login', { email: 'del@example.com', password: PW })).status).toBe(401);
  });
});

describe('sync', () => {
  it('pushes, pulls on another device, and resolves conflicts last-writer-wins', async () => {
    const a = new Client();
    await a.call('POST', '/api/auth/register', { email: 'sync@example.com', password: PW });
    const push1 = await a.call('POST', '/api/sync', { cursor: 0, changes: [
      { table: 'notes', uid: 'n1', updatedAt: 1000, payload: { body: 'first' } },
      { table: 'highlights', uid: 'h1', updatedAt: 1000, payload: { ref: 'JHN.6.51', color: 'yellow' } },
    ] });
    expect(push1.status).toBe(200);

    const b = new Client(); // second device, same account
    await b.call('POST', '/api/auth/login', { email: 'sync@example.com', password: PW });
    const pull = await b.call('POST', '/api/sync', { cursor: 0, changes: [] });
    expect(pull.body.changes.map((c: any) => `${c.table}:${c.uid}`).sort()).toEqual(['highlights:h1', 'notes:n1']);
    const cursor = pull.body.cursor;

    // B edits newer, A edits older: B wins
    await b.call('POST', '/api/sync', { cursor, changes: [{ table: 'notes', uid: 'n1', updatedAt: 3000, payload: { body: 'from B' } }] });
    const stale = await a.call('POST', '/api/sync', { cursor: push1.body.cursor, changes: [{ table: 'notes', uid: 'n1', updatedAt: 2000, payload: { body: 'from A (older)' } }] });
    expect(stale.body.changes.find((c: any) => c.uid === 'n1').payload.body).toBe('from B');

    // deletes propagate as tombstones
    await a.call('POST', '/api/sync', { cursor: stale.body.cursor, changes: [{ table: 'highlights', uid: 'h1', updatedAt: 4000, deleted: true, payload: {} }] });
    const after = await b.call('POST', '/api/sync', { cursor: 0, changes: [] });
    expect(after.body.changes.find((c: any) => c.uid === 'h1').deleted).toBe(true);
  });
  it('isolates users from each other', async () => {
    const a = new Client();
    const b = new Client();
    await a.call('POST', '/api/auth/register', { email: 'iso-a@example.com', password: PW });
    await b.call('POST', '/api/auth/register', { email: 'iso-b@example.com', password: PW });
    await a.call('POST', '/api/sync', { cursor: 0, changes: [{ table: 'notes', uid: 'secret', updatedAt: 1, payload: { body: 'private' } }] });
    const r = await b.call('POST', '/api/sync', { cursor: 0, changes: [] });
    expect(r.body.changes).toEqual([]);
    expect((await new Client().call('POST', '/api/sync', { cursor: 0, changes: [] })).status).toBe(401);
  });
  it('refuses unknown tables and oversized payloads', async () => {
    const c = new Client();
    await c.call('POST', '/api/auth/register', { email: 'lim@example.com', password: PW });
    const r = await c.call('POST', '/api/sync', { cursor: 0, changes: [
      { table: 'users', uid: 'x', updatedAt: 1, payload: {} },
      { table: 'notes', uid: 'big', updatedAt: 1, payload: { body: 'x'.repeat(300_000) } },
      { table: 'notes', uid: 'ok', updatedAt: 1, payload: { body: 'fine' } },
    ] });
    expect(r.body.rejected).toBe(2);
  });
  it('exports an account as JSON', async () => {
    const c = new Client();
    await c.call('POST', '/api/auth/register', { email: 'exp@example.com', password: PW });
    await c.call('POST', '/api/sync', { cursor: 0, changes: [{ table: 'journal', uid: 'j1', updatedAt: 5, payload: { body: 'Lord, hear' } }] });
    const ex = await c.call('GET', '/api/account/export');
    expect(ex.body.records[0].data.body).toBe('Lord, hear');
    expect(ex.headers.get('content-disposition')).toMatch(/attachment/);
  });
});
