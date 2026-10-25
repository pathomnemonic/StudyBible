# Correcting the data

Mistakes in cross-references, verse mappings, quotations, attributions or links are the most useful thing you can report.

## What to send
1. **Where**: the book, chapter and verse, or the page and section of the app.
2. **What is wrong**: say what the app shows.
3. **The evidence**: a link or citation for the right version (a printed edition, the publisher's page, the original text). "I think" is a start, but a source lets us fix it in minutes.
4. **A way to reproduce it**: for a mapping, the two translations and verse; for a link, the page you were on.

Use the **Report a problem** link on a study item, or open an issue with the *Data correction* or *Translation alignment* template. Do not include your own notes or journal text.

## Where each kind of data lives (to fix it yourself in a pull request)
| Problem | File to change |
|---|---|
| Verse numbering between translations | `scripts/ingest/bible.ts` (`verifiedExtra` rules), `docs/VERSIFICATION.md` |
| A cross-reference | `public/data/xrefs/<BOOK>.json` is generated from OpenBible; add to `data/curated/` instead of editing it |
| A study link to a page, video or homily | `data/curated/videos.json`, `data/curated/apologetics.json` and the matching scripts in `data/curated/` and `scripts/videos/` |
| A quotation or its author | `data/curated/` daily quotes; cite the edition and page |
| A source's licence or credit | `docs/DATA_SOURCES.md`, `docs/LICENSING.md` and `public/data/licenses.json` |
| An OCR error in the Roman Catechism | `public/data/library/` section file, with the page image or print source |

Generated files are rebuilt by `npm run data:all` (see `docs/INGESTION.md`); do not hand-edit them unless the file says it is curated.

## What we do with a report
We check the evidence, fix the data, add a test where one fits (`tests/data.test.ts`, `tests/content.test.ts`), and note content changes in `docs/CHANGELOG.md` under **Content**.
