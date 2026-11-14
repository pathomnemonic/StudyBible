import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/** SQLite via Node's built-in `node:sqlite` (no native dependency to compile). */
export function openDb(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT,
      pass_hash TEXT NOT NULL,
      seq INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      user_agent TEXT
    );
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS records (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tbl TEXT NOT NULL,
      uid TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      payload TEXT NOT NULL,
      seq INTEGER NOT NULL,
      PRIMARY KEY (user_id, tbl, uid)
    );
    CREATE INDEX IF NOT EXISTS records_seq ON records(user_id, seq);
  `);
  // sessions gained a last-seen time after the first release; add the column to databases created before that
  const cols = db.prepare('PRAGMA table_info(sessions)').all() as { name: string }[];
  if (!cols.some((c) => c.name === 'last_seen')) db.exec('ALTER TABLE sessions ADD COLUMN last_seen INTEGER');
  // second-factor, lock-out and recovery columns were added later; add them to databases created before
  const ucols = (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name);
  for (const [name, def] of [['totp_secret', 'TEXT'], ['totp_pending', 'TEXT'], ['totp_enabled', 'INTEGER NOT NULL DEFAULT 0'], ['totp_last_step', 'INTEGER NOT NULL DEFAULT -1'], ['recovery_hashes', 'TEXT'], ['failed_logins', 'INTEGER NOT NULL DEFAULT 0'], ['locked_until', 'INTEGER NOT NULL DEFAULT 0']] as const) {
    if (!ucols.includes(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} ${def}`);
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS security_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      at INTEGER NOT NULL,
      event TEXT NOT NULL,
      detail TEXT
    );
    CREATE INDEX IF NOT EXISTS security_log_user ON security_log(user_id, at);
    CREATE TABLE IF NOT EXISTS invites (
      code_hash TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      used_by TEXT,
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);
  return db;
}
