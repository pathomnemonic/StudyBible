import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createApp } from './app';
import { openDb } from './db';
import { backupDatabase } from './backup';
import { checkEnv } from './config';

/**
 * Study Bible sync server: accounts + record sync + static hosting of the built app.
 *
 *   PORT=8787 DB_PATH=./server-data/studybible.sqlite npm run server
 *
 * Environment: BACKUP_DIR (daily verified snapshots, newest BACKUP_KEEP=14 kept), PORT, HOST, DB_PATH, STATIC_DIR (default ./dist), REGISTRATION=open|closed (default closed; the first account can always be created), SESSION_DAYS,
 * TRUST_PROXY=1 (believe X-Forwarded-For; only behind your own proxy), ALLOWED_ORIGINS (comma list, only for cross-origin development), COOKIE_SECURE=auto|true|false.
 * Run it behind HTTPS (a reverse proxy that sets X-Forwarded-Proto) in production.
 */
const check = checkEnv(process.env);
for (const w of check.warnings) console.warn(`warning: ${w}`);
if (check.errors.length) {
  for (const e of check.errors) console.error(`error: ${e}`);
  process.exit(1);
}
const port = +(process.env.PORT ?? 8787);
// loopback by default: the server is meant to sit behind a reverse proxy. Set HOST=0.0.0.0 on purpose to listen on every interface.
const host = process.env.HOST ?? '127.0.0.1';
const staticDir = resolve(process.env.STATIC_DIR ?? 'dist');
const db = openDb(resolve(process.env.DB_PATH ?? 'server-data/studybible.sqlite'));
const server = createApp({
  db,
  staticDir: existsSync(staticDir) ? staticDir : undefined,
  // closed unless you say otherwise; the first account can always be created, so a private server can be set up
  registration: process.env.REGISTRATION === 'open' ? 'open' : 'closed',
  sessionDays: +(process.env.SESSION_DAYS ?? 60),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  secureCookies: process.env.COOKIE_SECURE === 'true' ? true : process.env.COOKIE_SECURE === 'false' ? false : 'auto',
});
server.listen(port, host, () => console.log(`Study Bible server on http://${host}:${port}  (static: ${existsSync(staticDir) ? staticDir : 'none — run npm run build'})`));

// optional automatic backups: one verified snapshot at start-up and then daily
if (process.env.BACKUP_DIR) {
  const dir = resolve(process.env.BACKUP_DIR);
  const run = () => {
    try {
      const b = backupDatabase(db, dir, +(process.env.BACKUP_KEEP ?? 14));
      console.log(`backup ok: ${b.file} (${(b.bytes / 1024).toFixed(0)} KB, ${b.users} accounts)`);
    } catch (e: any) {
      console.error(`backup FAILED: ${e?.message ?? e}`);
    }
  };
  run();
  setInterval(run, 24 * 3600_000).unref();
}
