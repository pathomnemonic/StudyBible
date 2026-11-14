# Next-cycle bug audit (assignment received 14 November 2026)

An outside review (written by ChatGPT, handed over by the project owner) listed suspected defects and gaps in the quality net. This file is the working record: each item is **reproduced, fixed with a regression test**, or **not reproduced, with the evidence**. Licensing and independent fact-checking are out of scope for this cycle. Feature work (Part IV of the assignment) waits until reliability work is done.

Rule for every item: inspect the code, reproduce deterministically, add a test that fails before the fix, make the smallest safe fix, run the focused test and the neighbouring ones, then record the commit here.

## Part I: defects to investigate

| # | Suspected defect | Status | Evidence / test / commit |
|---|---|---|---|
| 1 | Sync discovery stuck after a transient session failure | open | |
| 2 | Sync conflicts lose metadata-only edits | open | |
| 3 | Error-boundary recovery deletes unrelated Cache Storage | open | |
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
