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

## App

| Feature | Status | Notes |
|---|---|---|
| Navigation: Bible, Study, Today, Notes | **Working** | Four tabs (plus More on phones). Today groups the daily practice: Mass readings, plans, listening to Bible in a Year, memorizing and prayer. On wide screens the reader keeps a study panel beside the text that shows a chapter guide until you tap a verse. Search is first in the sidebar and in the reader bar. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Challoner’s notes, chapter summaries and introductions; chapter reading links | **Working** | Bishop Challoner’s annotations (about 1,850), a one-line summary for 1,293 chapters and 71 book introductions (public domain, Project Gutenberg). Every chapter of all 73 books also links to the Douay-Rheims with notes (DRBO), New Advent and the NABRE with the bishops’ notes (USCCB). These are chapter-level, not verse-level; the app labels them so. `scripts/verify/coverage.ts` reports how many verses have a verse-level reading versus chapter-level only. |
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

## Study

| Feature | Status | Notes |
|---|---|---|
| Church documents on Scripture (Dei Verbum, Verbum Domini, Vatican II, encyclicals) | **Partial** | Article numbers linked to the Scripture they cite, parsed from vatican.va; text not stored. Strong for Dei Verbum, Verbum Domini and the recent encyclicals; weak for pre-1965 documents and footnote-only citations. See docs/RESOURCE_COVERAGE.md. |
| Original-language word study (Greek and Hebrew) | **Working** | Word by word with Strong’s glosses and parsing for the protocanonical books (SBLGNT/MorphGNT, OSHB/WLC). Hebrew is shown only where verse numbers provably line up; deuterocanon not included. Links to Bible Hub and Blue Letter Bible as well. |
| Verse panel: notes first, shared notes grouped, verse-specific material ranked above chapter-level | **Working** | Tapping a verse opens the panel with the commentary already showing. A note written for a run of verses (for example Luke 21:1–4) is shown once, labelled with what it covers, instead of repeating. Chapter-level and click-out items sit below. |
| Lens notes: NT quotations of the Old Testament, parallels, customs and archaeology, literary structure, word and translation notes, ancient versions, manuscripts, liturgy and hymn echoes, genre, reading dependencies, reception history | **Partial** | About 550 short notes written for this app (AI-assisted; not an official text), each labelled with how firm the claim is. Coverage is selective, not exhaustive: roughly 180 quotation links, 80 customs notes, 50 parallels, 40 structure outlines. Manuscript notes are link-only (no manuscript images). Reception history lists readings without endorsing them. Check anything you will quote against a scholarly source. |
| Promise and fulfilment: types, prophecies, Fathers’ words and a reading list | **Partial** | 24 type and prophecy notes written for this app, each tied to both passages, with 19 word-for-word quotations from Irenaeus, Justin, Tertullian, Cyprian, Augustine and Ambrose that are checked against the library text at build time. They appear in the Connections tab and on the Promise and fulfilment page. Selective, not exhaustive. Brant Pitre’s work is copyrighted: it is linked (about 50 verse-linked pages) and listed, not copied. Catechism numbers are pointers to check. |
| New library works: Irenaeus’ Demonstration of the Apostolic Preaching; Edersheim’s Life and Times of Jesus the Messiah (with the list of messianic passages in the ancient rabbinic writings), The Temple, and Sketches of Jewish Social Life | **Working** | Public domain (CCEL). Edersheim was a 19th-century Protestant scholar: shown as Jewish and historical background, not doctrine. Scripture links come from the references tagged in the CCEL files. |
| Explorers: constellation of cross-references, web of themes, voices-through-time timeline, journeys and eras on the map | **Working** | The constellation is computed on your device from the cross-reference data. The timeline uses the dates recorded for each work in the library, which are approximate. The web of themes covers the 15 editorial themes only. |
| Word journeys, repeated-word fingerprint and pronunciation | **Partial** | A word’s appearances by book (counted by Strong’s number) and the words that recur in a chapter come from the Hebrew and Greek texts. Pronunciation uses the device’s speech engine; many devices have no Hebrew or ancient-Greek voice, so it is modern Greek or Hebrew at best. |
| Sacred art on the verse panel and share card | **Partial** | 39 public-domain paintings from The Metropolitan Museum of Art open-access collection (CC0), 30 of them linked to the scene they show. Images are bundled (about 2 MB). Not a complete art index. |

## Reading

| Feature | Status | Notes |
|---|---|---|
| Atmosphere, ambient sound, silent mode and quiet session | **Working** | Per-book colour identity, optional passage atmosphere, generated (not recorded) ambient sound, and a mode that hides everything except the text. All off or subtle by default. |

## Share

| Feature | Status | Notes |
|---|---|---|
| Verse card: shape, lettering, backgrounds, your own words, paintings | **Working** | Drawn on your device. Only public-domain translations and CC0 paintings are used, and the painting credit is printed on the image. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Manuscript viewer | **Partial** | 13 open-access manuscripts from The Metropolitan Museum of Art (CC0), from a fourth-century fragment of John 2:11-22 to medieval Bibles, Gospel books and Psalters, with zoom and page turning. Photographs load from the museum (needs a connection). Only two are tied to a passage. The great codices (Vaticanus, Sinaiticus, Alexandrinus) are linked, not shown, because their images are not free to reuse. |
| Scripture universe (3D sphere of the 73 books) | **Working** | A canvas sphere you can drag, with cross-reference arcs from the selected book. A list picker is provided for keyboard and screen-reader use. Motion is off when your device asks for reduced motion. |
| Time and place slider | **Partial** | One slider through nine eras: the map shows the era’s places (fainter for earlier ones) with its journeys, and the card lists finds from the period. Each era has only 2–4 places, and dates are conventional estimates. |
| Translation blind-spot detector | **Partial** | In the Words tab it flags original-language words the KJV alone renders six or more ways, so you know an English word is one choice among many. It does not compare modern translations word by word. |
| Pronunciation coach | **Partial** | Hear a word at normal or slow speed with a transliteration, and say it back for a rough letter-match score where the browser has speech recognition. Voices and recognition are modern Greek and Hebrew, not ancient pronunciation, and many devices lack them. |
| Maps, concordance and topical index | **Working** | OpenBible.info data (CC BY): 1,232 places on an OpenStreetMap map (needs a connection), exact-word concordance, 6,350 community-voted topics. |
| Book introductions and outlines, indexes, synopsis, Pauline outlines, genealogies | **Working** | Editorial study aids written for this app (AI-assisted) and checked for valid references; they are not official Church texts and are not exhaustive. |

## Library

| Feature | Status | Notes |
|---|---|---|
| Personal knowledge graph | **Working** | Notes, questions, passages, authors, Catechism paragraphs, tags and collections as an interactive graph built on your device. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Modern Catholic study Bibles and commentaries (Ignatius, Navarre, Jerome, CCSS…) | **Needs licence** | Copyrighted; none bundled. See docs/RESOURCE_COVERAGE.md. |

## Listen

| Feature | Status | Notes |
|---|---|---|
| Read aloud (text-to-speech) | **Working** | Any chapter read with your device’s speech voices: verse highlighting, speed, voice, skip, continue to the next chapter. It is synthesized speech, not a human recording; Latin has no standard browser voice. Recorded public-domain readings can be added to the media queue. |

## Settings

| Feature | Status | Notes |
|---|---|---|
| High-contrast themes, reduced motion, adjustable text | **Working** | Twilight (deep indigo) by default, with 17 themes to choose from (twilight, ocean, ember, midnight, OLED black, forest, mocha, nord, dawn, mist, light, paper, rose, sepia, solarized, two high-contrast, or match your device; each checked with an automated contrast audit), reduced-motion support, text size, spacing and margins, screen-reader labels (checked with an automated audit, not yet with a person using a screen reader). |

## Pray

| Feature | Status | Notes |
|---|---|---|
| Scripture memorization | **Working** | Spaced repetition, themed sets, fill-in-the-blank that gets harder as you improve, first-letter and audio recall. Syncs with your account if you use one. |
| Customizable Today dashboard, reminders and widget view | **Working** | Choose and order home-screen cards; reading, prayer, verse-of-the-day and review reminders (they fire while the app is open or installed; true background notifications and phone home-screen widgets need a native app); a compact widget page for a pinned tab or installed shortcut. |

## Library

| Feature | Status | Notes |
|---|---|---|
| Data portability, backup reminders and local-only mode | **Working** | Export everything (JSON), notes (Markdown), highlights and bookmarks (CSV or Markdown); preview before importing; merge or replace; backup reminders; local-only mode that never contacts a server. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Offline study packs | **Working** | Download commentary, library, links, reference data, Greek/Hebrew data, maps data and Church-document references in Settings. Map tiles, publisher links and audio still need a connection. |
| Biblical theology explorer | **Working** | 15 themes traced through Scripture with the Church’s reading and Catechism pointers. Editorial and not exhaustive. |
| Scripture textual history | **Partial** | 28 notable variants (New Testament manuscripts, Masoretic vs Septuagint vs Dead Sea Scrolls) with the passage in the bundled editions side by side. It is not a full critical apparatus; written cautiously; verify details with a critical edition. |
| Biblical world: journeys, eras and archaeology | **Partial** | Seven journeys (Abraham, the Exodus, Jesus, Paul’s four) stepped through on a map, nine historical eras and twelve archaeological finds. Locations are scholarly proposals; the Exodus route in particular is uncertain. |
| Read with the Church (guided session), verse cards, cross-reference map, authors side by side | **Working** | A five-step guided session from today’s Gospel (or the verse of the day), shareable verse images made on your device, a radial cross-reference map, and a side-by-side view of the authors who comment on a passage. |

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
| Catholic Answers articles linked to verses | **Partial** | Links to individual catholic.com pages (permitted by their permissions page) matched by hand from title and summary: about 130 pages across ~55 passages so far, plus 73 Bible Navigator pages. A complete index needs Catholic Answers’ own mapping; the database and import path are ready (docs/OUTREACH_CATHOLIC_ANSWERS.md). |
| Catholic creators (Jimmy Akin, Trent Horn, Matt Fradd, Brant Pitre, Word on Fire…) | **Partial** | About 45 individually linked pages and episodes (Word on Fire, St. Paul Center, Catholic Productions, FORMED/Augustine Institute, EWTN, New Advent, Jimmy Akin, Trent Horn), plus per-passage YouTube and podcast search links for each creator. Embedded playback for YouTube, Spotify, Apple Podcasts, Vimeo and audio files. |

## Platform

| Feature | Status | Notes |
|---|---|---|
| Installable offline PWA, light/dark/sepia, accessibility labels, responsive layout | **Working** | Service worker caches the app shell and any Scripture or content you open (or download in Settings). |

## Data

| Feature | Status | Notes |
|---|---|---|
| Ingestion pipeline with provenance, checksums, validation and reports | **Working** | npm run data:fetch / data:build / data:validate; see docs/INGESTION.md. |
