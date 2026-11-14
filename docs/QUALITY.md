# How bugs are kept from reaching the reader

Every bug found by hand so far came from one of five families. Each family now has a guard that runs on every build
(`npm test` and `npm run e2e:release`), and each reported bug gets its own regression test (see the log at the end).

| Family | Examples that were found by hand | Guard |
|---|---|---|
| **Layout**: text spilling out of a box, controls overlapping, page scrolling sideways, on phones and with big text | "Watch later (0)" over "Watched (5)"; hub tiles at 320 px | `e2e/sweep.mjs` visits every route at 320 px with 130 % text, 412 px and desktop and checks `e2e/lib/invariants.mjs` (overlap, spill, sideways scroll, unnamed controls, pictures that did not load) |
| **State**: a view that does not come back as it was, or lists that mix sources | Year tab: Queue, then back to Up next | `sweep.mjs` (loops in `e2e/lib/crawl.mjs`) opens every fold until none is left closed, then clicks every tab of every tab row (including rows that appear only after a click) and, after going back through all of them, requires each tab to show the same panel, the same links and record ids in the same order and the same text with its numbers; whether a fold is open is ignored. `e2e/crawler-selftest.mjs` feeds it 18 broken and clean fixtures; `overlap.mjs` seeds a mixed queue and repeats the exact sequence |
| **Lifecycle**: something rebuilt by a re-render | a resumed video reloading every few seconds; media dying when you change tab | the player lives in one root component (`MediaHost`); `e2e/mediahost.mjs` checks the same element survives navigation |
| **Data**: damaged or leaked text | RSV scan dropped first letters; `[ US ]` in a saint's name; heading footnote markers in WEB-C | `tests/data-hygiene.test.ts` reads every shipped string (control characters, garbled accents, leaked code values, region tags); `tests/editions-integrity.test.ts` checks the licensed editions book by book and named verses; `scripts/rsv/audit_full.py` for review |
| **Behaviour that should happen by itself** | About this chapter not opening | a test per behaviour in the browser run (see the log); a feature is not "done" until its trigger is exercised |

## What the crawl asserts on every route
Each entry in `e2e/lib/routes.mjs` is held to a marker: an unknown-id route must show the explicit not-found state (`data-state="not-found"`), every other route must not, and about thirty routes must show their own heading (`EXPECT`), so a route that renders the wrong page fails. The sweep refuses an empty or invalid configuration (unknown size, shard out of range, concurrency, ONLY that matches nothing) with exit code 2 and prints the configuration it ran.

## What the crawl asserts on every screen
No overlapping or clipped controls; no sideways page scroll; no `undefined` / `NaN` / `[object …]` / control characters /
`[ US ]`-style tags / garbled accents on screen; no error or not-found screen; no console error or uncaught exception; no
picture that failed to load; every button, link and tab has a name; and after opening each fold and each tab, all of the
above again.

## What it cannot see (so it is still checked by a person, on a phone, before a release)
* Anything that needs the live network: YouTube playback itself, podcast feeds, the calendar service.
* Whether a design is pleasant or confusing (the catechism grade page was fine to a computer and overwhelming to read).
* Platform quirks of a real phone browser (address-bar resizing, hover on touch).
After a release goes live, open it on a phone and walk the Today, Bible, Media and Learn tabs once.

## Automated and manual, kept apart
Automated, in `npm test` / `npm run e2e:release` / CI: everything above plus `tests/*.test.ts` (data, sync, backup round trip, profile graph) and the browser checks listed in `e2e/run-all.mjs`. The full width matrix (320 to 1280 px, large text) runs in `.github/workflows/full-sweep.yml`, nightly and on demand; pull requests run the fast matrix (320 px large text and 390 px). Manual, before a release: the phone walk below; real YouTube/podcast playback; platform quirks. Counts of routes, folds and tabs are printed by every run; none are written here because they change.

## Rules
1. A bug report is not closed until it has a failing test that now passes (or a note here saying why it cannot).
2. A new screen is added to the route list in `e2e/smoke.mjs`; the crawl picks it up from there.
3. A new data pack is covered by `tests/data-hygiene.test.ts` automatically; a licensed text also gets a book-level test.
4. Layout fixes go in the shared rules (hub tiles, tab rows), not in one page, so every page is fixed at once.

## Log of reported bugs and the guard that now covers each
* Continue-watching video reloaded every few seconds: `mediahost.mjs` (same iframe element across pages) and the player moved to `MediaHost`.
* Videos tab labels overlapped on phones: `sweep.mjs` / `overlap.mjs` (a tab row must show every tab, by wrapping or sharing the width; a row that scrolls sideways and hides tabs fails the crawl: `invariants.mjs` "hides tabs behind a sideways scroll", with a broken fixture in `invariants-selftest.mjs`).
* "[ US ]" before a saint's name: `data-hygiene` region-tag rule, `sweep.mjs` leaked-tag rule, and `cleanEventName` strips it where the calendar is read.
* Verse text cut off / garbled (Ps 119:18, Jer 30:8): `editions-integrity.test.ts` named verses and symbol rules.
* Queue tab then Up next showing chants: `overlap.mjs` mixed-queue sequence and the round-trip rule in `sweep.mjs` (not reproduced by hand; the guard is in place).
* About this chapter not auto-opening: browser check in `sweep.mjs` opening behaviour and the component's own effect (see `ChapterCompanion`).
* Heading footnote markers in WEB-C (found by `data-hygiene`): the ingest now drops them.

## Layout rule: fix the problem, not the layout

A page that already fits on a reader's phone keeps its layout. When the crawler finds something that spills or overlaps on a narrow screen, the fix is the smallest one that removes that problem (let a long word wrap, let a row shrink), never a blanket change such as forcing a denser two-column page into one column on every phone. A single-column fallback is allowed only for the exact width where the two-column form cannot hold, and the crawler must show that it cannot. (A blanket "one column under 400px" rule for hub tiles was added once and removed: it made pages worse on ordinary 360 to 412 px phones.)
