# Work that can be handed to another model

Written 17 November 2026, at the end of the fourth cycle (`docs/CYCLE4_LOG.md`). Each block below is a complete prompt: paste it as it stands. They are ordered by value. None of them needs a decision from the owner except where it says so.

Every prompt assumes the repository `pathomnemonic/StudyBible`, Node 22, and these gates, which must all pass before the work is called done:

```
npm ci && npm run typecheck && npm test && npm run data:validate && npm run build && npm run budget && node scripts/audit-gate.mjs
```

---

## 1. Tell the client which sync changes the server refused

```
Repository: pathomnemonic/StudyBible. Files: server/app.ts (the POST /api/sync handler), src/sync/api.ts, src/sync/engine.ts, tests/server.test.ts, tests/sync-engine.test.ts, tests/sync-unsent.test.ts. Read docs/CYCLE4_LOG.md section 1 first.

Problem. The sync server counts refused changes (`rejected`) but does not say which ones. The client therefore treats a batch with any refusal as wholly unsent and resends all of it on every sync, for ever if one note is over the 256 KB limit.

Do this.
1. In server/app.ts, alongside `rejected`, build `refused: { table: string; uid: string; reason: 'shape' | 'too-large' | 'quota' | 'invalid' }[]` and return it in the response. Keep `rejected` as the count. Do not change PROTOCOL: this is an additive field and old clients ignore it.
2. In src/sync/api.ts add `refused?` to the type of `api.sync`.
3. In src/sync/engine.ts `runSync`: when the response has `refused`, call `markSent` for the batch minus the refused entries (match on table and uid). When the response has `rejected > 0` but no `refused` array (an old server), keep today's behaviour: mark nothing in that batch.
4. Return the refused list from `runSync` and, in src/sync/state.ts, make the error message name the first refused record's table and, for a note, its title, so the reader knows what to shorten. Never include note body text in the message.

Do not change: the last-writer-wins rule, the `_unsent` marker semantics, the cursor handling.

Tests to add (they must fail before your change):
- server: a batch of three where the second has a 300 KB payload returns rejected 1 and refused naming exactly that uid with reason 'too-large'.
- engine against the real server (follow the harness in tests/sync-unsent.test.ts): after one sync, the two good rows have `_unsent === 0` and the oversized one has `_unsent === 1`; a second sync pushes exactly one change.
- engine against a stubbed old server that returns only `rejected: 1`: nothing in the batch is marked sent.
```

## 2. Per-edition numbering for Romans 14 and 16

```
Repository: pathomnemonic/StudyBible. Read docs/VERSIFICATION.md and docs/CYCLE4_LOG.md section 6 first.

Problem. WEB-C prints the doxology of Romans at 14:24-26; the RSV-2CE and the Vulgate print it at 16:25-27 (the RSV has no 16:24). Both editions use the numbering table called `english`, so one rule set cannot be right for both, and Romans 14 and 16 are still listed as unverified.

Do this.
1. Confirm the facts from the shipped texts with `python3 scripts/versification/align.py webc ROM 14,16 --full` and the same for `rsv2ce`. Write what you see into the commit message.
2. Give WEB-C its own scheme for this, without disturbing anything else: in scripts/ingest/bible.ts add a scheme `webc` that is the `english` rules plus [ROM 14:1-23 = 14:1-23], [ROM 14:24-26 = 16:25-27], [ROM 16:1-24 = 16:1-24]; and add to `english` (RSV) the rules [ROM 14:1-23 = 14:1-23], [ROM 16:1-23 = 16:1-23], [ROM 16:25-27 = 16:25-27] only if the RSV-2CE text confirms it has no verse 24. Set WEB-C's `scheme` to `webc` in data/registry/editions.json and add 'webc' to the `Scheme` type in src/lib/types.ts.
3. Regenerate with `npx tsx scripts/versification/rebuild.ts` (it also updates editions.json; extend it to write the new `scheme` value for webc), then regenerate public/data/manifest.json with `npx tsx -e "import('./scripts/ingest/manifest.ts').then(m=>m.buildManifest())"`.
4. Search src/ for every comparison with the string 'english' and decide for each whether 'webc' must be treated the same. List each one and your decision in the commit message.

Tests: extend tests/versification-verified.test.ts with Romans for both editions, including the closure check (every verse of each side has a partner). `npx tsx scripts/versification/rebuild.ts --check` must pass.
Stop and report instead of guessing if the RSV-2CE text does not match the description above.
```

## 3. Verify the remaining unverified chapters (reading task)

```
Repository: pathomnemonic/StudyBible. Read docs/CYCLE4_LOG.md section 6 and the comment above `verifiedExtra` in scripts/ingest/bible.ts.

Task. For each chapter group printed by `python3 scripts/versification/survey.py webc english`, decide whether a verified rule can be written, write it, and prove it.

Rules of the work.
- The survey proposes; it is sometimes wrong about where a join is (it was wrong in Judges 21). For every line marked `**` and for the first and last verse of every shifted run, print both texts with `python3 scripts/versification/align.py webc <BOOK> <chapters> --full` and read them. Run the same for `rsv2ce` and `nabre`; a rule goes in only if WEB-C and the RSV-2CE have the same structure.
- A rule is [book, modernChapter, v1, v2, vulgateChapter, a1, a2]. Equal lengths mean verse-for-verse. Unequal lengths mean "these verses together are that verse". The rules for a chapter must cover every modern verse of that chapter.
- If a modern verse has no counterpart in the Vulgate at all (Genesis 49:32, Exodus 40:13), do NOT write a rule for that chapter. Leave it unverified and add one line to docs/VERSIFICATION.md saying why.
- Do not touch Psalms, Tobit, Judith, Esther, Sirach or Daniel.

After each book: `npx tsx scripts/versification/rebuild.ts`, regenerate the manifest (`npx tsx -e "import('./scripts/ingest/manifest.ts').then(m=>m.buildManifest())"`), add the chapters to the closure test list in tests/versification-verified.test.ts, run `npm test`. If an existing test fails because it used one of these chapters as its example of an unverified chapter, move that test to a chapter that is still unverified; do not delete the assertion.

Deliver: one commit per book, and a table in docs/CYCLE4_LOG.md (chapter, rule in words, or the reason it stays unverified).
```

## 4. Align Daniel for the NABRE

```
Repository: pathomnemonic/StudyBible. Read scripts/ingest/nabre-scheme.ts and docs/CYCLE4_LOG.md sections 5 and 6.

Problem. The Lectionary cites Daniel about 60 times in three years ("Daniel 3:25, 34-43", "Daniel 7:9-10, 13-14", "Daniel 13:1-9"). The NABRE arranges Daniel as the Vulgate does (the Song of the Three inside chapter 3; Susanna and Bel as chapters 13 and 14), unlike WEB-C, which follows the Greek order. But the `nabre` table inherits "compare by chapter only" for Daniel from WEB-C, so every one of these readings is marked approximate.

Do this.
1. With `python3 scripts/versification/align.py nabre DAN <chapter> --full`, compare the NABRE with the Douay text for every chapter 1 to 14. Expect identity in most chapters, a one-verse shift where the NABRE's 6:1 is the Vulgate's 5:31, and a difference at the 13/14 boundary. Record exactly what you find; do not assume.
2. In buildNabreScheme, stop skipping DAN; instead give it explicit rules from step 1 (a constant in that file, with a comment per chapter), and remove DAN from the nabre table's unalignedBooks. Leave TOB, JDT, EST and SIR as they are. Leave the `english` and `kjv` tables' treatment of Daniel unchanged; tests pin it.
3. Rebuild (`npx tsx scripts/versification/rebuild.ts`), regenerate the manifest.

Tests: in tests/lectionary-citations.test.ts add Daniel citations from public/data/lectionary/2026.json with the Vulgate verses you verified, each expected to be exact; add DAN chapters to a NABRE closure check modelled on the one in tests/versification-verified.test.ts (use the nabre edition's verse counts as the modern side).
Stop and report if any chapter does not align cleanly; leave that chapter approximate.
```

## 5. Rate limiter memory

```
Repository: pathomnemonic/StudyBible, file server/auth.ts, class RateLimiter; tests in tests/server.test.ts.

Problem. `hits` is a Map keyed by address or email that only shrinks when the same key is used again. A client that sends each request from a new key grows it without bound.

Do this: on every `take`, if the map has more than 10,000 keys, delete every key whose newest timestamp is older than the window; if it is still over 10,000, delete the oldest keys until it is at 10,000. Keep `take` O(1) in the common case (do the sweep at most once per window). Do not change the limits or the public interface.

Tests: 50,000 distinct keys leave at most 10,000 entries; a key at its limit is still refused immediately after a sweep; behaviour for a single key is unchanged (reuse the existing assertions).
```

## 6. Listening totals from two devices

Needs the owner's decision before it is started: it changes what a synced record means.

```
Repository: pathomnemonic/StudyBible. Files: src/lib/listening.ts, src/sync/engine.ts (the KEYED_TABLES branch of applyRemote), src/sync/merge.ts, tests/sync-conflicts.test.ts.

Problem. `episodeProgress` rows sync last-writer-wins per episode. Each row carries `listeningDays: Record<date, { seconds, completions }>` and `heard`. If two devices play the same episode before syncing, the older device's seconds for that day are discarded.

Proposed rule (confirm with the owner): position, duration and completed come from the newer row; `listeningDays` is merged per date by taking the larger `seconds` and the larger `completions` of the two (not the sum: the same listening may already be in both after an earlier sync); `heard` becomes the larger of the two values and of the sum over the merged days; `undatedHeard` and `undatedCompletions` take the larger. A merged row that differs from the server's goes back with `updatedAt = remote + 1` and `_unsent: 1`, exactly as joined note tags do (see `r.joined` in applyRemote).

Tests: two devices, 300 s and 500 s on the same day, either order of sync, both end with 500 s for that day and identical rows; different days are both kept; a third sync changes nothing.
```
