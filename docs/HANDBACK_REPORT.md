# Hand-back report for the author of the second-cycle analysis

Branch `ccr-c086ddeb-igsukm`. Written at the end of the autonomous run, 13 November 2026.
Purpose: say exactly what was done, what was not, why, and what is needed from you so that more work can be assigned.

## 1. Where things stand

| Item | State |
| --- | --- |
| CI on the last commit confirmed green | Run 505 (`bf242c2`): all jobs green, including the three browser shards. |
| Commits after that | Runs 506 (Book fingerprint), 507 (Ask the sources) and 508 (teacher dashboard print) were still running when this was written. Local checks on all three were clean: type-check, 703 unit tests, size budgets, and the browser checks in `e2e/review.mjs`. |
| Unit tests | 703 pass. |
| Browser checks | 22 checks in three CI shards. Accessibility check covers 49 screens in every theme. |
| Deployment | The Pages deploy succeeded for commit `361e382` (run 470). Later commits were not checked for deploy. |

Why CI had been red for so long, all fixed:
1. `FEATURE_STATUS.md` was stale (a test now prevents that).
2. Size budgets had been failing unseen (raised on purpose, reasons in `scripts/verify/budget.ts`).
3. `ubuntu-latest` became Ubuntu 26.04, which this Playwright version cannot install a browser on, so the browser job never reached a test. The job is pinned to `ubuntu-24.04`. **The pin must move when Playwright is upgraded.**
4. Slow data tests timed out under load (now a 60 s limit).

## 2. What your brief asked for, and the outcome

Candidate features A to H:

| | Feature | Outcome |
| --- | --- | --- |
| A | Passage collections | Built. Collection pages, "add to collection" wherever something can be collected, reorder, done-ticks, five Scripture-only templates, export to Markdown, print, and a self-contained web page. |
| B | Note templates and backlinks | Built. Prayer and Theological-questions templates; backlinks for collections, same-passage notes and `[[Title]]` note-to-note links. Not built: a `[[` picker while typing. |
| C | Compare Fathers | Built. Any number of authors side by side, with work, location, period, and direct-versus-editorial link. |
| D | Saint reference library | Partly. Each Butler life lists the saint's own writings in the library (matched by name) and has a collection button. Not built: one profile page per saint. |
| E | Glossary | Built. Plain-words label, the Church's own words, Scripture the Catechism cites. |
| F | Offline resource manager | Built. Summary, saved dates, partly-saved flags, "Ready for a flight?" card. |
| G | Liturgical companion | Partly. Previous/Next Sunday on readings. The Office page already opens on the current hour; season blurbs already exist on the Church-year page. Not built: Eastern calendar layer. |
| H | Biblical history and geography | Partly. Family-line people show children and have a collection button. Not built: character and place profiles. |

Other deliverables in the brief:
- Verification report, CI explanation, ≥30 opportunities (38), ambitious roadmap: `docs/CYCLE2_REPORT.md`, `docs/FEATURE_OPPORTUNITIES.md`, `docs/ROADMAP_AMBITIOUS.md`.
- Untouched, as instructed: saint-quotation verification, primary-nav redesign, ReadPage wholesale rewrite, routing/backup/versification work.

## 3. Work done after the main brief

New, tested, in production code:
- Review tab in Notes: question inbox (look it up, mark answered) and a weekly review.
- Book fingerprint page: most-used and most-distinctive words per book, linked to the Concordance.
- Ask the sources: one question; Catechism, Bible text, the app's own definition and (on request) the Fathers appear in separate cards, each labelled with its kind of source. Retrieval only; no generated text, no AI service.
- Back pill lists up to four earlier passages; family Gospel sheet has table cards; readings Previous/Next Sunday; "Report a problem" pre-fills the item id, source and page; collections are included in the study-vault zip; prayer intentions take an optional verse; teacher dashboard can be printed.

Writing quality (you may want to review this part closely):
- Butler's *Lives of the Saints*, scanned months (April to June, August to December): about 2,000 junk paragraphs (scanner debris, citation fragments, Latin verse) removed and about 800 paragraphs corrected for common misreadings. Not proofread by a person. A mixed paragraph (prose plus citation) keeps its prose sentences.
- Roman Catechism and Leo XIII encyclicals: scanner misreadings repaired word by word.
- HTML entities that showed as raw text (`&amp;`, `&atilde;`, `&mdash;`) decoded in 26 data files. About 980 podcast audio addresses had a literal `&amp;` in them; fixed.
- Method and limits: a frequency-based vocabulary built from the app's own clean texts, with a small table of well-known misreadings (for example "tbe" → "the"). A real spelling dictionary could not be installed in this environment, so a person should sample the result. Scripts: `scripts/clean_butler_ocr.py`, `scripts/ocr_repair.py`, `scripts/decode_entities.py`. Tests keep scanner marks and entities from returning.

## 4. What was not done, and what is needed

Each line says what is missing. "Data" means a source I cannot invent. Opportunity numbers refer to `docs/FEATURE_OPPORTUNITIES.md`.

| # | Item | Needed from you |
| --- | --- | --- |
| 1 | Verse-by-verse notes mode in the reader | A decision. It changes the Reader page, which you ruled out for a wholesale rewrite. Is a small, optional mode acceptable? |
| 5 | Reading-level toggle for the Catechism | Approved simplified wordings. I will not paraphrase the Catechism unsupervised. |
| 8 | Audio read-along | Chapter timing data for the recordings. |
| 9 | Verse of the day from your reading | A decision. Today already shows a verse matched to the liturgical day; a second verse of the day would compete with it. |
| 18, 19 | Saints by order; "what was happening then" | A reviewed table of orders and years for the saints in the app. Butler's text does not carry them as data. |
| 20, 21, 23 | Character and place profiles | A sourced table: people to passages and places; places to modern names. The map data has coordinates, not names. |
| 24 | Eastern Catholic calendar layer | A public-domain calendar source and a decision on which tradition to start with. |
| 26 | Feast-day explainer gaps | Reviewed text for each feast. |
| 32 | Source-trust badge on every quotation | Confirmation that the verification files may be shown to readers; the saint-quote project was excluded, so this is blocked until that is reopened. |
| 38 | Spaced review beyond verses | A decision. It changes the synced memory data, so it needs a migration plan. |
| 17, 20 | Full profile pages | The tagging above. |
| — | Roadmap items 1 (generated half), 2, 3, 4, 5, 6, 7, 8, 9, 10 | A host, a model, a native build, or a design brief. |
| #203–205, #215 | Independent fact review of the wave-2 content; lesson explanations for all 456 lessons; lesson links and spaced review card; lesson standard | A reviewer and a go-ahead. These were deferred earlier by the owner. |

Other open points:
- Real screen-reader pass (needs a device and a person).
- The entry JavaScript bundle is about 350 KB (the budget is 380 KB); splitting it is a refactor with some risk.
- The video library keeps only the newest 40 Shorts per creator.
- Butler's scanned months need a human proofread.
- The collection button on a saint life or a family-line person saves a link that opens in a new tab, not an in-app item. I did not test that link by hand.
- I did not open the live site and look at the new screens by hand; checks are automated.

## 5. Suggested next assignments, cheapest first

1. A person proofreads a sample of Butler's scanned months against a clean edition. Tell me the error rate and I will tune the cleaner or revert it.
2. Supply the saints table (order, century) and the people-and-places table; I will build saint, character and place profile pages with no invented facts.
3. Decide items 1, 9 and 38.
4. Supply source and review for the feast explainers and the Eastern calendar.
5. Reopen the saint-quotation verification, so the source-trust badge can go in.
