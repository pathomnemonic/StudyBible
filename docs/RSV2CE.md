# RSV-2CE (The Ignatius Bible)

**Status:** bundled, 71 of 73 books (Esther and Zechariah are left out). Licensed text, included on the project owner's
statement that permission has been obtained (Nov 2026). The licence reference still has to be recorded below.

## What the text is
The Revised Standard Version, Second Catholic Edition, Ignatius Press (title page: "revised according to Liturgiam
Authenticam, 2002"). It came from the owner's copy as **an OCR'd scan of the printed book**, supplied twice:
`data/licensed/ignatius-rsv2ce.epub` (page text) and `data/licensed/ignatius-djvu.txt` (the same OCR with line breaks).
Both are git-ignored. The two files are the *same* OCR run (99.1 % word-identical, same damaged verse numbers), so the
second file is not an independent check of the first; it is used only to restore hyphens the epub lost at line ends.
The scan has the Bible text only: no footnotes, no cross-references, no imprimatur page.

## Why the verse breaks are rebuilt, and how reliable they are
The scan garbles most superscript verse numbers (`!%And`, `74And`, `*2But`) and drops many entirely, so splitting on
numbers would silently misassign verses. `scripts/rsv/build.py` instead aligns each chapter to the verse structure of the
bundled WEB-C text (same English-tradition numbering), scoring every candidate break by:
legible/partly legible printed number, sentence start, wording overlap with the WEB-C verse that should start/end there,
and verse length. Whole-verse overlap is scored with dynamic programming. WEB-C is only a guide: none of its words are
copied into the RSV text.

Measured on the finished pack (`scripts/rsv/audit.py`):
* 61 % of verse starts rest on a clean printed number, 18 % on a damaged number, 21 % on wording alone.
* With **every** printed number hidden, the same aligner reproduces 90 % of Genesis and 75 % of Matthew verses exactly,
  and 91 % of the Psalms verses whose numbers were hidden; real runs keep the legible numbers, so they do better.
* 4.4 % of verses overlap their WEB-C counterpart very little (mostly poetry that the RSV words freely); about 1 in 25
  verses may carry a clause that belongs to its neighbour. Chapter junctions that looked misplaced were re-cut by
  `scripts/rsv/repair.py`.
* About 4 % of verses keep a stray scan mark. `scripts/rsv/fix.py` removes the systematic ones (lost first letters such as
  `nd`→`And`, footnote letters stuck to words, stress marks in names) using WEB-C only as a hint for which word to restore.
* 1,200 section headings that the scan ran into the end of a verse are cut off (they are not stored).

## Books left out
* **Esther**: the Ignatius text follows the Greek order (it opens with "Mordecai's Dream 11"), which does not match the
  verse structure the aligner uses. **Zechariah**: chapter 5 could not be located reliably. Both are excluded in
  `scripts/rsv/fix.py` (`EXCLUDE`) and the edition is flagged `partial`.

## Reproduce
```
python3 scripts/rsv/build.py     # data/licensed/*  ->  data/curated/rsv2ce-raw/
python3 scripts/rsv/repair.py    # re-cut chapter junctions that look off
python3 scripts/rsv/fix.py       # scan clean-up  ->  data/curated/rsv2ce/   (the pack the build ships)
python3 scripts/rsv/audit.py     # quality report
npx tsx scripts/ingest/cli.ts build
```
`data/registry/editions.json` entry `rsv2ce` has `source: "curated-json"`; `scripts/ingest/bible.ts` validates the books
like any other edition. `tests/data.test.ts` allows a licensed edition only if its rights basis mentions permission and
the `bible` licence record names it.

## Rights record (to complete)
* Rights holder: National Council of the Churches of Christ in the USA / Ignatius Press.
* Permission: stated by the project owner, 7 Nov 2026. **Licence reference / correspondence: not yet recorded here.**
* If permission lapses or is withdrawn: delete `public/data/bible/rsv2ce`, `data/curated/rsv2ce`, the registry entry and
  the licence note, then rebuild.
