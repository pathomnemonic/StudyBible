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

## Catechism: linked, with verified verse links

The Catechism text is © LEV/USCCB and is not stored. `data/curated/ccc-links.json` holds paragraph numbers and a distinctive phrase; `npm run verify:ccc` fetches each paragraph (single pages, 2 s apart) from the Charles Borromeo mirror of the Vatican text and keeps only links whose phrase is present. Paragraph links open the online text. The full Scripture index of the CCC would need a licensed data file.

## Official documents: linked

Vatican.va URLs (all checked to resolve). Authority labels follow the document type (conciliar constitutions = doctrine; encyclicals/exhortations = authoritative teaching).

## Liturgical calendar

Computed locally (Meeus Easter, seasons, cycles) and, when online, from LitCal (https://litcal.johnromanodorazio.com, open source), which also supplies national calendars and the readings of solemnities/feasts. **The Lectionary text is copyrighted and no open reference list exists for ordinary days.** Users can import a reference list they are licensed to hold, or type references; the app shows references and opens them in a bundled translation, never the Lectionary wording.

## Catholic Answers, Word on Fire, Ascension articles/videos: linked

No public API or reuse licence. The app provides labelled search links only (Catholic Answers search; a YouTube search for Bishop Barron; Ascension search). It never claims these sources discuss a given verse. Curated, individually verified links can be added to the schema if a partnership or editorial review is arranged.
