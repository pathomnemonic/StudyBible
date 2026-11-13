# Where your data lives, and what protects it

This describes what the code does today. It is not a promise of more.

## On your device
- Notes, highlights, bookmarks, journal, reading progress, memory cards, settings and game streaks live in this browser's own database (IndexedDB) and local storage.
- **They are not encrypted on the device.** Anyone who can open this browser profile can read them. Use your device's lock screen and disk encryption.
- Clearing the browser's site data, removing the profile, or losing the device erases them unless a copy exists elsewhere.

## Safety copies in the browser
- A copy is kept in the same browser database each day (the last five). They guard against a mistake, a bad import or a bug.
- They are stored in the same place as your notes, so they **do not** protect against clearing the browser's data. The app says so, and the "Where your writing is kept" card on the Library page separates them from a backup outside the browser.

## Backups outside the browser
- **Backup file:** one tap saves or shares a JSON file. It is plain text unless you set a password. A password makes it AES-256-GCM with a PBKDF2-SHA-256 key (310,000 rounds); there is no recovery if the password is lost.
- **Google Drive (optional):** copies go to the app's private Drive folder, straight from your browser to Google. Nothing passes through a server of ours. It needs the site owner to configure a Google client ID.
- **Restoring:** a file is checked completely before anything changes, inside one transaction. A damaged, truncated, oversized, foreign or newer-format file is refused and your data is left alone. A restore that fails part-way (for example a full disk) changes nothing. Before a "replace" restore, a safety copy of the current data is made.

## Account and sync (optional, self-hosted)
- Sync exists only where someone runs the server in `server/`. The GitHub Pages build is made local-only and never looks for one.
- With a server: rows sync by `(table, uid, updatedAt)`. **The server stores your notes in readable form; there is no end-to-end encryption.** Whoever runs it can read them.
- Conflicts: if two devices edit the same note or journal entry before syncing, the newer one wins and the other is kept as a copy ("other version kept at sync"). If another device deleted a note you edited since your last sync, your edit is kept and sent back. Other synced items (highlights, bookmarks, settings) are last-writer-wins.
- If a sync fails (offline, expired sign-in, server error, a record the server refuses), the app does not report it as finished and keeps the changes queued.

## What leaves your device in the hosted app
- Page and data requests to the site's host (GitHub Pages).
- A YouTube video you press play on loads YouTube's player (youtube-nocookie.com), and its player script so the app can remember where you stopped. Podcast and audio links load from their publishers.
- Nothing you write is sent anywhere unless you turn on Drive backup or an account.

## Live classes
- Messages between a teacher and students pass through public message relays. They are sealed with a key made from the class code, so anyone with the code can read them. Do not put anything private in a live class.
