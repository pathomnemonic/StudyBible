# iOS build on Codemagic (no local Mac)

Cathology is the web app wrapped with Capacitor. Codemagic's cloud Macs build and sign it; nothing here needs Xcode on your own computer. **Nothing has been built yet and the workflow has not been run**: it waits for an active Apple Developer account.

## What is in the repo

| File | What it is |
|---|---|
| `codemagic.yaml` | One workflow, `ios-release`: install, check, build the web app, `cap sync ios`, sign, number the build, build the .ipa, send it to **TestFlight** (never to App Review). It has no trigger: it only runs when started by hand in Codemagic. |
| `ios/` | The Capacitor iOS project (bundle id `com.pathomnemonic.cathology`, iOS 14+, the 1024 app icon from `store/ios/AppIcon`, the green splash, `ITSAppUsesNonExemptEncryption=false`). `Pods`, the copied web files and the generated Capacitor config are not committed; `cap sync ios` makes them in CI. |
| `capacitor.config.ts` | `appId: com.pathomnemonic.cathology`, `appName: Cathology`, web files from `dist/`. |
| `scripts/ios/check.ts` | Runs first in CI and in the tests: fails if the Xcode project, the Capacitor config and `codemagic.yaml` disagree on the bundle id, or the icon is not 1024x1024 and opaque. |
| `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli` (7.x) | Added to `package.json`. |

The store build sets `VITE_LOCAL_ONLY=1` and not `VITE_ACCOUNTS`, so it has no accounts and no sync. Error reports and page counts never run in the app (`src/lib/telemetry.ts` skips native), and the tip link is hidden there, so the listing's "Data Not Collected" answer stays true.

## One-time setup (after the Apple Developer account is active)

1. **App ID.** In the Apple Developer portal, Identifiers: register `com.pathomnemonic.cathology` (explicit App ID). No special capabilities are needed. *Check first that this is the bundle id you want: it cannot be changed after the first upload.*
2. **App record.** In App Store Connect, My Apps > New App: name Cathology, bundle id above, SKU of your choice. Copy the app's numeric **Apple ID** (App Information > General).
3. **API key.** App Store Connect > Users and Access > Integrations > Team Keys: create a key with the **App Manager** role (or Admin). In Codemagic, Teams > Integrations > App Store Connect: add it and give it a name. (Dx Dash already has one on the same team; the same key can be used if the same Apple team owns both apps.)
4. **Edit `codemagic.yaml`:** replace `CHANGE_ME_ASC_KEY_NAME` with that integration's name and `CHANGE_ME_APP_STORE_APPLE_ID` with the number from step 2.
5. **Add the repository in Codemagic** and pick `codemagic.yaml`. Codemagic then creates the distribution certificate and the App Store profile from the API key by itself.
6. **Start `ios-release` by hand.** The build appears in TestFlight in about 10 to 30 minutes after it finishes.

## Before the first App Store submission

- Listing, privacy answers, review notes and screenshots: `store/ios/listing.md`. Screenshot sizes: 6.7", 6.5" iPhone and 12.9" iPad.
- Support URL, marketing URL and privacy policy URL (`https://pathomnemonic.github.io/StudyBible/privacy.html`) are still to be filled in.
- Age rating 4+; export compliance is answered by the plist key.

## Things to test on the first TestFlight build (not checked: there is no Mac here)

- **YouTube and Vimeo embeds.** The app runs from `app://localhost`; YouTube's player may refuse to play from a custom address. If so, the videos need an in-app browser fallback.
- **Google Drive backup.** Its sign-in expects a web address; in the iOS app it may not complete. Hide it in the native build or test it. If Google sign-in is offered anywhere in the app, Apple requires Sign in with Apple as well (accounts are off in this build).
- **Size.** The built web app (`dist/`) is about 450 MB uncompressed (280 MB of data plus pictures and audio) and ships inside the app, so the download is large (over the 200 MB cellular limit, so Wi-Fi only). Splitting data into on-demand packs would shrink it.
- Share sheet, file export and the splash/safe-area layout on a notched iPhone.

## What still blocks a first build

1. An active Apple Developer Program membership (enrollment is paid but not active).
2. The App ID and the App Store Connect app record (steps 1 and 2).
3. The API key in Codemagic and the two values in `codemagic.yaml` (steps 3 and 4).
4. A decision that `com.pathomnemonic.cathology` is the bundle id to keep.
