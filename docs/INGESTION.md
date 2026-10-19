# Ingestion pipeline

`scripts/ingest/cli.ts` (run with `tsx`):

| Command | Does |
|---|---|
| `npm run data:fetch` | Downloads each URL in `data/registry/fetch.json` and every work in `data/registry/library.json` into `data/raw/` (git-ignored, cached; `REFETCH=1` to refresh). Records URL, sha256, size, date, terms and rights in `data/provenance/fetched.json`. Sequential, 0.8 s apart. |
| `npm run data:build` | Runs the adapters below and writes `public/data/**` plus `data/provenance/build-report.json` (warnings and errors). Exit code 1 on errors. |
| `npm run data:validate` | Runs the data-integrity tests (73 books/edition, chapter tables, anchor-id bounds for 340k cross-references, episode passages, Catechism links…). |

## Adapters

| Adapter | Input | Output |
|---|---|---|
| `bible.ts` + `lib/usfm.ts` | eBible USFM zips | per-book JSON; Glossa; versification; `editions.json` |
| `xrefs.ts` | OpenBible zip | `xrefs/<BOOK>.json` (anchor-mapped, ≤12/verse) |
| `catena.ts` | CCEL ThML | `commentary/catena/<BOOK>.json` (verse groups, author attribution as printed) |
| `library.ts` | CCEL ThML + `library.json` | `library/works/*`, `index.json`, scripture index, section-level full-text postings |
| `biay.ts` | RSS | `media/biay.json`; overrides from `data/curated/biay-overrides.json` |
| `curated.ts` | `data/curated/*` | `doctrine/*`, registries; ships only verified Catechism links |

## Properties

- **Provenance**: every pack records source URL, retrieval date, rights, verification status.
- **Stable ids & dedupe**: anchor verse ids; duplicate books are errors; catena groups merge consecutive verse runs.
- **Source validation**: bracket artefacts stripped with balance checks; impossible chapters (e.g. "Psalm 199" in a feed) are dropped, not guessed; unparsed paragraphs are warned.
- **Incremental updates**: re-running `data:fetch` with `REFETCH=1` and `data:build` regenerates; checksums reveal what changed. Adapters are pure functions of `data/raw` + registry.
- **No scraping**: only files and feeds the publishers distribute for download. If a source has no suitable export, use curated links/metadata instead (see the Catechism and Catholic Answers treatment).

## Adding things

- **A Father/saint work from CCEL**: add an entry to `data/registry/library.json` (id, ccel path, author, period, `scriptureMode`, `psalmTags`), verify translator and rights from the CCEL record, run `data:fetch` and `data:build`. Check `build-report.json`.
- **Another podcast/feed**: copy `biay.ts`, change the feed and overrides.
- **A licensed edition**: see docs/LICENSING.md and add an entry to `editions.json` with its `scheme`.
- **Fix a mapping**: add an override (`biay-overrides.json`) or a verified versification rule (`bible.ts` → `verifiedExtra`), re-run the build and tests.

## Round 2 pipeline
Order: bible → xrefs → catena (SWORD zCom) → biay → haydock (MyBible sqlite) → library (CCEL, modes tractates/psalm-roman/john-dot/homily-start/summa-index/tags) → curated → external.
External resources: `data/curated/external-resources.json` (needs `reviewedBy`/`reviewedOn`), `data/licensed/external-*.jsonl` (only with written permission), and `data/curated/ca-bible-navigator-urls.txt` (sitemap URL slugs → passages). Output: `public/data/resources/<BOOK>.json` + `catalog.json`.
