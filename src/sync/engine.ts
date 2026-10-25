import { AUTO_TABLES, KEYED_TABLES, db, syncFlags } from '../db/db';
import { DEFAULTS, getSettings, updateSettings } from '../lib/store';
import { api, ApiError, type WireChange } from './api';

/**
 * Record-level, last-writer-wins sync.
 *
 * Every user-created row carries a `uid` (stable across devices) and `updatedAt`. Pushing sends rows newer than the last
 * successful push plus tombstones for deletions; pulling applies server rows newer than the stored cursor. A row only
 * overwrites a local row if its `updatedAt` is newer. Settings travel as one pseudo-record.
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

async function collect(userId: string, since: number): Promise<WireChange[]> {
  const out: WireChange[] = [];
  const folders = await db.folders.toArray();
  const folderUid = new Map(folders.map((f) => [f.id, f.uid]));
  for (const name of AUTO_TABLES) {
    const rows = (await db.table(name).toArray()).filter((r: any) => r.uid && (r.updatedAt ?? 0) > since);
    for (const r of rows as any[]) {
      const { id, ...rest } = r;
      if (name === 'notes') {
        rest.folderUid = r.folderId ? folderUid.get(r.folderId) ?? null : null;
        delete rest.folderId;
      }
      out.push({ table: name, uid: r.uid, updatedAt: r.updatedAt, payload: rest });
    }
  }
  for (const name of Object.keys(KEYED_TABLES)) {
    const rows = (await db.table(name).toArray()).filter((r: any) => (r.updatedAt ?? 0) > since);
    for (const r of rows as any[]) out.push({ table: name, uid: String(r[KEYED_TABLES[name]]), updatedAt: r.updatedAt, payload: r });
  }
  for (const t of await db.tombs.toArray()) if (t.updatedAt > since) out.push({ table: t.tbl, uid: t.uid, updatedAt: t.updatedAt, deleted: true, payload: {} });
  const sUpdated = Number(get(lk(userId, 'settingsUpdatedAt')) ?? 0);
  if (sUpdated > since) out.push({ table: 'settings', uid: SETTINGS_UID, updatedAt: sUpdated, payload: settingsPayload() });
  return out;
}

async function applyRemote(userId: string, changes: WireChange[]) {
  const order = ['folders', ...AUTO_TABLES.filter((t) => t !== 'folders'), ...Object.keys(KEYED_TABLES), 'settings'];
  const sorted = [...changes].sort((a, b) => order.indexOf(a.table) - order.indexOf(b.table));
  syncFlags.applying = true;
  try {
    for (const c of sorted) {
      if (c.table === 'settings') {
        if (c.updatedAt > Number(get(lk(userId, 'settingsUpdatedAt')) ?? 0) && !c.deleted) {
          const patch: any = {};
          for (const k of SYNCED_SETTINGS) if (k in (c.payload ?? {})) patch[k] = c.payload[k];
          updateSettings({ ...DEFAULTS, ...getSettings(), ...patch });
          set(lk(userId, 'settingsUpdatedAt'), String(c.updatedAt));
        }
        continue;
      }
      if (KEYED_TABLES[c.table]) {
        const t = db.table(c.table);
        const local: any = await t.get(c.uid);
        if (c.deleted) {
          if (local && (local.updatedAt ?? 0) <= c.updatedAt) await t.delete(c.uid);
        } else if (!local || (local.updatedAt ?? 0) < c.updatedAt) {
          await t.put({ ...c.payload, updatedAt: c.updatedAt });
        }
        continue;
      }
      if (!(AUTO_TABLES as readonly string[]).includes(c.table)) continue;
      const t = db.table(c.table);
      let local: any = await t.where('uid').equals(c.uid).first();
      if (!local && c.table === 'saved' && c.payload?.key) local = await db.saved.where('key').equals(c.payload.key).first();
      if (c.deleted) {
        if (local && (local.updatedAt ?? 0) <= c.updatedAt) await t.delete(local.id);
        continue;
      }
      const row: any = { ...c.payload, uid: c.uid, updatedAt: c.updatedAt };
      if (c.table === 'notes') {
        const fu = row.folderUid;
        delete row.folderUid;
        row.folderId = fu ? (await db.folders.where('uid').equals(fu).first())?.id : undefined;
      }
      if (local) {
        if ((local.updatedAt ?? 0) >= c.updatedAt) continue;
        await t.put({ ...row, id: local.id });
      } else {
        delete row.id;
        await t.add(row);
      }
    }
  } finally {
    syncFlags.applying = false;
  }
}

export async function runSync(userId: string): Promise<{ pushed: number; pulled: number; rejected: number }> {
  const startedAt = Date.now();
  const since = Number(get(lk(userId, 'lastPush')) ?? 0);
  let cursor = Number(get(lk(userId, 'cursor')) ?? 0);
  const local = await collect(userId, since);
  let pushed = 0;
  let pulled = 0;
  let rejected = 0;
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
    rejected += res.rejected ?? 0;
    pushed += batch.length - (res.rejected ?? 0);
    pulled += res.changes.length;
    await applyRemote(userId, res.changes);
    cursor = res.cursor;
    while (res.more) {
      res = await api.sync(cursor, []);
      pulled += res.changes.length;
      await applyRemote(userId, res.changes);
      cursor = res.cursor;
    }
  }
  set(lk(userId, 'cursor'), String(cursor));
  // if the server refused anything, keep the old push time so those changes are sent again next time
  if (!rejected) set(lk(userId, 'lastPush'), String(startedAt));
  // tombstones older than this push have reached the server; keep recent ones for slow second devices
  await db.tombs.where('id').above(-1).filter((t) => t.updatedAt < startedAt - 7 * 86400000).delete();
  return { pushed, pulled, rejected };
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
  syncFlags.applying = true; // no tombstones for a deliberate local wipe
  try {
    for (const t of [...AUTO_TABLES, ...Object.keys(KEYED_TABLES), 'tombs', 'history', 'recentSearches']) await db.table(t).clear();
  } finally {
    syncFlags.applying = false;
  }
}

export { ApiError };
