import { AUTO_TABLES, KEYED_TABLES, db, quietly, quietTables, syncFlags } from '../db/db';
import { DEFAULTS, getSettings, updateSettings } from '../lib/store';
import { api, ApiError, type RefusedChange, type WireChange } from './api';
import { hasContent, resolveConflict } from './merge';

/**
 * Record-level, last-writer-wins sync.
 *
 * Every user-created row carries a `uid` (stable across devices) and `updatedAt`. The database hooks mark each row changed on
 * this device as unsent (`_unsent: 1`); pushing sends the unsent rows and tombstones, and a row is marked sent only once the
 * server has taken the batch it travelled in and only if it has not changed again since. Pulling applies server rows newer than
 * the stored cursor. A row only overwrites a local row if its `updatedAt` is newer. Settings travel as one pseudo-record.
 *
 * "Unsent" used to be inferred by comparing `updatedAt` with the time of the last push. That guess is wrong whenever two clocks
 * disagree or a sync is cut short: a row that merely arrived from another device looked like a local edit (so the next change
 * from that device produced a needless "other version kept" copy, or a deletion was undone), and an edit made after the clock
 * was set back was never sent at all. The time comparison is kept only for rows written before the marker existed.
 */
const SETTINGS_UID = 'settings';
const SYNCED_SETTINGS = ['theme', 'fontSize', 'lineHeight', 'margin', 'fontFamily', 'defaultEdition', 'parallelEdition', 'showVerseNumbers', 'refNumbering', 'reminders', 'showStreaks', 'lectioMinutes', 'diocese'] as const;

const lk = (userId: string, name: string) => `studybible.sync.${userId}.${name}`;
const get = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const set = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

function settingsPayload() {
  const s = getSettings() as any;
  return Object.fromEntries(SYNCED_SETTINGS.map((k) => [k, s[k]]));
}

/** Has this row (or tombstone) a change the server has not accepted? Rows from before the marker existed fall back to the time of the last push. */
export const isUnsent = (r: { _unsent?: 0 | 1; updatedAt?: number }, lastPush: number): boolean => r._unsent === 1 || (r._unsent === undefined && (r.updatedAt ?? 0) > lastPush);
/** `since` 0 means this account has never been pushed to from here (first sign-in, or signed in again): everything goes. */
// Explicit sent/unsent markers override the initial-sign-in fallback. This matters when a
// first sync partially succeeds: accepted rows stay sent even though lastPush remains zero.
const due = (r: any, since: number) => r._unsent === undefined ? since === 0 || isUnsent(r, since) : r._unsent === 1;

async function collect(userId: string, since: number): Promise<WireChange[]> {
  const out: WireChange[] = [];
  const folders = await db.folders.toArray();
  const folderUid = new Map(folders.map((f) => [f.id, f.uid]));
  for (const name of AUTO_TABLES) {
    const rows = (await db.table(name).toArray()).filter((r: any) => r.uid && due(r, since));
    for (const r of rows as any[]) {
      const { id, _unsent, ...rest } = r;
      if (name === 'notes') {
        rest.folderUid = r.folderId ? folderUid.get(r.folderId) ?? null : null;
        delete rest.folderId;
      }
      out.push({ table: name, uid: r.uid, updatedAt: r.updatedAt ?? 0, payload: rest });
    }
  }
  for (const name of Object.keys(KEYED_TABLES)) {
    const rows = (await db.table(name).toArray()).filter((r: any) => due(r, since));
    for (const r of rows as any[]) { const { _unsent, ...rest } = r; out.push({ table: name, uid: String(r[KEYED_TABLES[name]]), updatedAt: r.updatedAt ?? 0, payload: rest }); }
  }
  for (const t of await db.tombs.toArray()) if (due(t, since)) out.push({ table: t.tbl, uid: t.uid, updatedAt: t.updatedAt, deleted: true, payload: {} });
  const sUpdated = Number(get(lk(userId, 'settingsUpdatedAt')) ?? 0);
  if (sUpdated > since) out.push({ table: 'settings', uid: SETTINGS_UID, updatedAt: sUpdated, payload: settingsPayload() });
  return out;
}

/**
 * Rows written before the unsent marker existed get it once, from the only evidence there is (their time against the last push),
 * so that from then on no decision rests on comparing clocks.
 */
async function stampLegacy(since: number): Promise<void> {
  const names = [...AUTO_TABLES, ...Object.keys(KEYED_TABLES), 'tombs'];
  await quietly(quietTables(), async () => {
    for (const name of names) await db.table(name).filter((r: any) => r._unsent === undefined).modify((r: any) => { r._unsent = (r.updatedAt ?? 0) > since ? 1 : 0; });
  });
}

/** The server took these: mark each one sent, unless it changed again while the request was in the air (then it stays unsent and goes next time). */
async function markSent(batch: WireChange[]): Promise<void> {
  if (!batch.length) return;
  await quietly(quietTables(), async () => {
    for (const c of batch) {
      if (c.table === 'settings') continue;
      if (c.deleted) {
        await db.tombs.where('tbl').equals(c.table).and((t) => t.uid === c.uid && t.updatedAt === c.updatedAt).modify({ _unsent: 0 });
        continue;
      }
      const keyed = !!KEYED_TABLES[c.table];
      if (!keyed && !(AUTO_TABLES as readonly string[]).includes(c.table)) continue;
      const t = db.table(c.table);
      const row: any = keyed ? await t.get(c.uid) : await t.where('uid').equals(c.uid).first();
      if (row && (row.updatedAt ?? 0) === c.updatedAt && row._unsent !== 0) await t.update(keyed ? c.uid : row.id, { _unsent: 0 });
    }
  });
}

async function rememberRemoteTombstone(table: string, uid: string, updatedAt: number): Promise<void> {
  const old = await db.tombs.where('tbl').equals(table).and((row) => row.uid === uid).first();
  if (old && old.updatedAt >= updatedAt) return;
  if (old) await db.tombs.update(old.id!, { updatedAt, _unsent: 0 });
  else await db.tombs.add({ tbl: table, uid, updatedAt, _unsent: 0 });
}

export async function applyRemote(userId: string, changes: WireChange[]) {
  if (!changes.length) return;
  const order = ['folders', ...AUTO_TABLES.filter((t) => t !== 'folders'), ...Object.keys(KEYED_TABLES), 'settings'];
  const sorted = [...changes].sort((a, b) => order.indexOf(a.table) - order.indexOf(b.table));
  const lastPush = Number(get(lk(userId, 'lastPush')) ?? 0);
  // One transaction for the page: it is applied whole or not at all, and only the writes made inside it skip the change hooks.
  // Whatever the reader writes while it runs waits its turn and is then stamped as a local edit, as it should be.
  await quietly(quietTables(), async () => {
    for (const c of sorted) {
      if (c.table === 'settings') {
        if (c.updatedAt > Number(get(lk(userId, 'settingsUpdatedAt')) ?? 0) && !c.deleted) {
          const patch: any = {};
          for (const k of SYNCED_SETTINGS) if (k in (c.payload ?? {})) patch[k] = c.payload[k];
          // synchronous, so the flag cannot cover anyone else's change
          syncFlags.applying = true;
          try { updateSettings({ ...DEFAULTS, ...getSettings(), ...patch }); } finally { syncFlags.applying = false; }
          set(lk(userId, 'settingsUpdatedAt'), String(c.updatedAt));
        }
        continue;
      }
      if (KEYED_TABLES[c.table]) {
        const t = db.table(c.table);
        const local: any = await t.get(c.uid);
        if (c.deleted) {
          const newerLocal = !!local && (local.updatedAt ?? 0) > c.updatedAt;
          if (local && !newerLocal) await t.delete(c.uid);
          // Persist server deletions locally: a backup made after sync must carry the deletion even
          // though the source device never performed this delete itself.
          if (!newerLocal) await rememberRemoteTombstone(c.table, c.uid, c.updatedAt);
        } else if (!local || (local.updatedAt ?? 0) < c.updatedAt) {
          await t.put({ ...c.payload, updatedAt: c.updatedAt, _unsent: 0 });
        }
        continue;
      }
      if (!(AUTO_TABLES as readonly string[]).includes(c.table)) continue;
      const t = db.table(c.table);
      let local: any = await t.where('uid').equals(c.uid).first();
      if (!local && c.table === 'saved' && c.payload?.key) local = await db.saved.where('key').equals(c.payload.key).first();
      if (c.deleted) {
        // another device deleted it, but this device edited it since the last sync: the writing is kept (and sent back as a live note) instead of being deleted silently
        const unsynced = local && isUnsent(local, lastPush);
        if (unsynced && (c.table === 'notes' || c.table === 'journal') && hasContent(local)) {
          await t.update(local.id, { updatedAt: Math.max(Date.now(), c.updatedAt + 1), _unsent: 1 });
          continue;
        }
        const newerLocal = !!local && (local.updatedAt ?? 0) > c.updatedAt;
        if (local && !newerLocal) await t.delete(local.id);
        if (!newerLocal) await rememberRemoteTombstone(c.table, c.uid, c.updatedAt);
        continue;
      }
      const row: any = { ...c.payload, uid: c.uid, updatedAt: c.updatedAt, _unsent: 0 };
      if (c.table === 'notes') {
        const fu = row.folderUid;
        delete row.folderUid;
        row.folderId = fu ? (await db.folders.where('uid').equals(fu).first())?.id : undefined;
      }
      if (local) {
        if ((local.updatedAt ?? 0) >= c.updatedAt) continue;
        // two devices edited the same record before either synced: the newer one wins field by field (see merge.ts), and whatever of the
        // other device's edit cannot be joined is kept as a copy with a stable id, so no edit is lost and syncing again adds nothing
        if (isUnsent(local, lastPush) && (c.table === 'notes' || c.table === 'journal')) {
          const r = resolveConflict(c.table, local, row);
          if (r.copy && !(await t.where('uid').equals(r.copy.uid).first())) await t.add({ ...r.copy, _unsent: 1 });
          // joined tags or a kept pin make the result differ from what the server holds: it goes back as a newer version, so every device ends up with the same record
          await t.put(r.joined ? { ...r.merged, id: local.id, updatedAt: c.updatedAt + 1, _unsent: 1 } : { ...r.merged, id: local.id });
        } else {
          await t.put({ ...row, id: local.id });
        }
      } else {
        // a record deleted on this device after the other device last wrote it stays deleted (the deletion is newer)
        const tomb = await db.tombs.filter((x) => x.tbl === c.table && x.uid === c.uid).first();
        if (tomb && tomb.updatedAt >= c.updatedAt) continue;
        delete row.id;
        await t.add(row);
      }
    }
  });
}

/** How many local changes have not been sent yet (for the sync status line). */
export async function pendingCount(userId: string): Promise<number> {
  return (await collect(userId, Number(get(lk(userId, 'lastPush')) ?? 0))).length;
}

export async function runSync(userId: string): Promise<{ pushed: number; pulled: number; rejected: number; refused: RefusedChange[] }> {
  const startedAt = Date.now();
  const since = Number(get(lk(userId, 'lastPush')) ?? 0);
  let cursor = Number(get(lk(userId, 'cursor')) ?? 0);
  await stampLegacy(since);
  const local = await collect(userId, since);
  let pushed = 0;
  let pulled = 0;
  let rejected = 0;
  const refusedChanges: RefusedChange[] = [];
  // batches are cut by size, not just count: the server refuses bodies over 6 MB and a note may be 256 KB
  const MAX_BYTES = 2_000_000, MAX_COUNT = 400;
  const batches: (typeof local)[] = [];
  for (let cur: typeof local = [], bytes = 0, k = 0; k <= local.length; k++) {
    const c = local[k];
    const size = c ? JSON.stringify(c).length : 0;
    if (!c || cur.length >= MAX_COUNT || (cur.length && bytes + size > MAX_BYTES)) { if (cur.length) batches.push(cur); cur = []; bytes = 0; }
    if (c) { cur.push(c); bytes += size; }
  }
  if (!batches.length) batches.push([]);
  for (const batch of batches) {
    let res = await api.sync(cursor, batch);
    const rejectedCount = res.rejected ?? 0;
    rejected += rejectedCount;
    const batchRefused = Array.isArray(res.refused) ? res.refused : undefined;
    const accepted = batchRefused
      ? batch.filter((change) => !batchRefused.some((item) => item.table === change.table && item.uid === change.uid))
      : rejectedCount === 0 ? batch : [];
    if (batchRefused) refusedChanges.push(...batchRefused);
    pushed += accepted.length;
    pulled += res.changes.length;
    await applyRemote(userId, res.changes);
    // each page is applied whole, so the place reached can be kept at once: a sync cut short later carries on from here
    cursor = res.cursor; set(lk(userId, 'cursor'), String(cursor));
    while (res.more) {
      res = await api.sync(cursor, []);
      pulled += res.changes.length;
      await applyRemote(userId, res.changes);
      cursor = res.cursor; set(lk(userId, 'cursor'), String(cursor));
    }
    // Only mark records the server accepted. An older server returns only a count, not identities;
    // in that case leave the whole batch unsent when any change was rejected.
    // markSent checks timestamps, so an edit made while the request was in flight remains unsent.
    await markSent(accepted);
  }
  // if the server refused anything, keep the old push time so those changes are sent again next time
  if (!rejected) set(lk(userId, 'lastPush'), String(startedAt));
  // tombstones older than this push have reached the server; keep recent ones for slow second devices
  await db.tombs.where('id').above(-1).filter((t) => t._unsent !== 1 && t.updatedAt < startedAt - 7 * 86400000).delete();
  return { pushed, pulled, rejected, refused: refusedChanges };
}

/** Mark settings as changed locally so the next sync carries them. */
export function touchSettings(userId: string | null) {
  if (userId) set(lk(userId, 'settingsUpdatedAt'), String(Date.now()));
}

export function resetSyncState(userId: string) {
  for (const n of ['cursor', 'lastPush', 'settingsUpdatedAt']) {
    try {
      localStorage.removeItem(lk(userId, n));
    } catch {
      /* ignore */
    }
  }
}

export async function localDataCount(): Promise<number> {
  let n = 0;
  for (const t of [...AUTO_TABLES, ...Object.keys(KEYED_TABLES)]) n += await db.table(t).count();
  return n;
}

export async function wipeLocalUserData() {
  // no tombstones for a deliberate local wipe
  const tables = [...quietTables(), 'history', 'recentSearches'];
  await quietly(tables, async () => { for (const t of tables) await db.table(t).clear(); });
}

export { ApiError };
