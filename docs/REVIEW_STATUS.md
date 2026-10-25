# Status of the outside review

The feature proposals from the same conversation (the 40 features, the parity audit, the innovations and the storage ideas) are compared with the app, line by line, in [CHATGPT_FEATURES.md](CHATGPT_FEATURES.md).

An outside code review (a ChatGPT analysis of the repository) produced a long list of suggestions. This page says what was done with each group, what was deliberately left, and why. "Done" means it is in the code and covered by a test or a check where one fits.

## 1. Highest-priority bugs and reliability
| Suggestion | Status |
|---|---|
| Offline packs marked complete although files failed | Done. Per-file checks, size and SHA-256 verification, retry, stop and resume, storage-full message |
| Failed downloads looked stuck | Done |
| Sync reported success when records were rejected; batches by count only | Done. Rejected records are counted, shown and kept queued; batches are cut by bytes. Tests: `tests/sync-engine.test.ts` |
| Server exposure defaults, forwarded-IP trust, login timing | Done (loopback default, `TRUST_PROXY`, dummy hash); registration is now closed by default (the first account can still be created) |
| Sync start-up retry, manual retry | Done (back-off with jitter, "look for the server again") |
| Stale "downloaded" marks | Done (re-checked against the cache) |
| Privacy text and architecture docs out of date | Done |
| Reload guard stuck; static-path prefix check; payload shapes; IndexedDB v4 upgrade; stale data caches; cookie attributes; session expiry index; failed edition download state | Done |
| Static responses: MIME types, range requests | Done: MIME types for all bundled formats, a 404 for missing assets, byte-range requests (206/416), and cached gzip |
| **Found while testing the review's areas** | Fixed: deletions never reached other devices; a version-1 database could not upgrade; upgraded rows looked newly edited; a replace-restore deleted what it restored; reading plans fell short (300 and 73 days); a malformed URL returned 500; a sideways scroll on the Study page at 320 px; two accessibility violations (a label that did not contain its visible text, a scrollable code box without keyboard access, low contrast on the Today chip in four light themes) |

## 2. Sync and accounts
| Suggestion | Status |
|---|---|
| Idempotent sync start-up | Done |
| Concurrent edits | Done: the older text is kept as a copy (tested) |
| Not relying only on client clocks | Partly: the server caps edit times at its own clock plus five minutes (tested). Full server-assigned revisions are not done; ordering still starts from device time |
| Deterministic deletion; recovery path | Done: deletions are markers; **Recently deleted** (30 days, this device) restores them |
| Integrity checks, durable cursor, partial sync, back-off, actionable auth errors | Done (tests inject a network failure between batches; errors are explained by kind) |
| Revisit which settings sync | Done: the list is shown on the Account page and the rest is labelled per-device |
| Session and device management | Done: list, sign out one, sign out all others (tested, including that one account cannot revoke another's) |
| Sync activity screen and privacy-safe diagnostics | Done |
| Local-only mode | Done (existing) |
| Protocol versioning | Done (`protocol: 1`; a newer app gets a clear 426 from an older server) |
| Deleted-items view | Done |

## 3. Backup, import and export
Versioned, validated, atomic imports with a preview; replace mode fixed (tombstones, timestamps); CSV formula neutralising; settings included; selective exports (notes, marks); reminders; storage status; unsafe link refusal were done earlier. New: **password-protected backups** (AES-GCM, tested), an automatic **safety copy before a replace-restore**, round-trip and upgrade tests, and a "what is backed up" list in `docs/SERVER.md` and Settings. Not done: an undo for every bulk action (Recently deleted and the safety copy cover the main cases).

## 4. Offline and PWA
Manifest with sizes and checksums, resumable and cancellable downloads, byte progress, quota message, repair of stale marks, install icons, a "what works offline" list, an offline reload test (`npm run e2e`), and **updates that never interrupt you** (a banner; applied only when you choose or when you leave with nothing unsaved) are done. Whole-edition downloads are verified against per-book checksums too.

## 5. Scripture data and sources
Done: the WEB label, per-edition provenance, an audit of every bundled Bible text (`scripts/verify/editions.ts`, with recorded source irregularities), a versification regression test, plan diagnostics, machine-readable rights per dataset (`public/data/licenses.json`, enforced by a test), a link checker (`scripts/verify/links.ts`, monthly in CI), a methodology section in About, filters by match kind and source kind in the study panel, and the data-correction guide. Not done: expanding Greek and Hebrew coverage, a larger textual-variant layer, right-to-left testing, proofreading the Roman Catechism OCR, Eastern calendars. These need sources or reviewers, not code.

## 6. Reader, visual system, accessibility
Done earlier: focus mode, command palette, search across notes, copy with citation, collections, tags and folders, reading width, themes, reduced motion, keyboard checks, localisation test. New: Back returns to your scroll position on any page, choose which study sections to show, copy format option, pinned notes and an inbox filter, note templates, forced-colors styles, larger touch targets on touch screens, a 320 px reflow check, automated accessibility checks (axe) on the main screens in every theme. Not done: virtualised lists and moving search indexing to a Web Worker. Measured instead: in a headless browser the first search takes about 4 s (loading the index over the network and building it) with the longest main-thread stall about 225 ms, and later searches about 0.5 s; a worker is not justified by those numbers, but re-measure on a low-end phone before closing this, visual-regression screenshots, a formal screen-reader audit.

## 7. Study features
Done earlier or now: knowledge graph, original-language study, comparison view, lectio divina, quiet sessions, memorisation, flexible plans with catch-up, cross-references with match kinds, media controls, Bible in a Year navigation, calendars named, reading provenance, daily questions (as notes of kind *question*), research filters, thematic paths, group-study sheet with sources (private notes left out unless ticked), correction workflow. Not done: AI-assisted study (declined for now: it needs a paid service and an evidence-first design), a separate bibliography view beyond the sheet's sources.

## 8. Performance
Bundle and data budgets (`npm run budget`, in CI), heavy features already lazy-loaded, request de-duplication, gzip on the server, storage status, and a local speed panel in Settings. Not done: Web Worker search and list virtualisation (see above), data-build reproducibility in CI (needs the upstream sources; the manual procedure is in `docs/INGESTION.md`).

## 9. Security and deployment
Done: closed registration by default, start-up checks that refuse bad settings and warn about risky ones, CSP and other headers, cross-origin and CSRF tests, per-user limits, **verified database backups with retention** and a restore procedure, an honest note on the encryption boundary, session and password-change tests, log audit, a retention policy, an account-deletion warning, HTTPS guidance, request timeouts and connection limits. Not done: end-to-end encryption for sync (needs a key-recovery design; backups can be password-protected today). **A root LICENSE file is the owner's decision**; none has been chosen for them.

## 10. Testing and CI
Done: IndexedDB upgrade tests, backup compatibility tests, sync engine tests with failure injection, server tests, browser smoke test with an offline reload, accessibility tests, size budgets, generated-document check, data validation, secret scanning, dependency audit, Dependabot, a fast job and a browser job, a release checklist. Not done: two real browser contexts syncing (the engine is tested against the real server instead), visual-regression snapshots, Firefox and Safari in CI.

## 11. Documentation
Done: contributor guide, issue templates (bug, data correction, feature, licensing, deployment, alignment), security policy, code of conduct, data-correction guide, deployment profiles, changelog with App and Content sections, browser and limits page, actionable feature status (next deliverable, blocker, how it will be tested), reproducible data pipeline steps.
