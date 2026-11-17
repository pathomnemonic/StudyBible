# Fourth cycle: running record

Branch `ccr-59fa9a7d-cl0z2v`, started 16 November 2026 from `6b42401`. Written as the work went, so that each change can be audited: what was wrong, how it was established, what was changed, how it is tested, and what was deliberately left alone.

The brief for this cycle: spend effort only where it is hard (faults that need reasoning across modules, races, clock and ordering problems, root causes behind checks that were patched repeatedly without being fixed) and act without asking.

Baseline on `6b42401` before any change: `npm ci`, `npm run typecheck`, `npm test` (163 files, 1,191 tests) and `npm run build` all passed.

## 1. Sync engine: local changes were inferred from clocks, and a global switch silenced the reader's own writes

Files: `src/db/db.ts`, `src/sync/engine.ts`, `src/sync/merge.ts`, `src/sync/state.ts`, `src/db/ops.ts`. Tests: `tests/sync-unsent.test.ts` (13 new), existing sync suites adapted.

Found by reading the engine against the database hooks and the server handler. None of these had a failing test; eleven of the thirteen new tests fail on the previous code.

| # | Fault | Consequence for a reader | Fix |
|---|---|---|---|
| S1 | `syncFlags.applying` was a global boolean held `true` across every `await` of a sync apply, a backup import, and a wipe. The database hooks consulted it for every write by anyone. | A note created while a sync was applying got no `uid` and so **never synced, permanently**. An edit in that window was not stamped, so it was never sent and could later be overwritten without a conflict copy. A deletion in that window left no tombstone (it stayed on every other device) and no copy in Recently deleted (it could not be undone). The audio player writes progress every five seconds and a sync starts 2.5 s after each edit, so the window was reached in ordinary use. | The switch belongs to the transaction: `quietly(tables, fn)` marks one Dexie transaction, and the hooks skip only writes made inside it (or its sub-transactions). A sync page is now applied in one such transaction, so it is also atomic. |
| S2 | "Has this row an unsent local edit?" was answered by `updatedAt > lastPush`, comparing another device's clock with this one's. | A device three minutes fast: its second edit to a note produced a needless "(other version kept at sync)" copy on every other device, and a note it deleted **came back** from the other devices. The same happened after any sync that was cut short (the last-push time is only stored at the end). | Rows carry an explicit marker, `_unsent`: `1` set by the hooks on every local write, `0` set when the server's version is applied or when a push is accepted. Marking as sent happens only after the whole pull of that request has been applied, and only if the row still carries the time it was pushed with. |
| S3 | The hooks stamped `updatedAt = Date.now()` unconditionally. | After the device clock went back (time-zone fix, manual change), edits were older than the last push and were **never sent**; an edit to a row last written by a fast device was older than the version it replaced and lost on the server. The hook also overwrote a caller's deliberately later stamp (`restoreFromTrash` moving a row past a future-dated tombstone did nothing). | Edit times are monotonic per row: `max(now, previous + 1, the caller's own later value)`. Tombstones likewise are never older than the row they delete. |
| S4 | Rows written by a backup import kept their file dates and bypassed the hooks. | Importing a backup while signed in did not send anything older than the last push: the imported notes existed on that device only. | Everything an import writes (rows, revived rows, tombstones) is marked unsent; file dates are kept. Exports strip the marker. |
| S5 | Tombstone and Recently-deleted copy were written when the delete *request* succeeded, not when the transaction committed. | A delete rolled back by a later failure in the same transaction left a tombstone, which then deleted the still-existing note on the server and on every other device. | Recorded on commit of the outermost transaction. |
| S6 | After signing out and in again the last-push time is 0, so every row counted as locally edited. | Every note changed on another device meanwhile produced a spurious conflict copy. | Follows from S2. Additionally, signing in to a *different* account now always starts that account's sync state from nothing, because "sent" on the device referred to the previous account. |

Also changed: the pull cursor is stored after each applied page (pages are atomic now), so an interrupted large first sync resumes instead of starting over; a merged record that differs from the server's (joined tags, a kept pin) is sent back as a newer version rather than relying on an equal-timestamp echo that other devices would ignore.

Compatibility: no schema version change (`_unsent` is not indexed). Rows from before the marker are classified once at the next sync, from the last-push time (the only evidence there is). The wire format and the server are unchanged; the marker is never sent or exported.

Left alone, on purpose:
- The server silently passes over a push older than its own copy, and caps a far-future client time. With per-row monotonic times this no longer loses a later local edit, but a device whose clock is far *behind* a second device's still loses a race it should win; fixing that needs server-assigned versions (a protocol change).
- Which rows of a batch the server refused is not reported, so a batch with one refusal is resent whole. Needs a protocol change.
- `episodeProgress` is last-writer-wins per episode across devices; listening totals from two devices in the same period are not added.

## 2. The two browser checks recorded as failing in the last cycle

Both were reproduced first (after pointing the pinned Playwright at the browser installed in this container).

**`e2e/datahealth.mjs`.** Cause confirmed as the previous record suspected, and then fixed at both ends rather than chosen between:
- The injected fault aborted "the next read of the notes store". After a repair, two things re-read it: the Data Health re-scan and the live queries elsewhere on the page. Whichever came first took the fault; when it was a live query, `dexie-react-hooks` threw during render and the page became "This page did not load".
- Product change 1: the re-scan now reads its six tables in **one read transaction** (`src/pages/library/DataHealth.tsx`). That is the right behaviour in itself (a collection and the note it points at are compared as they were at the same instant, so a sync landing between two reads cannot be reported as a broken link), and it gives the scan a shape nothing else on the page has, which the test now uses to aim the fault.
- Product change 2: `src/lib/live.ts` wraps `useLiveQuery` so a failed read is tried once more at once; a second failure is thrown as before. All 69 call sites import it. `tests/liveRetry.test.ts` shows the retry works, that the live query still observes later changes after a retry, and that without it one aborted read ends the query.
- Test change: the fault targets the scan transaction; the second half of the test used an unscoped "Restore" button that also matched the Recently-deleted list on the same tab (a strict-mode failure that had never been reached because the first half always failed). It is scoped to the health card. Nothing was loosened. Three consecutive passes.

**`e2e/mediacontrols.mjs` step 10 (offline notice).** The product was right. Step 9, added later, leaves the page on the programmes tab; step 10 then waited 20 s for a meditation button that is not on that tab, fell into its `catch`, and only changed tab without pressing play. No playback, so no notice. The step now opens the list while online, goes offline, presses play, and requires both the player and the notice. Passes.

## 3. The offline liturgical calendar was wrong on several days of the year

Files: `src/liturgy/compute.ts`, `src/liturgy/discipline.ts`. Tests: `tests/liturgy-calendar.test.ts` (new; dates checked against printed calendars for 2008, 2016, 2022 to 2029, plus whole-range properties for 2000 to 2100 in both calendars).

Found by reading the computation against the Universal Norms on the Liturgical Year and the Calendar. The existing tests covered Easter, Advent and a handful of names; none of the following.

| # | What the app showed | What is right | Cause |
|---|---|---|---|
| L1 | **Corpus Christi about seven weeks late** (2026: Thursday 23 July; U.S. Sunday 26 July) and an ordinary green weekday on the real day | Thursday after Trinity Sunday (4 June 2026), or the following Sunday where transferred | The offset from Easter (60/63 days) was compared with a count of days from Pentecost |
| L2 | United States, years when the Epiphany is 7 or 8 January (2018, 2023, 2024, 2029, 2030…): "Tuesday of the  week in Ordinary Time" (week 0, empty ordinal), then every Sunday before Lent one too low ("First Sunday" on the Second) | Week 1 starts the day after the Monday Baptism; the next Sunday is the Second | Week counted from the Sunday on or before the Baptism |
| L3 | 15 August: "Friday of the 19th week in Ordinary Time". Likewise St Joseph, the Annunciation, the Birth of John the Baptist, Sts Peter and Paul, All Saints, All Souls, the Immaculate Conception; and the Presentation, Transfiguration, Exaltation of the Cross and Lateran Basilica when they replace a Sunday | Named, ranked and coloured, with transfers (Sunday of Advent or Lent: Monday; St Joseph in Holy Week: Saturday before Palm Sunday; the Annunciation in Holy Week or the Easter octave: Monday after the Second Sunday of Easter; the Baptist meeting the Sacred Heart: 23 June) | Not computed offline at all |
| L4 | "Friday of Lent: abstain from meat" on **Friday 19 March 2027** (St Joseph), and "Friday: a day of penance" on any solemnity falling on a Friday | Canon 1251: no Friday penance on a solemnity | Follows from L3 |
| L5 | No Friday penance on any Friday from Christmas to the Baptism of the Lord | Only solemnities lift it; the days of the Christmas octave are not solemnities | Whole season exempted |
| L6 | Holy Family missing when Christmas is a Sunday (30 December 2022, 2033) | Kept on 30 December | Only a Sunday was looked for |
| L7 | Trinity, Corpus Christi, the Sacred Heart and Christ the King in green | White | Colour not set |
| L8 | Holy Family and the Baptism of the Lord ranked as solemnities | Feasts | — |
| L9 | United States: "Holy day of obligation: The Ascension. Mass is required today" on the Thursday, while the same calendar keeps the Ascension on the Sunday | The Thursday binds only in the provinces of Boston, Hartford, New York, Newark, Omaha and Philadelphia; the card now says "in some places" and names them | Two modules disagreed |

Limits, stated in the file header: memorials, the other saints' feasts and local calendars still come from the LitCal service when online. Two meetings that have no published ruling I could cite are resolved by the general rule (move to the next day): Sts Peter and Paul with the Sacred Heart (next in 2057) and the Baptist with Corpus Christi on a Thursday (2038). The U.S. question of whether the obligation follows the Immaculate Conception to Monday 9 December was left exactly as it was.

## 4. Extraordinary Form (1962): the Sundays between the 23rd and the last after Pentecost

Files: `src/liturgy/missaEF.ts`. Tests: `tests/missa.test.ts` (4 new, one over every year 1962 to 2100).

| # | What the app did | What the 1960 Code of Rubrics (no. 18) says |
|---|---|---|
| E1 | In a year with more than 24 Sundays after Pentecost, the 24th Sunday got the Mass of the *Last* Sunday (Matthew 24), which was then said again on the real last Sunday. 8 November 2026 was such a day. | The Mass of the 24th is said only on the last Sunday. |
| E2 | The remaining extra Sundays were counted forward from the first Epiphany Sunday that had been omitted (15 November 2026: the Fourth after Epiphany). | They are counted back from the end: the last extra Sunday is always the Sixth after Epiphany (15 November 2026: the Sixth). |
| E3 | The page of a resumed Sunday showed "Only the Latin text is in the source" for the prayers and readings, because the source lists these days by name only and the fallback to the Epiphany Sunday could never be reached. | The Collect, Epistle, Gospel, Secret and Postcommunion are those of the Sunday after Epiphany; the Introit, Gradual, Offertory and Communion are those of the 23rd Sunday after Pentecost. `resumedSunday()` composes exactly that from texts already in the app. The source's own copy of the chants on those days is identical to the 23rd Sunday's, which the test asserts. |

No data file was changed.

## 5. Mass readings: citations were read in the wrong numbering, and one form in ten was refused

Files: `src/liturgy/readings.ts`, `src/lib/refs.ts`. Tests: `tests/lectionary-citations.test.ts` (21 new, one of them over every reading shipped for 2026 to 2028).

| # | Fault | Example | Fix |
|---|---|---|---|
| R1 | The Lectionary cites the NABRE, which follows the Hebrew numbering. Citations were converted as if they were English (KJV) numbers, although a verified `nabre` table has been in the app since the NABRE was added. The result was marked exact. | Christmas, Mass during the Night, "Isaiah 9:1-6" opened 9:1-6 in the Vulgate (one verse early, losing "the zeal of the Lord of hosts"); "Malachi 3:19-20" pointed at verses the Vulgate does not have; "Joel 3:1-5" (Pentecost Vigil) opened the wrong chapter. Eight chapters used by the Lectionary were affected. | Converted with the `nabre` table. |
| R2 | The reference parser refused the forms the published lists actually use, and a refused citation was silently dropped: 215 citation forms over three years. | "Psalm 1:1-2, 3, 4 and 6", "Psalm 138:1-2ab, 2cde-3, 7c-8", "Cf. Mark 9:7", "Luke 2:22-40 or 2:22-32", a trailing full stop, "Acts 17:15, 22—18:1", "Esther C:12, 14-16, 23-25" | `cleanCitation()` normalises them; the lettered additions to Esther open the matching Vulgate section (marked approximate). |
| R3 | In a list, "30–19:3" after a chapter was read as chapters 30 to 19, an impossible range, and the whole reference was refused. This is in the shared parser, so it also affected references typed by the reader. | "2 Samuel 18:9-10, 14b, 24-25a, 30–19:3" | Continues from verse 30 of the chapter already named. A leading "1-2:3" is still a chapter range. |
| R4 | The parser limited chapters to the Vulgate's count, so "Joel 4" was refused although the caller, not the parser, decides the numbering. | "Joel 4:12-21" | Callers that know the text is in Hebrew numbering say so (`HEBREW_CHAPTERS`). |
| R5 | A responsorial psalm from a psalm that is two psalms in the Vulgate opened both. | "Psalm 116:12-13…" opened 114 and 115 | The cited verses decide (here 115). |
| R6 | A book name misspelt in the published list left the reading without a link. | "Phippians", "Sirarch", "2 Ttimothy" | Read as the one book it can be. |

After the change, 2,458 of 2,493 readings have a link. The 35 that do not are 33 stray `">` entries in the list itself (a gospel acclamation the source page did not cite) and two entries too garbled to read safely ("Psalm 23: 1-3a, 3b4, 5, 6", "Jonah 1:1–2:1-2, 11"); the test pins exactly that set. The data files were not edited.

Not solved here: chapters the numbering tables list as "unverified" stay marked approximate (John 6, Mark 4, 8 and 9, Matthew 17, several chapters of Acts). See section 6.

## 6. Verse numbering verified for the most-read New Testament chapters

Files: `scripts/ingest/bible.ts` (rules), `scripts/ingest/nabre-scheme.ts`, `scripts/versification/rebuild.ts` (new), `src/lib/versification.ts`, `public/data/versification.json`, `public/data/editions.json`, `public/data/manifest.json`. Tests: `tests/versification-verified.test.ts` (new, 17).

Until now ten New Testament chapters were "unverified": every reference into them from a modern Bible, a lesson, a devotion or the Lectionary was marked approximate, devotions and reading plans withheld their links, and "repair this address" refused. John 6 alone is cited 55 times in three years of Mass readings.

**How each rule was established.** A verse aligner (dynamic programming over shared wording, allowing one-for-one, one-for-two and two-for-one) was run between the Douay text and each of WEB-C, the RSV-2CE and the NABRE. All three gave the same structure for every chapter below, and I read both sides of every join. Then the rules were entered in the generator, not in the data file.

| Chapter | Modern numbering → Vulgate |
|---|---|
| John 6 | 6:51 = 6:51-52; 6:52-71 = 6:53-72 |
| Mark 8, 9 | 9:1 = 8:39; 9:2-50 = 9:1-49 |
| Mark 4 | 4:40-41 = 4:40 |
| Matthew 17 | 17:14-15 = 17:14; 17:16-27 = 17:15-26 |
| Acts 7 | 7:55-56 = 7:55; 7:57-60 = 7:56-59 |
| Acts 14 | 14:6-7 = 14:6; 14:8-28 = 14:7-27 |
| Acts 19 | 19:40-41 = 19:40 |
| 2 Corinthians 13 | 13:12-13 = 13:12; 13:14 = 13:13 |
| Revelation 12 | 12:17 = 12:17-18 |

**Old Testament, second pass.** Twenty more chapters with one clean difference were verified the same way: Genesis 50; Leviticus 26; Numbers 11, 12, 13, 20, 29, 30; Joshua 4, 5; Judges 5, 21; 1 Samuel 20, 23, 24; 1 Kings 22; 1 Chronicles 11, 20; Ecclesiastes 4 to 7; Hosea 2, 13, 14; Jonah 1, 2. Typical cases: Jonah 1:17 is the Vulgate's 2:1, Ecclesiastes 5:1 is 4:17, Hosea 13:16 is 14:1, Numbers 12:16 is 13:1, 1 Samuel 23:29 is 24:1. In Judges 21 the aligner put the join one verse early (it paired 21:23-24 with 21:23); reading the text shows 21:24-25 are the Vulgate's 21:24, and the rule follows the text. That is the reason every join is read. Unverified chapters: english and kjv 78 → 51 (of which 18 are Psalms with an internal split), nabre 101 → 80. The tools are in the repository: `scripts/versification/align.py` and `survey.py`.

**Reproducible.** There are no publishers' downloads in this container, so `npm run data:build` cannot run. `scripts/versification/rebuild.ts` runs the same `buildVersification` code over the edition files already shipped. Before any rule was added it reproduced the shipped `english` and `nabre` tables exactly, rule for rule in the same order. It found one divergence: the shipped `kjv` table lists Tobit, Judith, Esther, Sirach and Daniel as "compare by chapter", but the generator said `unalignedBooks: {}`, so the next full rebuild would have silently marked every Sirach cross-reference as exact. The generator now says what the shipped file and its tests say. `npx tsx scripts/versification/rebuild.ts --check` fails if the file and the code ever disagree again.

**Two supporting changes.**
- `convertRef` treats a passage as exact when an end of it is one verse that a verified rule maps to a whole group (John 6:51-58 becomes 6:51-59, exact). A single half-verse is still reported as inexact (Matthew 17:15 points at 17:14, marked).
- In the NABRE table a verified group no longer marks its whole chapter unverified.

**Tests re-pointed, not loosened.** Eleven existing assertions used John 6 or Mark 4 as their example of an unverified chapter. Each now uses a chapter that is still unverified (Romans 14, Jonah 1, Ecclesiastes 6), so the caution they test is still tested, and each gained an assertion of the new, correct result where there is one.

**Left unverified, with reasons.** Romans 14 and 16 (WEB-C prints the doxology at 14:24-26, the RSV and the Vulgate at 16:25-27: one table cannot serve both editions; needs per-edition rules). Genesis 49 (the Vulgate has no verse for modern 49:32), Exodus 40, Joshua 21, Nehemiah 3 and 12, Job 16 and 42, the Song of Songs, Wisdom, Jeremiah 37, Baruch, Ezekiel 2, Amos 6, Micah 5, Haggai and 1 and 2 Maccabees: each needs its joins read; some have a verse with no partner. For the NABRE, Matthew 17, Mark 4, Acts 7, 14 and 19, 2 Corinthians 13 and Revelation 12 now map to the right verses but are still labelled approximate, because the NABRE-to-WEB matching has an unpartnered verse in each. Daniel in the NABRE follows the Vulgate's own arrangement and could be aligned directly; not done.
