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
| Church Fathers: Catena Aurea (all four Gospels, CrossWire), Haydock Catholic Bible Commentary (protocanon), Augustine, Chrysostom, Irenaeus, Athanasius, Cyril, Glossa Ordinaria (Latin) | **Working** | Public-domain: CrossWire Catena (Public Domain licence), SermonIndex Haydock module, CCEL translations. 24 works in the library plus a link-out Summa index. |
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
| Accounts & cross-device sync | **Working** | Optional: needs the bundled Node server (npm start, or the Dockerfile) that you host yourself; the app works fully offline without it. Last-writer-wins sync of notes, highlights, bookmarks, journal, plans and attached links. Not end-to-end encrypted; no email password reset (operators use npm run admin). See docs/SERVER.md. |

## Pray

| Feature | Status | Notes |
|---|---|---|
| Today page: Mass readings, Bible in a Year, verse of the day, where you left off | **Working** | Readings need the LitCal calendar online or an imported lectionary. The Bible in a Year day follows the calendar year. |

## Library

| Feature | Status | Notes |
|---|---|---|
| Study data offline packs | **Working** | Download commentary, the Fathers library and resource links in Settings. Publisher links and audio still need a connection. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Catholic Answers articles linked to verses | **Partial** | Links to individual catholic.com pages (permitted by their permissions page) matched by hand from title and summary: about 75 pages across ~25 passages so far, plus 73 Bible Navigator pages. A complete index needs Catholic Answers’ own mapping; the database and import path are ready (docs/OUTREACH_CATHOLIC_ANSWERS.md). |
| Catholic creators (Jimmy Akin, Trent Horn, Matt Fradd, Brant Pitre, Word on Fire…) | **Partial** | A handful of individually linked pages and episodes, plus per-passage YouTube and podcast search links for each creator. Embedded playback for YouTube, Spotify, Apple Podcasts, Vimeo and audio files. |

## Platform

| Feature | Status | Notes |
|---|---|---|
| Installable offline PWA, light/dark/sepia, accessibility labels, responsive layout | **Working** | Service worker caches the app shell and any Scripture or content you open (or download in Settings). |

## Data

| Feature | Status | Notes |
|---|---|---|
| Ingestion pipeline with provenance, checksums, validation and reports | **Working** | npm run data:fetch / data:build / data:validate; see docs/INGESTION.md. |
