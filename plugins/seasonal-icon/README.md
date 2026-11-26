# capacitor-seasonal-icon

A small local Capacitor plugin for Cathology: it switches the app's launcher icon
between the primary icon and the bundled seasonal alternates.

The web side speaks in plain names: `'violet'`, `'green'`, `'red'`, or `null` for
the primary icon.

- iOS: the alternates are loose PNG files in the app bundle, declared in
  `Info.plist` under `CFBundleAlternateIcons` as `AppIcon-Violet`,
  `AppIcon-Green` and `AppIcon-Red`; the plugin calls
  `UIApplication.setAlternateIconName`. The system shows its own short message
  when the icon changes.
- Android: the alternates are activity-aliases (`.icon.Default`, `.icon.Violet`,
  `.icon.Green`, `.icon.Red`) that the build adds to the generated app manifest
  with `tools/android_seasonal_icon.py`; the plugin enables exactly one of them
  through `PackageManager.setComponentEnabledSetting`.

The season-to-icon decision lives in the app, in `src/lib/seasonalIcon.ts`, and
reuses the app's own liturgical calendar (`src/liturgy/compute.ts`).
