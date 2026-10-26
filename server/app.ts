import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, statSync, createReadStream } from 'node:fs';
import { extname, isAbsolute, join, normalize, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { DatabaseSync } from 'node:sqlite';
import { LiveHub, MAX_PLAYERS, sanitizeContent, sanitizeSettings, type LiveRoom } from './live';
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

/** Version of the sync wire format. Clients send theirs; a server that does not understand a newer one says so instead of guessing. */
const PROTOCOL = 1;
const MAX_BODY = 6 * 1024 * 1024;
const MAX_CHANGES = 1000;
const MAX_PAYLOAD = 256 * 1024;
const MAX_RECORDS_PER_USER = 200_000;
const MAX_BYTES_PER_USER = 100 * 1024 * 1024;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
/** What each synced table must look like. A deletion carries no body, so only a live record is checked. Unknown extra fields are allowed (newer clients). */
const SHAPES: Record<string, (p: Record<string, unknown>) => boolean> = {
  notes: (p) => typeof p.body === 'string' && (p.title === undefined || typeof p.title === 'string') && (p.tags === undefined || (Array.isArray(p.tags) && p.tags.every((t) => typeof t === 'string'))),
  highlights: (p) => typeof p.ref === 'string' && typeof p.color === 'string',
  bookmarks: (p) => typeof p.ref === 'string',
  journal: (p) => typeof p.date === 'string',
  userLinks: (p) => typeof p.url === 'string' && /^https?:\/\//i.test(p.url) && typeof p.ref === 'string',
  media: (p) => typeof p.url === 'string' && /^https?:\/\//i.test(p.url),
  settings: (p) => Object.values(p).every((v) => v === null || ['string', 'number', 'boolean', 'object'].includes(typeof v)),
};
function payloadOk(table: string, payload: unknown, deleted: boolean) {
  if (!isObj(payload)) return deleted && (payload === undefined || payload === null);
  if (deleted) return true;
  const check = SHAPES[table];
  return check ? check(payload) : true;
}
const SYNC_TABLES = new Set(['notes', 'highlights', 'bookmarks', 'folders', 'collections', 'userXrefs', 'journal', 'userPlans', 'saved', 'media', 'userLinks', 'planProgress', 'episodeProgress', 'libraryProgress', 'queue', 'savedSearches', 'memory', 'settings']);

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf', '.xml': 'application/xml', '.epub': 'application/epub+zip' };

/** compressed copies of static files, kept until the file changes, so each request does not compress again */
const gzCache = new Map<string, { mtime: number; body: Buffer }>();

/** How far ahead of the server's clock a client's edit time may be before it is capped. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "media-src https: blob:",
  "connect-src 'self' https://litcal.johnromanodorazio.com https://orthocal.info",
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
  // live classroom sessions (kept in memory; a session is meant to last one class)
  const hub = new LiveHub();
  const createLimit = new RateLimiter(20, 60 * 60_000);
  const joinLimit = new RateLimiter(80, 10 * 60_000);
  const streams = new Map<string, Set<{ res: ServerResponse; role: 'host' | 'player'; token?: string; seen: number }>>();
  const MAX_STREAMS_PER_ROOM = MAX_PLAYERS + 5;
  const pushRoom = (room: LiveRoom, force = false) => {
    for (const c of streams.get(room.code) ?? []) {
      if (!force && c.seen === room.version) continue;
      c.seen = room.version;
      c.res.write(`data: ${JSON.stringify(room.view(c.role, c.token))}\n\n`);
    }
  };
  const liveTimer = setInterval(() => {
    for (const room of hub.rooms.values()) { room.tick(); pushRoom(room); }
    for (const [code, set] of streams) { if (!hub.get(code)) { for (const c of set) c.res.end(); streams.delete(code); } }
    hub.sweep();
  }, 500);
  liveTimer.unref();
  const keepAlive = setInterval(() => { for (const set of streams.values()) for (const c of set) c.res.write(': keep\n\n'); }, 15_000);
  keepAlive.unref();

  const q = {
    userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    userById: db.prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?'),
    insertUser: db.prepare('INSERT INTO users (id, email, display_name, pass_hash, created_at) VALUES (?, ?, ?, ?, ?)'),
    insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent, last_seen) VALUES (?, ?, ?, ?, ?, ?)'),
    session: db.prepare('SELECT s.user_id, s.expires_at, s.last_seen FROM sessions s WHERE s.token_hash = ?'),
    touchSession: db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?'),
    listSessions: db.prepare('SELECT token_hash, created_at, expires_at, last_seen, user_agent FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY COALESCE(last_seen, created_at) DESC'),
    userCount: db.prepare('SELECT COUNT(*) AS n FROM users'),
    stats: db.prepare('SELECT tbl, COUNT(*) AS n, SUM(deleted) AS gone FROM records WHERE user_id = ? GROUP BY tbl'),
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
    bytes: db.prepare('SELECT COALESCE(SUM(LENGTH(payload)), 0) AS n FROM records WHERE user_id = ?'),
    all: db.prepare('SELECT tbl, uid, updated_at, deleted, payload FROM records WHERE user_id = ? AND deleted = 0'),
    expire: db.prepare('DELETE FROM sessions WHERE expires_at < ?'),
  };

  const isSecure = (req: IncomingMessage) => (cfg.secureCookies === 'auto' ? req.headers['x-forwarded-proto'] === 'https' : cfg.secureCookies);
  // X-Forwarded-For is only believed when the operator says a trusted proxy sets it (TRUST_PROXY=1); otherwise a client could invent addresses to dodge the rate limits
  const trustProxy = process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true';
  const clientIp = (req: IncomingMessage) => (trustProxy ? String(req.headers['x-forwarded-for'] ?? '').split(',').pop()!.trim() : '') || req.socket.remoteAddress || '';
  // a hash made once, so a login for an account that does not exist costs the same single check as one that does
  const dummyHash = hashPassword('not-a-real-password');

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
    // record activity at most every five minutes, so a busy client does not write on every request
    if (!row.last_seen || Date.now() - row.last_seen > 300_000) q.touchSession.run(Date.now(), hashToken(t));
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
    q.insertSession.run(hashToken(token), userId, now, exp, String(req.headers['user-agent'] ?? '').slice(0, 200), now);
    const user = q.userById.get(userId) as any;
    json(res, status, { user: pub(user) }, { 'Set-Cookie': sessionCookie(req, token, cfg.sessionDays * 86400) });
  }

  /** Closed servers still let the very first account be created, so the owner can set up a private server. */
  const openForSignup = () => cfg.registration === 'open' || (q.userCount.get() as any).n === 0;
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
      return json(res, 200, { ok: true, registration: openForSignup() ? 'open' : 'closed', name: 'studybible-sync', version: 1, protocol: PROTOCOL });
    }


    // ---- live classroom sessions: no account needed to join or to host
    if (path.startsWith('/api/live/')) {
      const parts = path.split('/').filter(Boolean); // api, live, <code|create|join>, <what>
      const first = parts[2];
      if (first === 'create' && method === 'POST') {
        if (!createLimit.take(clientIp(req))) throw new HttpError(429, 'Too many sessions started from this address. Try again later.');
        const body = await readJson(req);
        const content = sanitizeContent(body.content);
        if (!content.questions.length && !content.slides.length) throw new HttpError(400, 'A session needs slides or questions.');
        let room: LiveRoom;
        try { room = hub.create(content, sanitizeSettings(body.settings)); } catch (e: any) { throw new HttpError(503, e.message); }
        return json(res, 201, { code: room.code, hostKey: room.hostKey, view: room.view('host') });
      }
      if (first === 'join' && method === 'POST') {
        if (!joinLimit.take(clientIp(req))) throw new HttpError(429, 'Too many tries. Wait a few minutes.');
        const body = await readJson(req);
        const room = hub.get(String(body.code ?? '').replace(/\D/g, ''));
        if (!room) throw new HttpError(404, 'No session with that code. Check the number on the teacher’s screen.');
        try { const j = room.join(String(body.name ?? ''), typeof body.token === 'string' ? body.token : undefined); pushRoom(room); return json(res, 200, { ...j, code: room.code, title: room.content.title }); }
        catch (e: any) { throw new HttpError(409, e.message); }
      }
      const room = first ? hub.get(first) : undefined;
      if (!room) throw new HttpError(404, 'That session has ended or does not exist.');
      const sub = parts[3];
      if (sub === 'peek' && method === 'GET') return json(res, 200, { title: room.content.title, phase: room.phase, locked: room.locked });
      if (sub === 'events' && method === 'GET') {
        const url = new URL(req.url ?? '/', 'http://x');
        const key = url.searchParams.get('key'), token = url.searchParams.get('token');
        const role: 'host' | 'player' | null = key && key === room.hostKey ? 'host' : token && room.playerByToken(token) ? 'player' : null;
        if (!role) throw new HttpError(403, 'Not part of this session.');
        const set = streams.get(room.code) ?? new Set();
        if (set.size >= MAX_STREAMS_PER_ROOM) throw new HttpError(503, 'This session is full.');
        streams.set(room.code, set);
        res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        const c = { res, role, token: token ?? undefined, seen: room.version };
        set.add(c);
        res.write(`retry: 2000\ndata: ${JSON.stringify(room.view(role, token ?? undefined))}\n\n`);
        if (token) room.ping(token);
        req.on('close', () => set.delete(c));
        return;
      }
      if (sub === 'answer' && method === 'POST') {
        const body = await readJson(req);
        const ok = room.answer(String(body.token ?? ''), body.value);
        pushRoom(room);
        return json(res, 200, { ok });
      }
      if (sub === 'host' && method === 'POST') {
        const body = await readJson(req);
        if (body.key !== room.hostKey) throw new HttpError(403, 'Only the teacher can do that.');
        room.host(String(body.action ?? ''), body.arg);
        pushRoom(room);
        return json(res, 200, { ok: true });
      }
      if (sub === 'export' && method === 'GET') {
        const key = new URL(req.url ?? '/', 'http://x').searchParams.get('key');
        if (key !== room.hostKey) throw new HttpError(403, 'Only the teacher can do that.');
        const data = Buffer.from(room.csv());
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="session-${room.code}.csv"`, 'Cache-Control': 'no-store', 'Content-Length': data.length });
        return void res.end(data);
      }
      throw new HttpError(404, 'Not found.');
    }

    if (path === '/api/auth/register' && method === 'POST') {
      if (!openForSignup()) throw new HttpError(403, 'Registration is closed on this server.');
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
      const ok = u ? await verifyPassword(String(b.password ?? ''), u.pass_hash) : (await verifyPassword('not-the-password', await dummyHash), false);
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

    if (path === '/api/auth/sessions' && method === 'GET') {
      const mine = hashToken(cookie(req, 'sb_session')!);
      const rows = (q.listSessions.all(me.id, Date.now()) as any[]).map((r) => ({ id: r.token_hash.slice(0, 16), current: r.token_hash === mine, createdAt: r.created_at, lastSeen: r.last_seen ?? r.created_at, expiresAt: r.expires_at, device: String(r.user_agent ?? '').slice(0, 120) }));
      return json(res, 200, { sessions: rows });
    }

    const revoke = /^\/api\/auth\/sessions\/([0-9a-f]{16})$/.exec(path);
    if (revoke && method === 'DELETE') {
      const r = db.prepare('DELETE FROM sessions WHERE user_id = ? AND substr(token_hash, 1, 16) = ?').run(me.id, revoke[1]);
      return json(res, 200, { ok: true, revoked: Number(r.changes) });
    }

    if (path === '/api/auth/sessions/revoke-others' && method === 'POST') {
      const keep = hashToken(cookie(req, 'sb_session')!);
      const r = db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(me.id, keep);
      return json(res, 200, { ok: true, revoked: Number(r.changes) });
    }

    if (path === '/api/account/stats' && method === 'GET') {
      const rows = (q.stats.all(me.id) as any[]).map((r) => ({ table: r.tbl, records: r.n - (r.gone ?? 0), deleted: r.gone ?? 0 }));
      return json(res, 200, { tables: rows, bytes: (q.bytes.get(me.id) as any).n, limits: { records: MAX_RECORDS_PER_USER, bytes: MAX_BYTES_PER_USER } });
    }

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
      return json(res, 200, { ok: true, deleted: true }, { 'Set-Cookie': `sb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${isSecure(req) ? '; Secure' : ''}` });
    }

    if (path === '/api/account/export' && method === 'GET') {
      const rows = (q.all.all(me.id) as any[]).map((r) => ({ table: r.tbl, uid: r.uid, updatedAt: r.updated_at, data: JSON.parse(r.payload) }));
      return json(res, 200, { format: 'studybible-server-export', exportedAt: new Date().toISOString(), user: pub(q.userById.get(me.id)), records: rows }, { 'Content-Disposition': 'attachment; filename="studybible-account-export.json"' });
    }

    if (path === '/api/sync' && method === 'POST') {
      const b = await readJson(req);
      if (b.protocol !== undefined && (!Number.isFinite(b.protocol) || b.protocol > PROTOCOL)) throw new HttpError(426, 'This app is newer than the sync server. Ask the server owner to update it.');
      const cursor = Number.isFinite(b.cursor) ? Math.max(0, Math.floor(b.cursor)) : 0;
      const changes: any[] = Array.isArray(b.changes) ? b.changes : [];
      if (changes.length > MAX_CHANGES) throw new HttpError(413, `Send at most ${MAX_CHANGES} changes per request.`);
      let rejected = 0;
      const mine = new Set<string>();
      db.exec('BEGIN IMMEDIATE');
      try {
        const total = (q.count.get(me.id) as any).n as number;
        let used = (q.bytes.get(me.id) as any).n as number;
        let added = 0;
        for (const c of changes) {
          if (!c || typeof c.table !== 'string' || !SYNC_TABLES.has(c.table) || typeof c.uid !== 'string' || c.uid.length > 200 || !Number.isFinite(c.updatedAt)) {
            rejected++;
            continue;
          }
          if (!payloadOk(c.table, c.payload, !!c.deleted)) {
            rejected++;
            continue;
          }
          const payload = JSON.stringify(c.payload ?? {});
          if (payload.length > MAX_PAYLOAD || used + payload.length > MAX_BYTES_PER_USER) {
            rejected++;
            continue;
          }
          // A device with a clock set far ahead must not win every later conflict: cap client timestamps at server time plus a small allowance.
          const stamp = Math.min(Math.floor(c.updatedAt), Date.now() + CLOCK_SKEW_MS);
          const ex = q.getRec.get(me.id, c.table, c.uid) as any;
          if (ex && ex.updated_at > stamp) continue; // server copy is newer: client will receive it below
          if (!ex && total + added >= MAX_RECORDS_PER_USER) {
            rejected++;
            continue;
          }
          const seq = (q.bump.get(me.id) as any).seq as number;
          q.upsert.run(me.id, c.table, c.uid, stamp, c.deleted ? 1 : 0, payload, seq);
          mine.add(`${c.table}|${c.uid}`);
          used += payload.length;
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
        protocol: PROTOCOL,
        changes: rows.map((r) => ({ table: r.tbl, uid: r.uid, updatedAt: r.updated_at, deleted: !!r.deleted, payload: JSON.parse(r.payload) })),
      });
    }

    throw new HttpError(404, 'Not found.');
  }

  function serveStatic(req: IncomingMessage, res: ServerResponse, urlPath: string) {
    const root = resolve(cfg.staticDir!);
    let decoded: string;
    try {
      decoded = decodeURIComponent(urlPath);
    } catch {
      res.writeHead(400).end(); // malformed percent-escape
      return;
    }
    if (decoded.includes('\0')) {
      res.writeHead(400).end();
      return;
    }
    let rel = normalize(decoded).replace(/^([/\\])+/, '');
    let file = resolve(join(root, rel));
    const inside = relative(root, file);
    if (inside.startsWith('..') || isAbsolute(inside)) {
      res.writeHead(403).end();
      return;
    }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      // the app shell answers page navigations only; a missing script, style or data file is a real 404, not HTML that would break a JSON parse
      if (extname(rel) && extname(rel) !== '.html') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }).end('Not found');
        return;
      }
      file = join(root, 'index.html');
    }
    const ext = extname(file);
    const headers: Record<string, string> = {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': CSP,
      'Cache-Control': /\/assets\//.test(file) ? 'public, max-age=31536000, immutable' : file.endsWith('index.html') || file.endsWith('sw.js') ? 'no-cache' : 'public, max-age=3600',
    };
    const compressible = ['.html', '.js', '.css', '.json', '.svg', '.webmanifest', '.txt', '.xml'].includes(ext);
    const st = statSync(file);
    if (compressible && String(req.headers['accept-encoding'] ?? '').includes('gzip')) {
      let hit = gzCache.get(file);
      if (!hit || hit.mtime !== st.mtimeMs) {
        hit = { mtime: st.mtimeMs, body: gzipSync(readFileSync(file)) };
        if (gzCache.size > 300) gzCache.delete(gzCache.keys().next().value!);
        gzCache.set(file, hit);
      }
      res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', 'Content-Length': hit.body.length, Vary: 'Accept-Encoding' });
      res.end(hit.body);
      return;
    }
    // byte ranges, so audio and large files can be seeked and resumed
    const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range ?? ''));
    if (range && (range[1] || range[2])) {
      let start = range[1] ? +range[1] : Math.max(0, st.size - +range[2]);
      let end = range[1] && range[2] ? Math.min(+range[2], st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }).end();
        return;
      }
      res.writeHead(206, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Length': st.size });
    createReadStream(file).pipe(res);
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
      console.error('server error', (e as Error)?.name, (e as Error)?.message); // never the request body or headers
      json(res, 500, { error: 'Something went wrong on the server.' });
    }
  });
  // bound what one client can tie up: slow or stalled requests are cut off
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 5_000;
  server.maxConnections = 1500;
  return server;
}
