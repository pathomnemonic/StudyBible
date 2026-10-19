# Study Bible

A Catholic Bible study app: Scripture in the full 73-book canon, Church teaching, the Fathers and saints, Bible in a Year, personal notes, prayer and reading plans, in one connected library. Local-first and offline-capable; optional self-hosted accounts sync your notes between devices (`npm start`, see docs/SERVER.md). No tracking.

> **Core idea:** every verse is an entry point into a network of Catholic resources, while the Scripture text itself stays readable and uncluttered. Nothing is listed for a verse unless the data actually links it, and every item says *why* it is attached and *how authoritative* it is.

## What is in it

| Section | What you get |
|---|---|
| **Read** | Douay-Rheims (1899), Clementine Vulgate (Latin) and the World English Bible (Catholic order). All 73 books including the deuterocanon and the Greek additions to Esther and Daniel. Parallel view, verse comparison, translation switching that keeps your place, highlights (6 colours), notes (Markdown), bookmarks, footnotes, Psalm numbering shown both ways, themes (light/dark/sepia), text size/spacing/margins, scripture-only mode. |
| **Study** | Verse study panel (tabs: Teaching, Commentary — Haydock & Catena Aurea for all four Gospels —, Fathers & saints, Cross-references, Media, Context, Mine; Catechism, doctrine topics, saints, cross-references, Catholic Answers / Word on Fire / Ascension links, Bible in a Year, context, liturgy, your notes), doctrine index, Fathers & saints library with a reading mode, sources & licensing page, search. |
| **Listen** | The Bible in a Year with Fr. Mike Schmitz: 1,847 feed items mapped to passages, plan/canonical/release order, queue, progress, resume, background controls (Media Session), the publisher's own embedded player, a personal media queue. |
| **Pray** | Liturgical calendar (offline computation + the open LitCal API), readings references, Lectio Divina with a timer, prayer journal and intentions, traditional prayers, 11+ reading plans plus custom plans, optional reminders. |
| **Library** | Notes, highlights, bookmarks, folders, tags, collections, personal cross-references, history, JSON/Markdown export and import. |

See **[docs/FEATURE_STATUS.md](docs/FEATURE_STATUS.md)** (also under *About* in the app) for exactly what is working, partial, or blocked on a licence/credentials/future work.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit + data-integrity tests
npm run build        # type-check + production build (installable PWA)
```

The generated content (about 43 MB under `public/data/`) is committed so the app works immediately. To rebuild it from the publishers' downloads:

```bash
npm run data:fetch   # download sources into data/raw (cached, checksummed → data/provenance/fetched.json)
npm run data:build   # parse, map, validate, write public/data and data/provenance/build-report.json
npm run data:validate
npm run verify:ccc   # re-check curated Catechism links against the paragraph text (polite, 2 s delay)
```

## Principles

1. **Rights first.** Only texts verified public domain or openly licensed are bundled (see [docs/LICENSING.md](docs/LICENSING.md)). Copyrighted material (NABRE, RSV-CE, the Lectionary, the Catechism text, Word on Fire, Catholic Answers, Ascension content) is *linked*, never copied. Several popular translations were left out because their status could not be verified.
2. **No fabrication.** Verse → resource links come from the source's own structure or tags, or from checked curation. Machine-tagged and editorial links are labelled as such. Empty sections say "nothing found".
3. **Doctrinal honesty.** Items are labelled *official doctrine*, *authoritative teaching*, *Father*, *saint/spiritual master*, *scholarly*, *private reflection/apologetics*, or *historical commentary*. A direct citation is never confused with a suggested topical connection.
4. **Stable identifiers.** Notes, highlights and links attach to verse ids in the Clementine Vulgate numbering, so they survive a change of translation (see [docs/VERSIFICATION.md](docs/VERSIFICATION.md)).
5. **Private by default.** Everything the user writes stays in IndexedDB on their device; export/import is the way to move or back it up.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): data model, identifiers, app structure.
- [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md): every source, its terms, what was imported and what was not.
- [docs/LICENSING.md](docs/LICENSING.md): rights decisions and how to add licensed content.
- [docs/INGESTION.md](docs/INGESTION.md): the pipeline and how to add a work, feed, edition or dataset.
- [docs/VERSIFICATION.md](docs/VERSIFICATION.md): numbering differences and what is verified.
- [docs/FEATURE_STATUS.md](docs/FEATURE_STATUS.md): honest status matrix.


## Accounts, shortcuts and Catholic Answers

* **Accounts (optional):** `npm run build && npm start` serves the app and a small sync API. Sign in from the rail to sync annotations. Not end-to-end encrypted; no email reset. See [docs/SERVER.md](docs/SERVER.md).
* **Shortcuts:** `Ctrl/⌘+K` jump/search, `←/→` chapters, `S` study panel, `N` note, `1–6` highlight, `?` help.
* **Catholic Answers:** their Terms of Service forbid automated collection into a database, so articles are *not* bulk-linked. The app links their Bible Navigator pages, lets you attach any article/video to a passage ("Add link"; or open `#/attach?url=…&title=…`), and has a permission-ready import (`data/licensed/`). Draft request: [docs/OUTREACH_CATHOLIC_ANSWERS.md](docs/OUTREACH_CATHOLIC_ANSWERS.md).
