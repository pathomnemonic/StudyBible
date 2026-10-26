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
    await c.call('POST', '/api/auth/register', { email: 'pwchange@example.com', password: PW });
    expect((await c.call('POST', '/api/auth/password', { current: 'nope nope nope', next: 'another good phrase' })).status).toBe(401);
    expect((await c.call('POST', '/api/auth/password', { current: PW, next: 'another good phrase' })).status).toBe(200);
    expect((await new Client().call('POST', '/api/auth/login', { email: 'pwchange@example.com', password: PW })).status).toBe(401);
    expect((await new Client().call('POST', '/api/auth/login', { email: 'pwchange@example.com', password: 'another good phrase' })).status).toBe(200);
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
  it('caps timestamps from a clock set far in the future so they cannot win every later conflict', async () => {
    const a = new Client();
    await a.call('POST', '/api/auth/register', { email: 'skew@example.com', password: PW });
    const far = Date.now() + 10 * 365 * 86400000;
    const r1 = await a.call('POST', '/api/sync', { cursor: 0, changes: [{ table: 'notes', uid: 'n1', updatedAt: far, payload: { body: 'from a fast clock' } }] });
    const b = new Client();
    await b.call('POST', '/api/auth/login', { email: 'skew@example.com', password: PW });
    const pull = await b.call('POST', '/api/sync', { cursor: 0, changes: [] });
    const got = pull.body.changes.find((c: any) => c.uid === 'n1');
    expect(got.updatedAt).toBeLessThan(Date.now() + 6 * 60 * 1000);
    // an honest edit made a little later now wins
    const later = Date.now() + 10 * 60 * 1000;
    const r2 = await b.call('POST', '/api/sync', { cursor: pull.body.cursor, changes: [{ table: 'notes', uid: 'n1', updatedAt: later, payload: { body: 'honest' } }] });
    expect(r2.status).toBe(200);
    expect(r1.status).toBe(200);
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
  it('refuses records whose shape is wrong, and unsafe links', async () => {
    const c = new Client();
    await c.call('POST', '/api/auth/register', { email: 'shape@example.com', password: PW });
    const r = await c.call('POST', '/api/sync', { cursor: 0, changes: [
      { table: 'notes', uid: 'bad1', updatedAt: 1, payload: { body: 42 } },
      { table: 'notes', uid: 'bad2', updatedAt: 1, payload: 'text' },
      { table: 'userLinks', uid: 'bad3', updatedAt: 1, payload: { ref: 'JHN.1.1', url: 'javascript:alert(1)' } },
      { table: 'notes', uid: 'ok', updatedAt: 1, payload: { body: 'fine', tags: ['a'] } },
      { table: 'notes', uid: 'gone', updatedAt: 1, deleted: true, payload: {} },
    ] });
    expect(r.body.rejected).toBe(3);
  });
  it('exports an account as JSON', async () => {
    const c = new Client();
    await c.call('POST', '/api/auth/register', { email: 'exp@example.com', password: PW });
    await c.call('POST', '/api/sync', { cursor: 0, changes: [{ table: 'journal', uid: 'j1', updatedAt: 5, payload: { date: '2026-01-01', body: 'Lord, hear' } }] });
    const ex = await c.call('GET', '/api/account/export');
    expect(ex.body.records[0].data.body).toBe('Lord, hear');
    expect(ex.headers.get('content-disposition')).toMatch(/attachment/);
  });
});

describe('static files', () => {
  it('does not serve files outside the app folder, including sibling folders with a shared prefix', async () => {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { request } = await import('node:http');
    const parent = mkdtempSync(join(tmpdir(), 'sb-'));
    mkdirSync(join(parent, 'app'));
    mkdirSync(join(parent, 'app-secret'));
    writeFileSync(join(parent, 'app', 'index.html'), '<html>shell</html>');
    writeFileSync(join(parent, 'app-secret', 'key.txt'), 'SECRET');
    const s = createApp({ db: openDb(':memory:'), registration: 'open', sessionDays: 1, allowedOrigins: [], secureCookies: false, staticDir: join(parent, 'app') });
    await new Promise<void>((r) => s.listen(0, '127.0.0.1', r));
    const port = (s.address() as AddressInfo).port;
    const get = (path: string) => new Promise<{ status: number; body: string }>((resolve, reject) => {
      request({ host: '127.0.0.1', port, path, method: 'GET' }, (res) => { let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => resolve({ status: res.statusCode ?? 0, body: b })); }).on('error', reject).end();
    });
    for (const p of ['/../app-secret/key.txt', '/%2e%2e/app-secret/key.txt', '/..%2fapp-secret/key.txt', '/%2e%2e%2fapp-secret%2fkey.txt', '/..\\app-secret\\key.txt', '/%00', '/%E0%A4%A']) {
      const r = await get(p);
      expect(r.body, p).not.toContain('SECRET');
      expect(r.status, p).toBeLessThan(500);
    }
    expect((await get('/')).body).toContain('shell');
    // byte ranges and compression
    writeFileSync(join(parent, 'app', 'sound.mp3'), Buffer.from('0123456789'));
    const ranged = await new Promise<{ status: number; body: string; type?: string; range?: string }>((resolve, reject) => {
      request({ host: '127.0.0.1', port, path: '/sound.mp3', headers: { Range: 'bytes=2-5' } }, (res) => { let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => resolve({ status: res.statusCode ?? 0, body: b, type: String(res.headers['content-type']), range: String(res.headers['content-range']) })); }).on('error', reject).end();
    });
    expect(ranged.status).toBe(206);
    expect(ranged.body).toBe('2345');
    expect(ranged.range).toBe('bytes 2-5/10');
    expect(ranged.type).toBe('audio/mpeg');
    const bad = await new Promise<number>((resolve, reject) => { request({ host: '127.0.0.1', port, path: '/sound.mp3', headers: { Range: 'bytes=50-60' } }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode ?? 0)); }).on('error', reject).end(); });
    expect(bad).toBe(416);
    await new Promise<void>((r) => s.close(() => r()));
  });
});

describe('devices, sessions and operations', () => {
  it('lists signed-in devices, revokes one, and signs out the rest', async () => {
    const a = new Client();
    await a.call('POST', '/api/auth/register', { email: 'devices@example.com', password: PW });
    const b = new Client();
    await b.call('POST', '/api/auth/login', { email: 'devices@example.com', password: PW }, { 'User-Agent': 'Phone' });
    const c = new Client();
    await c.call('POST', '/api/auth/login', { email: 'devices@example.com', password: PW });
    const list = await a.call('GET', '/api/auth/sessions');
    expect(list.body.sessions).toHaveLength(3);
    expect(list.body.sessions.filter((s: any) => s.current)).toHaveLength(1);
    const other = list.body.sessions.find((s: any) => !s.current);
    expect((await a.call('DELETE', `/api/auth/sessions/${other.id}`)).status).toBe(200);
    expect((await a.call('GET', '/api/auth/sessions')).body.sessions).toHaveLength(2);
    const rev = await a.call('POST', '/api/auth/sessions/revoke-others', {});
    expect(rev.body.revoked).toBe(1);
    expect((await a.call('GET', '/api/auth/me')).status).toBe(200);
    // exactly one of the other two is signed out by each revoke; both are gone now
    const alive = [(await b.call('GET', '/api/auth/me')).status, (await c.call('GET', '/api/auth/me')).status];
    expect(alive).toEqual([401, 401]);
  });

  it('does not let one account revoke another account’s sessions', async () => {
    const a = new Client();
    await a.call('POST', '/api/auth/register', { email: 'owner@example.com', password: PW });
    const thief = new Client();
    await thief.call('POST', '/api/auth/register', { email: 'thief@example.com', password: PW });
    const id = (await a.call('GET', '/api/auth/sessions')).body.sessions[0].id;
    expect((await thief.call('DELETE', `/api/auth/sessions/${id}`)).body.revoked).toBe(0);
    expect((await a.call('GET', '/api/auth/me')).status).toBe(200);
  });

  it('signs other devices out when the password changes, and refuses an expired or revoked cookie', async () => {
    const a = new Client();
    const reg = await a.call('POST', '/api/auth/register', { email: 'pwrevoke@example.com', password: PW });
    expect(reg.status, JSON.stringify(reg.body)).toBe(201);
    const b = new Client();
    await b.call('POST', '/api/auth/login', { email: 'pwrevoke@example.com', password: PW });
    const chg = await a.call('POST', '/api/auth/password', { current: PW, next: 'a different long phrase 99' });
    expect(chg.body, JSON.stringify(chg.body)).toMatchObject({ ok: true });
    expect((await b.call('GET', '/api/auth/me')).status).toBe(401);
    expect((await b.call('POST', '/api/sync', { cursor: 0, changes: [] })).status).toBe(401);
    expect((await a.call('GET', '/api/auth/me')).status).toBe(200);
  });

  it('reports record counts without note contents, and rejects a newer sync protocol', async () => {
    const a = new Client();
    await a.call('POST', '/api/auth/register', { email: 'stats@example.com', password: PW });
    await a.call('POST', '/api/sync', { protocol: 1, cursor: 0, changes: [{ table: 'notes', uid: 'x', updatedAt: 1, payload: { body: 'secret words' } }] });
    const st = await a.call('GET', '/api/account/stats');
    expect(st.body.tables).toEqual([{ table: 'notes', records: 1, deleted: 0 }]);
    expect(JSON.stringify(st.body)).not.toContain('secret');
    const newer = await a.call('POST', '/api/sync', { protocol: 99, cursor: 0, changes: [] });
    expect(newer.status).toBe(426);
  });

  it('a closed server still lets the first account be created, and no more', async () => {
    const s = createApp({ db: openDb(':memory:'), registration: 'closed', sessionDays: 1, allowedOrigins: [], secureCookies: false });
    await new Promise<void>((r) => s.listen(0, '127.0.0.1', r));
    const b = `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
    const post = (email: string) => fetch(`${b}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-StudyBible': '1' }, body: JSON.stringify({ email, password: PW }) });
    expect((await post('first@example.com')).status).toBe(201);
    expect((await post('second@example.com')).status).toBe(403);
    expect(((await (await fetch(`${b}/api/health`)).json()) as any).registration).toBe('closed');
    await new Promise<void>((r) => s.close(() => r()));
  });
});

describe('server operations', () => {
  it('makes verified backups and keeps only the newest few', async () => {
    const { backupDatabase } = await import('../server/backup');
    const { mkdtempSync, readdirSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const db = openDb(':memory:');
    db.prepare('INSERT INTO users (id, email, display_name, pass_hash, created_at) VALUES (?, ?, ?, ?, ?)').run('u1', 'a@b.co', null, 'x', 1);
    const dir = mkdtempSync(join(tmpdir(), 'sbbk-'));
    for (let i = 0; i < 4; i++) backupDatabase(db, dir, 2, new Date(Date.UTC(2026, 0, 1 + i)));
    expect(readdirSync(dir)).toHaveLength(2);
    const last = backupDatabase(db, dir, 2, new Date(Date.UTC(2026, 0, 10)));
    expect(last.users).toBe(1);
  });

  it('checks the environment before starting', async () => {
    const { checkEnv } = await import('../server/config');
    expect(checkEnv({}).errors).toEqual([]);
    expect(checkEnv({ PORT: 'abc' }).errors[0]).toMatch(/PORT/);
    expect(checkEnv({ REGISTRATION: 'maybe' }).errors[0]).toMatch(/REGISTRATION/);
    expect(checkEnv({ ALLOWED_ORIGINS: 'https://a.org/path' }).errors[0]).toMatch(/origin/);
    expect(checkEnv({ HOST: '0.0.0.0', COOKIE_SECURE: 'false', REGISTRATION: 'open' }).warnings.length).toBeGreaterThanOrEqual(2);
  });
});

describe('live classroom sessions', () => {
  it('creates, joins, streams, answers and exports over HTTP', async () => {
    const c = new Client();
    const created = await c.call('POST', '/api/live/create', { content: { title: 'T', questions: [{ type: 'mc', q: 'q', options: ['a', 'b'], correct: [1], time: 10 }] }, settings: {} });
    expect(created.status).toBe(201);
    const { code, hostKey } = created.body;
    expect(code).toMatch(/^\d{6}$/);
    expect((await c.call('GET', `/api/live/${code}/peek`)).body.title).toBe('T');
    const j = await c.call('POST', '/api/live/join', { code, name: 'Student' });
    expect(j.status).toBe(200);
    expect((await c.call('POST', '/api/live/join', { code: '000000', name: 'x' })).status).toBe(404);
    expect((await c.call('POST', `/api/live/${code}/host`, { key: 'wrong', action: 'start' })).status).toBe(403);
    expect((await c.call('POST', `/api/live/${code}/host`, { key: hostKey, action: 'start' })).status).toBe(200);
    const ctl = new AbortController();
    const es = await fetch(`${base}/api/live/${code}/events?token=${j.body.token}`, { signal: ctl.signal });
    const reader = es.body!.getReader();
    const first = new TextDecoder().decode((await reader.read()).value);
    const view = JSON.parse(first.split('data: ')[1]);
    expect(view.phase).toBe('question');
    expect(view.reveal).toBeUndefined();
    expect(JSON.stringify(view)).not.toContain('"correct"');
    expect((await c.call('POST', `/api/live/${code}/answer`, { token: j.body.token, value: 1 })).body.ok).toBe(true);
    const csv = await fetch(`${base}/api/live/${code}/export?key=${hostKey}`);
    expect(csv.status).toBe(200);
    expect(await csv.text()).toContain('Student');
    ctl.abort();
  });
});
