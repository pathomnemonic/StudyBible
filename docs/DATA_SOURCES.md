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

## Bible in a Year: imported (metadata only)

Official public RSS feed `https://feeds.fireside.fm/bibleinayear/rss` (Ascension). Stored: title, date, duration, description, links, enclosure URL, the publisher's embed URL. Audio is never copied; playback uses the publisher's own file/embedder. Passages come from the feed's keywords/description and are majority-voted across the yearly re-releases of each Day. Days 99 and 184 list no chapters in the feed and are flagged for review. Corrections go in `data/curated/biay-overrides.json`. No transcripts are published in the feed.

## Catechism of the Catholic Church: full text, quoted with permission

The English text (© Libreria Editrice Vaticana; USCCB for the United States) is built into the app from the Holy See's own edition at vatican.va (IntraText pages, fetched once, 1 s apart, by `scripts/ingest/ccc.ts fetch`). **The app's owner has stated that they have permission to quote the Catechism as much as they like**; that statement is the basis for including it, and the permission letter should be kept with the project. If that changes, remove `public/data/ccc` and the `ccc` build step.

The build writes `public/data/ccc/` (paragraphs in blocks of 100, plus an index of headings) and `public/data/ccc/scripture/<BOOK>.json`, the verse-to-paragraph index made from the Catechism's own Scripture footnotes (a footnote with no "Cf." is counted as a quotation of the verse). The study panel shows the paragraph text under each verse, and `/study/catechism` reads and searches the whole text. `data/curated/ccc-links.json` (hand-checked links) is still used for anything the footnotes miss.

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
