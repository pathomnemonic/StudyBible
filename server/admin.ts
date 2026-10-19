import { resolve } from 'node:path';
import { openDb } from './db';
import { hashPassword, passwordProblem, validateEmail } from './auth';

/**
 * Operator tool (there is no email-based password reset, so this is how a forgotten password is handled).
 *
 *   npm run admin -- list
 *   npm run admin -- reset-password user@example.com 'new long passphrase'   (signs the user out everywhere)
 *   npm run admin -- delete-user user@example.com                            (removes all of their data)
 *
 * Uses DB_PATH like the server.
 */
const [cmd, emailArg, pw] = process.argv.slice(2);
const db = openDb(resolve(process.env.DB_PATH ?? 'server-data/studybible.sqlite'));

async function main() {
  if (cmd === 'list') {
    const rows = db.prepare('SELECT email, display_name, created_at, (SELECT COUNT(*) FROM records r WHERE r.user_id = users.id AND r.deleted = 0) AS records FROM users ORDER BY created_at').all() as any[];
    for (const r of rows) console.log(`${r.email}\t${r.display_name ?? ''}\t${new Date(r.created_at).toISOString().slice(0, 10)}\t${r.records} records`);
    console.log(`${rows.length} user(s)`);
    return;
  }
  const email = validateEmail(emailArg);
  if (!email) throw new Error('Give a valid email address.');
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
  if (!user) throw new Error(`No user ${email}`);
  if (cmd === 'reset-password') {
    const problem = passwordProblem(pw, email);
    if (problem) throw new Error(problem);
    db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(await hashPassword(pw), user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
    console.log(`Password reset for ${email}; all sessions ended.`);
  } else if (cmd === 'delete-user') {
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id); // sessions and records cascade
    console.log(`Deleted ${email} and all of their data.`);
  } else {
    throw new Error('Usage: list | reset-password <email> <new password> | delete-user <email>');
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
