# Contributing

Thank you for helping. This is a free Catholic study Bible that runs in the browser, so most changes are to data or to React pages.

## Set up
```
npm install
npm run dev        # the app
npm test           # unit tests (vitest)
npx tsc --noEmit   # type check
npm run build      # production build
npm run server     # optional account and sync server (see docs/SERVER.md)
```

## Where things live
- `src/` the app (pages in `src/pages`, the study panel in `src/study`, local data in `src/db`, sync in `src/sync`).
- `public/data/` built data the app reads. Most of it is generated; do not edit it by hand.
- `data/curated/` hand-curated sources and the small scripts that build them (videos, apologetics, children's Bible, art).
- `scripts/ingest/` the pipeline that builds Scripture, commentary and library data from public-domain sources (docs/INGESTION.md).
- `docs/DATA_SOURCES.md` every source and its licence. Add to it whenever you add data.

## Data rules
1. Cite the source and its licence before adding any text. Only public-domain or freely licensed text may be copied; for anything else link to the publisher.
2. Link and attribute, do not re-host audio or video.
3. Anchor ids follow the Clementine Vulgate (`BOOK.chapter.verse`); convert English numbering with `convertRef`.
4. Material the app wrote itself must be marked as such; do not present it as Church teaching.
5. Do not attach a video or article to a passage unless it is about that passage (or say plainly, on the card, how the link was made).

## Pull requests
Keep them small, run the tests and the type check, and say what you checked in a browser. Correct a wrong cross-reference, mapping or quotation with the book, chapter, verse and the source that shows the error.
