# Resource coverage: what is in the app, what is link-only, what is blocked

Status key: **In app** (data bundled, verse-linked) · **Links** (individual pages linked, text stays at the source) · **Search links** (built from the name + passage, not curated) · **License needed** · **Not done**.

## Official Church teaching
| Resource | Status | Notes |
|---|---|---|
| Catechism of the Catholic Church | In app (seed) | Paragraph numbers + the verified phrase; ~dozens of verse-level citations checked by hand. The full Scripture index needs the licensed text. |
| Dei Verbum | In app | Article numbers ↔ Scripture references, parsed from vatican.va (26 articles, 18 cite Scripture). Text not stored; links to vatican.va. |
| Verbum Domini | In app | 124 paragraphs parsed; 75 cite Scripture (from text and footnotes). |
| Providentissimus Deus, Spiritus Paraclitus, Divino Afflante Spiritu | Partly | Linked as documents; their old-style citations parse poorly (Providentissimus: 0, Spiritus Paraclitus: 22, Divino Afflante: 10 references). Pre-1965 Psalm citations are skipped (Vulgate numbering). |
| Pontifical Biblical Commission | Partly | *The Bible and Morality* (2008) and *The Jewish People and Their Sacred Scriptures* (2001) are in the list; neither yielded reliable verse references with the current parser. *The Interpretation of the Bible in the Church* (1993) has no English page on vatican.va that I could verify, so it is not linked. |
| Vatican II (Lumen Gentium, Sacrosanctum Concilium, Gaudium et Spes, Nostra Aetate, Unitatis Redintegratio) | Partly | Parsed from the main text only; footnote-only citations are not captured (LG: 0, UR: 0). |
| Deus Caritas Est, Spe Salvi, Evangelii Gaudium | In app | |
| Papal catecheses, homilies, audiences | Not done | Needs hand-curation per item (see "How to add links"). |

## Church Fathers and ancient commentary (public-domain translations from CCEL)
In app: Augustine (Tractates on John, Enarrations on the Psalms, Sermon on the Mount, Harmony, City of God, On Christian Doctrine, Confessions), Chrysostom (Matthew, John, Acts, Romans, 1–2 Corinthians, Hebrews), Jerome (treatises, letters), Ambrose, Basil, Irenaeus, Origen (Against Celsus), Athanasius (Orations against the Arians, Incarnation), Cyril of Jerusalem, Leo the Great, Gregory the Great (Pastoral Rule), Cassian, Vincent of Lérins, Ephrem (selections), Justin Martyr, Ignatius of Antioch, Clement of Rome, John of Damascus, Aquinas (Catena Aurea for the four Gospels; Summa as an index only), Haydock, Glossa Ordinaria (Latin).
Not in app: Bede, Cyril of Alexandria (John, Luke), Gregory's *Moralia*, Hilary on Matthew/Psalms, Gregory of Nyssa (*Life of Moses*), Maximus the Confessor, Athanasius's *Letter to Marcellinus* (not in the NPNF volumes; the usual English translation is copyrighted), Origen's commentaries and homilies, Ancient Christian Commentary on Scripture (© IVP), Sources Chrétiennes (© Cerf), PG/PL (Latin/Greek originals; an index would be a large separate project).

## Saints and classical Catholic commentaries
Haydock: in app. Aquinas Catena: in app (Gospels). Not in app: Cornelius a Lapide, Bellarmine, Francis de Sales, Alphonsus Liguori, Bernard (Song of Songs), John of Ávila, Lawrence of Brindisi. Public-domain translations exist for some of these on Internet Archive but need per-book work to align to verses.

## Modern commentaries and study Bibles
Ignatius Catholic Study Bible, Navarre Bible, Catholic Commentary on Sacred Scripture, Jerome Biblical Commentary, Word on Fire Bible, ACCS, The Church's Bible, New Interpreter's Bible: **License needed.** None of their text is in the app. The data model can hold a publisher-supplied mapping (`data/licensed/`), and each could be linked by title if a person records which verses it treats.

## Modern scholars and media
Catholic Answers, Jimmy Akin, Trent Horn, Matt Fradd, Brant Pitre, Scott Hahn, Joe Heschmeyer, Karlo Broussard, Word on Fire: **Links** (curated individual pages) plus **Search links** for every passage.
Added as search-link sources: John Bergsma, Mary Healy, Peter Williamson, Curtis Mitch, Michael Barber, Matthew Levering, Edward Sri, Jeff Cavins, Tim Gray, Fr. Mike Schmitz, Catholic Productions, Augustine Institute, Thomistic Institute.
Not covered (no way to map a book to a passage without reading it): Raymond Brown, Fitzmyer, Meier, Murphy, Harrington, Francis Martin, Luke Timothy Johnson, Clifford, Ratzinger/Benedict XVI. They are in the registry's reach once a person records "this page of this book treats this passage".
The Bible in a Year plays in the app. The Catechism in a Year is a search link only.

## Historical and language references
Interlinear and lexicon: links to Bible Hub and Blue Letter Bible for every protocanonical verse. Bible Odyssey, BAS, New Advent, Thomistic Institute: registered as sources (link-only, not yet mapped to passages). Perseus, Dead Sea Scrolls, atlases, Biblical dictionaries: **Not done**.


## Coverage by verse (audit)
`npx tsx scripts/verify/coverage.ts` reads the generated data and reports, for each of the 35,809 anchored verses, what the app has. Run it after `npm run data:build` (add `--write` to refresh `data/provenance/coverage.json`, which a test reads).

- **Verse-level reading** (about 77% of verses at the last run): a Haydock, Challoner, Catena Aurea or Glossa note on the verse, a Father or saint whose text cites or covers it, or a curated page about a short span around it.
- **Chapter-level** (the remaining ~23%): every chapter of all 73 books gets Challoner's one-line chapter summary, three chapter reading links (Douay-Rheims with Challoner's footnotes at drbo.org, Douay-Rheims on New Advent, the NABRE with the US bishops' notes at bible.usccb.org), a Bible in a Year episode where the plan covers it, cross-references, and topic links. These are about the chapter, not the verse, and the app says so on each item.
- **Nothing:** 0 verses.

Weakest at verse level: 1–2 Maccabees, Judith, Tobit, Baruch, parts of Sirach, Numbers, Genesis, Ezekiel and Chronicles. Haydock's module has no deuterocanon, and Challoner's notes there are sparse. Closing the gap needs more hand-curated links or a public-domain commentary on those books (none found that was machine-readable).

### Sources added in this round
- **Challoner's annotations, chapter summaries and book introductions** (Douay-Rheims, 1749–1752) from Project Gutenberg #8300: about 1,850 notes, 1,293 chapter summaries, 71 introductions. Public domain; verse numbering is Douay/Vulgate.
- **Chrysostom on Galatians, Ephesians, Philippians, Colossians, 1–2 Thessalonians, 1–2 Timothy, Titus, Philemon** (NPNF 1st series vol. 13), with each homily tied to its verse span.
- **More Fathers, found by their tagged Scripture citations:** Clement of Alexandria, Tertullian, Hippolytus, Cyprian, Novatian, Lactantius, Augustine (letters, doctrinal, moral, anti-Manichæan, Donatist and anti-Pelagian writings), Eusebius, Theodoret, Jerome's *Lives*, Gregory of Nyssa.
- **Sunday homilies** from Word on Fire and Ascension, matched to the Gospel through the Lectionary (confidence shown on each item), and Word on Fire's calendar and Gospel-chapter index pages.
- **Roughly 900 hand-reviewed links** to Catholic Answers, Jimmy Akin, the St. Paul Center, Catholic Productions, Word on Fire, Ascension, New Advent, EWTN, the USCCB and Vatican documents. Each was checked from its title and search-result summary, not by reading the page; the row says so.

### Considered and not used
- **"Early Church Fathers Commentary" MyBible module (SermonIndex).** The Fathers' own works are public domain, but this module is a verse-by-verse compilation whose text has the form of the *Ancient Christian Commentary on Scripture* (IVP, in copyright): ellipsised excerpts with work citations and modern translations of Didymus, Oecumenius, Andreas and Philoxenus. A translation has its own copyright, and a compiler's "Public domain" label is not evidence of it, so the module is not imported. The same Fathers are brought in from the original public-domain translations instead (Schaff's *Ante-Nicene* and *Nicene and Post-Nicene Fathers*, CCEL), tagged to verses from the citations in the text.
- **Cyril of Alexandria on John and Gregory the Great's *Moralia* on Job** are linked, not copied: Cyril's commentary (Pusey and Randell, 1874/1885; Books 1–12 at tertullian.org, which marks its transcriptions public domain) and the *Moralia* (Oxford translation, 1844–50; Books I–XXXV at Lectionary Central). Each book is linked to the passage it explains. Cyril's book boundaries were inferred from each book's opening text, so a few verses may be off, and Books 3–4 and 10–11 are given as shared ranges.
- **Cornelius à Lapide module (SermonIndex).** Public-domain translations (1876–1908), but only 175 entries (parts of the Gospels and 1–2 Corinthians, Galatians); not yet imported because the Gospels are already well covered.
- **USCCB pages are linked by address pattern only.** The site returns a bot challenge to rapid requests, so I checked the pattern on a sample and through search results, not every chapter. The DRBO and New Advent patterns were checked on every chapter.

## How to add links (any of the above)
Add a row to `data/curated/external-resources.json` with the passages it treats, the exact page URL, and `basis` stating how you checked it; add the publisher to `data/registry/resource-sources.json` first. For a larger authorised dataset use `data/licensed/external-*.jsonl`.

## Reference tools (round 5)
| Tool | Status | Data and honesty notes |
|---|---|---|
| Original-language word study | In app (protocanon) | Greek: SBLGNT + MorphGNT (97.5% of words matched to a Strong's number). Hebrew: OSHB/WLC. Glosses are Strong's definitions, a concordance aid, not translations. Hebrew verse numbers are used only where the chapter lines up with the English count (or a Psalm differs by its title lines); otherwise the panel says so. Deuterocanon: not available. |
| Interactive maps | In app | 1,232 places (OpenBible geocoding, CC BY) on OpenStreetMap tiles; needs a connection. Locations are scholarly guesses; approximate ones are paler. |
| Concordance | In app | Exact-word search by book in DRB, WEB-C or the other English edition. |
| Topical index | In app | 6,350 topics from OpenBible (CC BY), community-voted; not doctrine. |
| Book introductions and outlines | In app, editorial | Written for this app (AI-assisted) for all 73 books; the outline also serves as a chapter-level summary in the reader. Not an official text. |
| Chapter summaries | Partly | One outline line per chapter (the section it belongs to), not a separate summary for every chapter. |
| Parables, miracles, prophecy-and-fulfilment, covenants | In app, editorial | 37 parables, 35 miracles, 36 prophecy/fulfilment pairs (the New Testament's own citations), 7 covenants. Not exhaustive. |
| Gospel synopsis | In app, editorial | 90 pericopes with parallels, shown side by side in the chosen translation. Groupings follow common synopses but are editorial. |
| Pauline argument outlines | In app, editorial | 13 letters plus Hebrews. |
| Genealogies and family trees | In app, editorial | 134 people with parents and passages; Matthew 1 and Luke 3 lines; differences between lists are noted, not resolved. |
| Knowledge graph | In app | Built on your device from your notes, questions, tags, passages, authors, Catechism paragraphs and collections; optional suggested links to doctrine topics are marked as suggestions. |

## Update: outside-article links (permission given by the maintainer)
The maintainer authorised adding more links to outside articles. ~90 more pages were added, each matched by hand from its title and a search-result summary and labelled that way in the app (`basis: title-and-summary`): Catholic Answers (Genesis 1–3, original sin, Melchizedek, images, binding and loosing, divorce, Mary as Mother of God, John 19, Trinity and baptism, John 1:1, apostolic succession, Acts 15, Romans 10:9, 1 Timothy 2:5, James 5:14, John 21), Word on Fire (John 6, Genesis), St. Paul Center, Catholic Productions, FORMED/Augustine Institute (Matthew series), EWTN and New Advent. Forum threads and shop pages were left out. Nothing is copied; each row is a title, URL and passage list.

## Round 6: accessibility, memorization, dashboard and more
| Feature | Honest status |
|---|---|
| Read aloud | Browser speech synthesis; quality depends on the device. No human audio Bible is bundled (no verified public-domain recording source); LibriVox is linked and recordings can be added to the media queue. |
| Accessibility | Light and dark high-contrast themes, system contrast preference, reduced motion, ARIA labels. Axe audit clean on the checked pages; no testing with real screen-reader users yet. |
| Memorization | SM-2-style scheduling, 15 themed sets (references only, text read from your translation), cloze/initials/audio recall. |
| Dashboard / reminders / widget | Customizable Today page; reminders work only while the app runs; widget page is a web view, not an OS widget. |
| Data portability | Export JSON/Markdown/CSV, preview before import, merge/replace, backup reminders, local-only mode. |
| Biblical theology explorer | 15 editorial themes; CCC numbers are section pointers I checked from memory of the Catechism's structure, so verify them. |
| Textual history | 28 variants written in cautious language; manuscript details are from standard scholarship and need checking against a critical edition (e.g. NA28) before quotation. |
| Biblical world | 7 journeys, 9 eras, 12 finds; dates are conventional estimates. |
| Guided session, verse card, xref map, authors compared | Built on data already in the app. |
Not built: a community/study-group feature (needs a moderated server), hosted accounts with email reset, native widgets and push notifications, recorded audio Bibles.

## Round 7: lenses, explorers and sacred art
| Feature | Honest status |
|---|---|
| Lens notes (`data/curated/lens/*.json`) | Written for this app, in its own words, AI-assisted; each entry carries a `status` (attested, documented, supported, proposed, traditional, disputed, textual-fact, interpretive, editorial). References are validated against verse counts by `npm run data:build`. Coverage is selective. Verify before quoting. |
| Manuscripts | 26 entries describing codices, papyri and scrolls; link-only, no images. Dates are scholars' estimates. |
| Liturgy and hymn echoes | 38 entries naming where a text is heard; texts are named, not reproduced. Rubrics change; check the current Missal and Liturgy of the Hours. |
| Reception history | 15 passages; lists readings, does not endorse them. |
| Sacred art | `data/curated/art.json`: 39 paintings from The Met open access (CC0), each checked for `isPublicDomain` when built and re-hosted at reduced size under `public/art/`. 30 are linked to the scene they depict (`lens/art.json`). |
| Constellation, web of themes, voices timeline | Computed from existing data; the timeline uses the work dates in the library registry. |
| Word journeys, chapter word fingerprint | Computed in the browser from the Hebrew and Greek texts by Strong's number. Function words are excluded by a fixed list. |
| Manuscript viewer | `data/curated/manuscripts.json`: 13 Met open-access manuscripts (CC0); images hot-linked from images.metmuseum.org, not bundled. |
| Scripture universe, time and place | Computed on the device from existing cross-reference and era data. |
| Blind-spot detector, pronunciation coach, evidence meter | See `src/featureStatus.ts` for limits. |
Not built: the great codices as images (rights), combined per-event dating of places, a word-by-word comparison of modern translations, ancient (reconstructed) pronunciation.
