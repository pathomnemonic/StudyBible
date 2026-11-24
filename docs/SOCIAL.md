# Social content: how a day of posts is made

Rules: the verse on every card is the Douay-Rheims (public domain). The Mass readings are citations only (the lectionary text is copyrighted). Catechism and Father lines are quotes, labelled; only a saint or Father line the app marks verified goes on a card. No prayer text is generated. A person reads every card before it goes out.

## One generator, two uses

`src/lib/dayCard/` draws the daily card. The app's one-click **Today's card** (Today screen, "🖼 Today's card", route `/card`) and the social export run the same drawing code (`draw.ts`), so a user's card and the day's post are the same picture.

Card content, centred, in order: date and liturgical day name; (Advent walk day); the word; the Douay-Rheims verse and reference; the date's own saint or Father line; the question; the Mass reading citations; the footer line. The footer lines are in `src/lib/dayCard/taglines.ts`: the owner's default on every other day, the alternates between, and an Advent-only line on Advent dates. Pass `--tagline <number|text>` to choose one for a run.

Where the content comes from: the word, verse and question for the first week are in `src/data/dailyWords.json` (date, word, verse, optional question). Any other day uses the Today card's own verse and question. The saint line is always the date's own entry in `public/data/daily/index.json`.

## Make a week

    npx tsx scripts/social/export.ts --from 2026-11-29 --days 26        # JSON in social-out/
    npx tsx scripts/social/cards.ts --slate --advent-only --out social-cards/advent-2026
    npx tsx scripts/social/audit-saints.ts                              # dates with no verified saint line

Sizes: 1080x1350, 1080x1920, 1000x1500 (`--format` for one). Cards with a picture are JPEG (about a tenth of the size of a PNG); add `--png` for PNG.

## Choosing the picture

Automatic: `src/lib/dayCard/art.ts` scores the app's library (646 public-domain or open-access paintings and engravings) by the passage, the word, the saint and the season, drops scenes of violence and scenes from the wrong part of the year, and never reuses a picture inside a 150-card window. Picks are recorded in `art-picks.json` beside the cards, so a re-run draws the same card.

By hand: `--date 2026-12-01 --art <library id or path to an image>` draws that date with your picture (and records it). A library id is the `id` in `public/data/art.json` or `art-more.json`. A picture from outside the library is not rights-checked by the exporter; the credit line says so.

`CREDITS.md` beside the cards lists each card's picture credit and footer line, for captions.

## Before posting

Check `needsReview` in the JSON and the "Needs attention" list the renderer prints. A date with no verified saint line gets a card without one and is listed by `audit-saints.ts`.
