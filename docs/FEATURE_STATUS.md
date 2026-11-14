# Feature status

Generated from `src/featureStatus.ts` (`npm run docs:status`). The same table is shown in the app under About.


## Scripture

| Feature | Status | Notes |
|---|---|---|
| Douay-Rheims, Clementine Vulgate, WEB (Catholic): 73 books, offline | **Working** | Public-domain texts ingested from eBible.org USFM; paragraphs, poetry, headings and footnotes preserved. |
| Parallel view, verse comparison, translation switching that keeps the passage | **Working** | Aligned through the Vulgate anchor. Psalms are mapped by reviewed rules; other chapters whose numbering differs are flagged, never silently mismatched. |
| Verse-level alignment for Tobit, Judith, Sirach, Esther, Daniel across Greek vs Vulgate texts | **Partial** | These books follow different textual traditions; chapter-level alignment only, with an explicit notice. **Next:** A reviewed verse map for each of the five books. **Blocked by:** verification. **Done when:** a versification test per book that every verse maps or is marked unaligned. |
| RSV-2CE (Ignatius Bible) | **Working** | All 73 books from the owner’s clean publisher file, with the edition’s own footnotes, study notes and cross-references shown by verse, bundled with the owner’s stated permission (the permission reference still has to be recorded). Replaces the first pack, which was read from a damaged scan. Verse numbers follow the print, so verses the RSV leaves out or moves show as gaps. See docs/RSV2CE.md. **Next:** The licence reference recorded in docs/LICENSING.md. **Blocked by:** rights. **Done when:** tests/editions-integrity.test.ts passes and the licence record names the edition. |
| NABRE (New American Bible, Revised Edition) | **Working** | All 73 books from the owner’s Saint Benedict Press file, with section headings and the edition’s own notes (numbered study notes and lettered textual and cross-reference notes) shown by verse, bundled with the project owner’s stated official permission (the reference still has to be recorded). Book introductions, the lettered Greek additions to Esther and the Sirach foreword are not included. Hebrew-based verse numbering is mapped to the app’s anchor by a scheme derived from the text, with weak chapters flagged. See docs/NABRE.md. **Next:** The permission reference recorded in docs/LICENSING.md; book introductions if the permission covers them. **Blocked by:** rights. **Done when:** tests/editions-integrity.test.ts passes and the licence record names the edition. |
| RSV-CE (first edition), Jerusalem Bible / NJB | **Needs license** | Under copyright. The edition registry, anchor mapping and attribution records are ready; a license and text file are required. (The RSV Second Catholic Edition and the NABRE are bundled; see the rows above.) **Next:** A license and text file from the rights holders. **Blocked by:** rights. **Done when:** the edition registry test passes with the text present and an attribution record. |
| Maps and appendices | **Planned** | Not in the public-domain sources used; the data model allows per-edition introductions and footnotes. **Next:** Public-domain appendix sources chosen and ingested. **Blocked by:** data. **Done when:** the data validator lists each appendix with a source. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Verse study panel with provenance, authority level and match reason on every item | **Working** | Never lists a source for a verse unless the data links it; empty sections say so. |
| Catechism links | **Partial** | 29 verse-level citations, each verified against the paragraph text; topic ranges for 18 doctrine topics. The full Scripture index of the CCC needs a licensed data file. CCC text is never stored. **Next:** A licensed Scripture index of the CCC, or more verified citations. **Blocked by:** rights. **Done when:** scripts/verify/ccc.ts confirms each citation against paragraph text. |

## App

| Feature | Status | Notes |
|---|---|---|
| Navigation: Today, Bible, Study, Notes | **Working** | Today is one quiet screen with no tab bars: the day, a verse, a saint and a question, plus Continue reading, Random passage and Mass readings; a small menu in the corner leads to the rest. Bible in a Year, plans, memorizing and prayer live under Study and Prayer. Settings and the account are in the sidebar. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Challoner’s notes, chapter summaries and introductions; chapter reading links | **Working** | Bishop Challoner’s annotations (about 1,850), a one-line summary for 1,293 chapters and 71 book introductions (public domain, Project Gutenberg). Every chapter of all 73 books also links to the Douay-Rheims with notes (DRBO), New Advent and the NABRE with the bishops’ notes (USCCB). These are chapter-level, not verse-level; the app labels them so. `scripts/verify/coverage.ts` reports how many verses have a verse-level reading versus chapter-level only. |
| Church Fathers: Catena Aurea (all four Gospels, CrossWire), Haydock Catholic Bible Commentary (protocanon), Augustine, Chrysostom, Irenaeus, Athanasius, Cyril, Glossa Ordinaria (Latin) | **Working** | Public-domain: CrossWire Catena (Public Domain license), SermonIndex Haydock module, CCEL translations. 24 works in the library plus a link-out Summa index. |
| Read tab: saints, Fathers and catechisms in full | **Working** | 94 public-domain works, including the Imitation of Christ, Thérèse, Teresa, Julian, Francis de Sales, Ignatius, Anselm, and the Roman and Baltimore catechisms. The Roman Catechism text is unproofread OCR. The Catechism of the Catholic Church is copyrighted and linked, not included. |
| Popes and Vatican documents | **Partial** | Linked (not copied) with authority labels; text search of them is not included. **Next:** Full-text search of the linked documents. **Blocked by:** rights. **Done when:** a search test over the documents that returns the cited article. |
| Catholic Answers, Word on Fire, Ascension Presents | **Needs credentials / agreement** | No public APIs or reuse licenses. Only search links and a curated-link schema are provided; no content is imported. A partnership/license would unlock richer integration. **Next:** A reuse agreement or public API from each publisher. **Blocked by:** rights. **Done when:** an integration fetches an item and shows attribution. |
| Semantic / concept search with AI | **Planned** | Not implemented. Concept search currently uses editorial topic keywords and a people/places index, clearly labelled. If added, AI results will be marked as such. **Next:** Evidence-first retrieval that cites source passages. **Blocked by:** code. **Done when:** every result links to a passage and marks generated text as such. |

## Search

| Feature | Status | Notes |
|---|---|---|
| Exact phrase, partial words, references, scope filters, fuzzy suggestions, recent & saved searches | **Working** | Client-side indexes built on demand; Scripture across all editions; library full-text at section level. |

## Listen

| Feature | Status | Notes |
|---|---|---|
| Bible in a Year: 1,847 episodes mapped from the official feed; plan, canonical and release order; queue; progress; resume | **Working** | Passages come from feed metadata voted across yearly releases; one day (366, “A Special Leap Year Message”) has no passage in the feed, by design, and is shown without one. |
| Transcripts and captions | **Planned** | The official feed provides none. The schema supports them if Ascension publishes transcripts or grants access. **Next:** Transcripts supplied by Ascension. **Blocked by:** rights. **Done when:** a transcript loads beside an episode and stays in sync. |
| Video and other podcasts | **Planned** | Links to official YouTube channels only; adding more feeds is a matter of adding a feed entry. **Next:** More feeds added as entries. **Blocked by:** data. **Done when:** each feed entry validates and plays. |

## Pray

| Feature | Status | Notes |
|---|---|---|
| Liturgical calendar, seasons, cycles, calendar view, local calendars (via LitCal) | **Working** | Offline computation plus the open LitCal API when online. |
| Daily Mass readings, read in the app | **Partial** | The Church’s assigned passages for each day (citations compiled from the USCCB daily readings pages, which permit reading for analysis with attribution) are printed in full in your chosen translation, so you stay in the app. The Lectionary wording itself is copyrighted and not shown; the official page is one tap away. Coverage: the days that were collected (see the Readings page); other days fall back to feasts via LitCal, the Sunday Gospel table, or references you import or type. **Next:** The licensed lectionary wording. **Blocked by:** rights. **Done when:** the reading text shown matches the USCCB text with the copyright line. |
| Saint biographies and homilies for the day | **Partial** | The day’s celebrations come from LitCal (names, ranks). Biographies need a licensed or public-domain source (e.g. a public-domain Lives of the Saints) which has not been ingested yet. |
| Lectio Divina, prayer journal, traditional prayers, quiet reading, plans (11+ built in, custom plans) | **Working** | Optional; no streak pressure (streak display is off by default). |
| Audio Scripture | **Partial** | Device text-to-speech only. Recorded audio would need a licensed or public-domain recording per edition. **Next:** Timed recordings (verse-level timings). **Blocked by:** data. **Done when:** a recording highlights the verse being read. |
| Reminders | **Partial** | Work while the app is open/installed. True background push needs a server or native wrapper. **Next:** A push service for closed-app notifications. **Blocked by:** code. **Done when:** a reminder arrives with the app closed. |

## Library

| Feature | Status | Notes |
|---|---|---|
| Notes (Markdown), highlights (6 colors), bookmarks, folders, tags, collections, personal cross-references, journal, export/import | **Working** | Stored in IndexedDB on the device, anchored to stable Vulgate-based ids so they survive translation changes. |
| Accounts & cross-device sync | **Partial** | Built and tested but switched off in every normal build: nothing about sign-in or sync is shown and the app never looks for a server (switch: src/lib/accountsFlag.ts). Built: sign-up and sign-in, invite-only sign-up, two-factor sign-in with recovery codes, lock-out, operator reset codes, profile and email change, signed-in devices, a security log, download and delete, record-level sync with conflict copies, and operator tools. Turning it on needs a host that runs the bundled Node server and a decision about email (docs/ACCOUNTS_ROLLOUT.md). **Next:** Switch accounts on for a real host (and decide about email). **Blocked by:** code. **Done when:** e2e/accounts.mjs passes against the server and a build made with VITE_ACCOUNTS=1. |

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
| Book introductions and outlines, indexes, Gospel comparison, Pauline outlines, genealogies | **Working** | Editorial study aids written for this app (AI-assisted) and checked for valid references; they are not official Church texts and are not exhaustive. |

## Library

| Feature | Status | Notes |
|---|---|---|
| Collection pages: gather passages, your notes, highlights, bookmarks, Catechism paragraphs, links and questions | **Working** | Each collection opens to a page that shows every item read back from its original (a note, a highlight or a passage is referenced by identity, never copied), with a link to the original, reordering, and export to Markdown or print/PDF. Items from Church writings and commentary join from their own pages. Backups and sync carry collections like any other record. Items can be ticked off as done (the tick survives reordering). Not yet built: turning a collection into a plan. |
| Note templates, note-to-note links and backlinks | **Working** | Templates: Observe/Interpret/Apply, Lectio divina, Prayer, Theological questions, Questions, Argument map, Historical context. Write [[Title of another note]] in a note and it becomes a link to that note when shown. Each note lists the collections that hold it, the notes that link to it and other notes on the same passage, all computed on the fly (nothing extra is stored, so nothing can go stale). A link to a title that matches no note shows as plain text. Typing [[ in a note suggests your notes by title (titles that start with what you typed first) and completes the link when you pick one. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Cleaner historical texts | **Partial** | Butler’s Lives of the Saints for the scanned months (April to June, August to December) has had scanner debris, footnote citations and Latin verse removed, and common misreadings (for example “tbe”, “thai”, “oflfered”) corrected by program. It has not been proofread by a person, so a misprint may remain. The Roman Catechism and Leo XIII’s encyclicals had scanner misreadings repaired the same way. **Next:** A human proofread of the scanned months. **Blocked by:** verification. **Done when:** A reader checks a sample of days against a clean edition and finds no misprints.. |
| Ask the sources | **Working** | One question in plain words. The answer is never written for you: the page finds the Catechism paragraphs that match (official teaching, quoted), the verses that use your words (Bible text, in your translation), the app’s own definition if you named a term, and, on request, passages from the Fathers and saints in the library (single writers, not Church teaching). Each card carries a label naming its kind of source. It works with no AI service and no connection once the data is on the device. Tick which kinds of source to show (kept in the address); “Save this question” adds it to the question inbox in Notes, under Review. Each Catechism card names its exact location (paragraph number), expands to the full paragraph in place and links to the paragraph with its neighbours. “Guided walks on this” suggests the Argument Map questions whose titles share words with what you asked; every suggestion is an existing page, nothing is generated. |

## Learn

| Feature | Status | Notes |
|---|---|---|
| Pace a grade over the year; letters to families; my notes on a lesson | **Working** | From any grade page: choose the first day, the days you teach, lessons per day and any breaks, and the 456-lesson program is spread over the year (with the end date). Print the calendar, print a letter to families for each unit built from that unit’s own lessons (the question, the lessons, verses to learn, things to try at home), or put the whole plan into a class planner. Each lesson also has “My notes on this lesson”: kept as an ordinary note, so it is saved and backed up with everything else. Test and answer-key printing already existed under Teacher tools. Not yet built: editing the lesson text itself. **Next:** Local lesson overrides: edit a lesson’s text and keep the edit beside the original. **Blocked by:** code. **Done when:** An edited lesson shows the edit, the original stays available, and both survive a backup and restore.. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Think it through (guided argument) | **Working** | Pick one of the Argument Map’s questions. You write what you think first; then each source appears one at a time with a plain note on why it matters, and the quotation itself only when you ask for it; then the objections, with the reply hidden until you choose to see it. It ends with the chain’s own summary and an option to keep your first answer as a note. Everything shown is the chain’s own text; nothing is generated, so it works with no network and no model. |
| Original language, word by word | **Working** | Any chapter of the Greek New Testament or the Hebrew Bible, word by word: the original, how it sounds, a short dictionary gloss and, on tap, the grammar and the full dictionary entry (Strong’s, with the King James renderings). Hebrew reads right to left, and the Hebrew verse numbers are shown as the Hebrew text gives them. The gloss is a dictionary meaning, not a translation of the verse; there is no word-for-word alignment with an English Bible yet. **Next:** Word-for-word alignment of the English Bible to the original. **Blocked by:** data. **Done when:** Tapping an English word in the reader highlights its Greek or Hebrew word, with the source of the alignment named.. |
| Where the ancient texts differ | **Partial** | A browsable list of the 26 passages the app has notes on where the Hebrew, the Greek Old Testament and the Latin Vulgate read differently (Isaiah 7:14, Genesis 3:15, the Psalm numbering and others), each with the verse in the Douay-Rheims, the WEB and the RSV-CE side by side, and the 28 manuscripts and versions behind the text. It does not decide between readings. It is a short hand-picked list, not a full critical apparatus. **Next:** A sourced variant table for the New Testament (verse, readings, witnesses). **Blocked by:** data. **Done when:** Every variant row names its apparatus, and a verse with variants lists them in the study panel.. |
| Map of connections | **Working** | One normalised map of how the app’s doctrine topics, argument, claim, development and heresy chains, saints’ lives, situations, Bible chapters, Catechism paragraphs, library works and authors link up (about 980 things and 2,500 links). Pick anything to see its links grouped by kind, follow them, or ask how two things are connected (the shortest chain, with how each link is made). Every link comes from a source file; none is guessed. Tick “Include my notes” to add yours: each note joins the Bible chapters it is written on and the argument it was written for (from Think it through). Built offline by `npm run graph`; no server or model. **Next:** A layer for quotations (which Father is quoted for which passage). **Blocked by:** code. **Done when:** A quoted passage lists the works that quote it, each with its author.. |
| Book fingerprint | **Working** | For any book: the words it uses most, and the words it uses far more than a spread of other books (Genesis, Psalms, Isaiah, Matthew, John, Acts, Romans, Revelation) do, with how many times more. Counted on the device from the Bible text; each word links to the Concordance. Counting is by exact word, not meaning. |

## Library

| Feature | Status | Notes |
|---|---|---|
| Question inbox and weekly review | **Working** | A Review tab in Notes lists every note you wrote as a question, open or answered, with “Look it up” (opens the Catechism search with the question filled in) and “Mark answered”. It also shows the last seven days: notes written, highlights made, questions asked and notes you chose to revisit. All of it is read from your own records on the device. |
| Collection templates | **Working** | Start a collection from a template (Prayers in Scripture, Psalms for a hard day, the Eucharist in Scripture, Marian passages, the Passion in John, the Beatitudes and works of mercy, the call of the first disciples). Templates hold Scripture passages only; edit them freely afterwards. |
| Collections list: summary, search and duplicate | **Working** | Each collection in the list shows its item count, how many are ticked done and when it last changed. With more than three collections a search box filters by name, description or the label of any item. Duplicate makes a personal copy (same items, nothing ticked), which is how a template becomes your own. Make a reading plan turns the Scripture passages of a collection into a plan with one day per passage, in the collection’s order (other kinds of item are left out). Tags: each collection can carry your own tags (comma separated); they show in the list, are searched, and are copied by Duplicate. Not built: folders and collection types beyond the item kinds already supported. |
| Data health check | **Working** | In Library, Export and backup: “Run the check” looks through your notes, highlights, bookmarks, collections and reading plans for items that point at something no longer here (a note a collection still lists, a deleted bookmark) or at a passage address the app cannot read, and names each one with a link to open it. It only reports; nothing is changed or deleted. Not covered yet: failed downloads and backup problems (Downloads and the backup card show those). |

## Study

| Feature | Status | Notes |
|---|---|---|
| Modern Catholic voices (short credited quotations) | **Working** | 11 one-or-two-sentence quotations from four books (Jimmy Akin’s The Bible Is a Catholic Book and The Fathers Know Best, Dave Armstrong’s 100 Biblical Arguments Against Sola Scriptura, Kreeft and Tacelli’s Handbook of Catholic Apologetics), copied exactly from the books supplied, each naming its author, title, publisher and year and tied to the Argument Map question it relates to. Labelled as one author’s view, not Church teaching. Kept short on purpose (a test caps each at 45 words and each book at 12), because the books are in copyright; the books themselves are not included. Not built: more quotations (they can be added within those limits). |

## Library

| Feature | Status | Notes |
|---|---|---|
| Export only the notes with one tag | **Working** | In Export and backup, choose a tag and export just those notes as Markdown, with their passage references kept. The all-notes, Word-style and vault exports are unchanged. |
| Weekly review actions | **Working** | In Review, each note you chose to come back to can be marked Reviewed (the reminder is cleared), pushed to Next week, or added to a collection. Nothing is deleted or archived by these buttons. |

## App

| Feature | Status | Notes |
|---|---|---|
| Problem reports with a diagnostic summary | **Working** | Report a problem (on a study item, and on the About page) opens a pre-filled GitHub issue with the item id and source, the build (commit and date), the screen (without any query text), whether the device is online and the window width. It never includes notes, anything you typed, names or account details. The report opens in a new tab and nothing is sent until you submit it there. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Glossary letter index | **Working** | The glossary (already A to Z, searchable, with the Church’s own words, Scripture the paragraph cites, related terms and the lessons that teach each word) now has a row of letters that jumps to the first term under each. Not built: a side-by-side comparison of easily confused terms, which needs reviewed pairings rather than guessed ones. |

## Downloads

| Feature | Status | Notes |
|---|---|---|
| Saved-copy check | **Working** | On Downloads, “Check saved copies” reads every saved study pack back from the device and reports files that are missing, empty or damaged (a JSON file must parse). It changes nothing; the Save it now buttons fetch a pack again. Bibles and audio already show their real sizes, dates, partial state and a remove button. Not built: a download queue with pause and reorder, and automatic update checks. |

## Library

| Feature | Status | Notes |
|---|---|---|
| Note version history | **Working** | Each note keeps its last five earlier versions on the note itself (so they sync and back up with it and need no database migration). A new version is kept when an edit changes the text meaningfully, or when the last kept version is more than ten minutes old. In the editor, “Earlier versions” lists them with Restore, which only puts the text back in the box until you press Save. Notes are capped at five versions, so storage cannot grow without limit. Not built: comparing two versions side by side. |

## Games

| Feature | Status | Notes |
|---|---|---|
| Match the term | **Working** | Five terms and five meanings from the glossary (the app’s own plain wording, with the term blanked out). Tap a meaning, then its word; wrong taps are counted. Practice only: it has no daily puzzle and no streak, so it is not part of the trophy count. |
| Family ties | **Working** | Six questions: who was the father or mother of this person? They come only from the genealogies of Scripture already in the app, leave out entries that carry a note about a variant or complication, and each answer shows the Scripture reference. Practice only (no daily puzzle or streak). |

## Teach

| Feature | Status | Notes |
|---|---|---|
| Student worksheet from a lesson | **Working** | On a lesson’s teacher view, Student worksheet prints a page made only from that lesson’s own parts: what you will do, the Scripture to read, the words to know with blanks, the lesson question and discussion questions with answer lines, the lesson’s own quiz questions, the activity, the lines to remember, the verse to learn and the challenge for the week. Worksheet with answer key marks the right answers. Nothing is added or invented; a lesson that lacks a part simply omits that section. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Profiles of saints, people and places | **Partial** | Search and profile pages with every fact sourced and uncertainty stated (format and checks in docs/PROFILE_DATA_FORMAT.md). 40 saints, 45 people of Scripture and 42 places are loaded. Each was drafted by one agent (saints from the Catholic Encyclopedia, Scripture and Vatican documents; people from Scripture; places from Scripture and public reference pages) and then checked source by source by a second agent, which corrected 21 saints, 28 people and all 42 places (dates, wrong pages, claims beyond the cited verse, passages that did not name the place, tradition labelled as Scripture). Modern identifications of places rest partly on Wikipedia and are marked probable or disputed where scholars differ. A human review is still recommended. |

## Bible

| Feature | Status | Notes |
|---|---|---|
| Copy a verse in five formats | **Working** | In Text settings, “Copy a verse as” offers verse numbers, plain text, a quotation, a Markdown block quote with the citation in bold, or the reference only. The translation text is never altered; only the wrapping changes. |

## Pray

| Feature | Status | Notes |
|---|---|---|
| Readings: jump by Sunday | **Working** | The readings page has Previous Sunday and Next Sunday buttons next to the day arrows and date picker. |

## App

| Feature | Status | Notes |
|---|---|---|
| Offline readiness card | **Working** | The Downloads page opens with “Ready for a flight? Yes / Not yet”: your Bible saved and no half-saved study pack, with a button to fix each gap. Audio and video are not counted unless saved. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Saint pages link to their writings and to collections | **Partial** | Each life in Butler’s Lives of the Saints lists the saint’s own writings in the library (matched by name; a weak match shows nothing) and can be added to a collection. People in the family-line pages list their children in the lists and can be added to a collection too. Not yet built: one profile page per saint or biblical person that gathers every source, which needs a reviewed tagging first. **Next:** A saint profile page gathering life, writings, feast, quotes and mentors. **Blocked by:** verification. **Done when:** Every fact on the page links to a source already in the app; no field is invented.. |
| Compare the authors on a passage | **Working** | In the study panel’s Notes tab, choose any number of Fathers, saints and commentators and read them side by side. Each card gives the work, where in it the text sits, the period, whether the link to the passage is direct or editorial, and a link to the original work. Shows only what the library holds; it never summarises. |
| Glossary: plain-words explanations kept apart from the Church’s own wording | **Partial** | Each entry says it is written in plain words for this app, links the Catechism paragraph (the Church’s own words, or the nearest teaching) and, on request, lists the Scripture that paragraph’s footnotes cite. Not yet built: related doctrines and historical sources per entry. **Next:** Related doctrines and historical sources for each entry. **Blocked by:** data. **Done when:** Every entry lists at least one related doctrine, and the data validator checks that each links to an existing page.. |

## Library

| Feature | Status | Notes |
|---|---|---|
| Offline manager: saved date, partly saved packs and a summary | **Working** | The Downloads page shows how many Bibles and study-data packs are on the device, when each was saved, which packs are only partly saved (with the number of missing files and a Finish download button), real sizes, progress and Remove. |
| Personal knowledge graph | **Working** | Notes, questions, passages, authors, Catechism paragraphs, tags and collections as an interactive graph built on your device. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Modern Catholic study Bibles and commentaries (Ignatius, Navarre, Jerome, CCSS…) | **Needs license** | Copyrighted; none bundled. See docs/RESOURCE_COVERAGE.md. |

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
| Study data offline packs | **Working** | Download commentary, the Fathers library and resource links on the Downloads and offline page, with real sizes, remove buttons and a one-tap Download everything. Audio episodes can be saved one by one. Publisher links and audio still need a connection. |

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
| The Divine Office: Lauds, Terce, Sext, None, Vespers, Compline | **Partial** | The traditional Roman weekly psalter in the Douay-Rheims psalm text (Divinum Officium, MIT license), offline. Weekly psalter for ordinary time, plus the chapters, responsories, hymns, versicles and collects of Advent, Lent, Passiontide and Eastertide (chosen from today’s date or by hand). Not included: feast days, the seasons’ proper antiphons, the Office of Readings, Prime, and Compline’s seasonal parts. Not the modern Liturgy of the Hours, whose English text is copyrighted. **Next:** Feast days, proper antiphons of the seasons and the Office of Readings. **Blocked by:** data. **Done when:** each proper’s psalms, antiphons and collect match the Divinum Officium output for sample dates. |
| Devotions: Rosary, Divine Mercy, Angelus, Stations of the Cross, Seven Sorrows | **Working** | Step by step with a bead counter. Scripture for each mystery and station is shown in the reader’s own translation. |
| Prayer book and examination of conscience | **Working** | Traditional prayers searchable by need. The examination of conscience keeps nothing: ticks live only on screen. |
| Prepare for Sunday | **Working** | The coming Sunday’s readings (from the lectionary references data we hold, 2026 and 2027) with matching homilies, Catechism paragraphs, commentary and Fathers on the Gospel. Homily matches are by the Sunday calendar and say so. |
| Novenas and short prayer plans | **Working** | Novena to the Holy Spirit, novena to St Joseph, the seven penitential psalms and an Advent week: a passage in your translation and a traditional prayer each day, with progress kept on the device. |
| Build a prayer time | **Working** | Order prayers from the prayer book, Scripture passages and timed silence into a playlist, saved on the device, and pray through it step by step. |
| Following the Mass | **Partial** | The parts of the Mass in order with a short note on each, and links to the US bishops and the Catechism. The English words of the Mass (ICEL Missal) are copyrighted, so they are not included. **Next:** Licensed ICEL texts, or links only. **Blocked by:** rights. **Done when:** the page names every part of the Order of Mass. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Salvation history in twelve lessons, with quizzes | **Working** | Twelve lessons from creation to Revelation, each with the passage in your translation and a three-question quiz. Scores stay on the device. Written for this app. |
| Passage dossier with print | **Working** | Type any passage to open its full study page (text, Catechism, commentary, Fathers, homilies, videos, questions) and print it. |

## Pray

| Feature | Status | Notes |
|---|---|---|
| Daily Examen and the Church’s year | **Working** | Five guided steps for the end of the day (saved only if you choose), and a page of the liturgical year: seasons, colors and the great days, each linked to its readings. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Follow a story through the Bible | **Partial** | Six threads (the promise to Abraham, Exodus, David, exile, Peter, Mary) of about eight passages each, every step labelled as story, recalled by a later writer, or a reading from tradition. **Next:** More threads and a diagram of the characters in each. **Blocked by:** data. **Done when:** every thread has at least six passages that parse. |
| Your own thinking over time | **Working** | The reader shows a note you wrote on this chapter months ago; Lectio shows your earlier reflections on the same passage; notes and questions can carry a come-back date; Library → Notes has a timeline by tag. |
| Put the verse in order, group presentation, study vault | **Working** | A memorizing mode that cuts the verse into pieces to put back in order; a full-screen presentation of the group sheet (private notes never shown); and a vault export of notes and journal as Markdown files with an index, for Obsidian. |

## App

| Feature | Status | Notes |
|---|---|---|
| Eastern Catholic Churches and other traditions | **Partial** | A “Your Church” setting changes the name of the liturgy, the Psalm numbering, the prayer book order and the labels on Roman-only content; Byzantine Churches also get their year’s great days (Julian or Rome’s Pascha, old or new calendar) and an outline of the Divine Liturgy. The lectionaries, hours and calendars of the Syriac, Armenian, Alexandrian and Chaldean Churches are not in the app, which says so and points to each Church’s own site. **Next:** The calendars and daily readings of each Eastern Church, and the Peshitta and other Bibles. **Blocked by:** data. **Done when:** dates for sample years match the Church’s published calendar. |

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
| Interface in Spanish, French, Portuguese, Italian and Latin | **Partial** | Menus (about 50 strings), the home screen, the readings page headings and the reader’s main buttons are translated (Spanish and Latin translations written for this app, not professionally reviewed). The study material stays in its own languages. There is no Spanish Bible yet: no machine-readable public-domain Catholic-canon Spanish text could be verified. **Next:** Translate the remaining pages. **Blocked by:** code. **Done when:** tests/i18n.test.ts reports no missing keys for any language. |

## Reading

| Feature | Status | Notes |
|---|---|---|
| Scene sounds, chant by season and old hymn recordings | **Partial** | With “let the passage choose the sound” on, the sea, desert, night, fire, thunder, pasture and crowd recordings follow certain chapters. Chant: 7 tracks (Easter propers, a Salve Regina, one Kyrie). Hymns: 8 early recordings from the Library of Congress and others, with surface noise. No verified recordings for Advent or Lent chant yet. |

## Scripture

| Feature | Status | Notes |
|---|---|---|
| Church-approved translations | **Partial** | Douay-Rheims and the Clementine Vulgate are bundled and approved (public domain). The Bibles most Catholics read today (NABRE, RSV-CE, NRSV-CE) are under copyright, so their text cannot be included: the translation picker opens the current chapter in each at the USCCB or Bible Gateway. CPDV and WEB-C are public-domain but not Church-approved, and are labelled so. **Next:** Licensed texts of approved translations. **Blocked by:** rights. **Done when:** the edition registry shows approval and license for each. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Scripture universe with the library around the canon | **Working** | The 73 books plus 107 library works in eight rings (Early, Greek and Latin Fathers, medieval saints, spiritual masters, councils and documents, catechisms, history), each work placed beside the books it cites most; cards link Fathers to books and back. |

## Reading

| Feature | Status | Notes |
|---|---|---|
| Pictures in the text: Doré engravings and museum paintings | **Partial** | 224 Doré engravings (Gallica scans: credit required, non-commercial reuse) and about 190 Met and Cleveland open-access paintings appear after the scene they depict, up to three a chapter. Doré passage references were assigned from captions; museum references from titles only, so a few may be a verse or two off. Switch off in Reading settings. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Latin Glossa notes translated to English inline | **Partial** | About 8,000 of 13,800 notes are translated (AI-assisted, literal where the Latin is garbled). The rest show the Latin with a Translate link; docs/glossa-translation holds a hand-off kit to finish them. **Next:** Translate the remaining notes. **Blocked by:** data. **Done when:** the share of translated notes reaches 100% in the coverage report. |

## Today

| Feature | Status | Notes |
|---|---|---|
| Home extras: plan, season path, chant and hymns, saint of the day, verse card, memorize, favorite day | **Working** | Small links under the daily reflection. The saint link opens that author’s works only when the library has them; otherwise it opens the Reading room. Favorite days are stored on this device. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Gallery of paintings and engravings | **Working** | Every picture on one page, with filters, source credit, and a side-by-side compare for pictures of the same scene. Pictures also appear in the Media tab of the study panel. |

## App

| Feature | Status | Notes |
|---|---|---|
| Small conveniences | **Working** | Continue row, what is new card, swipe between chapters on phones, remembered study tab, phone Study button, offline pill, print stylesheet, settings search, reset reading look, shortcuts overlay (?), backup reminder after the first note, Report a problem link on study items, Bible in a Year chip in the reader, Library tabs across Reading room, Church documents and Study paths. |

## Reading

| Feature | Status | Notes |
|---|---|---|
| Words of Jesus in red (on by default) | **Working** | Exact in the World English Bible (from its own markup). In Douay-Rheims, CPDV and the Vulgate only whole verses that are mostly his words are red, because those texts have no markup; verses where he speaks in part are left plain there. Turn off in Reading settings. |
| Words particular to the Bible animate (Lamb, Cross, Covenant, Spirit, LORD, Amen, Heaven, Temple…) | **Working** | About 15 new gentle effects on top of the earlier ones; all stop with reduced motion and can be switched off. |
| Bible in a Year episode at the top of the chapter | **Working** | Plays in the mini player. Shown only for chapters the plan covers. |

## Pray

| Feature | Status | Notes |
|---|---|---|
| NABRE Lectionary text from the USCCB daily-readings feed | **Partial** | Shown as published, with the USCCB copyright line and a link back, for the days in the feed (about the last ten days up to today). The site build fetches the feed daily; dates outside it fall back to the passages in your chosen translation. Relies on the USCCB’s web-usage terms for free sites that do not condition access. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Catechism of the Catholic Church: full text, searchable, Scripture-indexed | **Working** | The English text from the Holy See’s edition, quoted with the permission the app’s owner has stated. 2,863 of 2,865 paragraphs are in (two are being checked). The verse index is built from the Catechism’s own footnotes, so every verse it cites shows its paragraphs in the study panel. Footnote shorthand for Church documents (GS, LG, DV…) is spelled out. |

## Reading

| Feature | Status | Notes |
|---|---|---|
| Plain wording in notes: abbreviations spelled out, Roman numerals as numbers | **Working** | The Bible’s notes on the text (TR, NU, MT, LXX, Gr., Heb.) are spelled out, and section titles, citations and commentary use ordinary numbers and full book names. Names such as Pius XII and Vatican II keep their numerals. A few unusual title forms may still show a numeral. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Favorite days, weekly summary, study-path links in the panel, skeleton loaders | **Working** | Starred days from Today are listed under More › Favorite days. The week card counts chapters read, works opened and notes written on this device. |
| Saints and Fathers quoting Scripture, in every verse’s notes | **Working** | Every library work is indexed against the verses it cites. Where the source tags its citations they are used; where it only writes them out ("Matt. xvi. 18", "Ps. xxii. 1") they are read from the text and the Roman numerals converted; and where a passage is quoted without a citation, a quotation of nine or more words (fewer for a short verse) is matched against the Douay-Rheims, CPDV and World English Bible. Psalm citations are read as English numbering, which was checked against the verse text for every work. A few works (for example the Constantinople councils and Ineffabilis Deus) simply have few or no biblical citations. Matching is by wording, so a free paraphrase is not found. |
| Bible dictionaries, Nave’s Topical Bible and people | **Working** | Easton’s (1897) and Smith’s (1884) dictionaries and Nave’s (1896) are public domain, 19th-century Protestant works, labelled as such. People named in a passage come from Theographic (CC BY-SA 4.0, family relations) and STEPBible (CC BY 4.0, short descriptions that STEPBible wrote with AI help). Excluded: STEPBible’s Hebrew lexicon (its definitions need Online Bible’s permission) and Theographic’s dates (a young-earth chronology). |

## Reading

| Feature | Status | Notes |
|---|---|---|
| The Septuagint in English (Brenton, 1851) | **Partial** | Thirty books whose chapter numbering matches the Vulgate; off by default. A few chapters number verses one or two differently from the Douay-Rheims. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Cornelius à Lapide, Catholic Encyclopedia and Butler’s Lives of the Saints | **Partial** | À Lapide (1908 English) covers the four Gospels, 1–3 John, 1 and 2 Corinthians and Galatians; Matthew 1–23 is in long blocks. The Catholic Encyclopedia selection (about 500 articles on the books, people, places and topics of the Bible) shows beside the verses its articles cite. Butler’s lives cover the whole year, but nine months were scanned from old prints and are unproofread. Butler’s feast days are those of the 18th century. |

## Listening

| Feature | Status | Notes |
|---|---|---|
| Recorded readings (LibriVox) | **Working** | Volunteer recordings (public domain) of the Douay-Rheims and World English Bible, shown beside the chapter they include, and of about 55 works in the library (Augustine, Chrysostom, Teresa of Ávila, the Imitation of Christ, Aquinas’s Summa and more) under Listen on each work. Each file plays from its own start; the app does not claim to know where a verse falls inside a recording. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Children’s Bible | **Working** | 56 Bible stories retold at three reading levels (4–6, 7–9, 10–12), each with a passage to open, questions, a memory verse, read-aloud and pictures. Written for this app; the older levels add a little of what the Church teaches. |

## Media

| Feature | Status | Notes |
|---|---|---|
| Catholic video library and passage-matched teaching videos | **Working** | About 41,000 videos from 31 Catholic channels (Catholic Answers Live, Catholic Productions, the St. Paul Center, Bishop Barron, Ascension, Jimmy Akin, Trent Horn, the Augustine Institute, the Thomistic Institute, EWTN and more) are searchable at Study → Catholic video library. About 1,560 are tied to a passage and play in the study panel; each was checked to exist and allow embedding. About 490 of those are Fr. Mike Schmitz’s and Jeff Cavins’s Sunday homilies and reflections, attached to that Sunday’s readings: the card says so, and that we have not verified the homily discusses that particular passage. The rest are listed from the channels’ public pages and open on YouTube if embedding is off. Not every Catholic creator is covered: some channels have no public upload list. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Questions about the faith (apologetics) | **Working** | 112 common questions, each gathering what Catholic authors and teachers have written and said: Catholic Answers tracts, articles, Q&As and Bible Navigator pages, the Catholic Encyclopedia, and videos from the channels above, with the Bible passages and Catechism paragraphs involved. The app writes no answers of its own. Links are matched by keyword and checked by title, so a few may be only loosely related. |

## Data

| Feature | Status | Notes |
|---|---|---|
| Back up to Google Drive | **Needs credentials / agreement** | Keeps dated copies in a private app folder on the person’s own Drive, updated by itself after changes. Needs a Google OAuth client ID (see docs/DRIVE_BACKUP.md); until one is set the Settings card says so. Not tested against a live Google account in this build. **Next:** A Google OAuth client ID supplied by the owner. **Blocked by:** rights. **Done when:** a backup file appears in the user’s Drive app folder and restores. |

## Reading

| Feature | Status | Notes |
|---|---|---|
| Kindle-style tools: find in chapter, look up a word, reading progress, continuous scroll, focus mode | **Partial** | Find in chapter (“/”), select a word and tap Look up (a short definition from Wiktionary when online, and a search of the Bible and library), minutes left and progress, continuous scroll between chapters, and a focus mode you can tailor. Not done: highlighting part of a verse, Popular Highlights from other readers, Word Wise. |
| A line drawing for every chapter and book-opening pictures | **Working** | The drawing at the head of each chapter is composed from small motifs chosen by what the chapter says (a boat, sheep, loaves, a flame…) and arranged differently each time. Nearly every book also opens with a historiated initial from a Gothic Bible of about 1275–1300 (Cleveland Museum of Art, CC0). |

## App

| Feature | Status | Notes |
|---|---|---|
| Six tabs, short setup and red dots | **Working** | Read, Study, Today, Bible, Pray and Listen tabs; a five-step setup that tailors the app; red dots on things you have not opened and one-time tips; one feature list drives search, the Everything page and Start here rows. All of it can be turned off in Settings. |

## Teach

| Feature | Status | Notes |
|---|---|---|
| Lesson in a box | **Working** | Run this lesson: a timed running order for the class length with what to say and ask at each step, built from the lesson and the age band. |
| Slide PDF handout and PowerPoint export | **Working** | Every slide with its teacher notes as printable boxes (Save as PDF in the print dialog), and a .pptx download with the notes as speaker notes. The PowerPoint file is text only, without pictures or builds. A Presenter button opens notes and the next slide in a second window on the same device. |

## Study

| Feature | Status | Notes |
|---|---|---|
| Visual Catechism | **Working** | Ten tappable diagrams (Trinity, sacraments, Creed pillars, commandments, virtues, Mass, Church year, salvation history, works of mercy, canon) tied to Catechism paragraphs. Content awaits review by a priest or theologian. |

## Pray

| Feature | Status | Notes |
|---|---|---|
| Pilgrim pack | **Working** | Offline guides to eight pilgrimage places, a getting-ready checklist and a prayer for the way. Opening hours are not included; each guide links to the shrine’s own site. |
| Prayer list and Church year calendar file | **Working** | A private list of intentions with a daily I prayed and answered prayers; a downloadable .ics of the next twelve months of feasts, holy days and Lenten fast days. |
