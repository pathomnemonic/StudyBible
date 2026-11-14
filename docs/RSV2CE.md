# RSV-2CE (The Ignatius Bible)

**Status:** bundled, all 73 books, from the publisher's own file, with the edition's footnotes, study notes and
cross-references. Licensed text, included on the project owner's statement that permission has been obtained (Nov 2026).
The licence reference still has to be recorded below.

## What the text is
The Revised Standard Version, Second Catholic Edition, Ignatius Press (2005 Ignatius Bible; the title page says "revised
according to Liturgiam Authenticam, 2002"). The pack is built from the owner's MOBI copy, a clean text with the printed
verse numbers and notes (replacing the first pack, which was read from an OCR scan and had dropped letters and damaged
verse numbers; see "History").

`scripts/rsv/build_mobi.py` unpacks the MOBI HTML and writes `data/curated/rsv2ce/<BOOK>.json`:
* the text with the printed paragraphs and poetry lines, and the printed section headings;
* `notes` for each chapter, keyed by verse: the lettered footnotes (`a: Or When God began to create.`), the printed
  study notes (the ones marked `*`) and the cross-references (`See: Jn 1:1.`).

```
pip install mobi
python3 -c "import mobi; print(mobi.extract('the-file.mobi'))"        # prints the folder with mobi7/book.html
python3 -I scripts/rsv/build_mobi.py <that>/mobi7/book.html data/curated/rsv2ce
npx tsx scripts/ingest/cli.ts build
```

## How the structure is checked
Chapter and verse numbers are recovered from the printed markers; each chapter's verse count is compared with the English
numbering of the WEB-C pack the app already carries, and the places where they differ were read one by one. What remains is
the edition's own printing, not a parse error:
* Verses the RSV leaves out or moves (Matthew 17:21, Mark 9:44 and 46, Luke 17:36, John 5:4, Acts 8:37, Exodus 22:1–4 …):
  the numbers follow the print, so a gap in the numbers is expected.
* Esther follows the Greek book: the additions are numbered 11–16 where the Ignatius Bible prints them, and Daniel 3 numbers
  the Prayer of Azariah and the Song of the Three on from 3:23 (3:24–91), then the Aramaic 3:24–30 as 3:92–98.
* A few verse numbers are missing in the source file itself (Matthew 5:4 is printed without its number); where the next
  number skips exactly one, it is numbered from its neighbours.
* The source file has a few typing slips and line-break hyphens (`beseiged`, `firma- ment`); they are listed in
  `TYPOS` and `tidy()` in the script.

`tests/editions-integrity.test.ts` checks all 73 books and the chapter order, that no stray symbols or control characters
are left, that footnotes are present, and a set of verses that the old scan had damaged (Psalm 119:17–18, Jeremiah 30:8 …).
`scripts/rsv/audit_full.py` lists words never seen in the other editions, for review against the print.

## History
The first pack came from an OCR'd scan (`data/licensed/ignatius-rsv2ce.epub`, `ignatius-djvu.txt`) and lost the first letter
of many verses ("en my eyes" for "Open my eyes"), left stray marks inside words and split chapters wrongly. An automatic
spelling repair was tried and rejected: it turned real words (`pommel`, `stripling`) into other words. The scripts under
`scripts/rsv/` other than `build_mobi.py` and `audit_full.py` belong to that scan route and are kept only as a record.

## Rights record (to complete)
* Rights holder: National Council of the Churches of Christ in the USA / Ignatius Press.
* Permission: stated by the project owner, 7 Nov 2026. **Licence reference / correspondence: not yet recorded here.**
* If permission lapses or is withdrawn: delete `public/data/bible/rsv2ce`, `data/curated/rsv2ce`, the registry entry and
  the licence note, then rebuild.
