# Social content: how a day of posts is made

Rules: the verse on every card is the Douay-Rheims (public domain, so no attribution line is needed beyond the translation name). The Mass readings are citations only: the lectionary text is copyrighted and is never posted. Catechism and Father lines are quotes, labelled. No prayer text is generated. A person reads every card before it goes out.

## Make a week

    npx tsx scripts/social/export.ts --from 2026-11-29 --days 7     # JSON in social-out/
    npx tsx scripts/social/cards.ts                                 # PNGs in social-out/cards/

Sizes: 1080x1350 (Instagram, Facebook, Threads), 1080x1920 (stories, Shorts), 1000x1500 (Pinterest). Pass `--format 1080x1350` for one.

## What each file holds

- `dailyWord`: the passage, its Douay verse, the first Catechism paragraph citing it, the day's Father line, the reflection question, and `needsReview` notes.
- `todaysClimb`: the seven Basilion questions for the day (the same ones players get, no answers). Post one as a plain card; the next morning post the rarest answers.
- `advent`: day N of 26 (Nov 29 to Dec 24 in 2026) with its Douay verse from the 24-day Advent plan (days 25 and 26 use the day's own reading).
- `feastFather`: the "From the Fathers" quote on its feast.

## Before posting

Check anything in `needsReview`. A Father line the app marks unverified, or a reading that could not be placed in the Douay numbering, needs a person. Catechism and commentary lines are quotes, not teaching of ours; a priest or catechist should read the first weeks.
