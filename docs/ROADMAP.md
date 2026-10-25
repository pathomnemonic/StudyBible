# Possible next features and review backlog

Everything here works from static data plus the user's own browser (or their own Google Drive), because the app has to stay at near-zero running cost. Items that would need a server we run, paid APIs or licensed text are listed last.

Most of this list comes from an outside code review (a ChatGPT analysis of the repository, kept at `docs/` only as these notes) and from our own audit. **Fixed** items are done in the code; the rest are open.

## Fixed from the review
- Offline study packs were marked "downloaded" even when files failed. They now report failures, offer Retry, and a mark is cleared if the browser evicted the files.
- Failed edition or pack downloads showed no error. They now do.
- Sync reported success when the server rejected changes. Rejected records are now counted, shown, and re-sent next time.
- Sync batches were cut by count only (400); they are now also cut at 2 MB so a large note set cannot exceed the server's request limit.
- Sync gave up for the session if the server was down at start-up. It now retries with back-off and jitter, and on coming back online.
- Server: the default listen address is now 127.0.0.1 as documented; `X-Forwarded-For` is trusted only with `TRUST_PROXY=1`; login for an unknown account no longer does extra hashing work; static-file containment uses a path check instead of a string prefix; a missing script or data file returns 404 instead of the app's HTML; the account-deletion cookie now matches the other session cookies; sessions have an expiry index.
- The IndexedDB v4 upgrade could reference the `memory` table before it existed.
- The reload-after-update guard could stay set for the whole tab; it now allows one reload per minute.
- Backups: they now include preferences, carry a version, validate every record and link before touching the database, refuse newer formats, and a replace-restore also clears old deletion records. CSV exports neutralise cells that start with `=`, `+`, `-` or `@`.
- The privacy text in Settings said there were no accounts; it now describes optional accounts and says sync is not end-to-end encrypted. ARCHITECTURE.md says the same.
- Data files are fetched network-first so a corrected file reaches people who cached an older one.
- Server: every synced record is checked against the shape of its table (a note needs a text body, a link must be http or https), and each account is capped at 100 MB.
- Sync: when two devices edit the same note or journal entry before syncing, the older edit is kept as a copy instead of being overwritten. The Account page shows how many changes are waiting and has a "look for the server again" button.
- Settings from an old version, a backup or another device are checked against the expected type of each value.
- PNG and maskable app icons for installing on Android and iOS; a test that Spanish and Latin have every interface string; a quiet reminder to back up when there are notes and no recent backup.
- CONTRIBUTING.md, SECURITY.md and issue templates.

## Open: sync and accounts
- Full server-assigned revisions (the server now caps a client's edit time at its own clock plus five minutes, so a fast clock cannot win every conflict, but ordering still starts from client time); a device/session list.
- Optional end-to-end encryption with a recovery story.
- CSRF review beyond SameSite, automatic server backups. (The server already sends a strict Content-Security-Policy, `nosniff`, a referrer policy and `frame-ancestors 'none'`.)

## Open: offline and PWA
- Per-pack manifests with sizes and checksums, resumable and cancellable downloads, real byte progress, quota-error handling.
- A true offline test in CI; an update prompt that never interrupts an unsaved journal entry.

## Open: scripture data integrity
- Confidence labels per versification mapping (Tobit, Judith, Sirach, Esther, Daniel) and broader versification tests.
- A provenance line on every edition; a periodic external-link checker; proofread the OCR-derived Roman Catechism.
- Label source types (Scripture, official document, historical commentary, app-written) more visibly.

## Open: reader and study features
- Multi-verse selection actions, unified search across notes and library, backlinks from notes to Scripture, note tags and history.
- Customisable study-panel section order, saved passage collections, configurable parallel columns.
- A daily-question notebook; printable group-study sheets beyond the passage dossier's Print button. (Plans now offer “Pick up at day N” when you are behind, and “Slow down a day” as a rest day.)
- Hymn of the day. (Copy with citation, the readings calendar grid and optional plan streaks already exist.)

## Open: quality
- Playwright end-to-end tests (sync with two contexts, offline, upgrade from old schemas), accessibility and visual regression checks, bundle-size budgets, a root LICENSE file (the owner's choice).

## Out of reach for the near-zero-cost model
- Live YouTube search or API discovery (needs a key and quota); the video library comes from channels' public pages instead.
- Cloud accounts that we host for everyone; licensed modern translations inline; AI chat over the library; push notifications on iOS without a push service.

## Parity list from the ChatGPT review: status

Done: Divine Office (ordinary-time psalter), Rosary, Divine Mercy, Angelus, Stations, Seven Sorrows, prayer book, examination of conscience (private), Prepare for Sunday, novenas and short plans, prayer playlists, Order of Mass guide (parts and links only), twelve-lesson Bible course with quizzes, passage dossier with print.
Not done: Office of Readings and seasonal/feast propers for the Office (need a proper-of-the-day dataset); word-study guide beyond the existing original-language panel; the licensed ICEL text of the Mass.
