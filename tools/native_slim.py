#!/usr/bin/env python3
"""Leave the downloadable content packs out of a synced native app's web assets.

Run AFTER `npx cap sync`, with the synced public folder as the argument
(android/app/src/main/assets/public, or ios/App/App/public). The store
binary keeps the daily core (prayers, readings, office, catechism, saints,
the Douay Rheims, NABRE and RSV2CE texts, the art gallery) and drops the packs the app already
knows how to download on demand (see data/manifest.json): the Fathers and
saints library, the commentaries, the Greek and Hebrew study pack, the
encyclopedia, the dictionary, the media lists, the other Bible editions, and the music tracks (those stream from the app's site
instead). The web build is untouched and still ships everything.

Added by Orion, Nov 25, 2026, to bring the store download from about
260 MB down to about 112 MB.
"""
import os, re, shutil, sys

DROP_DATA_DIRS = ["library", "commentary", "original", "encyclopedia", "dictionary", "media"]
KEEP_EDITIONS = {"dra", "nabre", "rsv2ce"}

def main(public_dir):
    data = os.path.join(public_dir, "data")
    for name in DROP_DATA_DIRS:
        p = os.path.join(data, name)
        if os.path.isdir(p):
            shutil.rmtree(p)
            print("dropped data/" + name)
    bible = os.path.join(data, "bible")
    if os.path.isdir(bible):
        for ed in sorted(os.listdir(bible)):
            if ed not in KEEP_EDITIONS:
                shutil.rmtree(os.path.join(bible, ed))
                print("dropped data/bible/" + ed)
    art = os.path.join(public_dir, "art")
    keep = keep_art_files()
    if os.path.isdir(art) and keep:
        for name in os.listdir(art):
            if "art/" + name not in keep:
                os.remove(os.path.join(art, name))
        print("dropped the gallery beyond the mini gallery (%d kept)" % len(keep))
    audio = os.path.join(public_dir, "audio")
    if os.path.isdir(audio):
        shutil.rmtree(audio)
        print("dropped audio/")
    print("native slim done")

def keep_art_files():
    """The mini gallery list, read from the same module the app imports (src/lib/artSrc.ts)."""
    here = os.path.dirname(os.path.abspath(__file__))
    src = os.path.join(here, "..", "src", "lib", "artSrc.ts")
    try:
        with open(src, encoding="utf-8") as fh:
            return set(re.findall(r"'(art/[^']+)'", fh.read()))
    except OSError:
        return set()

if __name__ == "__main__":
    main(sys.argv[1])
