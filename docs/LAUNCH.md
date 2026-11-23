# Launching on the web, Android and iPhone/iPad

The app is already an installable **PWA** (manifest, service worker, offline, update prompt, Install card in Settings). Store builds wrap that same
`dist/` folder, so one codebase serves all three. Everything that can be prepared without your accounts and machines is done and in `store/`.

## What is ready
| Piece | Where |
|---|---|
| Installable PWA: manifest with id, scope, categories, shortcuts, maskable icon; iOS meta tags and 180px touch icon; Install card (real button on Chrome/Edge/Android, Share→Add to Home Screen steps on iPhone) | `vite.config.ts`, `index.html`, `src/lib/install.ts`, `src/components/InstallCard.tsx` |
| All icons: PWA, Android launcher + adaptive layers, Play 512 icon, iOS 1024 (opaque) + every size, splash | `public/`, `store/` (regenerate: `scripts/launch/make-assets.mjs`) |
| Store graphics: Play feature graphic, phone/tablet/iPhone/iPad screenshots taken from the real app | `store/` |
| Listings, content rating, data-safety and privacy-label answers, review notes | `store/android/listing.md`, `store/ios/listing.md` |
| In-app privacy page | `/#/privacy` |
| Capacitor wrapper config | `capacitor.config.ts` |
| TWA digital-asset-links template (alternative to Capacitor on Android) | `store/android/assetlinks.template.json` |

## What only you can do
1. **Host the PWA** over HTTPS (any static host; the build is relocatable). Put the URL in both listings and the privacy field.
2. **Developer accounts:** Google Play ($25 once), Apple Developer Program ($99/year). Neither can be created from here.
3. **Android build** (needs Android Studio, JDK 17):
   ```
   npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
   npm run build && npx cap add android && npx cap sync android
   # copy store/android/res/* into android/app/src/main/res (launcher sizes + adaptive layers), then:
   npx cap open android   # Build > Generate Signed Bundle (AAB), upload to Play Console
   ```
4. **iOS build** (needs a Mac with Xcode):
   ```
   npm i @capacitor/ios && npm run build && npx cap add ios && npx cap sync ios
   # replace the AppIcon set with store/ios/AppIcon/*, set the bundle id org.cathology.app and your team, then:
   npx cap open ios       # Product > Archive > Distribute to App Store Connect
   ```
5. Fill the listings from `store/*/listing.md`, upload `store/` graphics, complete the rating and data-safety/privacy forms with the answers given.
6. Supply the **RSV-2CE licence reference** (docs/RSV2CE.md) if a reviewer asks. If you would rather not ship licensed text in the store build, remove the `rsv2ce` registry entry before building.

## Pre-flight checklist (all verified in this repo unless marked)
- [x] Works offline after first load; update prompt never interrupts typing.
- [x] No accounts, ads, analytics or tracking SDKs; privacy page matches behaviour. **This is true only while the accounts switch is off** (`VITE_ACCOUNTS`). The moment accounts ship in a store build, every item in the next section applies and the listings' "no data collected" answers must change first.
- [ ] If accounts ship in the store build (Supabase, see SUPABASE_SETUP.md):
  - Google Play data safety: collected = email address and user content (notes, highlights, progress); linked to the person; not shared; encrypted in transit; deletion available in the app ("Delete my StudyBible account") and on the web.
  - Apple App Privacy: Contact Info (email) and User Content, linked to the user, not used for tracking. The listing's "Data Not Collected" must go.
  - Account deletion must be reachable inside the app (it is: Account page). The shared email sign-in outlives it unless "Also remove my sign-in" is used; confirm the store wording accepts that.
  - **Sign in with Apple** is required in the iOS app if Google sign-in is offered (set up Apple as a provider in the project first).
  - The privacy policy address to enter in both stores: https://pathomnemonic.github.io/StudyBible/privacy.html (kept by Orion; it names the accounts, Drive backup, third-party content and children wording).
  - The terms of service address for the listings: https://pathomnemonic.github.io/StudyBible/terms.html (a draft; have it reviewed before launch).
  - The tip link is hidden inside the native app on purpose; check each store's current rules on tips and outside payment pages before showing it there.
  - The lessons for younger learners (Kindergarten to Grade 8) affect the age rating and, on Google Play, the audience and Families questions: decide the target audience deliberately.
  - Re-read the in-app sentences that say "there is no account" (Passport page, Widgets page, Help "Where is my data kept?") when accounts ship; they are true now and must stay true.
- [ ] The native wrappers are not installed yet: `@capacitor/*` is not in package.json (the steps above add them), so no store build has been made or tested from this repo.
- [x] Icons: maskable safe zone respected; iOS icon has no alpha channel.
- [x] `tests/launch.test.ts` checks manifest fields, icon files and listing limits (name ≤30, short description ≤80, keywords ≤100).
- [ ] Real-device pass on a low-end Android phone and an older iPhone (cannot be done here).
- [ ] Owner's support URL and contact email in the listings.
- [ ] Owner's legal review of the third-party content notes (docs/DATA_SOURCES.md).
