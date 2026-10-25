# Data sources

Each source below was checked for terms before use. "Imported" means the text or data is bundled; "linked" means the app only links to the publisher.

## Bible texts: imported (public domain)

| Edition | Source | Basis | Notes |
|---|---|---|---|
| Douay-Rheims, Challoner revision, 1899 American edition | eBible.org `engDRA` USFM | Published 1899; distributed as Public Domain | Vulgate numbering |
| Clementine Vulgate 1598 with Glossa Ordinaria (Migne 1880) | eBible.org `latVUC` USFM | Public domain | Psalms are the Gallican Psalter. The glossa is carried as footnotes and extracted as `commentary/glossa/*` |
| World English Bible, Catholic book order | eBible.org `eng-web-c` USFM | Dedicated to the public domain; "World English Bible" is a trademark (text must not be altered) | **Not** an approved Catholic translation. Tobit, Judith, Sirach, Esther, Daniel follow the Greek |

Checksums and retrieval dates: `data/provenance/fetched.json`.

## Bible texts: not imported

| Edition | Why | What it would take |
|---|---|---|
| RSV-CE, RSV-2CE | © (Ignatius Press / NCC) | Licence + text; the `english` scheme mapping is ready |
| NABRE | © CCD/USCCB; USCCB limits reproduction | Written permission; add a `hebrew` scheme (NABRE counts psalm titles as verses) |
| Jerusalem Bible / NJB | © Darton, Longman & Todd | Licence |
| CPDV (Catholic Public Domain Version) | Dedicated to the public domain, but a machine-readable authoritative source and rights statement were not verified | Verify, then add an entry to `data/registry/editions.json` |
| Anything via a Bible API | Needs credentials and per-edition terms | Implement a provider using your API key |

## Cross-references: imported

OpenBible.info Cross References, **CC BY 4.0**. 341,295 positive-vote pairs (66 protocanonical books; no deuterocanon), converted from KJV numbering to the anchor, top 12 per verse. Attribution is shown in the study panel and `public/data/xrefs/_provenance.json`.

## Fathers and commentary: imported (public domain, via CCEL)

CCEL publishes these as downloadable ThML. Translators and print sources are recorded per work (`library/index.json`).

- Catena Aurea (Aquinas), Gospels of Matthew and Mark (London 1842). Luke and John are not available from CCEL under these ids.
- Augustine: Tractates on John (NPNF1-07), Expositions on the Psalms (NPNF1-08), Confessions (Pusey, 1838).
- John Chrysostom: Homilies on John (NPNF1-14), on Matthew (NPNF1-10).
- Athanasius: On the Incarnation (NPNF2-04). Cyril of Jerusalem: Catechetical Lectures (NPNF2-07). Irenaeus: Against Heresies (ANF1).
- Teresa of Ávila: Interior Castle (Stanbrook Benedictines/Zimmerman, 1921). Catherine of Siena: Dialogue (Thorold, 1896). Brother Lawrence: Practice of the Presence of God.

**Deliberately excluded** (status could not be verified; see `data/registry/library.json`, key `_excluded`): John of the Cross, *Dark Night* (CCEL has E. Allison Peers's 20th-century translation); Francis de Sales, *Devout Life* (no translator/rights in the record); Thomas à Kempis, *Imitation* (1949 translation).

Scripture links inside these works come from (a) the work's own section structure (Augustine's Tractate headings, Chrysostom's homily headings, Augustine's Psalm headings) = strongest; (b) `scripRef` tags in the CCEL edition = machine-tagged: shows where a passage is cited, not necessarily a commentary on it. The UI labels which.

## Cornelius a Lapide, *The Great Commentary* (English): imported (public domain, via Internet Archive OCR)

Cornelius a Lapide, S.J. (1567-1637), *The Great Commentary*, English translation by Thomas W. Mossman, B.A., "assisted by various scholars" (Matthew, Mark, Luke, John, 1-3 John; 1876 onward) and by W. F. Cobb, D.D. (1 and 2 Corinthians, Galatians), in the Catholic Standard Library, Edinburgh: John Grant, 1908 printings (3rd to 6th editions of Mossman's volumes). Source: the Internet Archive scans of the University of Virginia copies, items `TheGreatCommentaryOfCorneliusALapideV1` to `V8`, plain OCR text (`<id>_djvu.txt`) fetched once, 1.2 s apart, by `scripts/ingest/lapide.ts fetch` into `data/raw/lapide` (ignored by git). Rights: every volume's title page shows the 1908 Edinburgh imprint (pre-1929, public domain in the US) and the Internet Archive record carries the Public Domain Mark; the build refuses a volume where either check fails. The translators died in 1885 (Mossman) and 1941 (Cobb, as W. F. Geikie-Cobb); the UK term for both has also run out. Other Archive items for the same work (1876/1887 editions, Emory/Cornell copies) were not used.

The build (`buildLapide`) writes `public/data/commentary/lapide/<BOOK>.json` (rows `[c1, v1, c2, v2, text]`, same shape as Haydock; the numbering is that of the printed Authorized Version text, which equals the app anchor for the New Testament) and `index.json` (volumes, translators, imprint, per-book and per-chapter coverage). Books: MAT, MRK, LUK, JHN, 1JN, 2JN, 3JN, 1CO, 2CO, GAL. Not translated in this edition, so absent: Acts, Romans, Ephesians onward, Hebrews, James, 1-2 Peter, Jude, Revelation and the whole Old Testament.

How the text is made: chapter headings are found in order; running heads, page numbers, scan stamps and the printed Bible text are removed; commentary is anchored by `Ver. N.` blocks, or (mostly Matthew 1-23) by matching the words a paragraph opens with to the printed verse; a paragraph that cannot be placed stays with the block before it, so nothing is dropped. Line-end hyphens are joined unless the volume itself spells the compound with a hyphen. Only typography is repaired (space before punctuation, the backslash the OCR makes of an italic comma); words are never corrected, so OCR slips (`bom` for `born`, Greek words garbled) remain. Not ingested: the general preface and the introductions that precede Chapter I of the Gospels and Johannine Epistles. Where a chapter shows no verse structure it is kept as one chapter-level row (see `index.json`). Matthew 1-23 is coarser than the rest because Mossman's early volumes mostly head paragraphs with the verse words, not verse numbers; long rows there may cover several verses.

## Bible in a Year: imported (metadata only)

Official public RSS feed `https://feeds.fireside.fm/bibleinayear/rss` (Ascension). Stored: title, date, duration, description, links, enclosure URL, the publisher's embed URL. Audio is never copied; playback uses the publisher's own file/embedder. Passages come from the feed's keywords/description and are majority-voted across the yearly re-releases of each Day. Days 99 and 184 list no chapters in the feed and are flagged for review. Corrections go in `data/curated/biay-overrides.json`. No transcripts are published in the feed.

## Catechism of the Catholic Church: full text, quoted with permission

The English text (© Libreria Editrice Vaticana; USCCB for the United States) is built into the app from the Holy See's own edition at vatican.va (IntraText pages, fetched once, 1 s apart, by `scripts/ingest/ccc.ts fetch`). **The app's owner has stated that they have permission to quote the Catechism as much as they like**; that statement is the basis for including it, and the permission letter should be kept with the project. If that changes, remove `public/data/ccc` and the `ccc` build step.

The build writes `public/data/ccc/` (paragraphs in blocks of 100, plus an index of headings) and `public/data/ccc/scripture/<BOOK>.json`, the verse-to-paragraph index made from the Catechism's own Scripture footnotes (a footnote with no "Cf." is counted as a quotation of the verse). The study panel shows the paragraph text under each verse, and `/study/catechism` reads and searches the whole text. `data/curated/ccc-links.json` (hand-checked links) is still used for anything the footnotes miss.

## Bible dictionaries and Nave's Topical Bible: imported (public domain, via CCEL)

Three nineteenth-century reference works, fetched once each as ThML from CCEL (1.2 s apart, `scripts/ingest/dictionaries.ts fetch`; cached under `data/raw`, not committed) and built into `public/data/dictionary/` by `buildDictionaries`:

| Work | CCEL id | Edition | Public-domain basis |
| --- | --- | --- | --- |
| Easton's Bible Dictionary, M. G. Easton | `easton/ebd2` (not `ebd`, which 404s) | 1897 (3rd ed., 3 years after Easton's death); CCEL text from the Online Bible, illustrations omitted | CCEL Rights: Public Domain |
| Smith's Bible Dictionary, William Smith | `smith_w/bibledict` | 1884 (title page; the American edition revised by Hackett and Abbott) | CCEL Rights: Public Domain |
| Nave's Topical Bible, Orville J. Nave | `nave/bible` | 1896 per CCEL (first printed edition commonly dated 1896/97) | Public domain by age (Nave died 1917). CCEL leaves the Rights field blank for this work, so the basis is date and author's death, not a CCEL statement |

**These are Protestant works** of the nineteenth century (KJV text and numbering, Protestant canon and theology, often dated archaeology). The UI must label them as such wherever they appear, and should not present them as Catholic teaching; the Catholic sources (Catechism, Fathers, Haydock, Challoner) remain the authorities in the app.

Output: `easton.json` and `smith.json` (`{ source, edition, license, entries: [{ term, aliases?, text: [paragraphs], refs? }] }`, text as published with markup stripped), `nave.json` (`{ topics: [{ topic, subtopics?: [{label, refs, level?}], refs, see? }] }`, topic names as published in capitals), `nave-by-book/<BOOK>.json` (rows `[c1, v1, c2, v2, topicIndex]` in anchor numbering; a whole-chapter reference has v1 1 and v2 999), `terms.json` (lowercase term or alias to entry index, or an array of indexes when several entries share a name) and `index.json` (counts, attribution).

Scripture references are the ones CCEL tagged in the text (`scripRef`). Each is parsed with `parseRefs` on the printed passage, converted from KJV to the anchor (Clementine Vulgate) numbering with `convertRef`, and stored as an anchor id (`PSA.44.9`, `EXO.6.16-20`). Where `parseRefs` cannot read the printed abbreviation (Nave's "Joh", "Lu", "De", "Re", "So", lists such as "Ps. 22, 23, 28") or reads it differently from CCEL's own tag (Nave's "Jud" is Judges), CCEL's OSIS tag is used instead. References that are not tagged in the source are not extracted. References to books outside the app's canon (1-2 Esdras, 3 Maccabees, the Prayer of Azariah) and a handful of source typos are dropped and counted in the build report (`dictionary-*-refs.failed`); the individual cases are written to `data/raw/dictionaries-ref-failures.txt`.

## The Catholic Encyclopedia (1913): selected articles, public domain

A selection of articles from *The Catholic Encyclopedia* (New York: Robert Appleton Company, 1907-1914), as transcribed for New Advent (`newadvent.org/cathen`; its `robots.txt` allows this). The work is in the public domain in the United States. The New Advent transcription is a convenience copy that **sometimes modernizes spellings or words**, so it is kept as transcribed and never paraphrased. **Attribution is required wherever it is shown in the UI** ("The Catholic Encyclopedia, 1913, via New Advent"), with the link to the article (`url` in each file).

Only articles useful for Bible study are fetched, not the whole work: one per canon book (some books share an article, e.g. Pentateuch, Kings), biblical persons and places named in this app's own data plus well-known figures, and a modest set of Scripture topics. The list, with the reason for each pick, is `data/curated/cathen-select.json` (rows marked `"manual": true` and ids in `"drop"` survive regeneration). The New Advent alphabetical index lists only part of the work (about 4,900 entries) and has no articles for some books (Genesis, Numbers, Lamentations, Ezechiel, Micheas appear only if an article links to them); cross-links from fetched articles add further persons, places and topics, each confirmed against the article's real title.

`scripts/ingest/cathen.ts fetch` (User-Agent `StudyBibleApp/1.0`, at least 1.2 s between requests, resumable; raw HTML in `data/raw/cathen/`, git-ignored) and the `cathen` build step write `public/data/encyclopedia/`: `index.json` (articles with kind, word count, `refs` = the book id(s) for book articles, and verse-level `cites`), `names.json` (lower-case names and the app's own spellings to slug) and `a/<slug>.json` (title, author, URL, blocks of paragraphs, `{h}` headings and `{q}` quotations). `cites` come only from explicit citations in the text ("Gen., xii, 1", read in the Douay/Vulgate numbering the app anchors use) and from the article's own links to New Advent's Bible pages; "I/II Kings" citations are skipped because they are ambiguous. People and places have no `refs`.

## Butler's Lives of the Saints: full text, public domain (saint of the day)

Alban Butler (1710-1773), *The Lives of the Fathers, Martyrs, and Other Principal Saints* (first published 1756-59). Butler died in 1773 and every edition used here is pre-1929, so the text is public domain. Fetched once by `npx tsx scripts/ingest/butler.ts fetch` (1.2 s apart, identifying User-Agent) into `data/raw/butler` (ignored by git); `buildButler` (also run by `data:build`) writes `public/data/saints/butler/`: `MM.json` (`{ month, source, edition, days: { DD: [ { name, heading, text: [paragraphs] } ] } }`), `index.json` (source, edition, entry counts, missing days/months per month) and `names.json` (simplified lowercase saint names, "St."/"B." and titles stripped, to `["MM-DD"]`, for matching the liturgical calendar).

No single digital edition covers the year, so the months come from different editions:

| Months | Source | Edition | Quality |
| --- | --- | --- | --- |
| Jan, Feb, Mar | Project Gutenberg #20450 | New York: P. J. Kenedy, 1903 (transcribed by Geoff Horton) | hand-transcribed; doubtful readings marked `{...}` by the transcriber |
| Apr | archive.org `livesfathersmar03butlgoog` | Dublin: James Duffy, 1866, vol. IV (Google scan) | unproofread OCR |
| May | archive.org `livesoffathersma456butl` | New York: D. & J. Sadlier, 1846, vols. 4-6 | unproofread OCR |
| Jun | archive.org `livesfathersmar06butlgoog` | Dublin: James Duffy, 1866, vol. VI (Google scan) | unproofread OCR |
| Jul | Project Gutenberg #49604 | New York: P. J. Kenedy, 1908, vol. VII | proofread (Distributed Proofreaders) |
| Aug | archive.org `the_lives_of_the_fathers_martyrs_vol_viii_1866-alban_butler` | 1866 edition, vol. VIII (Google scan; the scan gives no publisher in its metadata) | unproofread OCR |
| Sep | archive.org `livesfathersmar00butlgoog` | Dublin: James Duffy, 1866, vol. IX (Google scan) | unproofread OCR |
| Oct, Nov, Dec | archive.org `livesoffathersm10butluoft` | New York: P. J. Kenedy, 1903, vol. 10 (Toronto scan) | unproofread OCR |

Not used: Baring-Gould's *Lives of the Saints* (a different work, Gutenberg #46947 etc.); Benziger's one-saint-a-day abridgement; 1950s-60s Virtue/Kelly editions (still in copyright).

Notes and limits:

- **Dates are Butler's 18th-century ones.** Feasts have since moved (for example, many are now on a different day or not in the Roman calendar at all), so a saint of today's calendar may be under another day, or absent. Use `names.json` to look a saint up and do not assume the same day.
- Text is as printed (archaic spelling, "Mahomet" and similar kept). Only line-break artifacts are repaired: hard-wrapped lines joined, end-of-line hyphens removed, running heads and page numbers dropped, paragraphs split by a page break rejoined. Footnotes, footnote markers and Gutenberg's `{page}` marks are left out; Gutenberg's `_italics_` marks are removed.
- **OCR months (Apr-Jun, Aug-Dec) have recognition errors** (for example "8t." for "St.", stray characters, a few missing or merged entries, odd headings). Entries are separated by finding capitalised headings, so a damaged heading can merge two entries or split one. `name` is the heading in title case; `heading` is the heading as printed. Day headings lost to OCR were located from the page running heads; the missing "MARCH V." line in the Gutenberg Jan-Mar text was restored from that book's own table of contents (St. Adrian opens March 5).
- Publisher advertisements after the last day of an OCR volume are cut off, by pattern; a few lines may remain.

## Official documents: linked

Vatican.va URLs (all checked to resolve). Authority labels follow the document type (conciliar constitutions = doctrine; encyclicals/exhortations = authoritative teaching).

## Liturgical calendar

Computed locally (Meeus Easter, seasons, cycles) and, when online, from LitCal (https://litcal.johnromanodorazio.com, open source), which also supplies national calendars and the readings of solemnities/feasts. **The Lectionary text is copyrighted and no open reference list exists for ordinary days.** Users can import a reference list they are licensed to hold, or type references; the app shows references and opens them in a bundled translation, never the Lectionary wording.

## Catholic Answers, Word on Fire, Ascension articles/videos: linked

No public API or reuse licence. The app provides labelled search links only (Catholic Answers search; a YouTube search for Bishop Barron; Ascension search). It never claims these sources discuss a given verse. Curated, individually verified links can be added to the schema if a partnership or editorial review is arranged.

## Added in the reading-and-home round

- **Catholic Public Domain Version (CPDV)**: Ronald L. Conte Jr.; dedicated to the public domain by the translator (sacredbible.org/catholic). Text from the scrollmapper/bible_databases JSON export (`data/raw/CPDV.json`). Vulgate numbering. No imprimatur. Rights statement could not be re-fetched at build time; re-verify before redistribution beyond this app.
- **Daily Mass reading references**: citations only (e.g. "Ephesians 2:12-22"), compiled by `scripts/fetch-readings.py` + `scripts/lectionary-curate.py` from bible.usccb.org daily pages, one request per second with an identifying User-Agent. USCCB's llms.txt permits AI crawling and analysis with attribution for non-commercial use and forbids full mirrors; no Lectionary text is stored. Output: `data/curated/lectionary-refs.json`.
- **Daily reflection**: `data/curated/daily.json` (maintainer's own catholic-daily-reflection project; most saint quotes unverified and shown as attributed) and `data/curated/daily-season/*.json` (seasonal triples; quotes verified verbatim against `public/data/library/works`).
- **Ambience audio** (`public/audio`, credits in `public/audio/index.json`): BigSoundBank/Joseph Sardin (CC0), Kevin MacLeod (CC BY 4.0), Musopen Chopin via Internet Archive (CC0), Schola Gregoriana of the Pallottine Seminary, Ołtarzew (CC BY-SA 3.0, OTRS-confirmed; share-alike applies to that recording).
- **Library additions**: see `data/registry/library.json` (rights evidence per work) and `_excluded` for works examined and rejected.

## Added in the councils, paths and audio round

- **Councils and documents**: seven ecumenical councils from Percival's NPNF2-14 (1900, CCEL, public domain); Trent (Waterworth 1848), Leo XIII's encyclicals (Benziger 1903), Pascendi (Burns & Oates 1907), Vatican I and the Syllabus (Devin-Adair 1912) from Internet Archive OCR (unproofread, pre-1929 publications). ~75 modern documents are link-only (`data/registry/church-documents.json`); no text stored. Rejected items are in `data/registry/library.json` `_excluded`.
- **Study paths** (`data/curated/paths`): introductions and questions written for this app; quotations verified word for word at build time (`scripts/ingest/paths.ts` drops any that do not match).
- **Daily quote verification** (`data/curated/daily-verify.json`, summary in `daily-verify-summary.txt`): 38 verified, 20 re-attributed, 308 unverified.
- **Audio**: 34 tracks (see `public/audio/index.json` for each licence and source). Hymn recordings from the Library of Congress National Jukebox carry a Public Domain Mark; Tudor Consort items are CC BY 3.0; Salve Regina and Kyrie are CC BY-SA.
- **Fonts**: Atkinson Hyperlegible and OpenDyslexic via @fontsource (SIL OFL).

## People, places and Greek lexicon: STEPBible and Theographic (open licences, checked first)

Build: `npx tsx scripts/ingest/names.ts fetch` then `build` (also run by `data:build` as step `names`); `verify [seed]` prints random people/places with their verses looked up in `public/data/bible/webc`. Raw files: `data/raw/names/` (git-ignored). Source checksums are in `public/data/reference/{step,theographic}/index.json`.

### A. STEPBible-Data (https://github.com/STEPBible/STEPBible-Data, commit ed476a8, retrieved 2026-10-20)

Licence evidence, README: "# STEPBible Data Repository **CC BY 4.0** ... **Include any part of STEPBible-Data in any software or publications** without requesting permission ... And you should: **Credit it** to "STEP Bible" linked to www.STEPBible.org". README: "Every individual has a description in brief, short and article length (created by Claude 3 AI)".
Each file's own header: "Data created by www.STEPBible.org based on work at Tyndale House Cambridge (CC BY 4.0) ... This licence allows you to: * Include any part of this data in software or publications [TIPNR adds: and send it to AI servers] without requesting permission * Download the data and reformat it for your application ... * You MAY make changes yourself, but you should include a note of changes ... * Refer others to github.com/STEPBible as the source of the data. Please do not [re]distribute it yourself / post copies of this data file elsewhere." No non-commercial term in any of the files read. We ship a reformatted, derived JSON (a change, noted below), not the original file, and link back.

| File | Used? | Why |
|---|---|---|
| `Proper Nouns/TIPNR - ... STEPBible.org CC BY.txt` | yes | header CC BY 4.0 |
| `Lexicons/TBESG - ... Greek ... CC BY.txt` | yes | header CC BY 4.0; definitions are Abbott-Smith / Middle Liddell (both public domain) |
| `Lexicons/TBESH - ... Hebrew ... CC BY.txt` | **no** (downloaded for the record only) | header CC BY 4.0, but also: "The Brief lexicon is based on Abridged BDB by Online Bible ... Permission should be gained from Online Bible before these definitions are applied in any project." A third-party condition we cannot meet; skipped, so there is no `lexicon-hebrew.json`. Revisit if Online Bible permission is obtained or STEP publishes the full BDB (TFBDB). |
| TFLSJ, TAGNT, TOTHT, TVTMS, tagged Bibles | not requested | |

Output (`public/data/reference/step/`): `names.json` (4,238 entries: 3,054 person, 1,007 place, 177 other; each `{id,name,kind,type,meaning,desc,notes,refs,forms,rel,lat,lon,area}`), `names-by-book/<BOOK>.json` (66 files, rows `[c1,v1,c2,v2,entryIndex]`, adjacent verses merged), `lexicon-greek.json` (11,035 entries keyed by extended Strong's, e.g. `G0746`; the 188 entries whose Strong's number STEP splits into several words are keyed by their disambiguated number, e.g. `G0001G`), `index.json`.
Handling: `kind` is person only for Male/Female (tribes, titles, gods, months are `other`; `type` keeps STEP's word); `refs` are the union of every sub-record's exhaustive reference list (the "Total" line is abbreviated "27ff" and is not used); `meaning` is STEP's @Brief; `notes` are @Short then the @Article paragraphs (adapted by STEP from Claude 3 Opus output, so show them as machine-written background); `lat`/`lon` come from STEP's map links (originally OpenBible geocoding, CC BY); EXCLUDED OTHER records (11) are skipped. STEP references use standard English (NRSV/KJV) versification, so each goes through `toAnchor('kjv', ...)`; of 34,959 references 32,755 were exact and 2,204 (6%) fall in chapters the app's `kjv` scheme lists as unverified (identity mapping kept, same as the other KJV-numbered datasets); 23 map to a run of anchor verses (kept as the run). 24 LXX-only references (prefix `LXX.`, Greek-OT numbering) are not mapped; 4 unparseable tokens ("etc") dropped. TIPNR covers the Protestant canon and NT only, so deuterocanonical names are absent.

Attribution line for the UI: **Names and Greek lexicon data from STEP Bible (STEPBible.org), created by Tyndale House, Cambridge; CC BY 4.0. Descriptions adapted from AI-generated text by STEPBible. Reformatted and renumbered for this app.**

### B. Theographic Bible Metadata (https://github.com/robertrouse/theographic-bible-metadata, commit 52e049e, retrieved 2026-10-20)

Licence evidence: `LICENSE` is the full "Attribution-ShareAlike 4.0 International" text; readme: "This work is free to use and copy under a Creative Commons Attribution-ShareAlike 4.0 International License. Please also credit the original sources ..., several of which have their own licenses." `docs/data-source-bibliography.md` lists: STEPBible TIPNR (CC BY 4.0), OpenBible.info geocoding (CC BY; checked on openbible.info/geo: "licensed under the Creative Commons Attribution license"), Easton's Bible Dictionary (1897, public domain), Pelagios/Pleiades/GeoNames (not used by us beyond coordinates), Floyd Nolen Jones's chronology (basis for dates), Todd Atwood (Acts dates).
**ShareAlike consequence:** the files under `public/data/reference/theographic/` are adaptations and must be offered under CC BY-SA 4.0 with the credit below; keep them separate from code and other data so the licence does not spread beyond them. Not ingested: Easton text, KJV verse text, `WordIndex`, geojson.

Output (`public/data/reference/theographic/`): `people.json` (3,067: name, title, aliases, gender, birth/death, father, mother, siblings, halfSiblings, partners, children, birth/death place, `first` mention anchor, `n` verse count), `places.json` (1,288, 1,262 with coordinates: name, aliases, lat, lon, kind, sub, partOf, verses), `events.json` (450: title, start, duration, approx, participants, places, verses), plus `people-by-book/`, `places-by-book/`, `events-by-book/` row indexes (`[c1,v1,c2,v2,index]`), `index.json`. There is no periods file in the repository, so events carry `start` (an ISO astronomical year such as `-4003`, or a calendar date) and `duration` instead. Dates are Floyd Nolen Jones's Ussher-style chronology, not consensus dates; show them as such. KJV numbering is converted with the `kjv` scheme (24,553 verse conversions, 23,205 exact, 1,348 in unverified chapters).

Attribution line for the UI: **People, places and events: Theographic Bible Metadata by Robert Rouse (viz.bible), CC BY-SA 4.0; built on STEP Bible TIPNR (CC BY 4.0) and OpenBible.info geocoding (CC BY). Dates follow Floyd Nolen Jones. Compacted and renumbered for this app.**


## Added in the audio, children's, videos and apologetics round

- **LibriVox recordings** (public domain; dedicated by the volunteers): the Douay-Rheims (id 18352) and World English Bible (21093) and recordings of about 55 library works, listed in `data/curated/librivox/build.py` after checking each title and author. File lists come from the LibriVox API and audio streams from archive.org; nothing is copied. Files are not timed, so each plays from its start.
- **Video library** (`scripts/videos/library.ts`, built to `public/data/media/video_library.json`): upload lists of 31 Catholic channels read from YouTube's public pages (about 41,000 videos), searchable at Study → Catholic video library. Titles that name a passage are matched to it and each such video was then checked through oEmbed before joining the catalogue below.
- **Video catalogue** (`data/curated/videos.json`, built into `public/data/media/videos.json`): every video was checked through YouTube's oEmbed endpoint (it exists and allows embedding) and attached to passages by what it is about. Sources: Fr. Tim Peters' chapter-by-chapter Bible studies (his own playlists), Catholic Productions (Brant Pitre), the St. Paul Center (Scott Hahn, John Bergsma), the Augustine Institute, Catholic Answers Live, Jimmy Akin, the Thomistic Institute, Breaking in the Habit, Pints with Aquinas, Godsplaining, ACTS XXIX, Bishop Barron, and Gospel readings and stories for children from MisterD418 (Gospel Readings for Kids), Holy Heroes and Catholic Kids Media. Link and embed only; nothing is copied. Ascension's Bible in a Year videos and its Bible Timeline introductions disable embedding, so they appear as link-only cards. Video lists were gathered from each channel's public pages; every entry's channel is confirmed through oEmbed and its passages are chosen from its title. About 1,560 videos, including Sunday homilies (Sundays with Ascension) attached to the readings of the Sunday they were given for. The Sunday's readings come from Catholic Culture's liturgical calendar pages, and each homily is matched to its Sunday by title and upload order; whether it addresses a given reading is not verified, and the card says so, including Trent Horn's own channel (Counsel of Trent).
- **Children's Bible** (`data/curated/kids/*.py` → `public/data/kids_stories.json`): original retellings written for this app.
- **Questions about the faith** (`data/curated/apologetics/`: `kw.py` and `a7.py` define the questions and their keywords, `resources.py` matches them to pages in Catholic Answers' public sitemap, `build3.py` writes `data/curated/apologetics.json`): a directory of links to resources written or presented by Catholic authors (Catholic Answers tracts, articles, Q&As, Bible Navigator and the Catholic Encyclopedia as hosted there, plus videos from the library below). No answers are written by the app; the verses and Catechism paragraphs are references only.
- **Gothic Bible initials** (`data/curated/art-gothic-bible.json`): Cleveland Museum of Art accession 2008.2 (open access, CC0), images reduced to 520 px wide.
- **Chapter line art** (`src/art/`): drawn for this app.

## Added in the prayer round

- **Divine Office psalter** (`data/curated/office/build.py` → `public/data/office/office.json`): from Divinum Officium (https://github.com/DivinumOfficium/divinum-officium, MIT licence), English data files: psalm texts in the Douay-Rheims version (public domain), the weekly psalter arrangement, antiphons, chapters, hymns, responsories and versicles for the ordinary Roman psalter. Ordinary-time weekdays and Sundays are built, with the seasonal chapters, responsories, hymns, versicles and collects of Advent, Lent, Passiontide and Eastertide; feasts, proper seasonal antiphons and the Office of Readings are not. The collect shown is the Second Sunday after Pentecost's, and the Sunday Benedictus and Magnificat antiphons are those of that Sunday, used as representative texts. To rebuild: clone the repository and run `python3 data/curated/office/build.py <path>/web/www/horas/English`.
- **Devotions** (`src/data/devotions.ts`): the traditional wordings of the Rosary, Angelus, Regina Caeli, Stations of the Cross, Seven Sorrows chaplet and the Divine Mercy chaplet (a private devotion; wording as widely published). Scripture is shown from the reader's translation and none is stored. The Stations marked "traditional" are not told in the Gospels, so a nearby prophecy is shown instead.
- **Prayer book** (`src/data/prayerbook.ts`): long-used traditional prayers. The Nicene Creed is given in the traditional pre-1970 English wording; the ICEL translation proclaimed at Mass today is copyrighted and not used. The Stations carry the prayers after St Alphonsus Liguori as commonly printed (adapted, not a verbatim edition).
- **Examination of conscience** (`src/pages/pray/ExaminationPage.tsx`): questions follow the Ten Commandments and precepts of the Church in the traditional pattern; written for this app; stores nothing.

## Added: podcasts and Eastern daily readings

- **Podcasts** (`data/curated/podcasts.json` → `public/data/media/podcasts.json` and `podcast/<id>.json`, built by `scripts/podcasts/build.ts` from each show's own public RSS feed and refreshed daily by the site build): the Catechism in a Year and the Rosary in a Year (Ascension), the Fr. Mike Schmitz podcast, Sunday Homilies, All Things Catholic, Catholic Answers Live, the Word on Fire Show, Bishop Barron's Sunday Sermons, Pints With Aquinas, The Catholic Talk Show, Pray As You Go, Father Simon Says, Veritas's Daily Gospel Reflection, Eastern Catholic Daily Readings, The Daily Readings of the Maronite Church, DivineOffice.org and Catholic Saints. Only titles, dates, lengths, a short description and the publisher's own page and audio address are stored; the audio is streamed from the publisher. Catechism paragraph numbers are read from each Catechism in a Year episode's description.
- **Byzantine daily readings**: fetched in the browser from the open Orthocal service (https://orthocal.info), which publishes the Byzantine lectionary, saints and fasting rules as references. Only references and names are used; the Scripture text is the reader's own translation. Orthocal follows the Julian reckoning of Pascha.
