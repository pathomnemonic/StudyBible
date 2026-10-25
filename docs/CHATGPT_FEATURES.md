# Every feature ChatGPT proposed, against what the app has

Source: the whole ChatGPT conversation about this project (the code review, "40 exciting features", the parity audit against Ascension, Laudate, Hallow, Amen, Verbum and YouVersion, the "innovations" list and the storage discussion). Each line says **Yes** (built), **Partly** (built in part, with what is missing), or **No** (with the reason). Routes are inside the app.

## A. The 40 features

| # | Proposal | Status | Where / what is missing |
|---|---|---|---|
| 1 | Scripture Universe | Yes | Study → Scripture universe (`/study/universe`), 3D, plus constellation (`/study/constellation`) |
| 2 | Biblical history time machine | Yes | Time and place slider (`/study/timespace`); dates marked as one chronology, not consensus |
| 3 | Atlas with journeys | Yes | Maps and journeys (`/study/maps`, `/study/world`) |
| 4 | Interactive genealogy | Yes | People and genealogies (`/study/people`) |
| 5 | Narrative explorer | Partly | **Follow a story** (`/study/story`): six threads (Abraham, Exodus, David, exile, Peter, Mary). Not an interactive diagram of characters and conflicts |
| 6 | Theme propagation map | Yes | Themes (`/study/themes`), with the kind of link labelled |
| 7 | Manuscript and textual-tradition explorer | Partly | Manuscripts (13) and textual variants (28). Not a full Hebrew/Greek/Latin comparison for every passage |
| 8 | Personal knowledge graph | Yes | Library → Knowledge graph |
| 9 | Infinite study canvas | No | A free-form canvas is a large build; the Reading room (Bible beside another text) and the dossier cover the side-by-side need |
| 10 | Argument mapper | Partly | An *Argument map* note template (claim, because, but, therefore); no diagram editor |
| 11 | Interpretation comparison | Yes | Compare view in the study panel, authority labels on every item |
| 12 | Citation trails | Partly | Library citations open at their paragraph; no automatic broken-link detector across a commentary's own footnotes |
| 13 | Semantic search with evidence | No | Needs an embedding model or paid service; exact and fuzzy search exist |
| 14 | Automatic research dossier | Yes | Passage dossier (`/study/dossier`), print, group sheet with sources |
| 15 | Recursive lectio divina | Yes | Lectio shows your earlier reflections on the same passage before you begin |
| 16 | Living garden of insights | Partly | The knowledge graph grows as you link; no growth animation |
| 17 | Return to your past self | Yes | The reader says "You first wrote about this chapter eight months ago", with the note |
| 18 | Reflection evolution view | Yes | Library → Notes → Timeline, by tag, oldest first, with revision dates |
| 19 | Contemplative reading environment | Yes | Silent mode, Zen theme, quiet timer, ambience off by default |
| 20 | Questions that follow you | Yes | Questions are notes; "come back to this" date; a "To revisit" list. Resolving is by marking Done |
| 21 | Personal canon of important passages | Yes | Collections, exportable |
| 22 | Return-to-study reminders | Yes | Notes and questions can carry a revisit date |
| 23 | Morphology-aware word explorer | Yes | Words tab in the study panel |
| 24 | Translation decision explorer | Partly | Translation blind-spot detector and word study; not a toggle between rendering philosophies |
| 25 | Listen to the original languages | Yes | Pronunciation coach (device voice; not recorded Greek or Hebrew) |
| 26 | Quotation detector | Yes | NT quotations of the OT in the lens notes |
| 27 | Frequency maps | Yes | Word journeys and repeated-word fingerprint |
| 28 | Liturgical year as a navigable map | Yes | **The Church's year** (`/pray/year`): seasons, colours, great days, each linked to its readings |
| 29 | Patristic commentary explorer | Yes | Fathers tab, Fathers library, Voices timeline (`/study/voices`) |
| 30 | Scripture-to-Catechism pathway | Partly | Verified Catechism links (29 verses, 18 topics); the full index needs a licence |
| 31 | Development-of-doctrine timelines | Partly | Doctrine topics and the patristic timeline; no per-doctrine timeline |
| 32 | Eastern / Syro-Malabar pathway | Partly | **Your Church** setting (Settings): the liturgy's own name, Septuagint Psalm numbering, Eastern prayers first, Roman-only content labelled as Roman, and for Byzantine Churches the year's great days (Julian or Rome's Pascha, old or new calendar) and a Divine Liturgy outline. The Syriac, Armenian, Alexandrian and Chaldean calendars, lectionaries and hours are not in the app; it says so and links to the Church's own site |
| 33 | Daily readings with historical context | Partly | Readings, Prepare for Sunday, homilies and commentary; short historical notes only where we have them |
| 34 | Typology explorer | Yes | Promise and fulfilment (`/study/fulfilment`), labelled by source |
| 35 | Active-recall study | Partly | Memorisation in five modes; no generated review questions |
| 36 | Reconstruct the passage | Yes | Memorise → *Put in order* mode |
| 37 | Voice-first capture | Partly | Dictation in the note editor (the browser's speech service); no stored audio |
| 38 | One-click teaching mode | Yes | Group sheet → *Present* (full-screen slides) and *Print*; private notes excluded |
| 39 | Photograph-to-study workspace | No | In-browser OCR is a large download and unreliable on handwriting |
| 40 | Portable study library | Yes | Study vault (Markdown files with front matter and `index.json`, for Obsidian) and the JSON backup |

## B. Parity with other apps

| Area | Proposal | Status |
|---|---|---|
| Ascension | Bible in a Year with companion material | Yes (episodes mapped, readings, related teaching). Transcripts: No (not published) |
| | Catechism in a Year, Rosary in a Year | No: the programmes' content is copyrighted |
| | Sunday preparation | Yes (`/pray/sunday`) |
| | Bible question library | Yes (resource directory, written by others) |
| | Timeline-based Bible course with quizzes | Yes (`/study/course`) |
| Laudate / iBreviary | Complete Divine Office | Partly: Lauds, Terce, Sext, None, Vespers, Compline with the four seasons. No feasts, no seasonal antiphons, no Office of Readings; traditional psalter, not the modern Liturgy of the Hours (copyright) |
| | Order of Mass and Mass companion | Partly: the parts and links; the ICEL words are copyrighted |
| | Rosary, Divine Mercy, Angelus, Stations, Seven Sorrows | Yes |
| | Searchable prayer book, attach to passage | Yes (save to journal). Attaching a prayer to a passage: No |
| | Examination of conscience | Yes (private) |
| | Saint of the day | Partly (names, short lives for part of the calendar) |
| Hallow / Amen | Recorded prayer library | Partly: LibriVox recordings, chant and sleep mode; no studio-recorded prayers |
| | Session builder and playlists | Yes (`/pray/build`) |
| | Sleep and wake modes | Partly: sleep yes; no morning wake mode |
| | Examen | Yes (`/pray/examen`) |
| | Prayer plans, novenas | Yes |
| | Family and group prayer | Partly: share a prayer time or a study sheet by link; no live groups (needs a server) |
| Verbum | Passage guide | Yes (dossier) |
| | Word-study guide | Partly (Words tab) |
| | Research workflow | Partly (dossier, vault, sources) |
| YouVersion | Large plan library | Yes (built-in, Bible in a Year, topic and saint plans) |
| | Shared plans with friends | No (needs a server) |
| | Synchronised highlighting with audio | No (recordings are not timed) |
| | Widgets and reminders | Partly (widget page; closed-app reminders need a push service) |

## C. The 18 "innovations"

| # | Proposal | Status |
|---|---|---|
| 1 | Living Bible universe | Yes (see A1, A6) |
| 2 | Enter the world of the passage | Partly: maps, era slider, customs and archaeology notes; no 3D reconstruction |
| 3 | Bible as a branching narrative | Partly: Follow a story |
| 4 | Translation decision simulator | Partly (see A24) |
| 5 | Research agent | No: needs an AI service (cost) and an evidence-first design |
| 6 | Interpretation laboratory | Partly (compare view with authority labels) |
| 7 | Socratic tutor | No: needs AI; the Examen, Lectio and course ask questions without it |
| 8 | Provenance graph for every answer | Partly: every study item shows why it was attached |
| 9 | Digital garden | Partly (A16) |
| 10 | Adaptive contemplative environment | Yes (silent mode, zen, session, sleep) |
| 11 | Personal liturgical companion | Partly: the Church's year, readings, Sunday prep and your past reflections; not combined on one screen |
| 12 | Scripture memory system | Partly: five modes plus ordering; no review of event order or allusions |
| 13 | Bible as a soundscape | Yes (per-passage soundscapes) |
| 14 | Camera → sacred art | No: needs image-recognition AI |
| 15 | Bible-to-art explorer | Yes (Gallery, art on the verse panel) |
| 16 | Living study group | Partly: share by link; no live groups |
| 17 | Bible knowledge API | Yes: the data files are documented in `docs/DATA_API.md` |
| 18 | Generate your own study tools | No |

## D. Storage and accounts

| Proposal | Status |
|---|---|
| Keep local data in the browser, ask for persistent storage | Yes |
| Google Drive as the user's storage | Yes in code, needs a Google client ID from the owner (`docs/DRIVE_BACKUP.md`) |
| Optional account server we run ourselves | Yes (`docs/SERVER.md`) |
| A free hosted database (Supabase, Cloudflare) | Not used, by design (they pause or charge) |
| Move data between devices by file | Yes (JSON, password-protected, Markdown vault) |
