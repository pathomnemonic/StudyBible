# Supported browsers and known limits

The app is tested in Chromium (Chrome, Edge, Android Chrome) with Playwright. Firefox and Safari should work but are **not** tested automatically; features that depend on browser-specific APIs are listed below.

| Feature | Needs | If missing |
|---|---|---|
| Offline use and install | Service workers (all current browsers) | The app works online only |
| Notes, highlights, progress | IndexedDB | Nothing is saved; the app shows an error |
| "Keep screen on" | Screen Wake Lock API (Chrome, Edge, recent Safari; not Firefox) | The setting has no effect |
| Reminders | Notifications (not on iOS Safari unless installed to the home screen; never when the app is closed without a push service) | No reminders |
| Read aloud | Web Speech synthesis and the voices your device provides | The button is hidden or silent |
| Persistent storage | `navigator.storage.persist()` (Chromium, Firefox) | The browser may clear data under storage pressure; export a backup |
| Copy buttons | Async clipboard (HTTPS or localhost) | A message says the copy failed |
| Audio and video | Network; streams belong to their publishers | They do not play offline |

## Offline expectations
See Settings → "What works without a connection?". In short: the Bibles you have opened or downloaded, your own data, the Office, devotions and prayer book work offline; study packs work offline once downloaded; audio, video and links to other sites need a connection.

## Storage
The Scripture editions are about 5 MB each. All optional study data is about 220 MB; each pack in Settings shows its size and can be downloaded on its own. Browsers may evict cached files under pressure; a downloaded pack is re-checked and offered again if files are missing.

## Accessibility
Automated checks (axe-core) run on the main screens and in every theme. They find only some problems. Screen-reader support has been checked informally; we have not run a formal audit with NVDA, VoiceOver or TalkBack. Please report anything you find.
