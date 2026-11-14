# NABRE (New American Bible, Revised Edition)

**Status:** bundled, all 73 books, translation text, section headings and the edition's notes. Licensed text, included on
the project owner's statement that official permission has been obtained (Nov 2026). The permission reference still has to
be recorded in docs/LICENSING.md.

## Source and conversion
The owner's Saint Benedict Press epub (copyright line: © 2008, 1991, 1986, 1970 Confraternity of Christian Doctrine, Inc.).
`scripts/nabre/build.py <unpacked epub> data/curated/nabre` reads the Calibre-split HTML: verse numbers are the
`<sup class="calibre41">` markers, poetry and prose come from the paragraph classes, section headings from the bold
inline headings and centred paragraphs. Each chapter's `notes` are keyed by verse (`1: study note…`, `a: cross-references…`).

Where the printed text puts a verse beside the wrong chapter, it is moved to where its number says (Job 10:1, Wisdom 12:1
and Daniel 11:1 are printed as `10:1` inside the chapter before; Numbers 25:19 opens chapter 26; Tobit 6:1 closes chapter
5; the first lines of Hosea 7, Ruth 3 and Sirach 39 finish the verse before). The few passages printed with part letters
(Sirach 33:20a, b) stay in one verse.

## Not included
Book introductions; the lettered Greek additions to Esther (A–F); the foreword to Sirach.

## Versification
The NABRE follows Hebrew numbering (the Psalm titles are verses; Joel has four chapters, Malachi three). `scripts/ingest/
nabre-scheme.ts` derives the `nabre` scheme in `versification.json` by matching each NABRE verse to the WEB-C verse with the
same wording and carrying it through the verified English rules to the Vulgate anchor. Chapters with a weak match, or a verse
with no partner, are listed as unverified, not guessed. Greek-text books (Tobit, Judith, Esther, Sirach, Daniel) compare by
chapter only, as for WEB-C.

## Checks
`tests/editions-integrity.test.ts` (73 books, chapter order, no stray symbols, notes present, known verses).
