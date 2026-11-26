#!/usr/bin/env python3
"""Give the generated Android project its seasonal launcher icons.

The Android project is not kept in this repo: the builds create it with
`npx cap add android` and sync. Run this after the sync, before the bundle
build (the Codemagic android-release workflow and the Android AAB workflow
both do):

    python3 tools/android_seasonal_icon.py android

It does two things to the generated project:

1. AndroidManifest.xml: the launcher intent filter comes off MainActivity
   itself, and four activity-aliases are added, one per icon (.icon.Default,
   the primary, starts enabled; .icon.Violet, .icon.Green and .icon.Red start
   disabled). The SeasonalIcon plugin (plugins/seasonal-icon) switches between
   them at run time through PackageManager, so exactly one launcher entry
   exists at any moment.
2. The per-density icon PNGs kept in tools/seasonal-icons/ are copied into
   the project's res/ folders, where the aliases point at them.

Nothing here is generated at run time on a device; the switching is done by
the plugin. Fails loudly (exit 1) if the generated project does not have the
shape this expects, so a build never ships quietly without the aliases.
"""
import shutil
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ANDROID = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", ANDROID)
A = f"{{{ANDROID}}}"

VARIANTS = [("Default", True), ("Violet", False), ("Green", False), ("Red", False)]


def fail(msg: str) -> "SystemExit":
    print(f"android_seasonal_icon: {msg}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "android")
    manifest_path = root / "app/src/main/AndroidManifest.xml"
    if not manifest_path.exists():
        fail(f"{manifest_path} does not exist; run this after `npx cap add android` and `npx cap sync android`")
    icons_src = Path(__file__).resolve().parent / "seasonal-icons"
    if not icons_src.is_dir():
        fail(f"{icons_src} is missing from the repo")

    tree = ET.parse(manifest_path)
    manifest = tree.getroot()
    application = manifest.find("application")
    if application is None:
        fail("the manifest has no <application> element")

    main_activity = None
    for activity in application.findall("activity"):
        if (activity.get(f"{A}name") or "").endswith("MainActivity"):
            main_activity = activity
            break
    if main_activity is None:
        fail("the manifest has no MainActivity to point the aliases at")
    target_name = main_activity.get(f"{A}name")

    # The launcher entry moves from MainActivity to the aliases.
    for intent_filter in list(main_activity.findall("intent-filter")):
        categories = {c.get(f"{A}name") for c in intent_filter.findall("category")}
        if "android.intent.category.LAUNCHER" in categories:
            main_activity.remove(intent_filter)

    existing = {a.get(f"{A}name") for a in application.findall("activity-alias")}
    for variant, enabled in VARIANTS:
        alias_name = f".icon.{variant}"
        if alias_name in existing:
            continue
        alias = ET.SubElement(application, "activity-alias")
        alias.set(f"{A}name", alias_name)
        alias.set(f"{A}enabled", "true" if enabled else "false")
        alias.set(f"{A}exported", "true")
        alias.set(f"{A}icon", f"@mipmap/ic_launcher_seasonal_{variant.lower()}")
        alias.set(f"{A}label", "@string/app_name")
        alias.set(f"{A}targetActivity", target_name)
        intent_filter = ET.SubElement(alias, "intent-filter")
        ET.SubElement(intent_filter, "action").set(f"{A}name", "android.intent.action.MAIN")
        ET.SubElement(intent_filter, "category").set(f"{A}name", "android.intent.category.LAUNCHER")

    tree.write(manifest_path, encoding="utf-8", xml_declaration=True)

    res = root / "app/src/main/res"
    copied = 0
    for density_dir in sorted(icons_src.glob("mipmap-*")):
        dest = res / density_dir.name
        dest.mkdir(parents=True, exist_ok=True)
        for png in sorted(density_dir.glob("*.png")):
            shutil.copyfile(png, dest / png.name)
            copied += 1
    if copied == 0:
        fail(f"no icon PNGs found under {icons_src}")
    print(f"android_seasonal_icon: launcher aliases added for {', '.join(v for v, _ in VARIANTS)}; {copied} icon PNGs copied")


if __name__ == "__main__":
    main()
