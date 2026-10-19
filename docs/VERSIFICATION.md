# Versification: how numbering differences are handled

Different editions number chapters and verses differently: Psalms 9–147 (Vulgate vs Hebrew), the title lines of the Psalms, Daniel 3/4, Job 39–41, dozens of one-verse shifts, and genuinely different texts (Tobit, Judith, Sirach, Esther, Daniel). The app makes this explicit.

## What is verified

- **Psalm chapters**: exact (Ps 1–8 same; 9 → 9–10; 10–113 → n−1; 114–115 → 113; 116 → 114–115; 117–146 → n−1; 147 → 146–147; 148–150 same).
- **Psalm verses**: English psalm titles are unnumbered while the Vulgate numbers them as verse(s). The number of Vulgate title verses for each psalm (0, 1 or 2) is a hand-reviewed table (`data/versification/psalm-title-offsets.json`), checked by reading both texts for every psalm. For 18 psalms (e.g. 2, 4, 20, 43, 44, 56, 66, 71–74, 100, 109, 126, 136, 139, 140, 146) the Vulgate also splits or merges a verse inside the psalm, so the title offset is right at the start and may be off by one later; these are flagged.
- **Job 39–41**, **Daniel 3/4 (external data)**: verified rules (both texts read at each boundary).
- **Psalm numbering display**: Vulgate psalms show their Hebrew/English number (and vice versa).

## What is flagged, not guessed

- ~70 other chapters where verse counts differ (Gen 49, Exod 40, Num 11–13, 20, 29–30, Josh, 1–2 Sam, Neh, Eccl, Song, Hos, Jonah, Mic, Mark 4/8/9, Acts 7/14/19, Rom 14/16, …). The mapping is identity with `exact: false`; the reader, parallel view and compare view show "numbering differs in this chapter".
- **Tobit, Judith, Sirach, Esther, Daniel** in WEB follow the Greek; chapter-level alignment only, with a notice. The Vulgate texts are Latin recensions that differ in content, not just numbering.

## Safety net

Notes, highlights and bookmarks record `originEdition`. The action bar warns when a selection maps inexactly. Search results fall back to native references. The tests (`tests/data.test.ts`) pin the verified behaviour.

## Extending

All rules are data (`[book, nativeChapter, v1, v2, anchorChapter, a1, a2]` tuples) generated in `scripts/ingest/bible.ts`. To verify another chapter, read both texts at the boundary, add the rule to `verifiedExtra`, rebuild; the chapter leaves the flagged list automatically. Adding NABRE needs a `hebrew` scheme (psalm titles counted as verses, Mal 3, Joel 4).
