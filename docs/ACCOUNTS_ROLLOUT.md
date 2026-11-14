# Accounts: built, tested, switched off

Accounts and sync are fully built but **off in every normal build**. A normal build never looks for a server, shows no sign-in, no Account page, no "sync" row on the Privacy page and no link anywhere. This page is the checklist for turning them on later.

## What exists

| Area | What it does | Where |
|---|---|---|
| Sign-up and sign-in | email and password (scrypt), sessions as cookies (HttpOnly, SameSite=Lax, Secure behind HTTPS), CSRF header check, rate limits | `server/app.ts`, `server/auth.ts` |
| Invite-only sign-up | with `REGISTRATION=closed` the first account is free, later ones need a one-time invite code from the operator (valid 7 days) | `npm run admin -- invite` |
| Two-factor sign-in | authenticator-app codes (RFC 6238, tested against the RFC vectors), codes cannot be replayed, ten one-time recovery codes (only their hashes are stored) | `server/security.ts` |
| Lock-out | 8 wrong passwords or codes in a row lock the account for 5 minutes, doubling up to an hour; `npm run admin -- unlock` clears it | `server/security.ts` (`lockMs`) |
| Forgotten password | no email is sent; the operator makes a one-hour, one-use reset code (`npm run admin -- reset-code <email>`) and the person enters it on the sign-in screen. Resetting signs out every device | `server/app.ts`, `AccountSecurity.tsx` |
| Profile | change display name; change email (needs the password, signs out other devices) | account page |
| Devices | list, sign out one or all others; changing the password signs out the rest | existing |
| Security log | the last 50 events (sign-in, wrong password, 2FA on/off, email or password change, reset); never passwords, codes or tokens | `security_log` table |
| Sync | record-level, last-writer-wins, offline queue, conflict copies, limits per user | `src/sync/*`, `docs/SERVER.md` |
| Your data | download everything, delete the account and every row | account page |
| Operator tools | `list`, `invite`, `reset-code`, `reset-password`, `unlock`, `disable-2fa`, `delete-user` | `server/admin.ts` |

## The switch

`src/lib/accountsFlag.ts`:

* **Everyone:** build with `VITE_ACCOUNTS=1`.
* **Private preview:** build with `VITE_ACCOUNTS_PREVIEW=1`, then open the app once with `?accounts=on` in the address (and `?accounts=off` to remove it). A build without either variable ignores the address.
* The GitHub Pages build is also `VITE_LOCAL_ONLY=1`, which stops the app looking for a server at all. To enable accounts you need a host that runs the server (`npm start`), not Pages.

## To turn it on

1. Pick a host that can run Node 22+ and keep a SQLite file (see `docs/SERVER.md`). Put HTTPS in front of it.
2. Set `REGISTRATION=closed` first; create your own account (the first one is allowed), then use `invite` for others.
3. Decide on email: the server sends none. If you want self-service password reset by email, that needs a mail provider and a small mailer module; today the operator resets passwords.
4. Build the app with `VITE_ACCOUNTS=1` (and no `VITE_LOCAL_ONLY`, or set `VITE_API_BASE` if the server is on another origin).
5. Update the Privacy page wording if your host logs more than the defaults, and tell people the operator can read synced notes (there is no end-to-end encryption).
6. Run the checks: `npx vitest run tests/server.test.ts tests/accounts-security.test.ts tests/sync-engine.test.ts`, then the browser check below.
7. Set `BACKUP_DIR` and test a restore.

## Checks

* Unit and server tests run in CI: `tests/server.test.ts`, `tests/accounts-security.test.ts`, `tests/security.test.ts`, `tests/sync-engine.test.ts`.
* `e2e/review.mjs` (in CI) proves the default build shows nothing about accounts: `/account` redirects, and Settings, More and Privacy never mention signing in.
* `e2e/accounts.mjs` drives the real server and a build made with `VITE_ACCOUNTS=1`: register, turn on two-factor, sign out, sign in (the form asks for the code; a wrong code is refused; a recovery code works once). Commands are at the top of the file.

## Not built (needs a decision)

* Email (verification, password reset by email, security alerts): needs a mail provider.
* End-to-end encryption of synced notes: needs a key-recovery design (the existing `src/db/crypto.ts` only protects exported backups).
* Sign-in with Google, Apple or similar: needs developer accounts and review of what they share.
* Shared or class accounts and teacher-student sharing: needs a privacy decision about minors' data.
* Admin web console: the command-line tool covers the operator's needs today.
