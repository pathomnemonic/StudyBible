# What changed

## Third cycle
- Downloads: Check saved copies reads each saved pack back and reports missing or damaged files.
- Notes: the last five earlier versions of a note are kept on the note and can be restored in the editor (optional field, no migration; capped).
- Games: Family ties, a quiz on who was the father or mother of people in the genealogies of Scripture.
- Games: Match the term, pairing Catholic words with the glossary's own meanings.
- Lessons: print a student worksheet (or one with the answer key) built only from the lesson's own parts.
- Profiles of saints, people and places: data format with validation (every fact sourced, uncertainty stated), search and profile pages with an honest empty state. The data file is empty until reviewed sources are supplied.
- Collections: your own tags (shown, searched and copied). The field is optional and not indexed, so no database migration is needed and older collections are unchanged.
- Library, Export and backup: a data health check that reports references leading nowhere (read-only).
- Collections: a link saved from a saint life or a family-line person opens inside the app (it used to open a new tab); checked end to end in the browser run.
- Collections: Make a reading plan, one day for each Scripture passage in the collection.
- Ask the sources: choose which kinds of source to show (Catechism and definition, Bible text, Fathers and saints) and save the question to the question inbox.
- Copy a verse as a Markdown block quote or as the reference only (two new formats beside the three that existed).
- Collections list: item count, done count and last-changed date on every collection, search across names, descriptions and items, and a Duplicate button.
- Notes: typing [[ in a note suggests your notes by title and completes the link (the unfinished part of note-to-note links).

## Second cycle: collections, authors side by side, glossary, offline manager
- CI fix: docs/FEATURE_STATUS.md had gone stale against src/featureStatus.ts, so "Generated documents are up to date" failed. It is regenerated, and a unit test (tests/docs-status.test.ts) now fails locally whenever the two disagree.
- CI now runs every browser check the release depends on (npm run e2e:release): smoke, routes, not-found, the study and data workflows, collections, parallel reader, cross-links, passport, videos, offline (a real dead server), stale scripts, and accessibility at every level. It found a real contrast bug in the teaching-setup chips in dark themes, now fixed.
- Collections open to a page of their own: each item is read back from its original (notes, highlights and bookmarks by identity, never copied), with links to the originals, reordering, adding from your notes, highlights, bookmarks, Catechism, links and new questions, and export to Markdown or print/PDF. A new "＋ Collection" button on the reader's selection bar, Catechism paragraphs, Church writings and every study-panel item adds to a collection.
- Notes: Prayer and Theological questions templates; each note shows the collections that hold it and other notes on the same passage.
- The study panel's Notes tab gains "Compare the authors side by side": pick any authors, see work, location, period, direct or editorial link, and a link to the original.
- Glossary entries say their explanation is plain words written for this app, link the Church's own words (Catechism), and list the Scripture that paragraph's footnotes cite.
- Downloads shows a summary, the date each Bible or pack was saved, and flags a partly saved pack with the number of missing files and a Finish download button.
- CI browser job pinned to ubuntu-24.04 (ubuntu-latest moved to 26.04, which Playwright cannot install on, so the browser checks had never run in CI) and split into three parallel shards; slow data tests have a 60 s timeout.
- Collections: tick items off as done.
- Saints: each life links the saint's own writings in the library and can be added to a collection; people in the family lines show their children and can be added to a collection.
- Notes gets a Review tab: a question inbox (open and answered, look it up, mark answered) and a weekly review of notes, highlights and questions. Collections can start from templates (Scripture passages only). Readings has Previous/Next Sunday. Downloads opens with a "Ready for a flight?" card. "Report a problem" on a study-panel item now fills in the item id, source and page.
- Notes link to each other with [[Title]], and show "Linked from" backlinks. Collections can be saved as a self-contained web page and are included in the study-vault zip. The prayer list can attach a verse to an intention.
- Writing clean-up: Butler's scanned months lost scanner debris, footnote citations and Latin verse and had common misreadings corrected (scripts/clean_butler_ocr.py, scripts/ocr_repair.py); the Roman Catechism and Leo XIII encyclicals had scanner misreadings repaired; HTML entities such as &amp;, &atilde; and &mdash; that showed as raw text were decoded across the data (scripts/decode_entities.py), and the podcast audio addresses were fixed. Tests keep all three from coming back.
- The Back pill shows up to four earlier passages; the Family Gospel sheet has swipeable-style table cards.
- Book fingerprint page: a book's most used and most distinctive words, linked to the Concordance.
- Ask the sources: one question, with the Catechism, the Bible text, the app's definition and (on request) the Fathers shown in separate labelled cards. Retrieval only; nothing is generated.
- Map of connections: one normalised graph of topics, chains, lives, passages, Catechism paragraphs, works and authors (npm run graph), with a viewer that follows links and finds how two things connect.
- Catechesis: pace a grade over the school year (with breaks), print the calendar or put it in a class planner, a letter to families for each unit, and my notes on each lesson.
- Think it through: a scripted, offline guided walk through any Argument Map question (think first, then each source, then objections), with no generated text.
- Every Father, saint, council or scholar passage in Ask the Fathers and Ask the sources carries a label for what kind of voice it is, taken from the work's own record.
- The Map of connections can include your own notes (opt-in): a note joins the Bible chapters it is written on and the argument it was written for.
- Original language, word by word: any chapter of the Greek New Testament or Hebrew Bible with grammar and dictionary entries on tap (built on texts already in the app).
- Where the ancient texts differ: the app's short curated list of Hebrew, Greek and Latin differences, each verse in three translations.
- Docs: docs/FEATURE_OPPORTUNITIES.md (38 opportunities), docs/ROADMAP_AMBITIOUS.md (ten ambitious features and an evidence-grounded assistant architecture), docs/CYCLE2_REPORT.md.

## Closing the gaps from the audit
- The reader's Books and translation drawer now says what of the translation is really saved on the device ("14 of 73 books are saved, the ones you have opened" or "all 73"), read from the cache, with a link to Downloads.
- New tests with a server that is really switched off (Playwright's offline switch does not reach the service worker): a downloaded pack loads with no connection, a file never saved does not, an opened chapter reads and an unopened one says it needs a connection.
- Cross-reference workflow test through the interface (follow a reference, change translation, write a note, go back, find the note in the other translation). It found a real bug: changing translation dropped the "Back to John 3:16" way back. Fixed.
- Writing test through the interface: write, edit, delete, close and reopen, export, restore, and a damaged file refused with a plain message (it used to show "Unexpected end of JSON input"). Google Drive backup is tested to report failure and never record a success it did not have.
- Screen reader test (the accessibility tree): verses are buttons named "16 For God so loved...", the chapter is a labelled article under a level 1 heading, a selected verse says it is pressed. Search results, the audio player and 200% text are checked with axe.
- Dialogs and the Toolbox drawer now move focus in when they open, keep Tab inside, and return focus to where you were when they close (the new screen reader test found they did none of this).
- A chapter links to the Catechism lessons that use it ("Lesson: ..." beside Study this chapter): 233 chapters. Two videos added for social teaching.
- Sources explains that about 77% of verses have connections tied to the verse itself and the rest are marked "whole chapter".

## Lengths on every YouTube video
- The daily build now looks up the length of every YouTube video the app lists, not just the 41,980 in the video library: also the hand-picked passage videos (485 were missing) and the apologetics track videos.
- Lengths now show on Media > For you, in a lesson's Watch and look and Watch and listen, and on the Videos in the Bible study panel, next to the creator's name ("Bishop Robert Barron · 25 min"). Before, only the Video library showed them.

## Offline, accessibility and reader review
- Offline claims in Help, Settings, Account and Pilgrim now say exactly what works offline: the app and your notes always; Scripture and study data for what you opened or downloaded. New tests: first launch online then offline (an opened chapter reads, an unopened one says it needs a connection) and recovery from a missing script after an update.
- npm run e2e:a11y2: axe at every impact level on 13 screens at 320, 768 and 1280 px, seven widths for sideways scroll, landscape phone and tablet, 200% and 400% zoom, reduced motion, and keyboard behaviour in the reader (visible focus, Enter selects a verse, s opens the panel, Escape closes it). It found one low-contrast link, now fixed. Tiny inline targets (footnote markers inside a sentence) are listed rather than failed, since WCAG 2.2 exempts inline targets.
- The side-by-side Bibles view moved out of ReadPage into its own file (919 lines left); docs/READPAGE_REVIEW.md maps the rest and orders further steps, each with its test first.

## Data safety, sync and scripture-integrity tests
- Library > Export shows "Where your writing is kept": items in this browser, safety copies (clearly not a backup against clearing the browser), the last backup file, Google Drive and account status, and how many changes are not in any outside copy. A backup or safety copy that fails now says so instead of staying silent.
- Sync: a note edited here is kept (and sent back) if another device deleted it in the meantime; a note deleted here returns if another device edited it afterwards; an expired sign-in or a server error leaves changes queued and is never reported as a finished sync. All tested against the real server.
- Imports: a file over 100 million characters is refused before it is opened; a restore that hits a full disk part-way changes nothing; a version 1 backup restores; closing and reopening keeps notes. Tested.
- Versification: tests across all 73 books (every chapter maps into the same book and back), the Psalms (English n is Vulgate n-1, titles shift verses), and the five books whose numbering does not line up (Tobit, Judith, Esther, Sirach, Daniel) are never presented as exact. An end-to-end test writes a note on English Psalm 51:2 and finds it on Douay Psalm 50:4, after a reload, and backs out of a followed passage link.
- Chapter-wide resources are marked "whole chapter" and never appear as the connections of a single verse.
- The GitHub Pages build is local-only: it no longer probes for a sync server. docs/PRIVACY_AND_DATA.md states exactly what is stored where and what is and is not encrypted.

## Audit follow-up: tests that can fail, honest quotations
- The route tests now fail if a route redirects elsewhere, shows the not-found page, or has no heading of its own (before, a wildcard redirect could satisfy a generic "main exists" check). All 74 smoke routes and 81 mobile routes still pass.
- A truncated or non-backup file is refused with a plain message before anything is imported (tested).

## Every lesson gets a video, and videos remember your place
- Lessons for grades 6 to 12 and young adults now add the hand-checked videos matched to the lesson's own Scripture passage to their Watch and listen step: 234 of 285 have one, up from 79. The Debate it protocol still appears only where there is a real debate question or argument chain.
- A YouTube video played in the app remembers where you stopped (saved every few seconds and when you pause or close it, on this device only) and reopens a few seconds before that point.
- Media > Videos > Feed opens with Continue watching: unfinished videos with a progress bar and "Resume at 10:00". Videos within the last 20 seconds count as finished.

## Audit fixes
- An unknown address now shows a "That page is not here" page with ways home, instead of silently landing on Today.
- The video list says when it was last refreshed. Shorts are labelled from the Shorts flag only, not from length.
- Feed titles decode every HTML entity (for example dashes).
- The daily build adds each library video's length and upload date when the key is set (resumable), and relinks the lessons even if filling lengths fails.

## More cross-links
- Glossary entries say which lessons teach the word ("Taught in: ...", 163 words linked), and a lesson's "Worth knowing" words link to their glossary entry.
- Saint Guess ends with the saint's life and feast day; Who Said It links to the saint finder after each answer.
- Each saint's life in Butler links to its feast day card and to saints for your situation.
- Argument, claim and heresy pages list the lessons that teach them (earlier), and every empty Passport space is a link.

## Shorts kept apart, smaller Help button
- YouTube Shorts are marked in the video library (a fourth item on each video) and kept out of the Feed and For you. Elsewhere they carry a red SHORT tag and a red edge so they are easy to tell from full videos. The refresh marks new uploads itself; scripts/videos/mark-shorts.ts backfilled the newest 40 per creator (367 Shorts found).
- The Help button on You is a slim one-line row.

## Videos are current again
- The daily video refresh skipped nine busy channels (Ascension Presents, Catholic Answers Live, EWTN, FOCUS, Jimmy Akin, Pints with Aquinas and others) because its wrong-channel guard needed an overlap with older listed videos. The registry ids are confirmed, so the refresh now trusts them. A run today added 211 new videos across 25 creators, so the Feed shows this week's uploads.

## Passport links, one featured video, more media
- Pilgrim's Passport: every space still to fill is now a link. Tap it to go to that saint, council, feast, argument or game; opening the page earns the stamp.
- Watch and listen in a lesson opens with one featured video ("Start here", the shortest playable one), the rest folded away as "More to watch and hear"; lengths show as minutes (hours when long).
- scripts/launch/fill-minutes.ts reads every YouTube length from the official YouTube Data API and flags videos that have gone private; the daily build runs it when the YOUTUBE_API_KEY secret is set.
- Seven tracks that had no video gain one to three: Barron on Mary, Trent Horn on the papacy, Catholic Answers on Galileo and the Inquisition, The Catholic Talk Show on the Crusades, and the Archdiocese of Edmonton on euthanasia. Each was checked to exist and to come from the named channel.

## Big questions and richer lessons
- Lesson of the day on Learn now draws from a featured list of lessons on what people really ask and debate (does God exist, why suffering, science and faith, can I trust the Bible, the Eucharist, infallibility...), chosen from the same topics as the apologetics hub and shown as the question. The list lives in data/curated/featured-lessons.json.
- Lessons for teens and adults gain a Watch and listen step (hand-picked videos, talks, debates and podcasts from the apologetics tracks, playable in the page) and a Debate it protocol in Discuss (state their view, find agreement, answer with a reason and a source, say what would change your mind, swap sides) linked to the matching argument chains.
- A warm-up retrieval quiz now opens each lesson from the elementary grades up, replacing the end-of-lesson review.
- docs/LESSON_STANDARD.md records the teaching standard (Directory for Catechesis, Rosenshine) and what earns a lesson a feature slot.
- scripts/launch/make-lesson-links.ts regenerates the links from the tracks.
- Cross-links: argument, claim and heresy pages now list the lessons that teach them ("Taught in these lessons"), the way back from the lesson Debate it step.

## Video refresh covers every creator
- All 28 creators in the video library now have their YouTube channel id in data/curated/video-channels.json, each confirmed from the channel page of videos we already list for it. The daily refresh reads every one of them.

## Feeds, a tidier Learn tab and the toolbox
- Videos opens on a Feed: the newest videos from the creators you follow (a prompt to choose creators if none), then a Creators page of small boxes with Follow, All videos (search and filters) and your saved and watched lists. New uploads added by the daily refresh go to the front of their creator's list.
- Podcasts you follow now show as a feed (newest episodes of each, newest first; a year-long programme shows its next unheard day) on the Podcasts tab and in For you, replacing the one-line "new episode" list.
- Learn: Answer hard questions comes before Bible study, and Bible study is a grid of small boxes with the rest folded away.
- The toolbox is the old menu's sheet again: a left drawer of small boxes, with this chapter first.
- "About the whole chapter" in the study panel opens by itself.

## One plan at a time, and fresher media
- Only one reading plan is followed at a time. Starting a plan, or Bible in a Year, from anywhere pauses the other (it asks first) and the other can be picked up again. Readers who already had two active plans are tidied once: Bible in a Year wins when it is in progress. The Plans page says which one you are following.
- Following Bible in a Year, the toolbox no longer shows a place in another reading plan. Bible in a Year's done days now count episodes heard to the end, not only ticked days. "Start tracking from day 1" now starts at day 1; following the calendar is its own choice.
- The daily scheduled deploy also refreshes the LibriVox recordings and adds new uploads to the video library from the creators' channels (needs the channel ids in data/curated/video-channels.json; ten are listed so far, and an optional YOUTUBE_API_KEY secret makes it more reliable).
- The You tab has a Help button: where things are, how the top-bar buttons work, short answers, and the tour again.

## A simpler reading bar
- The top bar of the Bible page has five buttons: previous and next chapter on either side, books, search and the toolbox. The menu button is gone.
- Books also holds the settings of the reading: translation, Find in this chapter and Compare translations. The toolbox holds the rest (read aloud, focus mode, reading settings, the study panel beside the text, the Fathers on this chapter) above the outlines, concordance and other Bible tools.
- A line of chips under the bar offers the Fathers on this chapter, the book's outline, the Gospel comparison and a study page for the chapter. The study panel for a verse has a row of tools that work on that verse: across the centuries, who quoted it, the Fathers on it, compare translations.
- The tour explains the top bar, taps the verse number (which opens the study panel) and opens it on Notes, not on the last tab used.
- Learn has a Bible study section linking to the tools that were in the toolbox.

## Bible in a Year: finished, and automatic media updates
- The tour's Bible in a Year question has a new answer, "I finished it and want something else". It and "Not for me" now offer what to listen to next: The Catechism in a Year, The Rosary in a Year, or an audiobook (Augustine's Confessions and the Imitation of Christ first). Picks are followed, so Media puts them first.
- The daily scheduled deploy now also refreshes the Bible in a Year episode list from its public feed (the podcast lists were already refreshed) and the offline-pack sizes. Media shows when the lists were last refreshed. The app fetches data files network-first, so new episodes appear the next time it is opened online.
- Refreshed the committed Bible in a Year list today: 25 new episodes.

## A shorter first run
- The seven-step setup is gone. A first visit starts the point-and-tap tour by itself: it highlights the real screen and waits for you to tap it. End tour is on every step.
- Steps: Today, tap a verse, the Church Fathers and saints beside it, the Year tab (with the Bible in a Year question), Books for LibriVox recordings of the saints' books, and Questions about the faith with the Learn-to-answer tracks. Answering "not for me" adds a step showing where to pick other media.
- Bible in a Year asks whether you have listened before: carry on from a day (or find it by title), start at day 1, or leave it out.
- Other questions moved to where they matter: who the lessons are for (first time Learn opens), a daily reminder (second day), backup (once there are notes to lose, as before).
- Features that are not obvious from their name show a short note the first time you tap their red dot, then open.
- Readers who finished the old setup or tour are not shown the tour again. "Replay the intro" is in Settings and You.

## Everyday settings
- New Settings sections, all folded away and all starting at today's behaviour: Start and home (which tab opens first), Look and ease of use (bigger buttons, underlined links, animation, tap buzz), Calendar (week starts on Monday or Sunday), Lessons and games (step by step or whole page, lesson pictures, longer game timers, streaks), History and privacy (stop remembering what you read), and Start over (reset settings; notes and progress are kept).
- The first-run setup can be skipped from any step with one tap and keeps the defaults.

## Lesson appeal pass
- Every lesson now has up to four public-domain pictures (the passage's own Doré/Gothic/museum art first, then its subject), spread across the steps with credits.
- Step-by-step lessons end with a recap, "Mark done" and "Next lesson"; quizzes explain each answer, list what you missed and offer Try again; progress is kept so Learn can say "continue where you left off".
- Deck: Full / Short (15 min) / Fit to my class, picture layouts, and a better print handout with answer key.
- Teacher: quiz answer key, take-home note to print, hidden empty teaching cards. Go deeper names the apologetics track and level, plus related places in the app.
- Lists show minutes and teaching depth; lessons are searchable; offline packs know the new data; What's new page.
- Catechism text: 482 sentence starts regained their capital.

Changes to the **app** and changes to the **content** (data) are listed separately, so you can tell what a rebuilt dataset altered.

## Unreleased

### App
* **The slow Bible** (`/slow-bible`): the whole Catholic Bible, Genesis to Revelation, over about seven years (2,447 daily readings of 4 to 31 verses, median 13, cut at natural breaks and never across books). Each day shows the passage, a Father of the Church on it, and where it is read at Mass (from the daily readings the app has for 2026 to 2028). Progress stays on the device. `tests/slowBible.test.ts` checks that every verse is covered exactly once, in order.
* **Crown Quest** (`/play/trivia`): a trivia game with a spinning wheel of six categories (Scripture, Saints, Church history, Doctrine, Mass and sacraments, Prayer and devotion). Three right answers in a category win its crown; first to six crowns wins. Play against Brother Bot, pass the phone with up to four players, or play alone with three lives. 600 questions, each with a source quotation that is machine-checked against the text in the app.
* **A livelier games home** (`/play`): a "play this next" banner, a Surprise me button, and big colorful tiles grouped by mood (quick hits, brain teasers, explore, play together) with time and player counts.
* **Widgets** (`/widgets`, `/widget/<kind>`): today's verse, verses to review, game streak and reading plan as widgets; a Windows 11 widget (manifest and service worker); Android and iOS home-screen widget source in `store/widgets/` for the store builds. See `docs/WIDGETS.md` for what is tested and what the owner must build.
* **Is that true?** (`/study/claims`): 30 common claims about the Church ("Catholics worship Mary", "the Church banned the Bible" and others), each with a fair verdict, where the misunderstanding comes from, and verified sources.
* **A hard day** (`/pray/hard-day`): choose what kind of day it is and how much you have in you; get a Psalm or Gospel verse, one line to say and a saint who has been there.
* **Sourced chains** (`/study/arguments`, `/study/development`, `/study/heresies`, `/study/words`): a teaching laid out as real sources in order. 24 arguments (Real Presence, the Trinity, papal primacy, purgatory and others, each with its strongest objections), 12 developments through time (the Trinity, Christ’s natures, the canon and others), 12 heresies shown in their own words and where they break, and 12 key words (*logos*, *ekklesia*, *homoousios* and others). Every quotation is checked against the text of the Father, council, Catechism paragraph or Bible verse it cites (`npx tsx scripts/chains/check.ts`, enforced by `tests/chains.test.ts`).
* **A verse across the centuries** (`/study/conversation`): one passage read by commentators in time order, from the Fathers to the medieval schools to later writers.
* **Doctrine at different distances** (`/study/zoom`): any glossary teaching as one sentence, a paragraph, a page, the sources behind it, then where to read on.
* **Saints for what you’re facing** (`/study/mentors`): 28 situations (grief, addiction, doubt, a new baby, a hard boss and more) with 102 saints and their own words from Butler’s Lives or their writings, each quotation verified. Includes plain safety notes where a situation may need a doctor or other people.
* **Lives in time** (`/study/lives`): 16 saints year by year, with setbacks left in and the world around them.
* **Walks through the Bible** (`/study/walks`): 8 threads (the mountain, water and Baptism, bread, the shepherd and others) followed across the map, stop by stop, each with a verified Bible quotation.
* **The Church across the centuries** (`/study/church-timelapse`): a map from Pentecost to 1600 with 180 events (councils, martyrs, missions, foundations) appearing in date order, with play and a year slider.
* **Podcast chapters**: read from a feed’s Podcasting 2.0 chapters file or from timestamps in the show notes; tap a chapter in the full player to jump.
* **Glossary**: 59 more terms, each tied to a verified Catechism paragraph.
* **RSV-2CE (The Ignatius Bible)** added to the translation picker: the Revised Standard Version, Second Catholic Edition, 71 of 73 books, offline. It is a licensed text included with the owner's stated permission, read from a scan, so the edition's description says plainly that verse breaks were rebuilt automatically and a few can be off by a clause; Esther and Zechariah are left out. See docs/RSV2CE.md.
* **More devotions** in Prayer → Devotions: a Holy Hour guide with timed silences and Scripture, the Litany of Loreto (with the 2020 additions), the Litany of St Joseph, the Chaplet of St Michael, and a step-by-step guide to going to Confession. **Catholic life** page (Prayer → Catholic life): today's obligations (Sunday and holy-day Mass with the U.S. Saturday and Monday exceptions, fast and abstinence on Ash Wednesday, Good Friday and Lenten Fridays, Friday penance), the next holy days, a private last-Confession note, a plain guide to indulgences, and links to find a Mass.
* **Lesson slides redesigned as a real deck**: title slide with art, section dividers (Explore, Understand, Practice, Live it), one idea per slide, big key-point numerals with Catechism chips, cards that build one by one, quote layouts for Scripture and the Catechism, lettered answer tiles, a slide overview (G), and controls that hide while presenting.
* **Young adults course** (36 sessions): teaching points and activities rewritten in full, with Catechism, Scripture and Church-history sources.
* **Interactive prayer** (Prayer → Devotions): the Rosary and the Chaplet of Divine Mercy are prayed bead by bead on a drawn rosary (the bead being prayed glows, tap a bead or a decade to jump), each mystery shown with a public-domain painting or engraving and its Scripture in your translation, progress saved so you can resume. Four ways to pray: tap Next, a set pace (slow, steady, brisk), "Lead me" (your device reads each prayer and moves on), or "Pray with me", which plays the Creedal podcast's recordings of the four sets of mysteries and the Divine Mercy chaplet (streamed from the publisher) with the beads following along and a nudge when they drift. The Angelus gets a bell, the Stations of the Cross get a picture at the stations, the Seven Sorrows and Regina Caeli get the same ways of being led, and every prayer in the Prayer book can be read aloud to pray along.
* **Extraordinary Form Mass** (`/mass/ef`): the whole 1962 Order of Mass in English, step by step, with the Introit, readings, Gradual, Offertory, Secret, Preface, Communion and Postcommunion of the day.
* **Present as slides** on every catechism lesson: a real deck with a title slide, the question, the big idea, one slide per word, the story and Scripture in readable pieces, art, the Catechism, a video, discussion questions, the activity, a saint, a check with click-to-reveal answers, the weekly challenge and the closing prayer. Arrow keys, swipe, full screen, and teacher notes (N).
* The Reading room tab now returns to the work and the place you were reading (and your search), and LibriVox recordings play in the bottom player like the Bible in a Year, with the next parts queued.
* **Catechism program rewritten as a catechist would plan it**: every lesson now opens with a story or question ("Start here"), has four teaching points tied to Catechism paragraphs, Scripture and the saints, common misunderstandings, a text or prayer to learn by heart, and a way to check understanding; the teacher plan uses them. Nine new units (27 lessons) fill the gaps against the Catechism: the rest of the Creed, the seven petitions of the Our Father, the Ten Commandments in full, development of doctrine and dogma, rites, sacramentals, indulgences and funerals, the moral life (acts, law, grace) and the tradition of prayer. 396 lessons in all.
* Every catechism lesson (K–12 and young adults) now has teacher talking points, discussion questions, an authored quiz with explanations (answer positions shuffled), a weekly challenge, a saint who lived it and, for older grades, misunderstandings to listen for.
* **Young adults course**: 30 guided sessions in 10 units for small groups or solo (leader plan, discussion, Scripture, Catechism, a weekly challenge, a saint, authored quiz).
* **Mass mode** (one step at a time, with posture, responses and today's readings), an **All the liturgies** page that says what the app has for each rite, and a **Papal writings** catalog of about 1,250 documents linked to the Vatican's text.
* **Catechism, Kindergarten to Grade 12** (Study → Catechism program): 318 lessons in 13 grades, each with the big idea, words to know, Scripture and Catechism text, videos and art from the library, a question, an activity, a prayer and a check with spaced review; Student, Teacher (timed plan, background, support and stretch) and Family (five-day plan) views; present-on-screen, read-aloud and print; a teacher and parent handbook; progress saved and synced.
* Morning mode, attach a prayer to a passage, the feast of the day with Matins lessons on the Office page, the Byzantine Divine Liturgy of St John Chrysostom, a Young adults page, and The Chosen (Season 1) in the video catalog.
* One Reading room (the tab), not two; the Notes tab in the study panel now holds the Catechism and Church teaching as well, so there is no separate Teaching tab.
* The tour now has you choose your Church, theme, translation and text size, then walks one verse (John 6:51) through Notes, Connections, Words and Media.
* **Your Church** setting for the Eastern Catholic Churches and Ordinariates: names, Psalm numbering, Byzantine calendar (computed Julian Pascha, tested against published dates), Divine Liturgy outline, Eastern prayers, honest labels on Roman-only pages, and an About section on what is and is not covered.
* Daily Examen, the Church’s year, Follow a story, group presentation mode, a study vault export, a “put in order” memorizing mode, come-back dates and a notes timeline, your past reflections returning in the reader and in Lectio, dictation in the note editor, share a prayer time by link.
* Divine Office (Lauds, Terce, Sext, None, Vespers, Compline), devotions (Rosary, Divine Mercy, Angelus, Stations, Seven Sorrows), prayer book, examination of conscience, novenas, prayer playlists, Prepare for Sunday, Following the Mass.
* Reading room tab with the Bible beside any other text; Bible course with quizzes; passage dossier with print.
* Sync: devices list and sign-out, activity and diagnostics, Recently deleted (30 days), conflict copies, sync protocol version, clock-skew cap.
* Fix: “The whole Catholic Bible in a year” had only 300 days and “The New Testament in 90 days” only 73, because of how chapters were split; both now have the advertised number of days (days you had ticked off in an old copy of these plans will point to different passages).
* Fixes: deletions now reach other devices; old (version 1) databases upgrade; replace-restore keeps timestamps and no longer deletes what it restores; malformed URLs return 400.
* Offline packs and whole Bible editions: checksums, byte progress, stop and resume, storage-full message.
* Settings: note templates, offline help, sturdier loading of saved settings.
* Server: closed registration by default (the first account can always be created), startup checks, verified backups, request timeouts.
* Tests: IndexedDB upgrades, backup round trips, sync engine against the real server, accessibility (axe) on main screens and every theme, offline reload, bundle budgets.

* Server: byte-range requests, cached compression, more file types.

### Content
* **Life essentials**: 48 short lessons that combine several parts of the Catechism around how to live (rest, attention, money, anger and forgiveness, truth, friendship, suffering, decisions, death, and age-fitted versions for every grade). Each grade page opens with a “Short on time? Start with these” card.
* **Quiz depth**: every one of the 456 lessons now has 4–6 quiz questions (balanced so the longest answer is not the tell), and the live-class question bank covers every lesson.
* **Teacher notes for K–2**: five fuller points per lesson (the one thing to get across, the doctrine, wording for the child, a pitfall, how to tell it landed).
* **Daily Mass readings for 2028** through 16 May (the USCCB had not yet published later dates).
* Divine Office psalter data from Divinum Officium (MIT license), Douay-Rheims psalm text, with seasonal chapters, responsories, hymns, versicles and collects for Advent, Lent, Passiontide and Eastertide.
* Video library and catalog of about 1,560 Catholic videos; LibriVox recordings for the Bible and about 55 library works; apologetics resource directory.
* Offline pack manifest now lists each file's size and checksum.

## Reading room reader and Today
- Reading-room works now read like the Bible page: reader bar, shared typography, progress and minutes left, find, word look-up, read aloud, background sound, focus mode, swipe and arrow-key turning, highlights and notes by selecting text, bookmarks.
- Today: feature tiles (Apologetics, Video library, Mass mode, Scripture universe) replace the top buttons; softer verse, saint and background styling.
- Reading room now holds the Catechism, papal writings, councils, doctrine, saints and encyclopedia under Church teaching and tradition.
- US English spelling throughout, with a Settings choice for British spelling (Scripture and library texts are never changed).
- Reading room: calmer Discover page (continue reading, a few starting points, browse by group), and "My shelves" with Want to read, Reading, Finished and Did not finish, star ratings, private notes, dates and a yearly count.
- Listen: new Listen now (resume, queue, new episodes of followed shows), a library of 59 Catholic podcasts and programs by subject (adds The Counsel of Trent, the Jimmy Akin shows, Shameless Popery, Thomistic Institute, Dominican friars and more), audiobooks with progress, and the last episode and speed restored after a reload.
- Listen opens on the Bible in a Year; tab rows wrap instead of scrolling sideways.
- Live classes: a teacher opens a session from any lesson ("Host live with a class code"), students choose "Join a class" and type the 6-digit code. They go through the lesson slides together, then play a Kahoot-style quiz: colored answer shapes, timers, speed-based points with streak bonuses and double-point questions, multiple choice, true/false, select-all, type-in and put-in-order questions, live answer counts, leaderboards, optional teams, a podium, lock and kick controls, and a CSV of scores. Sessions run in the Study Bible server's memory (`server/live.ts`), no account needed, and expire after a couple of hours. Needs the server (it does not work from a static copy).
- A bank of about 3,000 harder questions for every lesson (`data/curated/curriculum/questions.py`), built from the lesson's idea, common misunderstandings, vocabulary, a Catechism sentence with a word removed, the saint and the Scripture, with wrong answers drawn from neighboring lessons. Lessons also gain "Play it!" (Myth or truth, a scored challenge with stars, flip cards), a banner for each pillar, and stars on the grade page.
- Video library sorted by recently uploaded; watched list and Watch later; history can be cleared for single items, by category, or all at once, plus listening progress, reading places, searches and the queue.
- Teacher tools (`/teach`): classes with student lists, attendance, participation, a weighted gradebook with letter grades, item analysis of which questions the class missed, report cards, and CSV downloads. A live session started for a class has students pick their name from the class list, so attendance is taken automatically (late if they join more than three minutes in; absent if they never come), participation is counted from the questions each student answers, and the quiz score lands in the gradebook when the session ends. Names that do not match can be matched afterwards, and hand-entered scores and marks are never overwritten. New session kinds: lesson only, quiz game, and exam (each student works alone against one clock, answers saved as they go, optional score and answer review). Class records live in two new synced tables, `classes` and `classwork`.
- Bible tools moved to the Bible tab: a "Bible tools" button in the reader bar (and in its ⋯ menu) opens a sheet with what is about the book you are reading (its introduction and outline, the Gospel comparison or Paul's argument where they apply, a study page for the chapter), then Understand the text (books, Gospel comparison, Paul's letters, indexes, textual history, manuscripts) and Words and topics (key words, concordance, topical index), with a word look-up. These pages keep the Bible tab lit and show a "Back to reading" bar. Study no longer lists them, and says where they went.
- More games, and the live quiz has a look of its own (parchment cards, lettered medallions, a gold timer ring, arched podium). In a live class a teacher can now choose: Pilgrim Quiz (everyone together), Last Saint Standing (a wrong answer puts you out), Pilgrim's Road (each student races along a road to the church at their own pace), Build the Cathedral (the whole class lays stones together), a lesson only, or an exam. In each lesson, the Play it! tab adds Match up (pairs of words and meanings) and Mystery word (guess the word before the six candles go out).
- Live classes no longer need the Study Bible server. The teacher's own device runs the session and students reach it through a public message relay (MQTT over secure web sockets; the list is in `src/live/mqtt.ts` and can be replaced with `localStorage['sb:live:brokers']`). Every message is sealed with AES-GCM using a key made from the class code, and topics do not reveal the code, so the relay sees only encrypted bytes. The teacher keeps the page open (a reload picks the session up again from a saved snapshot). If the relay cannot be reached and a Study Bible server exists, the server carries the session instead. `scripts/dev/mini-broker.mjs` is a tiny local relay for tests and for a classroom without internet.
- Study opens with four colored doors (Apologetics hub, Video library, Mass mode, Scripture universe); the other sections fold away until opened. Today has big Mass readings and Random verse buttons and a star in the corner for favoriting the day. The Bible's top bar has a button for books and chapters. The universe card has a large close button on phones.
- Teacher toolkit (random student picker, group maker, timer, printable tests with an answer key from the question bank, a lesson planner, rubrics, student notes, family messages, due dates). A "Hard questions" unit in grades 8 to 12 and young adults (21 lessons: faith and science, the Church's sins and history, suffering, the abuse crisis, women's ordination, celibacy, abortion, contraception, chastity, divorce and annulment, same-sex attraction, euthanasia, the death penalty and war, IVF, salvation outside the Church, infallibility, slavery and anti-Judaism, Mary, conscience, faith and politics, doubt), each with what the Church teaches, why people struggle, how to answer with charity, and the Catechism sources. Lesson slides now run as stories, polls, think-pair-share with a clock, myth or truth, debates, and an exit ticket; polls and debates are live in a class.
- Your own content: add a podcast by searching the directory or pasting a feed link (read through the Study Bible server's feed proxy or a public one if the feed blocks browsers), import and export your list as OPML, add your own EPUB, text, Markdown or HTML books to the Reading room, and your own audio files to the bottom player. A full player with 0.5× to 3× speed remembered for each show, skip-intro, sleep timer (minutes or end of episode), queue and show notes. Reading goals, a daily streak, collections, a notebook of every highlight in a book, and sharing a quote.

## Library expansion and glossed-page setting
- The library grew by 45 public-domain works: the Didache, Shepherd of Hermas, Diognetus, Polycarp, Barnabas, Papias, the apologists (Aristides, Athenagoras, Theophilus, Tatian, Minucius Felix), Apostolic Constitutions and early liturgies, Athanasius's select works and Life of Antony, Gregory Nazianzen's orations and letters, Basil's Hexaemeron and letters, Ambrose's letters, Eusebius's Life of Constantine, Sulpitius Severus (all from the Schaff series already on disk), plus from Project Gutenberg: Bede's history, Boethius, Newman's Apologia, Grammar of Assent, Idea of a University and Development of Doctrine, Chesterton's Orthodoxy, Everlasting Man and St Francis, Liguori's Glories of Mary, Catherine of Siena's letters and Gibbons's Faith of Our Fathers. Every entry records its translator and print date.
- Not added, on rights grounds: the Doyle Rule of St Benedict (1948), the Pensées edition with T. S. Eliot's 1958 introduction, and Bernard's On Loving God (translator unidentified).
- The glossed page is now off until switched on in the reading settings.
- New `writer` kind for argument-map steps that are not Fathers or canonized saints (Brother Lawrence, Julian of Norwich, Pliny).

## Play online with a code
- **Play online together** (`/play/online`): one person opens a quiz room (categories, number of questions, difficulty, time, teams, last-one-standing) and shares a six-digit code or a share-sheet invitation; everyone else joins from their own device at `Join` with the code. No account and no Study Bible server: the host's device runs the room and messages go through a free public relay, sealed with a key made from the code. The same engine runs live classes.
- Crown Quest now reads every trivia file, so the 480 new questions (1,080 in all) appear in the wheel. Before, only the first file of each category was loaded.
- The join page and the host lobby say "game or class" and "code" rather than only "class", and the lobby no longer says a server is needed.
- Tests: `e2e/online.mjs` (host plus three players, answering every question to the final results) and `e2e/live.mjs` both run against a local relay.
- Not verifiable from the build sandbox: the public relays (emqx, hivemq, mosquitto, eclipse) were unreachable here, so real-world reach should be tried on two phones before launch. Hosts can set their own relay in `localStorage['sb:live:brokers']`.

## Daily Office Companion
- Guided Morning and Evening Prayer with large-print Pray now steps, a note on why we pray each part, and the saint of the day.

## Readings together and Mass along
- Why these readings together: cross-references between a Sunday's readings, a Father's comment on the Gospel (Catena Aurea) and the Catechism's frame, for Sundays and major feasts 2026-2028.
- Read the Mass along: large-print, one-part-at-a-time Mass with today's readings and optional Catechism lines.

## Pilgrim’s Passport
- New page /passport: private, on-device stamps for saints, councils, feasts, arguments, lives, library works, games and each part of the app, with a map of councils and a list of stamps still to find.
- You: “Move my place” saves or pastes a small code with your reading position, memorized verses, Slow Bible progress, passport, game streaks, favorite days and setup choices, to move to a new phone without an account.

## Compare translations and study booklets
- Compare a passage in up to three bundled translations, verse by verse, with differing words marked.
- Print a study booklet (A5, Letter or A4) with cover, contents, cited quotations, a sources page and fixed-template questions.

## Questions children ask, writer label, plain words
- New page /kids/questions: 80 real questions with two-level answers, grown-up notes and verified sources.
- Writer step kind has a legend on argument pages and a test that every kind is styled.
- Plain words toggle on the argument-map pages.

## Ask the Fathers and Compare two Fathers
- Ask a plain question and read matching passages from the library (retrieval only, nothing generated), grouped by century, with filters.
- Compare two Fathers on one topic, side by side, with a plain count of shared key words and the date gap.

## Play together: co-op Verbum and weekly group leaderboard
- Solve today's Verbum together with a six-digit code; every guess shows for everyone.
- A weekly leaderboard by group code, opt-in, nickname only.

## The apostolic chain
- A tappable chart of teachers and pupils from the apostles to Augustine. Every link carries a quotation checked against the library text; links no text states are shown dashed and labelled.

## Teachers and families
- Quick quiz now: one tap from a lesson opens a live room with 8 mixed questions; optional bonus questions from the Crown Quest bank.
- Teacher dashboard at Teach: lessons taught, session averages, most-missed questions, who has not joined, and lessons to reteach.
- Family week plan: children, a weekly grid, print and share as text.

## Apologetics tracks
- New: Learn to answer. Pick a question (atheism, Protestant friends, Islam, natural law and more) and grow through four levels, with checked free resources, sourced chains and practice cards.

## Fathers on the feast, and hymns
- Each major feast card now has a short passage from the Fathers, checked against the library.
- New Hymns and chants page: Latin hymns with named public-domain English translations, filtered by season.

## Lessons as a journey, and a whimsical games room
- Lessons now open as a short step-by-step journey with one part on screen at a time and a progress bar: adults and high school (Begin, Scripture, Teaching, Witness, Discuss, Practice, Pray and check), middle school the same with games in the practice step, elementary (Listen, Learn, Play, Talk, Do, Pray, Check) and primary (Story, Wonder, Play, Do, Pray, Check). "Whole lesson" brings back the long page.
- Catechism paragraphs show their first two sentences with "Read all"; Scripture passages show the first eight verses with "Keep reading". Facilitator hooks ("Ask the group…") no longer appear for participants.
- Word definitions: older readers see at most three words worth knowing, folded away, and the slides use one combined slide instead of one per word; common words are no longer defined.
- The lesson games now sit in a chip grid that cannot overlap on phones.
- Games on Learn is a direct link to the games room, with no expanding menu. The games room has a new playful look: letter-block title, a robot with tips, marquee-light hero, sticker cards, doodles, and a Surprise me dice.
- Verse notes open with "Yours", then "Start here" (the 3 to 5 most relevant items), then grouped lists; "More in this app" links lessons, chains, stories and readings to the verses they discuss. Apologetics tracks (39 topics, 4 levels each) point to verified free resources and the app's own sourced content.

## Lists, search, offline packs and What's new
- **Lesson lists** show minutes with a group and on your own, a teaching-depth badge and unit totals; grade pages and Learn offer "Continue your lesson" at the saved step.
- **Search** indexes lesson vocabulary, teaching points and saints, so questions like "why do we go to confession" find the lesson under Learn.
- **Offline packs**: verse links, hymns, readings together and game word lists now sit in sensible packs with real sizes; new "Children and family" preset.
- **What's new** page (`/whats-new`) lists recent features by area.
