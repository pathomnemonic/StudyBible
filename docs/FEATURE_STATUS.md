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
| Navigation: Today, Bible, Study, Notes | **Working** | Today is one quiet screen with no tab bars: the day, a verse, a saint and a question, plus Continue reading, Random passage and Mass readings; a small menu in the corner leads to the rest. Bible in a Year, plans, memorizing and prayer live under Study and Prayer. Settings and the account are in the sidebar. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Challoner’s notes, chapter summaries and introductions; chapter reading links | **Working** | Bishop Challoner’s annotations (about 1,850), a one-line summary for 1,293 chapters and 71 book introductions (public domain, Project Gutenberg). Every chapter of all 73 books also links to the Douay-Rheims with notes (DRBO), New Advent and the NABRE with the bishops’ notes (USCCB). These are chapter-level, not verse-level; the app labels them so. `scripts/verify/coverage.ts` reports how many verses have a verse-level reading versus chapter-level only. |
| Church Fathers: Catena Aurea (all four Gospels, CrossWire), Haydock Catholic Bible Commentary (protocanon), Augustine, Chrysostom, Irenaeus, Athanasius, Cyril, Glossa Ordinaria (Latin) | **Working** | Public-domain: CrossWire Catena (Public Domain licence), SermonIndex Haydock module, CCEL translations. 24 works in the library plus a link-out Summa index. |
| Reading room: saints, Fathers and catechisms in full | **Working** | 94 public-domain works, including the Imitation of Christ, Thérèse, Teresa, Julian, Francis de Sales, Ignatius, Anselm, and the Roman and Baltimore catechisms. The Roman Catechism text is unproofread OCR. The Catechism of the Catholic Church is copyrighted and linked, not included. |
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
| Daily Mass readings, read in the app | **Partial** | The Church’s assigned passages for each day (citations compiled from the USCCB daily readings pages, which permit reading for analysis with attribution) are printed in full in your chosen translation, so you stay in the app. The Lectionary wording itself is copyrighted and not shown; the official page is one tap away. Coverage: the days that were collected (see the Readings page); other days fall back to feasts via LitCal, the Sunday Gospel table, or references you import or type. |
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
| Connections open inline and you can step back | **Working** | Cross-references, quotations, parallels and types show their verses inline by default. Opening one in the reader leaves a “Back to …” button, and chains of hops can be walked back one at a time. Notes in Latin or other languages are hidden unless you choose to show them. |
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
| Atmosphere, ambient sound and music, drifting light, inline paintings, silent mode | **Working** | Sound is on by default (it starts at your first tap, with a one-time note on how to turn it off): CC0 nature recordings, Kevin MacLeod ambient music (CC BY 4.0), Chopin nocturnes from Musopen (CC0) and one short plain-chant Kyrie (CC BY-SA 3.0). Only that one chant is verified so far; more chant tracks are listed for later. Soft drifting light behind the text, key-word sparkles and inline Met paintings can each be switched off in Reading settings. |

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
| Daily reflection: verse, saint quote and question for the day | **Partial** | 366 calendar-day triples plus 151 season-specific ones (Advent, the O Antiphons, Christmas, Lent, Holy Week, Easter) so verse, quote and question agree with the liturgical day. Season quotes were checked word for word against the library texts; of the 366 calendar-day quotes 38 are verified against a library text or a published edition (with a “see it in context” link), 20 were found to be misattributed and are shown with the corrected author, and the remaining ~300 could not be traced to a source and are labelled as such. About 30 quote texts appear under more than one saint in the source list. Questions are written for this app. |

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

## Scripture

| Feature | Status | Notes |
|---|---|---|
| Translations: WEB-C (default), Douay-Rheims, Catholic Public Domain Version, Clementine Vulgate | **Working** | WEB-C is the modern-English default. The CPDV (Ronald L. Conte Jr.) is a plain-English Catholic translation of the Vulgate dedicated to the public domain; it has no imprimatur and is not the Lectionary text. |

## Reading

| Feature | Status | Notes |
|---|---|---|
| Key words that sparkle (Son of Man, Kingdom of God…) | **Partial** | 32 key terms with a short note and every place they occur in the Douay-Rheims; matching follows that wording, so counts are approximate in other translations. Switch off in Reading settings. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Study paths: 15 guided journeys through a theme | **Working** | Each step has a passage in your translation, a short editorial introduction (written for this app), one Father or saint quotation checked word for word against the library, and a question. Progress is kept on your device. A few quotes fit their theme more loosely than their exact verse. |
| Who quoted this verse? (quotation tracker) | **Partial** | Lists every library excerpt that cites a passage, ranked by how many words it shares with the verse, then by length. It only covers the 94+ works in the library and the tags in them; it is a guide, not a complete patristic index. |
| Councils and Church documents | **Partial** | Seven ecumenical councils (Percival, 1900), Trent (Waterworth 1848, OCR), Vatican I, Leo XIII, Pius IX and X are read in full; ~75 modern documents (Vatican II, the Catechism, encyclicals from Pius XI on) are official links only. The OCR texts are not proofread. |

## Reading

| Feature | Status | Notes |
|---|---|---|
| Reading comfort: large print, dyslexia-friendly, low vision, spacing, animation and haptic settings, zen high-contrast theme | **Working** | Presets in Reading settings set the type size, spacing, alignment and font (Atkinson Hyperlegible and OpenDyslexic are bundled). Research on dyslexia fonts is mixed, so both are offered alongside the spacing controls. Haptics work only on devices that support vibration. |

## Pray

| Feature | Status | Notes |
|---|---|---|
| Sleep mode | **Working** | A chosen psalm shown and read slowly with your device’s voice, one verse at a time, while the sound fades and the screen dims; it stops by itself. |

## Library

| Feature | Status | Notes |
|---|---|---|
| Export notes to PDF and e-book (EPUB) | **Working** | PDF opens the browser’s print dialog (choose Save as PDF). The EPUB has one chapter per note and a contents page; it has been generated but not checked in every e-reader. |

## App

| Feature | Status | Notes |
|---|---|---|
| Spanish and Latin interface | **Partial** | Menus, the home screen, the readings page headings and the reader’s main buttons are translated (Spanish and Latin translations written for this app, not professionally reviewed). The study material stays in its own languages. There is no Spanish Bible yet: no machine-readable public-domain Catholic-canon Spanish text could be verified. |

## Reading

| Feature | Status | Notes |
|---|---|---|
| Scene sounds, chant by season and old hymn recordings | **Partial** | With “let the passage choose the sound” on, the sea, desert, night, fire, thunder, pasture and crowd recordings follow certain chapters. Chant: 7 tracks (Easter propers, a Salve Regina, one Kyrie). Hymns: 8 early recordings from the Library of Congress and others, with surface noise. No verified recordings for Advent or Lent chant yet. |
