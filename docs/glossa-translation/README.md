# Finishing the Latin → English translation of the Glossa notes

The Glossa Ordinaria notes are shipped in Latin (`public/data/commentary/glossa/<BOOK>.json`). English translations live in
`data/curated/glossa-en/<BOOK>.json` and are shown inline. About 8,000 of the ~13,800 notes are done; **5,889 notes (~288,000 Latin
words) remain**, split into 48 files in `todo/` (about 6,000 Latin words each, so each fits comfortably in one conversation with a
long-context model).

## What to give the other AI

For each file `todo/todo-NNN.json`, paste the file contents after this prompt, and ask for the answer as one JSON object:

> You are translating medieval Latin (the Glossa Ordinaria, from Migne's Patrologia, with some OCR-garbled passages) into clear,
> faithful modern English for a Catholic study-Bible app. Below is a JSON object whose keys look like "GEN|1.1" and whose values are
> the Latin note for that verse. Return ONE JSON object with exactly the same keys, each value being your English translation.
> Rules: translate every entry completely, including quoted Bible phrases and long patristic quotations; keep the verse-number
> prefix at the start ("1.6 …"); stay close to the Latin sentence order; where the Latin is garbled or cut off, translate what can
> be understood and render the rest literally, never invent content and never add commentary; translate elisions such as
> "etc., usque ad …" literally ("etc., down to …"); use familiar English names (Moses, Isaiah, Augustine, Gregory); Dominus = the
> Lord, Deus = God; expand authority abbreviations (Aug. = Augustine, Hier. = Jerome, Greg. = Gregory); no footnotes, brackets or
> translator remarks; translate polemic as written. Output only valid JSON (escape quotation marks inside strings).

Save each reply as `translated-NNN.json`.

## Importing

    python3 scripts/glossa-import.py translated-000.json translated-001.json …
    npx tsx scripts/ingest/cli.ts build

The importer rejects entries that are empty, unknown, suspiciously short or still look like Latin, and prints which ones, so they can
be redone. Merged entries appear inline in the study panel the next time the app is built; entries without a translation keep
showing the Latin with a “Translate with Google” link.

## Why not on the device?

Browsers' built-in translators (Chrome's Translator API) do not include Latin, and the open Latin→English models that run in a
browser (Opus-MT family via Transformers.js) need roughly 100 MB of downloads and produce poor results on medieval commentary,
so they would not meet the quality bar for this app.
