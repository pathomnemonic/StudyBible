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
