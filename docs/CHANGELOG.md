# What changed

Changes to the **app** and changes to the **content** (data) are listed separately, so you can tell what a rebuilt dataset altered.

## Unreleased

### App
* **Catechism, Kindergarten to Grade 12** (Study → Catechism program): 318 lessons in 13 grades, each with the big idea, words to know, Scripture and Catechism text, videos and art from the library, a question, an activity, a prayer and a check with spaced review; Student, Teacher (timed plan, background, support and stretch) and Family (five-day plan) views; present-on-screen, read-aloud and print; a teacher and parent handbook; progress saved and synced.
* Morning mode, attach a prayer to a passage, the feast of the day with Matins lessons on the Office page, the Byzantine Divine Liturgy of St John Chrysostom, a Young adults page, and The Chosen (Season 1) in the video catalogue.
* One Reading room (the tab), not two; the Notes tab in the study panel now holds the Catechism and Church teaching as well, so there is no separate Teaching tab.
* The tour now has you choose your Church, theme, translation and text size, then walks one verse (John 6:51) through Notes, Connections, Words and Media.
* **Your Church** setting for the Eastern Catholic Churches and Ordinariates: names, Psalm numbering, Byzantine calendar (computed Julian Pascha, tested against published dates), Divine Liturgy outline, Eastern prayers, honest labels on Roman-only pages, and an About section on what is and is not covered.
* Daily Examen, the Church’s year, Follow a story, group presentation mode, a study vault export, a “put in order” memorising mode, come-back dates and a notes timeline, your past reflections returning in the reader and in Lectio, dictation in the note editor, share a prayer time by link.
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
* Divine Office psalter data from Divinum Officium (MIT licence), Douay-Rheims psalm text, with seasonal chapters, responsories, hymns, versicles and collects for Advent, Lent, Passiontide and Eastertide.
* Video library and catalogue of about 1,560 Catholic videos; LibriVox recordings for the Bible and about 55 library works; apologetics resource directory.
* Offline pack manifest now lists each file's size and checksum.
