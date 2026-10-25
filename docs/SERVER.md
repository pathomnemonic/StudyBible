# Running the account & sync server

The app is **local-first**: everything works offline with no account. The optional server adds sign-in and syncs your
notes, highlights, bookmarks, folders, collections, journal, plans, progress, attached links and some reading settings between devices.
It is **not hosted for you**: you run it (or someone you trust does). Nothing in the app needs it.

```bash
npm run build          # builds the web app into dist/
npm start              # serves dist/ and the API on http://127.0.0.1:8787  (Node 22+, no extra dependencies)
```

## Settings (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `PORT`, `HOST` | `8787`, `127.0.0.1` | listen address. Loopback by default; set `HOST=0.0.0.0` on purpose to expose it |
| `REGISTRATION` | `closed` | `open` lets anyone create an account. When closed, the **first** account can still be created, so you can set up a private server and then leave it closed |
| `SESSION_DAYS` | `60` | session lifetime (1 to 365) |
| `COOKIE_SECURE` | `auto` | `auto` marks cookies Secure when the proxy says `X-Forwarded-Proto: https`; `true` always; `false` never (development only) |
| `TRUST_PROXY` | off | `1` to believe `X-Forwarded-For` for rate limits (only behind a reverse proxy you control) |
| `DB_PATH` | `./server-data/studybible.sqlite` | SQLite file (`node:sqlite`) |
| `STATIC_DIR` | `./dist` | web app to serve |
| `ALLOWED_ORIGINS` | none | comma-separated extra origins for cross-origin development only |
| `BACKUP_DIR`, `BACKUP_KEEP` | off, `14` | write a verified snapshot at start-up and daily, keeping the newest N |

At start-up the server checks these and **refuses to start** on an invalid value, and prints a warning for risky combinations (a public address with open registration or insecure cookies).

## Deployment profiles

| Profile | What you run | Security assumptions |
|---|---|---|
| **Static only** (default) | `npm run build`, then host `dist/` anywhere (GitHub Pages, Netlify, a file server) or open it locally | No server, no accounts, no sync. Data lives in each browser. Use Library → Export or Google Drive backup to move or protect it |
| **Static, public** | The same, on a public website | The site only serves public-domain texts and links. There is nothing private to protect |
| **Private sync** | `npm start` on a home server or VPS, `REGISTRATION=closed`, behind HTTPS | Only people you create accounts for. The operator can read synced notes (see below) |
| **Public server** | As above with `REGISTRATION=open` | Anyone may sign up. Add `TRUST_PROXY=1` behind your proxy, `BACKUP_DIR`, monitoring, and read the retention section. Not recommended unless you are prepared to run a service |

## HTTPS and the network
* Terminate TLS at a reverse proxy (Caddy or nginx) and forward to `127.0.0.1:8787`. Set `X-Forwarded-Proto` and, if you use the client address for rate limits, `TRUST_PROXY=1`.
* Without HTTPS, passwords and session cookies cross the network in plain text. The server cannot enforce HTTPS itself; with `COOKIE_SECURE=auto` it only marks cookies Secure when the proxy says the request was HTTPS, so **a misconfigured proxy means weaker cookies**. Test by signing in and checking the cookie has the `Secure` flag.
* Firewall: expose only 443 (and 80 for redirects). Keep 8787 on loopback.
* Requests are cut off after 30 seconds, headers after 15, and at most 500 connections are held open.

## Backups and restore
* `BACKUP_DIR=/var/backups/studybible` writes `studybible-<time>.sqlite` snapshots (VACUUM INTO, safe while running), **opens each one and runs `integrity_check`**, deletes any that fail, and keeps the newest `BACKUP_KEEP`.
* To restore: stop the server, copy a snapshot over `DB_PATH` (remove the `-wal` and `-shm` files next to it), start the server. Test a restore on another machine before you need it.
* Each user can download everything (Account → Download my account data) and delete their account, which removes every server-side row.

## What is protected, and from whom
* **In transit:** encrypted if you serve it over HTTPS. Otherwise not.
* **At rest on the server:** stored as ordinary JSON in SQLite. **There is no end-to-end encryption.** The person who runs the server can read synced notes and journal entries. Passwords are never stored in the clear (scrypt, per-user salt). Sessions are random 256-bit tokens; only their SHA-256 is stored.
* **On your device:** in the browser's IndexedDB, unencrypted, readable by anyone with access to the browser profile.
* If that is not acceptable, do not sign in: use local-only mode (Settings → Privacy) and move data with an exported backup.

## Retention
| Where | What | Kept until |
|---|---|---|
| This device | notes, highlights, journal, etc. | you delete them |
| This device | **Recently deleted** copies (Library) | 30 days, then removed |
| This device | deletion records ("tombstones") for sync | 7 days after they have been sent |
| Server | your records, including deleted ones as small markers | you delete the account |
| Server | sessions | their expiry (60 days by default) or when revoked |
| Server logs | request errors only; **never** passwords, cookies, tokens or note text | your host's log rotation |

## Accounts and devices
* Account → **Signed-in devices** lists every session with its last activity and lets you sign one out or all others. Changing the password signs out all other devices.
* **No email password reset** (the server sends no email). The operator resets a forgotten password: `npm run admin -- reset-password user@example.com 'new passphrase'` (also `list` and `delete-user`).
* Limits: 1000 changes per request, 256 KB per record, 200,000 records and 100 MB per user.

## Sync behaviour
* Record-level, last-writer-wins by edit time, with edit times from a device clock capped at the server's clock plus five minutes. Deletions travel as markers; a deleted item can be restored from Library → Recently deleted on the device that deleted it.
* If two devices edit the same note or journal entry before syncing, the newer edit wins and the other is kept as a copy.
* The sync format is versioned (`protocol: 1`). A server that is older than the app answers 426 and the app says so.

## Docker
```bash
docker build -t studybible .
docker run -d -p 127.0.0.1:8787:8787 -v studybible-data:/data -e COOKIE_SECURE=true -e REGISTRATION=closed -e BACKUP_DIR=/data/backups studybible
docker exec -it <container> npx tsx server/admin.ts list
```
Put it behind an HTTPS reverse proxy. The Dockerfile is not built in CI; check it on your host.
