# Licensing decisions

**Rule:** a text is bundled only if its public-domain/open status was verified from the publisher's own statement *and* the underlying date/authorship makes sense. "Old", "free online", or "on a Catholic website" is not evidence.

| Item | Decision | Evidence |
|---|---|---|
| DRB 1899, Clementine Vulgate, Glossa (Migne 1880) | Bundled | eBible.org marks them Public Domain; publication dates 1599–1899 |
| WEB (Catholic) | Bundled, unaltered wording | Dedicated to the public domain by the translators; trademark note preserved |
| OpenBible cross references | Bundled with attribution | CC BY 4.0 |
| CCEL texts (NPNF/ANF 1880s–90s, Pusey 1838, Thorold 1896, Stanbrook 1921, Catena 1842) | Bundled | Each work's translator and print date recorded in `library/index.json` (`rightsEvidence`) |
| Brother Lawrence | Bundled, flagged | CCEL rights field "Public Domain"; translator/edition not identified |
| Peers (Dark Night), 1949 Imitation, Devout Life (CCEL) | **Not bundled** | Translation date/status unverified |
| Catechism text | Not bundled | © LEV/USCCB; only numbers and check phrases stored |
| Lectionary / NABRE / RSV / NJB | Not bundled | Copyrighted |
| Bible in a Year, Word on Fire, Catholic Answers, Ascension | Metadata/links only | No reuse license |
| Traditional prayers (Our Father, Hail Mary, Memorare, …) | Bundled | Long-established traditional wording; ICEL liturgical texts excluded |

## Adding licensed content

1. Put the licensed file under `data/licensed/` (git-ignored) and add an adapter in `scripts/ingest/` that outputs the same pack shape.
2. Record `rights: "licensed"`, the license reference and permitted uses (offline? excerpt length?) in the registry; set `offlineAllowed` accordingly.
3. Do not commit it to a public repository unless the license allows redistribution.

## Attribution

Each edition's `attribution` string is displayed under every chapter; each study item shows its source and rights note; the Sources page lists everything.

## Round 2 additions
* Catena Aurea: CrossWire `Catena` module, `DistributionLicense=Public Domain` (checked at build time).
* Haydock Commentary: SermonIndex MyBible module, public domain (checked in module info).
* Extra library works: CCEL ThML volumes, each with translator and rights evidence in `data/registry/library.json`; John of the Cross (Peers), Devout Life and the 1949 Imitation are excluded.
* Summa Theologiae: index only (≤300-char snippets + link-out).
* Catholic Answers / Word on Fire / Ascension: link-only; CA's ToS forbid automated collection, so no crawl.
