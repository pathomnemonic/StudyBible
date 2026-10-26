# What changed

Changes to the **app** and changes to the **content** (data) are listed separately, so you can tell what a rebuilt dataset altered.

## Unreleased

### App
* **Extraordinary Form Mass** (`/mass/ef`): the whole 1962 Order of Mass in English, step by step, with the Introit, readings, Gradual, Offertory, Secret, Preface, Communion and Postcommunion of the day.
* **Present as slides** on every catechism lesson: a real deck with a title slide, the question, the big idea, one slide per word, the story and Scripture in readable pieces, art, the Catechism, a video, discussion questions, the activity, a saint, a check with click-to-reveal answers, the weekly challenge and the closing prayer. Arrow keys, swipe, full screen, and teacher notes (N).
* The Reading room tab now returns to the work and the place you were reading (and your search), and LibriVox recordings play in the bottom player like the Bible in a Year, with the next parts queued.
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
