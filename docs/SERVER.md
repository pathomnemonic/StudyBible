# Running the account & sync server

The app is **local-first**: everything works offline with no account. The optional server adds sign-in and syncs your
notes, highlights, bookmarks, folders, collections, journal, plans, progress, attached links and reading settings between devices.
It is **not hosted for you** — you run it (or someone you trust does).

```bash
npm run build          # builds the web app into dist/
npm start              # serves dist/ and the API on http://localhost:8787  (Node 22+, no extra dependencies)
```

| Env var | Default | Meaning |
|---|---|---|
| `PORT`, `HOST` | `8787`, `127.0.0.1` | listen address |
| `DB_PATH` | `./data/server.sqlite` | SQLite file (`node:sqlite`) |
| `STATIC_DIR` | `./dist` | web app to serve |
| `REGISTRATION` | `open` | `closed` disables sign-up (create accounts first, then close) |
| `SESSION_DAYS` | `30` | session lifetime |
| `ALLOWED_ORIGINS` | same-origin | comma-separated extra origins allowed for API calls |
| `COOKIE_SECURE` | `0` | set `1` behind HTTPS (required in production) |

## Deploying
* Put it behind an HTTPS reverse proxy (Caddy/nginx) and set `COOKIE_SECURE=1`, `HOST=127.0.0.1`.
* Back up the single SQLite file (`sqlite3 server.sqlite ".backup backup.sqlite"`).
* Each user can download all their data (Account → Export) and delete their account, which removes every server-side row.

## Security model (honest summary)
* Passwords: scrypt (N=2^15) with per-user salt. Sessions: random 256-bit tokens, only their SHA-256 is stored; HttpOnly, SameSite=Lax cookie.
* CSRF: state-changing requests need header `X-StudyBible: 1` and a same-origin `Origin`. Login/registration are rate limited.
* Limits: 1000 changes/request, 256 KB per record, 200k records per user.
* **Not end-to-end encrypted.** Note text is stored as JSON on the server, so the operator can read it. Host it yourself or trust the host.
* **No email password reset** (the server sends no email). An operator can delete an account and the user can re-register; a signed-in user can change their password.
* Sync is last-writer-wins per record by `updatedAt`; deletions travel as tombstones.
