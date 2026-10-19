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
