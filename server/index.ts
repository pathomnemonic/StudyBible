import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createApp } from './app';
import { openDb } from './db';

/**
 * Study Bible sync server: accounts + record sync + static hosting of the built app.
 *
 *   PORT=8787 DB_PATH=./server-data/studybible.sqlite npm run server
 *
 * Environment: PORT, HOST, DB_PATH, STATIC_DIR (default ./dist), REGISTRATION=open|closed, SESSION_DAYS,
 * ALLOWED_ORIGINS (comma list, only for cross-origin development), COOKIE_SECURE=auto|true|false.
 * Run it behind HTTPS (a reverse proxy that sets X-Forwarded-Proto) in production.
 */
const port = +(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '0.0.0.0';
const staticDir = resolve(process.env.STATIC_DIR ?? 'dist');
const db = openDb(resolve(process.env.DB_PATH ?? 'server-data/studybible.sqlite'));
const server = createApp({
  db,
  staticDir: existsSync(staticDir) ? staticDir : undefined,
  registration: process.env.REGISTRATION === 'closed' ? 'closed' : 'open',
  sessionDays: +(process.env.SESSION_DAYS ?? 60),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  secureCookies: process.env.COOKIE_SECURE === 'true' ? true : process.env.COOKIE_SECURE === 'false' ? false : 'auto',
});
server.listen(port, host, () => console.log(`Study Bible server on http://${host}:${port}  (static: ${existsSync(staticDir) ? staticDir : 'none — run npm run build'})`));
