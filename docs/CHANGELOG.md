# What changed

Changes to the **app** and changes to the **content** (data) are listed separately, so you can tell what a rebuilt dataset altered.

## Unreleased

### App
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
* Divine Office psalter data from Divinum Officium (MIT licence), Douay-Rheims psalm text.
* Video library and catalogue of about 1,560 Catholic videos; LibriVox recordings for the Bible and about 55 library works; apologetics resource directory.
* Offline pack manifest now lists each file's size and checksum.
