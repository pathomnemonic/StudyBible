# Architecture

## Shape of the system

```
 publishers' downloads ─► scripts/ingest (TypeScript) ─► public/data/*.json  ─► static PWA (React + Vite)
 (USFM, ThML, RSS, CSV)    parse • map • validate          provenance + report     IndexedDB for user data
```

There is no application server. Content is static JSON loaded lazily (per book, per work, per pack) and cached by the service worker; user data lives in IndexedDB (Dexie). This keeps the app offline-capable, private, and trivially hostable (GitHub Pages, any static host, or a Capacitor wrapper).

## Stable Scripture identifiers

Every verse is identified as `BOOK.chapter.verse` using the three-letter USFM book code and the **Clementine Vulgate numbering** (the *anchor*): `JHN.6.51`, `PSA.22.1`. Passages are `JHN.6.51-58`, `GEN.1.1-2.3`, whole chapters `PSA.22`.

Why Vulgate? It is the numbering of the Douay-Rheims and the Clementine Vulgate (both bundled), of the Fathers' and Aquinas's citations, and of the Catena Aurea and Glossa. Editions that number differently declare a *scheme* and a rule table (`src/lib/versification.ts`, data in `public/data/versification.json`):

| Scheme | Used by | Notes |
|---|---|---|
| `vulgate` | Douay-Rheims, Clementine Vulgate | identity |
| `english` | WEB (Catholic) and any future RSV-CE/RSV-2CE | Psalms mapped by reviewed rules; unverified chapters flagged; Tobit/Judith/Sirach/Esther/Daniel flagged as different text traditions |
| `kjv` | external data: OpenBible cross-references, plans, lectionary lists, typed references | same Psalm rules + Daniel 3/4 |

Notes/highlights/bookmarks store the anchor id plus `originEdition`, so the UI can warn when a mark was made in an edition whose numbering is not verified for that chapter.

## Data model (spec §16 → implementation)

| Entity | Where |
|---|---|
| Bible editions, rights, attribution | `data/registry/editions.json` → `public/data/editions.json` (+ `planned` licensed editions) |
| Books, chapters, verses | `src/lib/canon.ts` (73 books); `public/data/bible/<edition>/<BOOK>.json` (blocks of `[verse, text]` runs, footnotes) |
| Verse identifiers, translation-specific numbering | `src/lib/refs.ts`, `src/lib/versification.ts` |
| Commentary sources, authors/organisations | `data/registry/sources.json`, `authors.json` |
| Commentary items and passage mappings | `public/data/commentary/catena/*`, `glossa/*`; library scripture index `library/scripture/<BOOK>.json`; `StudyItem` (src/study/providers.ts) is the unified shape |
| Catechism paragraphs and links | `data/curated/ccc-links.json` (verified) → `doctrine/ccc-links.json`; text is never stored |
| Church documents | `data/curated/doctrine.json` (`documents`, linked not copied) |
| Saint / Father works | `data/registry/library.json` → `library/works/*.json`, `library/index.json`, section-level full-text index |
| Media items, Bible in a Year mapping | `public/data/media/biay.json` (episodes, days, passage ids, `passageSource`), overrides in `data/curated/biay-overrides.json` |
| Liturgical calendar and readings | `src/liturgy/*` (offline computation, LitCal client, readings providers) |
| Users, preferences | `src/lib/store.ts` (localStorage settings); no accounts |
| Notes, highlights, bookmarks, tags, folders, collections | `src/db/db.ts` (IndexedDB) |
| Reading plans and progress | `src/plans/builtin.ts` (generated), `planProgress`, `userPlans` tables |
| Cross-references | `public/data/xrefs/<BOOK>.json` (OpenBible, anchor-mapped, top 12 per verse) + user cross-refs |
| Licensing and attribution records | `data/provenance/fetched.json` (URL, sha256, date, terms), `library/index.json` (`rightsEvidence`), per-pack `_provenance/_meta` |

Every ingested item keeps provenance: source URL, retrieval date, checksum, rights status, and a verification status (`verified`, `source-metadata`, `machine-tagged`, `editorial`). The build report (`data/provenance/build-report.json`) lists warnings and errors.

## App structure

- `src/pages/ReadPage.tsx`: the reader. Chapter text (`ChapterText`), parallel table, selection → action bar (highlight, note, bookmark, study, compare, copy, link) → `StudyPanel`.
- `src/study/providers.ts`: one provider per source family; each returns `StudyItem`s with `authority`, `period`, `format`, `match` (why it is attached) and rights notes. Sections render progressively and are sorted by authority, then match quality, then votes (reliability, not popularity).
- `src/search/engine.ts`: query parser (`"phrase"`, `in:john`, `by:augustine`), MiniSearch indexes built on demand (Scripture per edition, Catena, episodes), section-level postings for the library, reference interpretation with misspelling suggestions.
- `src/liturgy`: Meeus Easter, seasons/weeks/cycles, LitCal client with caching, readings providers (LitCal feasts → imported lectionary → manual).
- `src/data/PlayerContext.tsx`: one global `<audio>` element + Media Session for lock-screen controls and background playback.
- `src/db/sync.ts`: the `SyncAdapter` interface (not implemented); see below.

## Sync, accounts, backup, deletion (design)

Not implemented; local-first by choice. The intended design: end-to-end encrypt records client-side, sync rows by `(table, id, updatedAt)` with last-writer-wins and tombstones, keep Scripture links as anchor ids, offer export-before-delete and full server-side account deletion. Until then, JSON export/import moves data between devices.

## Offline

The service worker precaches the app shell and caches `/data/**` on first use (CacheFirst). Settings → *Offline reading* prefetches an entire edition. Only public-domain editions are marked `offlineAllowed`.
