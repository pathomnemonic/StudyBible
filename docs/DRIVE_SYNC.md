# Sync between devices through Google Drive

Built, tested and **off**. It keeps your notes, highlights, bookmarks, journal, plans, progress, folders and some settings the same on every device, through the hidden app folder of **your own** Google Drive. There is **no server, no database and no account of ours**: it works from the plain GitHub Pages copy of the app.

## Switches

* **Build switch** (`src/lib/driveSyncFlag.ts`): build with `VITE_DRIVE_SYNC=1` to offer it to everyone, or with `VITE_DRIVE_SYNC_PREVIEW=1` and open the app once with `?drivesync=on` in the address to try it privately (`?drivesync=off` removes it). A normal build shows nothing and sends nothing.
* **Google client id**: the same one the Drive backup uses (`VITE_GOOGLE_CLIENT_ID`; see [DRIVE_BACKUP.md](DRIVE_BACKUP.md) for the one-time Google Cloud setup: a project, the Drive API, a consent screen, and a *Web application* client with the site's address as an authorized JavaScript origin). It needs no server and no client secret.
* **Per person**: Settings → "Sync between your devices through Google Drive" → Turn on. Nothing is sent until they do.

## What you need to provide

Only the Google client id, as for the backup. Nothing for a server (there is none) and no other platform: this option is Google Drive only. Other cloud drives (iCloud, Dropbox, OneDrive) are not built; each would need its own client id and its own small file layer behind the same interface (`DriveFiles` in `src/sync/driveSyncBackend.ts`).

## How it works

It reuses the **same sync engine as account sync**, so conflict handling is the existing, tested kind (newer record wins; a note edited on two devices keeps both versions; a deletion never silently destroys writing that was added elsewhere). Drive stands in for the server, through the same call (`sync(cursor, changes)`):

* Every push becomes a small immutable file, `sbs-chg-<device>-<random>.json`, in the app folder. Two devices never write the same file, so there is nothing to lock and no write can clobber another's.
* A device remembers which files it has read (by Drive's file id), so it needs no clock, and applying a change twice is harmless.
* When the log reaches 40 pushes, a device folds it into one snapshot, `sbs-snap-<time>-<random>.json`, and deletes the files it replaced. A device that was away reads the snapshot instead. Two devices compacting at once just write two snapshots that both hold everything.
* A file it cannot read, or a newer format, is skipped and never deleted.

## What to know

* **Use the same Google account on every device.** Another Google account is another Drive; turning sync on with it would send this device's library there.
* **It is exclusive with an account on a server.** While signed in to an account, that account is the sync, and Drive sync says so and stops.
* **Google's key lasts an hour** and cannot be renewed in the background without a tap. Sync tries quietly when the app opens, comes to the front, or after a change, and if the key is gone it stops with "sign in again"; pressing **Sync now** once renews it. A small cost of having no server.
* **Not instant.** Changes arrive when the other device next syncs (a short while after an edit, and when the app comes to the front), not live.
* **The files sit in your Drive unencrypted**, in a folder only this app can open (not shown among your files). Turn sync off and choose "delete from Drive" to remove them; removing the app's access in your Google account also removes the folder.
* **Large libraries** upload in pieces of about 2 MB. Drive's own limits (file size, requests) are far above what notes need.
* **Settings** that sync are the same few as account sync (theme, text size, translations and so on), newest change wins.

## Honest status

* Tested against a pretend Drive folder (a list of files with creation times that only go up) with the real engine and the real browser-side code, including two devices writing at once, a device away through a compaction, two compactions together, unreadable files, a failed delete, a full round trip of notes, highlights, edits and a deletion across three devices, and the Drive request shapes (paging, app-folder only, our files only).
* **Not yet run against the real Google Drive.** The first real run is the test: turn it on with your own account on two devices before anyone else.
* The compaction is conservative (it never loses what another device has not read), but it has not been exercised with very large histories.
