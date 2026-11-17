# Deep Waters — Krillion expansion

## Size and schedule

This batch contributes **2,416 distinct prompts**. Together with the 139 retained curated prompts, the bank contains **2,555 distinct prompts**, exactly 365 seven-question daily sets. The four-answer Evangelist-symbol question was removed rather than exempted from the minimum answer requirement.

## Question style

The generated prompts deliberately use familiar categories and simple constraints, in the style of accessible naming games:

- Name a saint or biblical place containing a letter.
- Starts with or ends with a letter.
- Contains one or both of two letters, exactly one of two letters, or one letter before another.
- Contains a letter more than once, or meets a short name-length / word-count condition.
- Three-letter combinations appear as a smaller family of variations.

There are 1,200 saint prompts and 1,216 biblical-place prompts. The letter and word constraints are deterministic filters over the shipped answer corpora, not invented trivia. Prompts are distinct by exact wording and stable ID; the selection rotates across prompt families rather than taking one contiguous block of a single template.

## Answer sources and completeness

- Saints: the app's saints-any corpus in deepWaters.generated.json, a compiled reference list of 539 entries before normalization and deduplication.
- Biblical places: the union of the app's places-* by-book corpora in deepWaters.generated.json, compiled from the OpenBible map/place data shipped with the app.

Each generated prompt has at least 25 distinct accepted answers, at least one non-normalized source alias, and display answers of no more than four words. Its answer list is complete for the filtered source corpus used to generate it. These are open prompts: the source corpus is not claimed to contain every valid saint or every biblical place, and an unlisted true answer should be treated as “not on our list,” not as universally false.

## Rarity and review

The source answers are ordered by their existing source tiers, then assigned the requested approximate 8/12/20/25/25/10 six-tier distribution once per source pool. Filtered prompts retain those shared answer objects and their tiers; every selected prompt is required to contain all six tiers. This is a deterministic editorial ranking, not player telemetry or measured familiarity. Shared answer objects keep the large prompt bank compact in memory.

All generated prompts have status: draft. They are excluded from the manual hash-review registry because the generator and dedicated tests validate the full generated set on every run. The tests check prompt uniqueness, word-count bounds, answer counts, all six tiers, source metadata, three canonical accepted answers, a source alias, a wrong-category rejection, and a near-miss rejection for every generated prompt. Human review remains required before publication.
