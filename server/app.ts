import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, statSync, createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { DatabaseSync } from 'node:sqlite';
import { RateLimiter, hashPassword, hashToken, newToken, passwordProblem, validateEmail, verifyPassword } from './auth';

export interface Config {
  db: DatabaseSync;
  /** directory with the built web app to serve (optional) */
  staticDir?: string;
  registration: 'open' | 'closed';
  sessionDays: number;
  /** extra allowed Origins for cross-origin dev setups */
  allowedOrigins: string[];
  secureCookies: 'auto' | boolean;
  /** sign-ups allowed per IP per hour (default 5) */
  registerLimitPerHour?: number;
}

const MAX_BODY = 6 * 1024 * 1024;
const MAX_CHANGES = 1000;
const MAX_PAYLOAD = 256 * 1024;
const MAX_RECORDS_PER_USER = 200_000;
const SYNC_TABLES = new Set(['notes', 'highlights', 'bookmarks', 'folders', 'collections', 'userXrefs', 'journal', 'userPlans', 'saved', 'media', 'userLinks', 'planProgress', 'episodeProgress', 'libraryProgress', 'queue', 'savedSearches', 'memory', 'settings']);

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json' };

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "media-src https: blob:",
  "connect-src 'self' https://litcal.johnromanodorazio.com",
  "frame-src https://fireside.fm https://www.youtube-nocookie.com https://open.spotify.com https://embed.podcasts.apple.com https://player.vimeo.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export function createApp(cfg: Config): Server {
  const { db } = cfg;
  const loginLimit = new RateLimiter(10, 10 * 60_000);
  const registerLimit = new RateLimiter(cfg.registerLimitPerHour ?? 5, 60 * 60_000);
  const q = {
    userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    userById: db.prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?'),
    insertUser: db.prepare('INSERT INTO users (id, email, display_name, pass_hash, created_at) VALUES (?, ?, ?, ?, ?)'),
    insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)'),
    session: db.prepare('SELECT s.user_id, s.expires_at FROM sessions s WHERE s.token_hash = ?'),
    delSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    delUserSessions: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
    delUser: db.prepare('DELETE FROM users WHERE id = ?'),
    setPass: db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?'),
    bump: db.prepare('UPDATE users SET seq = seq + 1 WHERE id = ? RETURNING seq'),
    getRec: db.prepare('SELECT updated_at FROM records WHERE user_id = ? AND tbl = ? AND uid = ?'),
    upsert: db.prepare(`INSERT INTO records (user_id, tbl, uid, updated_at, deleted, payload, seq) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, tbl, uid) DO UPDATE SET updated_at = excluded.updated_at, deleted = excluded.deleted, payload = excluded.payload, seq = excluded.seq`),
    since: db.prepare('SELECT tbl, uid, updated_at, deleted, payload, seq FROM records WHERE user_id = ? AND seq > ? ORDER BY seq LIMIT ?'),
    count: db.prepare('SELECT COUNT(*) AS n FROM records WHERE user_id = ?'),
    all: db.prepare('SELECT tbl, uid, updated_at, deleted, payload FROM records WHERE user_id = ? AND deleted = 0'),
    expire: db.prepare('DELETE FROM sessions WHERE expires_at < ?'),
  };

  const isSecure = (req: IncomingMessage) => (cfg.secureCookies === 'auto' ? req.headers['x-forwarded-proto'] === 'https' : cfg.secureCookies);
  const clientIp = (req: IncomingMessage) => String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '').split(',')[0].trim();

  function json(res: ServerResponse, status: number, body: unknown, headers: Record<string, string | string[]> = {}) {
    const data = Buffer.from(JSON.stringify(body));
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': data.length, ...headers });
    res.end(data);
  }

  async function readJson(req: IncomingMessage): Promise<any> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const c of req) {
      size += (c as Buffer).length;
      if (size > MAX_BODY) throw new HttpError(413, 'Request too large.');
      chunks.push(c as Buffer);
    }
    if (!chunks.length) return {};
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new HttpError(400, 'Invalid JSON.');
    }
  }

  function cookie(req: IncomingMessage, name: string): string | null {
    const h = req.headers.cookie;
    if (!h) return null;
    for (const part of h.split(';')) {
      const [k, ...v] = part.trim().split('=');
      if (k === name) return decodeURIComponent(v.join('='));
    }
    return null;
  }

  function sessionCookie(req: IncomingMessage, token: string, maxAgeSec: number) {
    return `sb_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}${isSecure(req) ? '; Secure' : ''}`;
  }

  function auth(req: IncomingMessage): { id: string } | null {
    const t = cookie(req, 'sb_session');
    if (!t) return null;
    const row = q.session.get(hashToken(t)) as any;
    if (!row || row.expires_at < Date.now()) return null;
    return { id: row.user_id };
  }

  /** CSRF: state-changing requests must carry our header and, if an Origin is sent, come from this host or an allowed origin. */
  function csrfCheck(req: IncomingMessage) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return;
    if (req.headers['x-studybible'] !== '1') throw new HttpError(403, 'Missing X-StudyBible header.');
    const origin = req.headers.origin;
    if (origin) {
      const host = req.headers.host;
      const ok = origin === `http://${host}` || origin === `https://${host}` || cfg.allowedOrigins.includes(origin);
      if (!ok) throw new HttpError(403, 'Cross-origin request refused.');
    }
  }

  async function startSession(req: IncomingMessage, res: ServerResponse, userId: string, status = 200) {
    const token = newToken();
    const now = Date.now();
    const exp = now + cfg.sessionDays * 86400_000;
    q.insertSession.run(hashToken(token), userId, now, exp, String(req.headers['user-agent'] ?? '').slice(0, 200));
    const user = q.userById.get(userId) as any;
    json(res, status, { user: pub(user) }, { 'Set-Cookie': sessionCookie(req, token, cfg.sessionDays * 86400) });
  }

  const pub = (u: any) => ({ id: u.id, email: u.email, name: u.display_name ?? null, createdAt: u.created_at });

  function deleteUserData(userId: string) {
    q.delUserSessions.run(userId);
    db.prepare('DELETE FROM records WHERE user_id = ?').run(userId);
    q.delUser.run(userId);
  }

  async function api(req: IncomingMessage, res: ServerResponse, path: string) {
    csrfCheck(req);
    const method = req.method ?? 'GET';

    if (path === '/api/health' && method === 'GET') {
      return json(res, 200, { ok: true, registration: cfg.registration, name: 'studybible-sync', version: 1 });
    }

    if (path === '/api/auth/register' && method === 'POST') {
      if (cfg.registration !== 'open') throw new HttpError(403, 'Registration is closed on this server.');
      if (!registerLimit.take(clientIp(req))) throw new HttpError(429, 'Too many sign-ups from this address. Try again later.');
      const b = await readJson(req);
      const email = validateEmail(b.email);
      if (!email) throw new HttpError(400, 'Enter a valid email address.');
      const pp = passwordProblem(b.password, email);
      if (pp) throw new HttpError(400, pp);
      if (q.userByEmail.get(email)) throw new HttpError(409, 'An account with that email already exists. Try signing in.');
      const id = randomUUID();
      const name = typeof b.name === 'string' ? b.name.trim().slice(0, 80) || null : null;
      q.insertUser.run(id, email, name, await hashPassword(b.password), Date.now());
      return startSession(req, res, id, 201);
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const b = await readJson(req);
      const email = validateEmail(b.email);
      const key = `${clientIp(req)}|${email ?? ''}`;
      if (!loginLimit.take(key)) throw new HttpError(429, 'Too many attempts. Wait a few minutes and try again.');
      const u = email ? (q.userByEmail.get(email) as any) : null;
      // Always spend the hashing time so response timing does not reveal whether the account exists.
      const ok = u ? await verifyPassword(String(b.password ?? ''), u.pass_hash) : (await verifyPassword('x', await hashPassword('x')), false);
      if (!u || !ok) throw new HttpError(401, 'Email or password is incorrect.');
      loginLimit.reset(key);
      return startSession(req, res, u.id);
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      const t = cookie(req, 'sb_session');
      if (t) q.delSession.run(hashToken(t));
      return json(res, 200, { ok: true }, { 'Set-Cookie': `sb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${isSecure(req) ? '; Secure' : ''}` });
    }

    const me = auth(req);
    if (!me) throw new HttpError(401, 'Not signed in.');

    if (path === '/api/auth/me' && method === 'GET') return json(res, 200, { user: pub(q.userById.get(me.id)) });

    if (path === '/api/auth/password' && method === 'POST') {
      const b = await readJson(req);
      const u = q.userByEmail.get((q.userById.get(me.id) as any).email) as any;
      if (!(await verifyPassword(String(b.current ?? ''), u.pass_hash))) throw new HttpError(401, 'Current password is incorrect.');
      const pp = passwordProblem(b.next, u.email);
      if (pp) throw new HttpError(400, pp);
      q.setPass.run(await hashPassword(b.next), me.id);
      // sign out other devices, keep this one
      const keep = hashToken(cookie(req, 'sb_session')!);
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(me.id, keep);
      return json(res, 200, { ok: true });
    }

    if (path === '/api/account' && method === 'DELETE') {
      const b = await readJson(req);
      const u = q.userByEmail.get((q.userById.get(me.id) as any).email) as any;
      if (!(await verifyPassword(String(b.password ?? ''), u.pass_hash))) throw new HttpError(401, 'Password is incorrect.');
      deleteUserData(me.id);
      return json(res, 200, { ok: true, deleted: true }, { 'Set-Cookie': `sb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0` });
    }

    if (path === '/api/account/export' && method === 'GET') {
      const rows = (q.all.all(me.id) as any[]).map((r) => ({ table: r.tbl, uid: r.uid, updatedAt: r.updated_at, data: JSON.parse(r.payload) }));
      return json(res, 200, { format: 'studybible-server-export', exportedAt: new Date().toISOString(), user: pub(q.userById.get(me.id)), records: rows }, { 'Content-Disposition': 'attachment; filename="studybible-account-export.json"' });
    }

    if (path === '/api/sync' && method === 'POST') {
      const b = await readJson(req);
      const cursor = Number.isFinite(b.cursor) ? Math.max(0, Math.floor(b.cursor)) : 0;
      const changes: any[] = Array.isArray(b.changes) ? b.changes : [];
      if (changes.length > MAX_CHANGES) throw new HttpError(413, `Send at most ${MAX_CHANGES} changes per request.`);
      let rejected = 0;
      const mine = new Set<string>();
      db.exec('BEGIN IMMEDIATE');
      try {
        const total = (q.count.get(me.id) as any).n as number;
        let added = 0;
        for (const c of changes) {
          if (!c || typeof c.table !== 'string' || !SYNC_TABLES.has(c.table) || typeof c.uid !== 'string' || c.uid.length > 200 || !Number.isFinite(c.updatedAt)) {
            rejected++;
            continue;
          }
          const payload = JSON.stringify(c.payload ?? {});
          if (payload.length > MAX_PAYLOAD) {
            rejected++;
            continue;
          }
          const ex = q.getRec.get(me.id, c.table, c.uid) as any;
          if (ex && ex.updated_at > c.updatedAt) continue; // server copy is newer: client will receive it below
          if (!ex && total + added >= MAX_RECORDS_PER_USER) {
            rejected++;
            continue;
          }
          const seq = (q.bump.get(me.id) as any).seq as number;
          q.upsert.run(me.id, c.table, c.uid, Math.floor(c.updatedAt), c.deleted ? 1 : 0, payload, seq);
          mine.add(`${c.table}|${c.uid}`);
          if (!ex) added++;
        }
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
      const page = q.since.all(me.id, cursor, 2000) as any[];
      const rows = page.filter((r) => !mine.has(`${r.tbl}|${r.uid}`));
      const last = page.length ? page[page.length - 1].seq : cursor;
      const more = page.length >= 2000;
      return json(res, 200, {
        cursor: last,
        more,
        rejected,
        changes: rows.map((r) => ({ table: r.tbl, uid: r.uid, updatedAt: r.updated_at, deleted: !!r.deleted, payload: JSON.parse(r.payload) })),
      });
    }

    throw new HttpError(404, 'Not found.');
  }

  function serveStatic(req: IncomingMessage, res: ServerResponse, urlPath: string) {
    const root = resolve(cfg.staticDir!);
    let rel = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
    let file = resolve(join(root, rel));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html'); // SPA fallback
    const ext = extname(file);
    const headers: Record<string, string> = {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': CSP,
      'Cache-Control': /\/assets\//.test(file) ? 'public, max-age=31536000, immutable' : file.endsWith('index.html') || file.endsWith('sw.js') ? 'no-cache' : 'public, max-age=3600',
    };
    const compressible = ['.html', '.js', '.css', '.json', '.svg', '.webmanifest', '.txt'].includes(ext);
    if (compressible && String(req.headers['accept-encoding'] ?? '').includes('gzip')) {
      const body = gzipSync(readFileSync(file));
      res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', 'Content-Length': body.length, Vary: 'Accept-Encoding' });
      res.end(body);
    } else {
      res.writeHead(200, { ...headers, 'Content-Length': statSync(file).size });
      createReadStream(file).pipe(res);
    }
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://x');
      if (url.pathname.startsWith('/api/')) {
        if (req.method === 'OPTIONS') {
          const origin = req.headers.origin;
          if (origin && cfg.allowedOrigins.includes(origin)) {
            res.writeHead(204, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Content-Type, X-StudyBible', 'Access-Control-Allow-Methods': 'GET, POST, DELETE', Vary: 'Origin' });
          } else res.writeHead(204);
          return res.end();
        }
        const origin = req.headers.origin;
        if (origin && cfg.allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Vary', 'Origin');
        }
        q.expire.run(Date.now());
        return await api(req, res, url.pathname);
      }
      if (cfg.staticDir) return serveStatic(req, res, url.pathname);
      res.writeHead(404).end();
    } catch (e: any) {
      if (e instanceof HttpError) return json(res, e.status, { error: e.message });
      console.error('server error', e);
      json(res, 500, { error: 'Something went wrong on the server.' });
    }
  });
  return server;
}
