# What changed

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
