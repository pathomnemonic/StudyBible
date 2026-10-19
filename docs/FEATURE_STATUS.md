# Feature status

Generated from `src/featureStatus.ts` (`npm run docs:status`). The same table is shown in the app under About.


## Scripture

| Feature | Status | Notes |
|---|---|---|
| Douay-Rheims, Clementine Vulgate, WEB (Catholic): 73 books, offline | **Working** | Public-domain texts ingested from eBible.org USFM; paragraphs, poetry, headings and footnotes preserved. |
| Parallel view, verse comparison, translation switching that keeps the passage | **Working** | Aligned through the Vulgate anchor. Psalms are mapped by reviewed rules; other chapters whose numbering differs are flagged, never silently mismatched. |
| Verse-level alignment for Tobit, Judith, Sirach, Esther, Daniel across Greek vs Vulgate texts | **Partial** | These books follow different textual traditions; chapter-level alignment only, with an explicit notice. |
| RSV-CE, RSV-2CE, NABRE, Jerusalem Bible / NJB | **Needs licence** | Under copyright. The edition registry, anchor mapping (English scheme) and attribution records are ready; a licence and text file are required. |
| Maps and appendices | **Planned** | Not in the public-domain sources used; the data model allows per-edition introductions and footnotes. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Verse study panel with provenance, authority level and match reason on every item | **Working** | Never lists a source for a verse unless the data links it; empty sections say so. |
| Catechism links | **Partial** | 29 verse-level citations, each verified against the paragraph text; topic ranges for 18 doctrine topics. The full Scripture index of the CCC needs a licensed data file. CCC text is never stored. |
| Church Fathers: Catena Aurea (Matthew, Mark), Augustine, Chrysostom, Irenaeus, Athanasius, Cyril, Glossa Ordinaria (Latin) | **Working** | Public-domain translations from CCEL; Luke and John Catena volumes are not available from CCEL. |
| Saints library (Teresa of Ávila, Catherine of Siena, Brother Lawrence) | **Partial** | Several popular translations were left out because their copyright status could not be verified. |
| Popes and Vatican documents | **Partial** | Linked (not copied) with authority labels; text search of them is not included. |
| Catholic Answers, Word on Fire, Ascension Presents | **Needs credentials / agreement** | No public APIs or reuse licences. Only search links and a curated-link schema are provided; no content is imported. A partnership/licence would unlock richer integration. |
| Semantic / concept search with AI | **Planned** | Not implemented. Concept search currently uses editorial topic keywords and a people/places index, clearly labelled. If added, AI results will be marked as such. |

## Search

| Feature | Status | Notes |
|---|---|---|
| Exact phrase, partial words, references, scope filters, fuzzy suggestions, recent & saved searches | **Working** | Client-side indexes built on demand; Scripture across all editions; library full-text at section level. |

## Listen

| Feature | Status | Notes |
|---|---|---|
| Bible in a Year: 1,847 episodes mapped from the official feed; plan, canonical and release order; queue; progress; resume | **Working** | Passages come from feed metadata voted across yearly releases; two days have no passages in the feed and are flagged for review. |
| Transcripts and captions | **Planned** | The official feed provides none. The schema supports them if Ascension publishes transcripts or grants access. |
| Video and other podcasts | **Planned** | Links to official YouTube channels only; adding more feeds is a matter of adding a feed entry. |

## Pray

| Feature | Status | Notes |
|---|---|---|
| Liturgical calendar, seasons, cycles, calendar view, local calendars (via LitCal) | **Working** | Offline computation plus the open LitCal API when online. |
| Daily Mass readings | **Needs licence** | The Lectionary is copyrighted and no open reference list exists for ordinary days. Solemnities and feasts are shown via LitCal; everything else via an imported or hand-entered reference list. |
| Saint biographies and homilies for the day | **Partial** | The day’s celebrations come from LitCal (names, ranks). Biographies need a licensed or public-domain source (e.g. a public-domain Lives of the Saints) which has not been ingested yet. |
| Lectio Divina, prayer journal, traditional prayers, quiet reading, plans (11+ built in, custom plans) | **Working** | Optional; no streak pressure (streak display is off by default). |
| Audio Scripture | **Partial** | Device text-to-speech only. Recorded audio would need a licensed or public-domain recording per edition. |
| Reminders | **Partial** | Work while the app is open/installed. True background push needs a server or native wrapper. |

## Library

| Feature | Status | Notes |
|---|---|---|
| Notes (Markdown), highlights (6 colours), bookmarks, folders, tags, collections, personal cross-references, journal, export/import | **Working** | Stored in IndexedDB on the device, anchored to stable Vulgate-based ids so they survive translation changes. |
| Cross-device sync & accounts | **Planned** | Local-first by design. A SyncAdapter interface is defined (src/db/sync.ts); a backend (e.g. an end-to-end-encrypted store) must be provided. Until then use export/import. |

## Platform

| Feature | Status | Notes |
|---|---|---|
| Installable offline PWA, light/dark/sepia, accessibility labels, responsive layout | **Working** | Service worker caches the app shell and any Scripture or content you open (or download in Settings). |

## Data

| Feature | Status | Notes |
|---|---|---|
| Ingestion pipeline with provenance, checksums, validation and reports | **Working** | npm run data:fetch / data:build / data:validate; see docs/INGESTION.md. |
