#!/usr/bin/env python3
"""Wire the audio asset pack into the generated Android project.

Run AFTER `npx cap sync android`, from the repo root. Moves the web audio
folder out of the app module into an install-time Play Asset Delivery pack
so the base module stays under Play's 200 MB limit (the full bundle is
about 260 MB, of which audio is about 68 MB). Install-time pack assets
merge into the app's AssetManager at install, so the files keep their
original asset paths (public/audio/...) and no app code changes.

Added by Orion, Nov 25, 2026, for the Play closed test.
"""
import os, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AND = os.path.join(ROOT, "android")
SRC = os.path.join(AND, "app", "src", "main", "assets", "public", "audio")
PACK = os.path.join(AND, "audiopack")
DST = os.path.join(PACK, "src", "main", "assets", "public", "audio")

if not os.path.isdir(SRC):
    print("audio folder not found at", SRC)
    sys.exit(1)
os.makedirs(os.path.dirname(DST), exist_ok=True)
if os.path.exists(DST):
    shutil.rmtree(DST)
shutil.move(SRC, DST)
print("moved audio into the asset pack:", DST)

with open(os.path.join(PACK, "build.gradle"), "w") as f:
    f.write("""plugins {
    id 'com.android.asset-pack'
}

assetPack {
    packName = "audiopack"
    dynamicDelivery {
        deliveryType = "install-time"
    }
}
""")

sg = os.path.join(AND, "settings.gradle")
s = open(sg).read()
if "audiopack" not in s:
    open(sg, "w").write(s + "\ninclude ':audiopack'\n")

bg = os.path.join(AND, "app", "build.gradle")
s = open(bg).read()
if "assetPacks" not in s:
    open(bg, "w").write(s.replace("android {", 'android {\n    assetPacks = [":audiopack"]', 1))
print("asset pack wired")
