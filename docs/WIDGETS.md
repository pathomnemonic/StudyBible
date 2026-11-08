# Widgets

What a widget shows: **today's verse**, **verses due for review** and the **game streak** (a reading-plan count is available too). All of it is computed on the device from what is saved there. Nothing is sent anywhere.

| Where | How it works | Status |
| --- | --- | --- |
| **In the app** (`/widgets`, `/widget/<verse|review|streak|plan>`) | Each widget is its own small page, so it can be pinned as a tab or kept as a small installed window. | Built and tested. |
| **Windows 11 Widgets board** (Edge, installed web app) | The web manifest declares a `widgets` entry; `public/widgets-sw.js` (loaded by the service worker) answers `widgetinstall`, `widgetresume`, `widgetclick` and a daily `periodicsync`, and fills the card template `public/widgets/verse-template.json` from `public/widgets/verses.json`. | Built; **not tested on a real Windows 11 machine** (it cannot be tested here). The browser support is limited to Edge on Windows 11. |
| **Android home screen** | `store/widgets/android/`: an `AppWidgetProvider` that reads what the web app last published, and a Capacitor plugin (`WidgetBridge`) the web app calls. | Written; **needs building and testing in Android Studio** by the owner. |
| **iPhone / iPad home screen** | `store/widgets/ios/`: a WidgetKit extension that reads the shared App Group, and a Capacitor plugin (`WidgetBridge`). | Written; **needs building and testing in Xcode** by the owner. |

## How the data gets to a native widget

`src/lib/widgetData.ts` builds the data (`buildWidgetData`) and `publishWidgets` calls `Capacitor.Plugins.WidgetBridge.publish({ json })` when the app runs inside the store wrapper. It runs when the widgets page opens; to keep native widgets fresh call `publishWidgets` once on app start (it is cheap) and when the day changes. In a plain browser the call does nothing.

## Android (after `npx cap add android`)

1. Copy `store/widgets/android/java/org/cathology/app/*.kt` into `android/app/src/main/java/org/cathology/app/`.
2. Copy the `res/` folders into `android/app/src/main/res/`.
3. Paste the `<receiver>` from `AndroidManifest.snippet.xml` inside `<application>`, and add the three strings from its comment to `res/values/strings.xml`.
4. In `MainActivity.kt` register the plugin as shown in `MainActivity.snippet.kt`.
5. Build, install, touch and hold the Home screen, Widgets, pick the app.

## iOS (after `npx cap add ios`)

1. In Xcode: File, New, Target, Widget Extension, named `CathologyWidget` (untick "Include Configuration App Intent"). Replace its Swift file with `store/widgets/ios/CathologyWidget/CathologyWidget.swift`.
2. Add the **App Groups** capability to **both** the App target and the widget target, with the group `group.org.cathology.app` (change it in the Swift files if you pick another id).
3. Add `store/widgets/ios/App/WidgetBridgePlugin.swift` to the App target.
4. Build and run, then touch and hold the Home Screen, tap +, search for the app.

## Windows widget data

`public/widgets/verses.json` is generated from the verse-of-the-day list: run `npx tsx scripts/launch/make-widget-verses.ts` after changing `src/study/verseOfDay.ts`. A test (`tests/chains.test.ts`, "widget verses") fails if the two lists differ in length.
