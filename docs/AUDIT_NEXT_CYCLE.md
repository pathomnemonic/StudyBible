# Next-cycle bug audit (assignment received 14 November 2026)

An outside review (written by ChatGPT, handed over by the project owner) listed suspected defects and gaps in the quality net. This file is the working record: each item is **reproduced, fixed with a regression test**, or **not reproduced, with the evidence**. Licensing and independent fact-checking are out of scope for this cycle. Feature work (Part IV of the assignment) waits until reliability work is done.

Rule for every item: inspect the code, reproduce deterministically, add a test that fails before the fix, make the smallest safe fix, run the focused test and the neighbouring ones, then record the commit here.

## Part I: defects to investigate

| # | Suspected defect | Status | Evidence / test / commit |
|---|---|---|---|
| 1 | Sync discovery stuck after a transient session failure | **reproduced and fixed** | Root cause: `discover()` returned to `syncNow()` once the server was "available", and `syncNow()` returns when there is no user, so a failed `/me` left the person signed out until reload. Fix: `src/sync/state.ts` (session tracked apart from reachability; only 401/403 means nobody; timeouts/5xx/unreadable answers retry on a bounded back-off; online/visibility/Retry look again at once; a deliberate sign-out is remembered; an epoch drops stale answers) and a 20 s request timeout in `src/sync/api.ts`. Tests: `tests/sync-discovery.test.ts` (14; 12 fail on the old code). Not covered by a unit test: two real browser tabs (covered by reasoning: each tab keeps its own state and re-checks on visibility). |
| 2 | Sync conflicts lose metadata-only edits | **reproduced and fixed** | Old code kept the other version only when the body text differed; a title, kind, folder, target, revisit or pin difference was silently overwritten, and an older copy from another device could resurrect a note deleted here. Fix: `src/sync/merge.ts` (tags/refs joined, pin and answered stay set, any other difference kept as a copy with a stable id `uid~conflict~hash`) and `applyRemote` (tombstone check). Tests: `tests/sync-conflicts.test.ts` (21; 11 fail on the old code). Other tables (highlights, bookmarks, collections, plans, queue ...) remain record-level newest-wins by design; folder rename/delete, schema migration, interrupted batches are exercised by the existing `tests/sync-engine.test.ts` against a real server and are not re-tested here. |
| 3 | Error-boundary recovery deletes unrelated Cache Storage | **reproduced and fixed** | The old "Refresh the app" unregistered every service worker and deleted every cache on the address, including offline Bible/content packs (`studybible-data-v1`), offline audio (`studybible-audio-v1`) and other apps' caches. Reproduced in Chromium: `e2e/recovery.mjs` against the previous build failed with the offline pack and audio gone. Fix: `src/lib/recover.ts` (inventory: app precache `workbox-precache-v2-<scope>` and `studybible-heavy-v1` are removable; data, audio, media, offline and everything else are kept; only this app's scope is unregistered; offline nothing is removed and the person is told). Tests: `tests/recovery.test.ts` (6) and `e2e/recovery.mjs` (real Cache Storage, online and offline, in the release runner). |
| 4 | Update safety checks textarea presence, not dirty state | open | |
| 5 | ThemeApplier effect dependencies | open | |
| 6 | Collection and note round-trip integrity | open | |
| 7 | Deep links and browser navigation (route manifest) | open | |
| 8 | Profile relationship structural validation | open | |
| 9 | Edition and versification end to end | open | |
| 10 | Persistent media lifecycle | open | |
| 11 | Reader auto-open and toolbar behaviour | open | |

## Part II: strengthening the quality net

| # | Gap | Status | Evidence |
|---|---|---|---|
| 1 | CI uses the fast sweep; add a scheduled or release full sweep over 320/360/390/412/768/1024/1280 | open | |
| 2 | Crawler caps (6 folds, 4 tab groups, 8 tabs) and swallowed clicks | open | |
| 3 | Console and network failures (`requestfailed`, first-party 4xx/5xx) | open | |
| 4 | Route-specific assertions and a route manifest compared with executed coverage | open | |
| 5 | Overlap invariant exemptions (sticky/fixed); add a broken fixture that must be caught | open | |
| 6 | Tab round-trip assertions (aria-selected, identity, order) | open | |
| 7 | Account/sync checks in the release runner | open | |
| 8 | Production dependency audit must fail on high severity | open | |

## Owner requests handled alongside (14 November)

- Lesson pages themselves made calmer, not only the grade page.
- Media tab: all tabs visible (no hidden sideways scroll); the sweep now fails on any tab row that hides tabs.
- Mini player can be moved anywhere (drag, or arrow keys; Home puts it back).
- Principle: organising must not make things harder to find. Nothing is moved behind a fold or menu without a visible, labelled entry point.
