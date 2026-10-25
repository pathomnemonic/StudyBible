# Google Drive backup

The app keeps everything you write in the browser's own database (IndexedDB). That is fast and works offline, but the browser can clear it. Google Drive backup keeps a few dated copies in a private folder on **your own** Drive (the hidden "app data" folder, scope `drive.appdata`). It does not show among your files, and the app cannot see anything else on your Drive.

What it does:

- Connect once from Profile or Settings. A copy is saved right away.
- A few minutes after your data changes (and at most about every ten minutes), the newest copy is updated. If the newest copy is more than twelve hours old, a new dated copy is made instead. The last seven copies are kept, so one bad save cannot overwrite the only good one.
- Settings lists the copies and can **merge** one into this device or **replace** this device's data with it.
- The app asks the browser for persistent storage, which makes it less likely that the data is cleared.
- Nothing is sent to any server of ours. The browser talks to Google directly. Local-only mode turns it off.

## Switching it on for a site (once)

Google requires an OAuth client ID for any app that signs in with Google.

1. In the [Google Cloud console](https://console.cloud.google.com/), create a project and enable the **Google Drive API**.
2. Under *APIs & Services → OAuth consent screen* set up the app (the `drive.appdata` scope is not a "sensitive" scope, so it needs no verification beyond the basic consent screen).
3. Under *Credentials* create an **OAuth client ID** of type *Web application* and add the site's address (for example `https://example.github.io`) as an authorised JavaScript origin.
4. Build the app with `VITE_GOOGLE_CLIENT_ID=<the id>` set, or paste the ID into *Settings → Back up to Google Drive* on a single device to try it.

Until an ID is present the Settings card explains this instead of offering to connect.
