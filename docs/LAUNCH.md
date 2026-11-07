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
- [x] No accounts, ads, analytics or tracking SDKs; privacy page matches behaviour.
- [x] Icons: maskable safe zone respected; iOS icon has no alpha channel.
- [x] `tests/launch.test.ts` checks manifest fields, icon files and listing limits (name ≤30, short description ≤80, keywords ≤100).
- [ ] Real-device pass on a low-end Android phone and an older iPhone (cannot be done here).
- [ ] Owner's support URL and contact email in the listings.
- [ ] Owner's legal review of the third-party content notes (docs/DATA_SOURCES.md).
