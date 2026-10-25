# The data files, as an API

Everything the app knows is plain JSON under `public/data/`, served as static files. There is no server API for it; read the files directly. Rights per item are in `public/data/licenses.json`: respect them (some files are metadata and links only).

| Path | Contents |
|---|---|
| `editions.json` | Bible editions: id, name, numbering scheme, rights, attribution, verse counts |
| `bible/<edition>/<BOOK>.json` | `{ id, chapters: [{ n, blocks: [[kind, [[verse, text], ...]]], notes }] }` |
| `versification.json` | Rules for mapping verse numbers between editions |
| `xrefs/<BOOK>.json` | Cross-references (OpenBible, CC BY) |
| `commentary/…`, `library/…` | Public-domain commentary and works, by section |
| `topics/`, `doctrine/`, `terms/` | Editorial indexes pointing at passages |
| `reference/…` | Outlines, genealogies, journeys, Theographic people/places/events (CC BY-SA) |
| `office/office.json` | The Divine Office psalter and seasons |
| `media/*.json`, `apologetics.json` | Links to recordings, videos and resources written by others |
| `manifest.json` | The offline packs and Bible editions with file sizes and SHA-256 prefixes |

**References** are anchored to the Clementine Vulgate numbering: ids look like `JHN.6.51` or `PSA.22.1-6`. The app converts typed references with `convertRef` in `src/lib/versification.ts`.

**Your own data** leaves the app as the JSON backup (`format: "studybible-export"`, versioned), the password-protected form of it (`studybible-encrypted`) or the Markdown vault (`studybible-vault`, with `index.json`).
