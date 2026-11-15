# Next-cycle bug audit (assignment received 14 November 2026)

An outside review (written by ChatGPT, handed over by the project owner) listed suspected defects and gaps in the quality net. This file is the working record: each item is **reproduced, fixed with a regression test**, or **not reproduced, with the evidence**. Licensing and independent fact-checking are out of scope for this cycle. Feature work (Part IV of the assignment) waits until reliability work is done.

Rule for every item: inspect the code, reproduce deterministically, add a test that fails before the fix, make the smallest safe fix, run the focused test and the neighbouring ones, then record the commit here.

## Part I: defects to investigate

| # | Suspected defect | Status | Evidence / test / commit |
|---|---|---|---|
| 1 | Sync discovery stuck after a transient session failure | **reproduced and fixed** | Root cause: `discover()` returned to `syncNow()` once the server was "available", and `syncNow()` returns when there is no user, so a failed `/me` left the person signed out until reload. Fix: `src/sync/state.ts` (session tracked apart from reachability; only 401/403 means nobody; timeouts/5xx/unreadable answers retry on a bounded back-off; online/visibility/Retry look again at once; a deliberate sign-out is remembered; an epoch drops stale answers) and a 20 s request timeout in `src/sync/api.ts`. Tests: `tests/sync-discovery.test.ts` (14; 12 fail on the old code). Not covered by a unit test: two real browser tabs (covered by reasoning: each tab keeps its own state and re-checks on visibility). |
| 2 | Sync conflicts lose metadata-only edits | **reproduced and fixed** | Old code kept the other version only when the body text differed; a title, kind, folder, target, revisit or pin difference was silently overwritten, and an older copy from another device could resurrect a note deleted here. Fix: `src/sync/merge.ts` (tags/refs joined, pin and answered stay set, any other difference kept as a copy with a stable id `uid~conflict~hash`) and `applyRemote` (tombstone check). Tests: `tests/sync-conflicts.test.ts` (21; 11 fail on the old code). Other tables (highlights, bookmarks, collections, plans, queue ...) remain record-level newest-wins by design; folder rename/delete, schema migration, interrupted batches are exercised by the existing `tests/sync-engine.test.ts` against a real server and are not re-tested here. |
| 3 | Error-boundary recovery deletes unrelated Cache Storage | **reproduced and fixed** | The old "Refresh the app" unregistered every service worker and deleted every cache on the address, including offline Bible/content packs (`studybible-data-v1`), offline audio (`studybible-audio-v1`) and other apps' caches. Reproduced in Chromium: `e2e/recovery.mjs` against the previous build failed with the offline pack and audio gone. Fix: `src/lib/recover.ts` (inventory: app precache `workbox-precache-v2-<scope>` and `studybible-heavy-v1` are removable; data, audio, media, offline and everything else are kept; only this app's scope is unregistered; offline nothing is removed and the person is told). Tests: `tests/recovery.test.ts` (6) and `e2e/recovery.mjs` (real Cache Storage, online and offline, in the release runner). |
| 4 | Update safety checks textarea presence, not dirty state | **reproduced and fixed; reworked in the second pass (revision-based acknowledgement, see below)** | Old rule (`document.querySelectorAll('textarea')` with any text): with a saved journal entry open for editing it returned true, so an update waited indefinitely; typing in inputs, selects or rich text was invisible to it. Reproduced in Chromium (see `e2e/updatesafety.mjs` step 4: old rule true, new tracker false). Fix: `src/lib/dirty.ts` (an edit is recorded on input/change events, cleared only when Dexie confirms a write to the table the field saves to via `data-saves`, ignored when the field leaves the page or is emptied, search/password boxes excluded) wired into `src/db/db.ts` hooks (`this.onsuccess`) and `src/lib/update.ts` (hidden-tab auto-update waits for clean; "Update now" asks first when dirty). Test: `e2e/updatesafety.mjs` (saved content, unsaved content, metadata-only title edit, failed save, two editors, navigation, self-clearing form, search box) in the release runner. Limit: a field that saves somewhere other than Dexie (localStorage forms) is cleaned by being emptied or leaving the page, not by its own save. |
| 5 | ThemeApplier effect dependencies | **reproduced and fixed** | The effect read `s.verseLines`, `s.showNoteMarks` and `s.layout` but they were missing from its dependency list, so changing one did not update `data-verses`/`data-notemarks`/`data-layout` until another listed setting changed or the page reloaded. Fix: three dependencies added in `src/App.tsx`. Test: `e2e/themeapplier.mjs` changes each through the real Settings UI and checks the attribute immediately, after reload, across routes, and under a dark + high-contrast system theme; run against a build with the old dependency list it fails ("one verse per line did not change data-verses at once"). Other values read by the effect were audited against the list: all others were already present. Not tested individually: seasonal theme change at midnight (the hourly timer is unchanged). |
| 6 | Collection and note round-trip integrity | **investigated in the second pass (see below): one defect found and fixed** | The existing `tests/backup*`, export and `e2e/collections.mjs` checks pass; no new round-trip comparison (duplicate, reorder, print, HTML, Markdown, ZIP, JSON, Unicode, partial import) was written. Still open. |
| 7 | Deep links and browser navigation (route manifest) | **reproduced and fixed (unknown ids); rest covered by the crawler** | The new full route manifest (`e2e/lib/routes.mjs`, 242 crawl paths for 213 app routes, kept in step by `tests/route-manifest.test.ts`) includes an unknown-id probe for every route that takes a required id. Reproduced in Chromium: a deleted or mistyped id left `/collection/<number>`, `/pray/plans/user:<n>`, `/teach/<id>` loading for ever (a missing record and "still loading" were both `undefined`), `/collection/<not a number>` crashed to the error page (NaN reached Dexie), and `/room/work/<id>` and `/study/works/<id>` rendered a blank page. Fixed in `CollectionPage.tsx`, `PlanPage.tsx`, `teach/store.ts` (`useClass`) and `WorkReader.tsx`: loading is `undefined`, not found is `null`, and each says so with a link back. The sweep now fails if an unknown id leaves a blank page or loads for ever. Covered by the crawler: direct loads of every route, in-app tab navigation. Covered by `e2e/reader-companion.mjs`: back/forward on the reader. NOT covered (open): query/hash parameters on shared links, Unicode/punctuation ids, passage scroll restoration, the GitHub Pages base path (CI serves at `/`), mobile drawer focus and dismissal. |
| 8 | Profile relationship structural validation | **validator added; shipped data already clean** | The existing validator checked references, duplicate ids and kinds only. Added `validateProfileGraph` in `src/lib/profiles.ts`: relation labels from a fixed list with the kinds that may carry them, no self-links, no repeated relation, no empty or missing targets, parent/child cycles and a 60-generation depth bound, one name for two profiles of the same kind only when listed (`mariam`), well-formed passage references (including cross-chapter ranges, which my first pattern wrongly rejected), and `relationGaps` for one-sided links (4 today: Elijah/Elisha, Andrew/John, John/Peter, Luke/Paul; capped so a new one is deliberate). Result on the 127 shipped profiles: no structural errors. So this was not a reproduced data defect; it closes the gap that such defects could not have been caught. Tests: 10 new in `tests/profiles.test.ts` (no relations, multiple, aliases, duplicates, empty/malformed, self, cycle, deep line, kind mismatch). Not covered: deleted targets at runtime (the page shows only profiles that exist; unchanged) and import paths (there is no profile import). |
| 9 | Edition and versification end to end | **reproduced and fixed (silent substitution); rest tested** | Reproduced in Chromium: `/read/web-c/PSA/23` (a mistyped translation id; the registered id is `webc`) rendered the Douay text under that address; an unknown book showed John, and a chapter past the end showed the last chapter, all without a word. The reader's `get(edId) ?? editions[0]`, `BOOK_BY_ID[book] ?? JHN` and a clamp did this quietly. Fix: `ReadPage.tsx` now renders an explicit state ("That translation is not available", "That book is not in the Bible", "John has 21 chapters") with one-click links to what exists. Test: `e2e/editionswitch.mjs` (release runner) checks the three bad addresses, a non-numeric chapter, a good address, and that switching translation keeps John 3 and Psalm 23 (WEB-C and NABRE share Hebrew numbering; the existing `tests/versification-audit.test.ts` covers the numbering rules). The crawler's manifest now also probes the three bad reader addresses. Not covered: cross-chapter ranges, parallel view with missing alignments, footnote display per edition (existing parallel/footnote e2e only). My earlier sample paths used the wrong id `web-c`; corrected to `webc` throughout. |
| 10 | Persistent media lifecycle | **reproduced and fixed (two players at once); rest tested, no defect** | Reproduced in Chromium: with a video playing in the host, starting a recording in Meditate left the video host open (`.media-host iframe` still present), and nothing paused the audio player when a video started, so both could play together. Fix: `PlayerContext.play()` closes the host first, and the audio element registers `hooks.onNewMedia` in `src/lib/mediaHost.ts` so a new video or recording pauses it. Test: `e2e/mediaaudit.mjs` (release runner): one player after switching tracks, the dock has an accessible name and does not cover the tab bar, every dock control is named and reachable by Tab, the title link returns to the page, close really removes it and it stays closed on other pages, a reload never autoplays, offline does not crash, and the two-engine case above. Not covered: playback position resume after a reload (covered by `videoresume.mjs`), media-element error states (a failing stream), screen-reader announcements beyond names. |
| 11 | Reader auto-open and toolbar behaviour | **not reproduced; tests added** | Read `ChapterCompanion.tsx` (a `touched` flag stops the automatic open after a deliberate open or close; it resets on a new chapter, so a new chapter opens again when it has content, by design). `e2e/reader-companion.mjs` (in the release runner) checked at 360, 320 with 140% text, and 1100 px: opens by itself on a chapter with content; a deliberate close survives scrolling, a window resize, and opening then closing the study panel; it does not overlap the verses (an earlier draft of that assertion matched no element and so proved nothing; it now fails if it finds no verse); the toolbox menu is on top and Escape closes the menu, not the page; back and forward leave exactly one panel. No defect found. Not covered: dismissal remembered across a return to the same chapter (the panel reopens then, by the same by-design rule), sticky-control interplay beyond the menu. |

## Part II: strengthening the quality net

| # | Gap | Status | Evidence |
|---|---|---|---|
| 1 | CI uses the fast sweep; add a scheduled or release full sweep over 320/360/390/412/768/1024/1280 | **done (run pending)** | Confirmed: CI ran `SWEEP_FAST=1`, one 320 px large-text size only. Now `SWEEP_MODE=fast` (320 px large text + 390 px) on every push, and `.github/workflows/full-sweep.yml` runs `SWEEP_MODE=full` nightly, on release and on demand: 10 sizes (320 360 390 412 768 1024 1280, plus large text at 320, 390, 1280) split over five jobs. See the first full run in the report. |
| 2 | Crawler caps (6 folds, 4 tab groups, 8 tabs) and swallowed clicks | **fixed** | Confirmed all three caps and `.catch(() => undefined)` on clicks. `e2e/sweep.mjs` now opens every fold (repeating while folds reveal more), clicks every tab of every tab row, reports each click that fails, checks `aria-selected` after each click and re-runs the layout invariants after every interaction; it prints counts of folds, tab rows and tabs exercised. |
| 3 | Console and network failures (`requestfailed`, first-party 4xx/5xx) | **fixed** | Confirmed the old filter dropped every "Failed to load resource" console error and watched no network events. The sweep now records `requestfailed` and every response; a first-party failure or 4xx/5xx fails with URL, status and route; third-party hosts are on a documented allowlist (video and audio hosts, fonts) and are only counted. |
| 4 | Route-specific assertions and a route manifest compared with executed coverage | **fixed** | Confirmed: only 68 of 213 routes in `src/App.tsx` were crawled. `e2e/lib/routes.mjs` is now a full manifest (static routes, optional-parameter bases, real samples, and unknown-id probes for required parameters); `tests/route-manifest.test.ts` fails if App.tsx and the manifest drift. The sweep requires a real heading per route, fails on the error page, and on the not-found page except for unknown-id probes (which must say so rather than break). |
| 5 | Overlap invariant exemptions (sticky/fixed); add a broken fixture that must be caught | **fixed** | Confirmed the old rule exempted every sticky/fixed ancestor after scrolling, and fixed elements were skipped entirely (`offsetParent` is null for them). Now only a named list of overlays and sticky bars is exempt, and fixed elements are checked. `e2e/invariants-selftest.mjs` feeds nine fixtures (overlap, unknown fixed bar, known bar, hidden-tab row, text spill, sideways page, popup menu, leaked values, clean page) and runs in the release runner. |
| 6 | Tab round-trip assertions (aria-selected, identity, order) | **fixed (partly)** | Round trip now compares `STRUCTURE` (which tab is selected in every row, and the first 40 link targets in order, numbers kept) as well as the text, and asserts `aria-selected` after each click and after coming back. Not covered: restoration after a route change or reload (several tab rows persist by design and others do not; asserting it needs a per-row expectation). |
| 7 | Account/sync checks in the release runner | **fixed in CI, not in `e2e:release`** | Confirmed `e2e/accounts.mjs` was in no runner. It needs a separate build (`VITE_ACCOUNTS=1`) and the real server, so it is a separate CI job (`accounts`). It passes locally (registration, two-factor sign-in, sign-out, wrong code refused, recovery codes, security log). Two-device sync, merge/wipe, conflicts, expired sessions, endpoint errors, offline recovery and deletion are covered against the real server by `tests/sync-engine.test.ts`, `tests/server.test.ts`, `tests/accounts-security.test.ts` and the new `tests/sync-discovery.test.ts` and `tests/sync-conflicts.test.ts`, which run in `npm test`. No live credentials are used. |
| 8 | Production dependency audit must fail on high severity | **fixed** | Confirmed `continue-on-error: true`. Now `scripts/audit-gate.mjs` fails on high/critical findings unless `docs/AUDIT_EXCEPTIONS.json` has an unexpired waiver (owner, reason, date); output shows PASS / WAIVED / FAIL. Today two high findings (pptxgenjs, image-size; no fixed release exists) are waived until 2027-02-14 with the reason written down. `tests/audit-gate.test.ts` (7). |

## Owner requests handled alongside (14 November)

- Lesson pages themselves made calmer, not only the grade page.
- Media tab: all tabs visible (no hidden sideways scroll); the sweep now fails on any tab row that hides tabs.
- Mini player can be moved anywhere (drag, or arrow keys; Home puts it back).
- Principle: organising must not make things harder to find. Nothing is moved behind a fold or menu without a visible, labelled entry point.

## Round summary (14 November 2026)

Reproduced and fixed: items 1, 2, 3, 4, 5, 7 (unknown ids). Added with no defect found: 8, 11. Not investigated: 6, 9. Partly covered: 10. Part II items 1 to 8 are done (see rows), with the first nightly/release full sweep not yet run in CI. Feature work (Part IV) was not started, as instructed.

Other defects found by the stronger crawler and fixed: the Bible-tools passage panel tabs hid behind a sideways scroll; shelf, church-document and games tiles overflowed at large text; the old `overlap.mjs` carried a private copy of the detector (now shared).


---

# Second-pass reliability audit (14 November 2026)

Assignment: fix the confirmed problems, strengthen the quality net, finish the collection and edition audits; no Part IV feature work. Baseline `7cf9afa`. This section records what was executed; nothing here is claimed that was not run.

## Defects: reproduction and fix status

| # | Item | Reproduced | Fix | Regression test (fails before) |
|---|---|---|---|---|
| 1 | Dirty state cleared by any write to a table | by reading the code and the new API not existing before; the old acknowledgement was table-wide (`this.onsuccess` in the Dexie hooks) | `src/lib/dirty.ts` rewritten: each field has an editor id and a revision; `beginSave(editorId)` snapshots, and only a successful write of that editor and revision clears it; editor-less fields stay dirty until emptied or removed; editors wired in notes, journal, reflections, examen, lectio, collections and lesson notes | `e2e/updatesafety.mjs` (two editors on one table, edit during a save, failed save, metadata-only edit) |
| 2 | Conflict ids depended on key order of nested values | yes: 4 tests failed on the old code | `src/lib/canonical.ts` (recursively sorted keys) used for comparison and for `uid~conflict~<hash>`; collections compare items and done marks by value | `tests/sync-conflicts.test.ts` (29) |
| 3 | Profile depth validator was recursive and input-order dependent | yes: 8 tests failed on the old code | iterative memoised longest-line search, `MAX_GENERATIONS = 60`, cycles reported once | `tests/profiles.test.ts` (34) |
| 4 | Fold crawler capped at 6 passes | yes (read from code; the old loop stopped silently) | `openAllFolds` (`e2e/lib/crawl.mjs`) opens folds until none remain; the safety ceiling (60 passes) FAILS and names what is still closed; folds the crawler cannot see (a page's other-width alternate) are not folds | `e2e/crawler-selftest.mjs`: ten nested folds, a fold revealed by another, an endless reveal that must fail at the ceiling, popup menus excluded |
| 5 | Empty or invalid crawler and runner configuration passed | yes (an empty `SWEEP_SIZES` crawled nothing and passed) | `e2e/lib/config.mjs`: sizes, shard, concurrency, mode, empty routes and zero checks all exit 2 and print the configuration actually used; the runner also checks every check file exists | `tests/crawler-config.test.ts` (spawns the real scripts with bad settings) |
| 6 | Route assertions were "something rendered" | yes | every unknown-id page carries `data-state="not-found"` (15 pages changed) and the crawler requires it; other routes must not show it; about 30 routes must show their own heading (`EXPECT` in `e2e/lib/routes.mjs`); `/join/<bad>` and `/widget/<bad>` are tolerant pages, now listed as such | `e2e/crawler-selftest.mjs` (misrouted page, missing not-found state, wrong not-found on a real route) and `tests/route-manifest.test.ts` |
| 7 | Tab round trips compared 40 links and the first tab only | yes | `exerciseTabRows`: every tab of every row, rows revealed by a click, then back through all of them in reverse; compares selected state, panel identity, every link and record id in order, and the text with its numbers; whether a fold is open is ignored; three equal reads before a capture | selftest fixtures: list of 60 with one change at item 56, same count different ids, reordered, changed number, a middle tab, a changed panel id, a row revealed by a click, a tab that never becomes selected |
| 8 | MediaHost: iframe remounts per key but the YouTube player was bound per video id; players never destroyed | yes: scenario 3 failed on the old code (the same video under a new address got a new iframe and no player, so its position stopped being saved) | effect depends on `[id, key]`, title read through a ref, `player.destroy()` in cleanup | `e2e/mediahost-lifecycle.mjs` (12 scenarios, 15 assertions, controlled YouTube script and embed pages, no network) |
| 9 | Collection/note round trips | yes: a merge import lost folder membership (folders get new ids, notes kept the old `folderId`) | `importAll` imports folders first and maps ids; a note whose folder is not in the file loses the dangling id | `tests/roundtrip.test.ts` (9): replace and merge round trips of notes, folders, collections, highlights, bookmarks, journal and cross-references compared field by field, Unicode text, merge twice, damaged file imports nothing, newer-format refusal, Markdown and CSV exports. Formats: the JSON backup is the only one read back; Markdown notes, CSV and Markdown marks are export-only (stated in the test) |
| 10 | Editions and versification, end to end in a browser | yes, three defects | (a) switching a second time lost the verse (the `?v=` highlight was not treated as the place): fixed; (b) a chapter the other translation lacks was silently replaced by its last one: no longer clamped; (c) a translation without the book (the Septuagint has no John) landed on "John 1" with a leaked JSON parse error: now an explicit "does not include John" state with links to translations that have it | `e2e/edition-verse.mjs`: 15 cases checked against numbering facts independent of the app's tables (Ps 23:1 = 22:1; Ps 51:1 = 50:3; Ps 51:3 = 50:5; Ps 3:1 = 3:2; Joel 2:28 and Mal 4:1 do not move in the Clementine; round trip; the missing-book state) |
| 11 | Documentation drift | yes | `docs/QUALITY.md` no longer says tab rows scroll; automated and manual checks are separated; counts are printed by runs, not written in prose | `tests/docs-status.test.ts` |

Found by the stronger full sweep (nightly workflow, first run on `ea1655f`) and fixed: the reader's study-panel tab row hid tabs behind a sideways scroll in the 400 px desktop panel (CSS only fixed it below 600 px; the row now wraps at every width). Crawler false positives fixed: folds nobody can see, a fold the page opens by itself (About this chapter), a press that fails once on a busy machine, a tab list captured before a lazily loaded item arrived. One earlier "real" finding (`/study/passage/JHN.6.51` tab round trip) was the crawler's own comparison ignoring folds it had opened; corrected, not an app defect. A CI failure in `e2e/recovery.mjs` (an aborted reload while the app reloads itself) was a race in the check and is tolerated.

## Owner requests handled in this pass

* The docked picture-in-picture player can be resized (drag the handle in its bar, or arrow keys, `+`/`-`; Home restores; the size is remembered), `e2e/mediahost.mjs`.
* Outside projects and data: see `docs/INTEGRATIONS.md` (adopted: chant notation, Greek edition differences, podcast transcripts, original scans; each other item has its reason).

## Test inventory (what ran, on which commit)

See the commands and results table below.


---

# Reliability cycle: reference integrity, listening history, and safe state transitions

**Status: incomplete; draft review only.** Branch: `reliability/reference-listening-state-cycle`. The PR base is `c3cee139c40d291a0eaa7aa000359c846ac1bbd4`; compare confirms it is the merge base (237 commits ahead, zero behind). No rebase was necessary. The base commit already contains the shared `refCheck` / `resolveRef` and recoverable Go Further loading work; this cycle extends those paths rather than duplicating them.

## Work completed in this pass

| Area | Changes and regression coverage | Commits |
|---|---|---|
| CI failure triage | The first observed `fast` run (`43649865764`, commit `354ea94`) passed `npm ci` and failed typecheck on two dynamic Dexie transaction spreads and two reads of nonexistent `convertRef().note`. Replaced the dynamic spread with an explicit transaction table list and removed the invalid property reads. These fixes have not yet been verified by a completed rerun. | `00e62c8`, `eff8fc4`, `023a6c5` |
| Source / anchor semantics | Added all-or-nothing plan reference resolution against pooled English source counts and the canonical Clementine Vulgate edition. Both PlanBuilder and the manual PlansPage creation flow now refuse a day containing any invalid or non-exact reference; they do not persist the valid subset of a mixed day. PlanBuilder's book/chapter mode validates every generated chapter against the canonical edition counts; invalid, reversed, non-integer or out-of-range inputs are rejected instead of clamped. The UI distinguishes Vulgate chapter selections from English/KJV typed references. Their UI identifies the English/KJV source numbering and exact-only Vulgate-anchor storage. | `14edda1`, `64d41da`, `1d7321d`, `0b8d90d`, `0fb4d79`, `289ae68`, `0c86d15`, `6ea995c` |
| Unaligned books | Copied the five known unaligned Catholic books into the KJV external-reference scheme as well as English; same-tradition shortcuts now respect unaligned-book caveats. | `4016052`, `9579e37`, `3eeda39` |
| Versification range integrity | `convertRef()` now preserves the end chapter of chapter-only and partial cross-chapter ranges. Whole-chapter mappings that split or merge are marked non-exact. No clamping or nearby-verse substitution was introduced. | `48d91d2`, `ad0b35a`, `73e3589`, `040fb16` |
| Reference regressions | Added tests for KJV John 6:51–58, unverified Psalm numbering, every unaligned book in English and KJV schemes, a verified Psalm conversion, invalid book/chapter/verse, single verse, same-chapter range, cross-chapter range endpoints, absent target books, split Psalm chapters and chapter-only range preservation. | `54fc9a4`, `cc0376a`, `e02823f`, `856820c` |
| Repair semantics | Human-readable repair conversions require exact KJV-to-anchor conversion and both real source and canonical Vulgate edition counts; unverified John 6 references are withheld. Data Health validates stored anchor refs against edition counts. Repair and Undo now re-check the record state inside the transaction, so a later user edit is not overwritten. | `80b3f09`, `fd89208`, `a4b2c96`, `3dbd99e`, `5e24643`, `5e76cee`, `422ec36`, `c3c0e80`, `9f0d7c0`, `488dc4d`, `d772f5d` |
| Go Further / memorization | Go Further requires source, target and canonical anchor counts before creating a reference context; it withholds Scripture links if any are unavailable, reports them as unavailable, and keeps the retryable loading path. Review/memorization without counts is explicitly approximate and cannot be added automatically. Approximate scripture links to a different numbering remain explicitly noted. Memorization retains the original source ref/scheme and an approximate flag; exact-only compatibility lookup returns no card for unverified passages. The review UI offers a separate, explicit “Add it anyway as … (Vulgate numbering)” action for an approximate card; without edition counts, even a static-only exact mapping is withheld from automatic memorization. Approximate Go Further notes identify English/KJV as the source numbering and the selected target edition. | `c3cee13`, `6d3bc0a`, `75de56e`, `c3c0e80`, `9f0d7c0`, `488dc4d`, `4c9069d`, `91415f2`, `2e60373`, `ed14814`, `cce8b05`, `c3799f5`, `311404d` |
| Annual listening | Dated ledger attribution covers listening across years, later position-only updates, manual played marks, replay in a later year, actual end events and legacy undated rows. Listening ledger read-modify-write and manual played updates now use Dexie transactions to prevent concurrent saves from losing increments. Legacy undated listening seconds and completion marks persist after new dated activity, so later playback does not hide the historical uncertainty. | `68d4536`, `35d75e4`, `86ae189`, `4d139de`, `0a00db0`, `763fc62`, `f829c86`, `40285e0`, `3d43f46`, `d97b7cb`, `b923da7`, `93a7122`, `be4cae5` |
| Playback races | Added a request-generation resolver used by play, retry and reload restoration. Controlled-promise tests resolve requests in reverse order, cover imported local audio followed by a remote episode, stale rejection and stop invalidation. Source errors are bound to the active resource, queued stale ended events are ignored, and previous playback time is flushed before replacing the source or clearing the dock. | `d680d06`, `46e1c84`, `057b316`, `9075f17`, `ef09e7e`, `664b6f5`, `5fdf3d2`, `a31995a`, `6c3a5d1`, `4f7d5da`, `f6ef19c`, `8e9fdd9`, `ab15609`, `9bc7431`, `9997392` |
| Atomic repair / restore | Repair batch, Undo and trash restore are transactional. Snapshot failure is a hard stop; mid-batch and Undo failures roll back; concurrent restores consume the trash row once; duplicate UIDs are not re-added; an interrupted restore leaves the trash/tombstone intact. The Data Health UI distinguishes a committed mutation from a later refresh failure. | `9d80f6d`, `4e1707c`, `f715c02`, `3900d78`, `1dad107`, `4d0be69`, `bed08da` |
| Collection completion | Done marks use canonical JSON comparison rather than key-order-sensitive string comparison. | `d65ab18`, `b893a80` |

## Regression tests now present

- `tests/refCheck.test.ts`: source/target counts, unaligned books, KJV John 6, Psalm numbering, invalid refs, both range endpoints, chapter-only ranges and absent books.
- `tests/planReferences.test.ts`: exact typed passage, mixed valid/unverified day, invalid chapter, all five unaligned books and whole-chapter book-mode validation.
- `tests/dataRepair.test.ts`: safe capitalization normalization, withheld unverified conversion, semantic counts, snapshot failure, batch rollback, Undo rollback and stale-edit protection.
- `tests/goFurther.test.ts` and `tests/knownLoad.test.ts`: approximate scripture link disclosure, memorization uncertainty with and without edition counts, failed edition index withholding, transient retry, no partial-result caching, missing work file and unavailable index behavior.
- `tests/listening.test.ts`: year boundaries, manual played marks, position-only saves, legacy rows, end-event attribution, replay in another year, concurrent saves and persistence of legacy-undated disclosure after new activity.
- `tests/playbackRequest.test.ts`: controlled promise reverse-order resolution, local-file-to-remote transition and stop invalidation.
- `tests/trashRestore.test.ts`: simultaneous restore, duplicate UID, interrupted transaction rollback.
- `tests/verselinks.test.ts`: exact-only verse and whole-chapter index lookups; unverified John/Psalm and unaligned-book mappings are withheld.
- `tests/refIntegrity.test.ts`: exact-only secondary apologetics and daily-reference consumers.
- `tests/prayer.test.ts`: prayer, course and story helper does not attach approximate passage addresses.
- `e2e/mediacontrols.mjs`: actual browser audio-element switch from a local meditation file to a BIAY episode; asserts the old position is persisted before the new source takes over.
- `e2e/datahealth.mjs`: injects a post-commit IndexedDB refresh read failure; asserts the mutation remains committed, the error is accurately reported, and stale repair actions disappear.
- `tests/collectionsView.test.ts`: key-order-independent completion mark.

## Additional independent consumer audit

A repository-wide scan of the source tree found additional direct convertRef consumers outside the original plan and Go Further paths. They now all gate use of converted addresses on `.exact` or withhold the result: episode search, devotional attachments, course and story references, apologetics, Catechism footnotes, translation comparison, concept-map personal notes, passage dossier, glossed page, lexicon, manuscript links, study paths, daily readings, inline artwork, original-language text, and verse-link index lookup. The reader's book-section label is also suppressed when its reverse chapter mapping is not exact. Unverified episode searches and Catechism/apologetics/term/path views show an explanatory note instead of opening a guessed passage.

This is a source-level audit, not a runtime verification. The new secondary-consumer regression tests and CI results still need to run.

## Fresh independent reliability audit

A second pass over reference resolution, link construction, memorization, Data Health and the browser harness found additional issues:

| Finding | Fix and regression coverage |
|---|---|
| Cross-chapter anchor resolution checked only the two endpoints and could miss an unverified chapter between them. | `anchorToNativeRef` now uses the range-aware converter, which checks every intermediate chapter. `tests/refCheck.test.ts` covers Genesis 48:31–51:1 across unverified chapters 49–50 and a verified Genesis 1:31–2:3 range. |
| Go Further could label a cross-chapter passage while its reader URL opened only the first chapter. | It now discloses that the link opens at the first chapter and names where the range continues. The component renders the actual caveat rather than a generic numbering warning. `tests/goFurther.test.ts` covers the route and disclosure. |
| `readerUrl` checked only the first chapter, not the end chapter or verse endpoints. | It now calls `checkRefIn` before returning a URL. `tests/refIntegrity.test.ts` covers invalid end-verse and end-chapter cases. |
| Approximate memorization cards used the static conversion result even when semantic resolution had reduced the anchor to a chapter-only reference. | `keyVerse` now stores `res.anchor` when available. Mark 4:41 and Acts 7:60 regression cases check that the stored anchor is valid in the canonical edition. |
| A target-edition verse mismatch could be downgraded to chapter-only without proving a known numbering difference. | The fallback now requires a known alignment caveat, a maximum one-verse overrun and a valid chapter range; it preserves both chapter endpoints and otherwise returns invalid. A damaged-anchor test covers a large mismatch. |
| Data Health could leave a stale Restore action visible if restoration committed but the follow-up scan failed. | The UI clears stale restore actions and distinguishes a committed restore from a failed refresh. `e2e/datahealth.mjs` now tests both repair and trash restoration with post-commit IndexedDB read failures, intercepting object-store and index getAll/cursor reads, then verifies persisted state after reload. |
| Reader edition changes could briefly render the previous edition's chapter while the new edition loaded; the browser test could click a stale verse. | `ReadPage` now keys loaded book data by edition and book and hides stale content immediately. The browser test waits for a matching `data-reader-ready` chapter marker before selecting a verse. |
| Annual-listening tests used incorrect durations for decimal-hour accounting and fake timers that interfered with IndexedDB. | Tests now inject explicit local dates and realistic durations; frequent five-second saves assert 100 seconds recorded and 0.0 displayed hours after one-decimal rounding. |
| The trash rollback test queried a tombstone UID index that does not exist. | It now uses a filtered collection scan, matching the actual schema. |
| CI's generated-index commit failed with HTTP 403. | Only the fast job now requests `contents: write`; subsequent generated-index commit steps passed. |

This is an independent code/test audit. The newest browser assertions have been added but still require a completed current-head browser run.

## CI and quality-gate status

Results are tied to the exact commit tested:

| Run | Tested commit | Verified result |
|---|---|---|
| #1016 | `f3f8432` | `npm ci`, typecheck and reference-index regeneration passed; unit tests failed on six reference/memorization assertions. Later fixes address those failures. |
| #1029 | `008ddd5` | Fast job passed: `npm ci`, typecheck, exact-reference index generation/commit, `npm test`, `docs:status`, `data:validate`, build, budget and dependency audit gate. Secrets and accounts/sync passed; browser shards and full-width sweep were still running at last check. |
| #1031 | `d919132` | Fast job passed the same full gate list. Secrets and accounts/sync passed. Browser shard 1 failed in the Data Health refresh-failure test and edition-switch verse-selection test; both causes have been addressed in later commits. Browser shards 2/3 and the full-width sweep remained in progress at last check. |
| #1043 | `13eb4a9` | Queued; includes the browser retry-position and Data Health restore-refresh assertions. |
| #1045 | `32f1568` | Queued on the prior report head. No result yet. |
| #1061 | `17f8e7f` | Queued; includes the loaded-edition guard and deterministic edition-verse browser wait. No result yet. |

The automatic generated-index commit initially failed with HTTP 403 on run #1001. Job-scoped `permissions: contents: write` fixed it; the generated-data commit step subsequently passed. The workflow uploads an artifact for review and commits regenerated exact-reference indexes and the offline manifest to the PR branch.

Run #1031 is a complete fast-gate pass on `d919132`, not on the latest head. Its browser release shards and full-width sweep were still executing when checked. Accounts/sync passed on that commit. Do not treat the latest PR head as verified until a run on the current head and all dependent jobs finish and their results/logs have been inspected.

## Remaining before merge

- Await a run on the newest PR head; fix any fast-gate failure and repeat until all fast checks pass.
- Verify all three browser release shards, including actual audio-element switching, retry-position persistence, edition switching, and Data Health repair/restore committed-mutation versus refresh-failure assertions.
- Verify the dedicated full-width sweep and accounts/sync job on the latest head.
- Complete one final independent audit after those browser results and record any further fixes.
- Update this report with final run IDs, the exact tested commit SHA and actual results.

PR #11 remains draft and unmerged. Do not merge it.


## Third independent reliability audit — 2026-11-15

This pass continued from the current PR head after run #1083 exposed a reference-validation regression. It was a source-level audit plus regression-test authoring; tests on the newest head remain pending until the queued workflow completes. No claim is made that the repository is bug-free.

### Additional findings and fixes

| Finding reproduced by source inspection | Fix | Regression coverage |
|---|---|---|
| The same-tradition shortcut could return an exact verse despite an explicit unverified source-chapter caveat. | `d2a0ba0398336e9e43b70008013b0903127c93a9`; range-bounded caveat scan `c5de67c6f9ec8eed41ab72d137ba2495b6784a08`. | Existing one-verse source/anchor mismatch regression; CI #1083 originally failed this test. |
| A target-edition mismatch fallback inspected only range endpoints and could miss a known unverified intermediate chapter. | `d0565844fe7d1f2e6c264c0eb5aee68b5a463da6`. | `0942dfa010408282fa3d9437a0881e84af19b217` adds a cross-chapter target-caveat case. |
| An ended-event queue lookup could resolve after a newer user selection and start the stale queued episode. | `cf34ca23a368425096eec5345d0f5bed2c6870d4`. The handler now captures the ended episode and request generation, awaits completion persistence, and rechecks identity/generation after each asynchronous queue/load step. | `8bd3c1296fd0136ce8f7859a883564bf6e162702` adds a controlled-promise stale-queue regression. |
| Collection summaries counted duplicate imported done marks as multiple completed items. | `59fa922da0780ec4a322e4ee462bcf08feb3c09c`; the lightweight shared matcher was isolated in `87332f018122e5655c1df5bd935d0b6b37987ebc`, re-exported in `d11a2012011c1f2ed14e2c75c1cba6f19118134a`, and used by the summary in `934b7b06f0ed42d7b7a52d1c039cb76e0695f4fd`. The unused import was removed in `898016edeb5c521e66a4d6f827cc5eee75128401`. | `9e94b5d6a592b85bba85c3e52af880d1492b208b` tests duplicate marks and key-order independence. |
| Go Further computed broken lesson resources but did not render them; a missing library work could therefore disappear silently. | `be26ce2c73f9dc3d81ab9fba40c31e784d8bf4ce` renders broken references and includes them in the visibility/empty-state decision. The all-sources failure fallback now includes editions. | Existing missing-work and broken-link tests in `tests/knownLoad.test.ts` / `tests/goFurther.test.ts`; UI rendering still requires browser verification. |
| Failed or malformed Go Further indexes could be mistaken for complete data. Track imports swallowed per-file errors; chain, reverse-track and edition caches could retain rejected promises; missing/null JSON results could remain cached; malformed indexes could assemble as apparently empty data. | Retryable cache helper: `5efec59bf5a20c3e33d7f82c0f3de9a22a0cccac`. Edition/JSON retry: `e497876bb3d4d711e8e109a3a107a1e11fe2b1d6`, `ac37183a28a4fbe6130c08d1b1d578aa9d6f3b53`, `dc00c5dbb9f34e74e7298cfad27ef222590c8a28`. Track/reverse-track retry: `cf63f56890755a11c5572bde0035b7c068611fc1`, `8eaf6815c4a855af359dd8fafef4cfcc187dab27`, `7d3cb27b191ca5c51de6e3cc1806d2d2f1b79d36`. Chain and secondary-index retry/missing-index handling: `5d3e55ff540de1037ba3d324b9f627a4d2f4262d`, `7495a46ad1969d7b14b59d29178c84e2be4ca1be`, `f183a80da310ae66e8789daccf126c177c4b49c3`. Structural validation: `9a2801e69306ea80f7494c4958defd4041338956`, `bad66e236478247311601cf455455e0b5646ec24`, `e8cf327beb185f6b90b4c586c1c041333cd9eff1`, `fc0c50054a05e2de91be0601b5704625f8a84f40`. | `2186e67fcc454627b9a436b8236d2685fabbe957` tests retryable promise caches; `2eed159c804c1e796d0d1b3a6fd1f669a7097e70` tests missing/null JSON retry; `7d987ede6fa34a815164bec1f219da3896b79b8c` and `d2f1e8f3cb145e549f0afeca86c13bea207eb51c` test malformed source and nested track indexes. |
| Legacy episode-progress rows with a zero heard total could trigger an unnecessary “undated listening” warning. | `bc22b3ad862fd263fc43d912c16d14d31da06223` ignores zero-value legacy totals while preserving actual legacy completions. | `e7e7c2e52c78cb3c1ad8eedfee4c5bfb043a88dc`. |
| Formatting a cross-chapter range whose start is a whole chapter and whose end is a verse dropped the end verse; the corresponding human-readable range could not be parsed back. | Formatting fix `8de4f3bd4cdcb3fff4ca4c09199dae6d6f4e802e`; parser support `a26e1a9fb0777cca0f5e7dffde5d835c95a97438`. | `ac97aeb4b04c147147ffffc12baab57d0f71a2f2` and `519031452aeb5d75bf6705a9cf199d9a77330bfd`. |

### Test inventory added in this pass

- `tests/refCheck.test.ts`: intermediate target-chapter caveat during endpoint downgrade.
- `tests/playbackRequest.test.ts`: stale queue resolution after a newer selection.
- `tests/collectionsView.test.ts`: duplicate done marks count once.
- `tests/knownLoad.test.ts`: malformed index and nested track structure are partial failures.
- `tests/promiseCache.test.ts`: rejected promise eviction, retry, successful caching, and keyed isolation.
- `tests/loaderRetry.test.ts`: 404 and JSON-null responses are not cached as successful data.
- `tests/listening.test.ts`: zero-value legacy progress does not trigger an undated-history warning.
- `tests/refs.test.ts`: partial cross-chapter formatting and parsing round-trip.

### Verification status on the latest code head

Latest code head at the time of this report: `519031452aeb5d75bf6705a9cf199d9a77330bfd`.

| Check | Result |
|---|---|
| CI run #1160 — fast job | Queued; not run/verified |
| CI run #1160 — secrets job | Queued; not run/verified |
| `npm ci` | Not yet verified on this head |
| `npm run typecheck` | Not yet verified on this head |
| `npm test` | Not yet verified on this head |
| `npm run docs:status` | Not yet verified on this head |
| `npm run data:validate` | Not yet verified on this head |
| `npm run build` | Not yet verified on this head |
| `npm run budget` | Not yet verified on this head |
| `node scripts/audit-gate.mjs` | Not yet verified on this head |
| Three browser release shards | Not yet verified on this head |
| Accounts/sync browser job | Not yet verified on this head |
| CI full-width sweep job | Not yet verified on this head |
| Dedicated scheduled/release full-width workflow | Not dispatched or verified on this head |

The new tests are authored but are not evidence of passing tests until a completed run executes them. Runs cancelled because later commits arrived are not passes.

### Remaining work — do not merge

1. Wait for CI #1160 on `519031452aeb5d75bf6705a9cf199d9a77330bfd` to start and inspect its fast-job logs.
2. If any gate fails, fix the defect without weakening tests, then rerun the full fast gate on the resulting head.
3. Verify all three browser release shards, the accounts/sync job, and the full-width CI sweep on the same tested head.
4. Trigger/verify the dedicated full-width workflow if repository permissions allow; otherwise explicitly retain it as unverified.
5. Perform a final independent review after runtime results, update the test-results table with exact run IDs and conclusions, and record the exact tested SHA.
6. Keep PR #11 open, draft, and unmerged.

No claim of zero bugs or complete runtime verification is made.


## Fourth independent reliability audit — 2026-11-14

This audit continued from the prior report and reviewed the reference conversion path, annual listening ledger, playback request lifecycle, Data Health repair/restore paths, Go Further loading and cache behavior, plan-reference validation, collection completion matching, and the release workflow. Source-level findings below were corrected and regression tests were added. Runtime verification is still pending; authored tests are not evidence of passing tests.

### Additional findings and fixes

| Finding | Fix | Regression coverage |
|---|---|---|
| A parser update accidentally duplicated most of `src/lib/refs.ts` inside a regular-expression literal, producing TypeScript parse errors across the file. | Restored the parser and added the intended `C-C:V` partial-chapter range branch in commit `116425ab2dcad5a38fc4f7bfe762748f6676d3d3`. The earlier parser commit `a26e1a9` is not a valid verification point. | Existing `Gen 1–2:3` parser/format round-trip assertion in `tests/refs.test.ts`; CI must execute it. |
| A same-chapter reference beginning at chapter verse 1 but represented as `v1: undefined` could receive a noncanonical identifier such as `GEN.1-1.3`, distinct from `GEN.1.1-3`. | Canonicalized chapter-start partial ranges in commit `5b637dc3331cd0b4f3b88270f6710257de27273a`. | `tests/refs.test.ts` covers verse 1, verse ranges, and parse/identifier round-trip. |
| Replaying an episode whose progress row was already completed did not clear `completed`; later saves could continue treating it as finished and lose the replay's resumable position. | Replay now clears completion and stores the new position through `creditListening`, preserving the historical heard total and dated ledger. Error handling for the progress read/write was added in `7bfe97c2dd820ab345702fc0f637f25315c7a7e6`. | `tests/listening.test.ts` verifies completion reset preserves listening history; `e2e/mediacontrols.mjs` exercises replay in the real audio element. |
| Re-selecting the currently loaded episode incremented the request generation, making the old source-error listener stale; errors from the replayed source could then be ignored. | Rebind the source-error listener to the new generation before the asynchronous progress lookup; see `7245437d43138554f3dbe8484d632e361c370b31`. | `e2e/mediacontrols.mjs` injects a source error after replay and verifies the alert and retry path. |
| A whole Vulgate Psalm chapter could be reported as an exact whole-English-chapter conversion even when the target English chapter merged two Vulgate chapters (Psalms 114 and 115 both contribute to English Psalm 116). | `wholeChapterMapsExactly()` now checks the reverse target-chapter mapping before claiming exactness; commit `dd77ff05f9530ceb0a91673b0b0aac5de1b678d1`. | `tests/refCheck.test.ts` checks the English Psalm 10 partial split and rejects a false exact Vulgate-Psalm-114-to-English-Psalm-116 whole-chapter mapping. |

### Current verification status

The latest source/test head before this report update was `3aefdae67df4f229588a145a0c1fb29c055c403b`. CI run #1201 (`43666343843`) was queued on that SHA; neither fast nor secrets had started when checked. This documentation commit changes the branch head and will cause a new workflow run. The old queued run is not evidence for the documentation-updated head.

| Gate | Result on the latest source/test head |
|---|---|
| `npm ci` | Pending — queued CI, not run |
| `npm run typecheck` | Pending — queued CI, not run |
| `npm test` | Pending — queued CI, not run |
| `npm run docs:status` + generated-doc diff | Pending — queued CI, not run |
| `npm run data:validate` | Pending — queued CI, not run |
| `npm run build` | Pending — queued CI, not run |
| `npm run budget` | Pending — queued CI, not run |
| `node scripts/audit-gate.mjs` | Pending — queued CI, not run |
| Secrets scan | Pending — queued CI, not run |
| Three browser release shards | Pending — depend on fast gate |
| Accounts/sync browser job | Pending — depends on fast gate |
| Full-width CI sweep | Pending — depends on fast gate |
| Dedicated scheduled/release full-width workflow | Not dispatched or verified |

### Next actions — continue; do not merge

1. Inspect the first CI run created for the documentation-updated branch head. Do not count cancelled runs or queued jobs as passes.
2. If the fast job fails, inspect the exact failing step/log, fix the defect without weakening the regression, and rerun all fast gates on the new head.
3. Once fast gates pass, verify all three browser shards, accounts/sync, the CI full-width sweep, and the dedicated scheduled/release full-width workflow if it can be dispatched.
4. If CI regenerates and commits reference indexes, re-read the PR head and tie every result to that exact SHA.
5. Complete one final source review after runtime results and replace this pending table with exact run IDs, conclusions, and the final tested SHA.
6. Keep PR #11 open, draft, and unmerged.

No claim of zero bugs is possible. The remaining acceptance criterion is a completed, inspected run on the final head plus all dependent browser jobs; any unavailable gate must remain explicitly marked unverified.


## Fourth audit checkpoint — playback replay and Psalm reverse mappings — 2026-11-15

This section supersedes the previous section's “latest code head” and queued-run status. Additional review and concurrent branch work exposed further edge cases after the third audit.

### Additional defects and fixes

| Finding | Fix commits | Regression coverage |
|---|---|---|
| A whole Vulgate Psalm chapter can map into a target chapter that merges multiple Vulgate chapters (e.g. Vulgate Psalms 114 and 115 into English Psalm 116). Checking only that one target chapter was returned could falsely mark the conversion exact. | `dd77ff05f9530ceb0a91673b0b0aac5de1b678d1` now reverse-checks the target chapter back to exactly one anchor chapter. | `3aefdae67df4f229588a145a0c1fb29c055c403b` tests the merged-target case and the reverse split-Psalm mapping. |
| Queue advancement could adopt a newer pending request's generation if the ended event began after the new request but before its audio lookup resolved. | `1f6d704c983fd503e7ab60045fdcec8b4e8539a9` binds queue advancement to the active source generation; `8e6b18c385bf378587b6508143f356c147ceb05f` sets that identity on restore/retry. | `3a231d0040a39ff2d764dd5f103b2f0a0297e267` covers a pending newer request. |
| Replaying an episode already marked complete could leave its persisted `completed` flag set, preventing future resume restoration. The mini-player's original toggle path also bypassed replay-aware `play()`. | `e44024e29534d00ab1be096e442bf710afad6c23` clears completion without erasing history; `d152f28f400f89af15527d2f2ef88aa3c5d08d17` routes mini-player and Media Session play through replay-aware playback; `dbede8e548f62c27ca4b233ea7d79dc56a682af4` handles ended/outro state even before the completion write finishes; `327cd41a83c0492e4b38d33296034809b301c1b4` applies the reset on retry; `7bfe97c2dd820ab345702fc0f637f25315c7a7e6` surfaces reset failures; `39a55d35347a64077ba327b0d81fc7dac3d3d5bb` keeps Retry bound to the requested episode. | `ef94272b7e8d108fc56ddae6f93502c96cea5dca`, `bc1f5a5d10ce0a4188d1b15b5734b2b7de0238b0`, and `58106ba10b9db87b1a04735565cb3d0f0c393754` add/strengthen replay-ledger tests, including browser coverage. |
| Replaying the same source changed the request generation, making its existing media-error listener stale; rebinding only after an asynchronous progress lookup left a window where an error could be lost. | `c0a834e60a337fbb6610f8ef180d6c496ae186de` rebinds same-source errors; `7245437d43138554f3dbe8484d632e361c370b31` binds before the async lookup. | `edf6794fe39a2f8278a99c19004f228709c901fb` tests error reporting and Retry after replay. |
| A malformed cross-chapter parser edit caused typecheck to fail. | The parser file was restored from the last clean version and safely reapplied in `116425ab2dcad5a38fc4f7bfe762748f6676d3d3`. | `tests/refs.test.ts` retains the partial end-chapter parsing/formatting regressions. CI #1162 confirmed the failure before the corrective commit; no pass is claimed for that run. |

### Current code and CI status

Current source/test head: `3aefdae67df4f229588a145a0c1fb29c055c403b`.

- CI run #1162 on the earlier docs-updated head `d8683631ee31e45c10ea876063bd5d70cc7d5a32` ran `npm ci` successfully and failed at `npm run typecheck` due to the parser edit. The parser correction was subsequently pushed.
- CI run #1201 for the current head was queued at the time of this checkpoint. Its fast and secrets jobs had not completed. No test, build, audit, browser, accounts/sync, or sweep pass is claimed on the current head.
- Runs cancelled by subsequent branch updates are not passes.
- The dedicated full-width workflow has not been dispatched or verified. The CI `sweep-full` job remains the available corresponding full-width check, but is also unverified on this head.

### Remaining work

1. Obtain a completed CI run on the current head; inspect the fast job logs and fix any failures without weakening coverage.
2. Verify `npm ci`, typecheck, all unit tests, docs status, data validation, build, budget, dependency audit, and secrets scan on the same head.
3. Verify all three browser release shards, including the new replay/error regression, plus accounts/sync and the full-width sweep.
4. Run/verify the dedicated full-width workflow if available; otherwise record it as unverified.
5. Repeat the independent source audit after runtime results, update this test-results table with actual run IDs/conclusions, and record the exact tested SHA.
6. Keep PR #11 open, draft, and unmerged.

The audit reduces known risks but cannot prove the absence of every possible defect. No zero-bug or complete-runtime-verification claim is made.


## Fifth audit checkpoint — sleep timer and latest typecheck corrections — 2026-11-15

This checkpoint supersedes the fourth section's queued-run status.

### Additional fixes

- Run #1204 on `965091aaf5ec1faf683c3b55a685faa49b99c53f` completed `npm ci` and failed `npm run typecheck` on two issues:
  - `src/lib/listening.ts` dereferenced the optional legacy progress row while calculating undated totals.
  - `tests/collectionsView.test.ts` widened the target discriminator to `string`.
- Fixed the legacy migration with an explicit optional-safe ledger/total calculation in `3cb00c8cd92c13263bc457b9fcadfc575c22c7fb`.
- Fixed the test fixture's literal target type in `7a28c164c007a4f1e342b99f5f50240347634bcc`.
- A further playback audit found that a minute-based sleep timer could pause the active source while leaving an in-flight source lookup valid; that lookup could subsequently start playback after the timer expired. The timer now invalidates the current playback generation before pausing, in `b7d47c924e9f766f5936c8f820174eedc9c9076b`; `d6732f5279fa39b2307d17dec6f58c9ef04c42f7` adds a pending-source regression test.

### Current verification status

Current code/test head: `d6732f5279fa39b2307d17dec6f58c9ef04c42f7`.

- Run #1204: `npm ci` passed; typecheck failed with the two issues above; later corrected. Unit tests and all downstream gates were skipped.
- Run #1211 (push) and #1212 (pull request) for the corrected head were queued when this checkpoint was written. Neither had completed. No current-head typecheck, unit-test, build, audit, browser, accounts/sync, or full-width pass is claimed.
- The latest full-gate verification still does not extend beyond run #1031 on intermediate commit `d919132`.
- The dedicated full-width workflow remains undispatched/unverified; the CI `sweep-full` job is also unverified on the current head.

### Next actions

1. Get a completed fast job on `d6732f5279fa39b2307d17dec6f58c9ef04c42f7`; inspect logs and fix any further typecheck or test failures.
2. Verify the entire fast gate: install, typecheck, reference-index regeneration, unit tests, docs status, data validation, build, budget and `node scripts/audit-gate.mjs`.
3. Verify the three browser release shards, accounts/sync, and the full-width sweep on the same final code head.
4. Verify the dedicated full-width workflow if it can be dispatched; otherwise retain an explicit unverified status.
5. Perform another independent audit after runtime results and complete the test-results table with actual run IDs, conclusions and exact tested SHA.
6. Keep PR #11 open, draft and unmerged.

The source-level audit has found and corrected additional defects, but no assertion of zero bugs or complete runtime verification is justified until the required checks execute and pass.


## Sixth audit checkpoint — CI #1298 browser-shard regressions — 2026-11-15

Run #1298 (`43685850647`) tested head `f170ce967f6cf7f7ab1d257e2a3263f70815d2aa`.

| Job | Result |
|---|---|
| `fast` | Passed: install, typecheck, generated exact-reference indexes, unit tests, generated docs, data validation, build, size budgets and production dependency audit |
| `secrets` | Passed |
| `accounts` | Passed |
| `browser (1/3)` | Failed in `datahealth.mjs`: the injected fault did not abort the post-repair notes read; the other 16 checks in this shard passed |
| `browser (2/3)` | Failed in `mediacontrols.mjs`: the Retry button disappeared before the click in the synthetic-error retry case; the other 16 checks in this shard passed |
| `browser (3/3)` | Passed all 17 checks |
| `sweep-full` | Still running when this corrective push was prepared; no pass is claimed |

### Review and corrective work

- The Data Health fault injector was installed after the app had opened Dexie's IndexedDB connection. The interceptor is now installed by Playwright's init script before app initialization; it arms after a notes write transaction commits and aborts the next read-only notes transaction. The test still requires both an observed write and an aborted follow-up read.
- A source review found that Data Health retained its previous `found`, `repairs`, and `restorable` state while a new scan was running. If a committed repair/restore was followed by a failed scan, stale findings could remain visible. Each new scan now clears the prior result state before reading; browser assertions check that stale findings are not presented after refresh failure.
- The Media Controls failure occurred in the synthetic same-source error/retry test. It removed the injected `MediaError` before clicking Retry, leaving a window in which a queued `loadeddata` event could clear the alert. The test now activates Retry first and clears the synthetic error immediately afterward. The Retry/recovery and saved-position assertions remain intact; the test has not been relaxed.

These are test-harness and stale-view corrections identified by the #1298 logs/source review. A new full CI run is required; no current-head browser pass is inferred from authored tests. PR #11 remains draft, open, and unmerged.

### Follow-up correction to the fault-injector phases

Review immediately after commit `55e1ab9cd5fdb52d7a3e6578b24a446ec5702632` found that the repair-phase state object remains defined (disabled) when the restore-phase object is enabled. The interceptor now selects the enabled phase object rather than using nullish fallback, so the restore test exercises its own transaction and abort assertion. The subsequent CI run must verify both phases.

## Seventh audit checkpoint — CI #1302 browser regressions — 2026-11-15

Run #1302 (`43689967257`) tested head `68ba48890484755c1082d0b630782893950448a6`.

| Job | Result |
|---|---|
| `fast` | Passed install, typecheck, exact-reference index generation/upload/commit step, unit tests, generated-doc check, data validation, build, size budget and dependency audit |
| `secrets` | Passed |
| `accounts` | Passed |
| `browser (1/3)` | Failed in `datahealth.mjs`: a write and abort attempt were observed, but the Data Health refresh-error alert did not appear; the other 16 checks passed |
| `browser (2/3)` | Failed in `mediacontrols.mjs`: the second synthetic audio-error case did not display its alert; the other 16 checks passed |
| `browser (3/3)` | Passed all 17 checks |
| `sweep-full` | Still running when this corrective push was prepared; the concurrency policy cancels this superseded job. No pass is claimed for #1302. The next full run must pass the full sweep. |

### Corrective work

- The Data Health injector previously aborted a read-only notes transaction at transaction creation. That could hit an unrelated read and disarm before the explicit follow-up scan; it also counted an abort attempt even when `abort()` failed. The replacement intercepts the actual notes `getAll()` / `openCursor()` bulk read, aborts after the request is queued, counts only successful aborts, and stays armed until the UI error is observed. Repair and restore fault phases are independently controlled.
- The Media Controls helper previously treated an existing `.player` as proof that the newly selected meditation source was ready. It now waits for a changed playback generation, `med:` episode identity, attached source and loaded duration before injecting the error. The position-flush regression refuses to proceed without that active-source identity.
- A separate reference-conversion review confirmed that a direct reader link can be exact within a numbering tradition while its optional Vulgate anchor remains approximate; the source explicitly preserves this distinction. No code change was needed.

PR #11 remains open, draft, and unmerged. Authored fixes require fresh CI verification.

### Pre-run correction to the Media Controls source wait

Before the next browser run began, source review caught that the new `startMeditate()` helper's metadata wait also applied to the intentional failed-stream scenario. A failed stream cannot provide metadata, so the helper now waits for an active `med:` source/generation in every case and waits for duration metadata only when `mode === 'ok'`. The regression's failure alert and Retry assertions remain required.

The #1302 workflow run ID in the preceding table is corrected to `43689967257`.


## Eighth audit checkpoint — CI #1306 browser results and corrective work — 2026-11-15

Run #1306 (`43693150610`) tested head `ca75b50ed09ba0d23d237d93b8083fcc8e007237`.

| Job | Result |
|---|---|
| `fast` | Passed install, typecheck, exact-reference index generation, unit tests, docs checks, data validation, build, budget and production dependency audit |
| `secrets` | Passed |
| `accounts` | Passed |
| `browser (1/3)` | Failed only in the restore phase of `e2e/datahealth.mjs`: its write detector did not arm for the restored notes row |
| `browser (2/3)` | Failed only in `e2e/mediacontrols.mjs` at the second synthetic source-error assertion; the other 16 checks passed |
| `browser (3/3)` | Passed all 17 checks, including the 496-screen fast sweep |
| `sweep-full` | Passed all 2,480 screens (248 routes × 10 sizes): 4,185 folds, 256 tab rows, 1,036 tabs, 45,720 first-party requests checked, zero failed clicks |

### Corrective changes prepared after #1306

- Data Health's E2E fault injector now observes notes writes at the IndexedDB object-store boundary. It handles both `put` (repair) and `add` (restore), and only arms the follow-up read fault after the write request and containing transaction both succeed. The regression still requires a successfully aborted read in both phases.
- The player stop path now removes its source-error listener, clears the old source identity, removes the source and calls `load()` to reset the reusable media element. This prevents an old queued error/native MediaError from being mistaken for a later request when replaying the same meditation URL. The existing same-source retry and position-flush assertions remain enabled.

Run #1306 concluded failure because browser shards 1/3 and 2/3 failed; the full-width sweep passed. The source fixes require a new full CI run on the pushed head. Cancelled or superseded runs are not passes. PR #11 remains open, draft, and unmerged.


## Ninth audit checkpoint — CI #1307/#1308 regressions — 2026-11-15

Both runs tested the same head, `e6e79bf69a7983bea80f89393ed754a12ce16a8d`.

| Job | #1307 (`43697776463`) | #1308 (`43697780276`) |
|---|---|---|
| `fast` | Passed | Passed |
| `secrets` | Passed | Passed |
| `accounts` | Passed | Passed |
| `browser (1/3)` | Failed: Data Health repair fault injector did not abort the follow-up notes read | Same failure |
| `browser (2/3)` | Failed: synthetic source-error test timed out waiting for the Retry control | Same failure |
| `browser (3/3)` | Passed all 17 checks | Passed all 17 checks |
| `sweep-full` | Passed all 2,480 screens; 4,040 folds, 256 tab rows, 1,036 tabs, 45,728 first-party requests, zero failed clicks | Passed all 2,480 screens; 3,775 folds, 256 tab rows, 1,036 tabs, 45,715 first-party requests, zero failed clicks |

### Follow-up corrections

- The object-store `add`/`put` interception did not observe the Dexie write on every path. The Data Health test now arms after a committed read/write transaction whose scope includes `notes`, while still aborting the actual follow-up `getAll` or `openCursor` request (not the transaction at creation). Failure output includes the write/read/abort counters so any remaining harness mismatch is diagnosable.
- The player cleared the error state on any `playing` event, even if a `MediaError` was already attached to the active audio element. A queued event from the previous load could therefore remove the Retry control after the current source error was reported. The listener now clears the error only when the audio element has no active error; the browser test explicitly dispatches a queued `playing` event and verifies Retry remains available.

Both workflows concluded failure because browser shards 1/3 and 2/3 failed. The two browser failures are addressed in the next commit and require a fresh full CI run. PR #11 remains open, draft, and unmerged.


---

# Cycle: reference integrity, curriculum reliability, integration-data validation (14–15 November 2026)

Branch `ccr-c086ddeb-igsukm`, started from `64206baa813be26f83c5e82139c546aedbc06ece`. On 15 November the owner's parallel branch `reliability/reference-listening-state-cycle` (388 commits, built directly on my first commit of this cycle, `c3cee13`) was reviewed and fast-forwarded in; it hardens `resolveRef` (a caveat in any chapter between two endpoints, at most one verse of overrun, the canonical-anchor check, `readerUrl` re-validation) and adds listening, trash/restore, Data Health and playback fixes. Its own record is in the sections above. Everything below is this assignment's findings and their dispositions.

## Findings and dispositions

| # | Finding | Disposition | Regression test | Fixing commit |
|---|---|---|---|---|
| 1 | `keyVerseRef()` ignored `exact` from `convertRef()`, so a verse whose numbering is not verified was added as if certain | `keyVerse()` returns `exact` / `approximate` / `invalid` / `none`, the original passage and its scheme (`kjv`) are kept, and the card is added by the user only; an unverified mapping is offered as a labelled "Add it anyway as … (Vulgate numbering)" choice, never automatically | `tests/refIntegrity.test.ts` (key verse block), `e2e/gofurther.mjs` (scenario 7) | `c3cee13`, hardened in the owner's branch |
| 2 | `refProblem()` checked book and chapter only | `checkRefIn()` checks both endpoints, every chapter in the range, verse numbers against the real per-edition verse counts, backward ranges, absent books; typed English references are checked against the pooled counts of the English-tradition editions (editions of one tradition disagree in places, so the largest count wins) | `tests/refIntegrity.test.ts` (valid single/range/cross-chapter, past-the-end verse, bad chapters, range end, absent book, editions that differ) | `c3cee13` |
| 3 | Go Further links converted references without keeping or showing mapping certainty | `resolveRef()` returns `exact` / `approximate` / `invalid` / `absent`; approximate links carry a note shown beside the link; an absent book is listed as unavailable text, never redirected; an invalid passage is reported as broken data | `tests/refIntegrity.test.ts` (Psalm numbering, split and merged psalms, cross-chapter ends, unverified chapter, Daniel, absent book, 2 Maccabees 12:46), `e2e/gofurther.mjs` (scenarios 1–3) | `c3cee13`, hardened in the owner's branch |
| 4 | `readerPath()` clamped an unavailable chapter to the last one | no clamp; `readerUrl()` returns null for a chapter or verse the edition lacks | `tests/refIntegrity.test.ts` ("never clamp") | `c3cee13` |
| 5 | The loader cached a partial result forever after one transient failure and returned defaults (`cccMax` 2865, empty lists) as if complete | `loadKnownFrom()` reports `complete` / `partial` / `failed` and names the failed sources; `memoizeComplete()` keeps only a complete result; the panel shows "could not be loaded" with a Try again button; what depends on a failed source is listed as unavailable, not as broken or hidden | `tests/knownLoad.test.ts`, `e2e/gofurther.mjs` (scenario 4) | `c3cee13` |
| 6 | The app and the report script resolved library works by different rules | both build `Known` through `assembleKnown()`; a work is offered only when its data file can be read (`verifyWorks()` in the app, file existence in the script); every work a lesson names was checked and has a file | `tests/knownLoad.test.ts` (library block) | `c3cee13` |
| 7 | `cccList()` silently skipped malformed segments | `cccParse()` reports errors, `cccList()` throws on a malformed list, `cccListSafe()` is used only to render; all 456 lessons parse strictly | `tests/knownLoad.test.ts` (Catechism block) | `c3cee13` |
| 8 | `ReviewCard` checked then inserted in two steps and had no busy or error state | `addReviewCard()` does both in one Dexie transaction; the button is disabled while adding, repeat clicks are ignored, a failed write shows a readable error and the lesson stays done; the card stores the lesson's own passage and scheme | `tests/reviewCard.test.ts` (20 concurrent calls, existing card untouched, failed write, neighbouring verse not mistaken for "already added"), `e2e/gofurther.mjs` (scenarios 5, 6) | `c3cee13` |
| 9 | Memorize applied a late `passageText()` reply to whatever card was on screen | one `latestRequest()` ticket per card; cleanup supersedes it. Honest limit: the UI advances one card at a time and only after the text has loaded, so the browser cannot trigger the overlap; the guard is proven in `tests/latestRequest.test.ts` and the browser test checks a slow passage shows Loading, offers no Reveal, and never shows another card's words | `tests/latestRequest.test.ts`, `e2e/gofurther.mjs` (scenario 8) | `30a707c` |
| 10 | (data) Two lessons cite 2 Maccabees 12:44–46 / 12:38–46; the English-tradition editions end the chapter at verse 45 | not an error in the Vulgate/Douay/NABRE numbering the lessons use; reported as approximate: the link opens the chapter with a note, no verse is invented | `tests/refIntegrity.test.ts` | `c3cee13` |
| 11 | (data) 23 lesson passages sit in chapters whose verse numbering the app's own tables mark unverified (e.g. John 6, Mark 9, Psalm 139) | shown with a note in the app; the key verse is offered, not added; `npx tsx scripts/curriculum/lesson-report.ts` lists them | report script | `c3cee13` |
| 12 | Chant check was token membership (≥ 80 % of sung words appear somewhere in the hymn text) so a scrambled or truncated score passed | ordered comparison (longest common subsequence) with a measured coverage; per-score records with source id and URL, header provenance, SHA-256 of the reviewed GABC, floors, the portions not sung and a written explanation; a changed score fails the test and stops `build.mjs`; repeated text is allowed only if a record says so | `tests/chant.test.ts` (new blocks, including a shuffled and a truncated score) | `4439815` |
| 13 | (data) The Veni Creator score omits the doxology stanza; the Adoro te hymn text in `hymns.json` contains editorial lines (saeculo xiii, editio incognita, fons incognitus) that are not sung | recorded in the per-score explanations; the hymn text was **not** changed in this cycle; the three missing hymns were not added (nothing checkable) | `public/data/hymns/chant-review.json` | `4439815` |
| 14 | STEPBible build fetched `master` and validated chapters only against the English canon | pinned to `5de0a47f35f0fc13dfe1430d104e5db8a4285f9c`, SHA-256 of both files in `scripts/stepbible/sources.lock.json`, build stops on any mismatch, `--update-lock --commit=<sha>` is the only way to move; the same commit reproduces the shipped 1,630 notes exactly; every note's chapter and verse is checked against the verse counts of the English-tradition editions (TAGNT states NRSV versification); files record upstream commit, hashes, numbering, and tell source-authored note text from the app's own `kind` tagging; no TIPNR or TAGOT | `tests/greekEditions.test.ts` | `4439815` |

Not done, on purpose: the Ordinary Form Mass Proper integration; any new external resource; the three missing hymns; checking the chant scores against the printed books (the record says the review compared word lists only); changing `hymns.json`. The browser test cannot set the user's edition to one with approximate numbering for the Psalms in the lesson beyond the three editions it uses (WEB-C, Douay-Rheims, Brenton); other combinations are covered by unit tests only.
