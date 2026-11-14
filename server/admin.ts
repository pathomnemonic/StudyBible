import { resolve } from 'node:path';
import { openDb } from './db';
import { randomBytes } from 'node:crypto';
import { hashPassword, hashToken, passwordProblem, validateEmail } from './auth';

/**
 * Operator tool (there is no email-based password reset, so this is how a forgotten password is handled).
 *
 *   npm run admin -- list
 *   npm run admin -- reset-password user@example.com 'new long passphrase'   (signs the user out everywhere)
 *   npm run admin -- delete-user user@example.com                            (removes all of their data)
 *   npm run admin -- invite [note]                                           (a one-time sign-up code, valid 7 days, for a server with closed registration)
 *   npm run admin -- reset-code user@example.com                             (a one-hour code the person uses at Sign in > Forgot password; no email is sent)
 *   npm run admin -- unlock user@example.com                                 (clears a sign-in lock)
 *   npm run admin -- disable-2fa user@example.com                            (turns off two-factor sign-in for someone who lost their device and recovery codes)
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
  if (cmd === 'invite') {
    const code = randomBytes(9).toString('base64url');
    db.prepare('INSERT INTO invites (code_hash, created_at, expires_at, note) VALUES (?, ?, ?, ?)').run(hashToken(code), Date.now(), Date.now() + 7 * 86400_000, emailArg ?? null);
    console.log(`Invite code (valid 7 days, one use): ${code}`);
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
  } else if (cmd === 'reset-code') {
    const code = randomBytes(9).toString('base64url');
    db.prepare('INSERT INTO reset_tokens (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(hashToken(code), user.id, Date.now(), Date.now() + 3600_000);
    console.log(`Reset code for ${email} (valid one hour, one use): ${code}`);
  } else if (cmd === 'unlock') {
    db.prepare('UPDATE users SET failed_logins = 0, locked_until = 0 WHERE id = ?').run(user.id);
    console.log(`Unlocked ${email}.`);
  } else if (cmd === 'disable-2fa') {
    db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL, totp_pending = NULL, recovery_hashes = NULL, totp_last_step = -1 WHERE id = ?').run(user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
    console.log(`Two-factor sign-in turned off for ${email}; all sessions ended.`);
  } else {
    throw new Error('Usage: list | reset-password <email> <new password> | reset-code <email> | unlock <email> | disable-2fa <email> | invite [note] | delete-user <email>');
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
