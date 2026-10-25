import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * Copy the live database into `dir` (a consistent snapshot taken with VACUUM INTO, safe while the server runs),
 * open the copy and check it, and keep only the newest `keep` snapshots. A snapshot that fails the check is deleted
 * and reported, so a backup that cannot be restored never counts as a backup.
 */
export function backupDatabase(db: DatabaseSync, dir: string, keep = 14, now = new Date()): { file: string; bytes: number; users: number } {
  mkdirSync(dir, { recursive: true });
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const file = join(dir, `studybible-${stamp}.sqlite`);
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  const copy = new DatabaseSync(file, { readOnly: true });
  try {
    const check = (copy.prepare('PRAGMA integrity_check').get() as any).integrity_check;
    if (check !== 'ok') throw new Error(`backup failed its integrity check: ${check}`);
    const users = (copy.prepare('SELECT COUNT(*) AS n FROM users').get() as any).n as number;
    copy.close();
    const old = readdirSync(dir).filter((f) => /^studybible-.*\.sqlite$/.test(f)).sort().reverse().slice(keep);
    for (const f of old) rmSync(join(dir, f), { force: true });
    return { file, bytes: statSync(file).size, users };
  } catch (e) {
    try { copy.close(); } catch { /* already closed */ }
    rmSync(file, { force: true });
    throw e;
  }
}
