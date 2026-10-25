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

## Curated links and creators (round 3)
* `data/registry/resource-sources.json`: the publishers and creators the app links to (policy, section, search names). Add a source before using it in a row.
* `data/curated/external-resources.json`: one row per page: `source`, `type` (article/qa/tract/video/podcast/page), `title`, `url`, `refs` (modern numbering), `tags`, optional `author`/`show`, `basis` (`page-read` or `title-and-summary`), `reviewedBy`, `reviewedOn`.
  Titles are the publisher's own; descriptions (`note`) must be your own words. The build rejects rows with an unknown source, a non-https URL or no reviewer.
* In-app playback (`src/lib/embed.ts`): YouTube (privacy-enhanced), Spotify, Apple Podcasts, Vimeo and direct audio/video files play inside the app; everything else opens at the publisher. The Bible in a Year plays in the app's own player.
* Creator video/podcast links for *any* verse are search links built from the creator's name and the reference; they are not curated.

## Reproducing the data from scratch
1. `npm run data:fetch` downloads each source into `data/raw/` (git-ignored) and records its URL, date and SHA-256 in `data/raw/*.json`.
2. Before anything is used, check its rights against `docs/LICENSING.md`; add a record to `public/data/licenses.json` for any new top-level data item (a test fails otherwise).
3. `npm run data:build` runs the adapters in `scripts/ingest/` and writes `public/data/`.
4. `npm run data:validate` and `npm test` check shape, anchors, rights records and the Bible-text audit (`scripts/verify/editions.ts`).
5. The offline pack manifest (`public/data/manifest.json`) is rebuilt by the same step; it lists each file's size and checksum. A rebuild from unchanged sources should leave `git diff` empty except for the `generated` date: review any other diff before committing.
6. Record what changed in `docs/CHANGELOG.md`.
