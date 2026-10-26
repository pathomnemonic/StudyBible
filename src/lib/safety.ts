import { useEffect, useState } from 'react';
import { db } from '../db/db';
import { download, exportAll, importAll } from '../db/ops';
import { localDataCount } from '../sync/engine';
import { BRAND } from './brand';
import { getSettings, updateSettings } from './store';

/**
 * Keeping a person's writing from being lost, with no paid service behind it: the browser is asked not to clear the data, a safety copy is
 * kept on the device each day, a backup file can be saved or shared in one tap, and the app nudges when a backup is overdue. An account or
 * Google Drive, when available, adds a copy somewhere else.
 */
const KEEP = 5;
const DAY = 86400000;
const snapKey = (iso: string) => `snap:${iso}`;
const ls = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

export interface Snapshot { key: string; at: number; bytes: number; records: number }

/** One safety copy per day on this device (the last few are kept). Protects against a bad import, a bug or an accidental delete; not against the browser clearing everything. */
export async function snapshotIfDue(force = false): Promise<boolean> {
  const n = await localDataCount();
  if (!n) return false;
  const rows = await db.cache.where('key').startsWith('snap:').toArray();
  const last = rows.reduce((m, r) => Math.max(m, r.ts), 0);
  if (!force && Date.now() - last < DAY) return false;
  const json = await exportAll();
  await db.cache.put({ key: snapKey(new Date().toISOString()), value: json, ts: Date.now() });
  const all = (await db.cache.where('key').startsWith('snap:').toArray()).sort((a, b) => b.ts - a.ts);
  for (const old of all.slice(KEEP)) await db.cache.delete(old.key);
  return true;
}
export async function listSnapshots(): Promise<Snapshot[]> {
  const rows = (await db.cache.where('key').startsWith('snap:').toArray()).sort((a, b) => b.ts - a.ts);
  return rows.map((r) => ({ key: r.key, at: r.ts, bytes: String(r.value).length, records: Object.values((JSON.parse(String(r.value)).counts ?? {}) as Record<string, number>).reduce((a, b) => a + b, 0) }));
}
export async function restoreSnapshot(key: string): Promise<number> {
  const row = await db.cache.get(key);
  if (!row) throw new Error('That safety copy is gone.');
  await snapshotIfDue(true); // keep what is there now, in case the restore is a mistake
  return importAll(String(row.value), 'merge');
}

/** Save everything as a file: the share sheet on phones (Files, Drive, iCloud, email), a download elsewhere. */
export async function saveBackupFile(): Promise<'shared' | 'downloaded'> {
  const json = await exportAll();
  const name = `studybible-backup-${new Date().toISOString().slice(0, 10)}.json`;
  let how: 'shared' | 'downloaded' = 'downloaded';
  try {
    const file = new File([json], name, { type: 'application/json' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) { await nav.share({ files: [file], title: `${BRAND.name} backup` }); how = 'shared'; }
    else download(name, json);
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    download(name, json);
  }
  updateSettings({ lastBackup: Date.now() });
  return how;
}

export const firstSeen = (): number => { const v = Number(ls('sb:first')); if (v) return v; const n = Date.now(); lsSet('sb:first', String(n)); return n; };
export const snoozeBackup = (days = 7) => lsSet('sb:backupSnooze', String(Date.now() + days * DAY));

/** Whether to nudge: there is something to lose, no account or Drive copy exists, and the last backup is old (or there never was one). */
export function backupDue(o: { records: number; signedIn: boolean }): boolean {
  const s = getSettings();
  if (!o.records || o.signedIn || s.drive.connected) return false;
  if (Date.now() < Number(ls('sb:backupSnooze') ?? 0)) return false;
  const since = s.lastBackup || firstSeen();
  return Date.now() - since > (s.lastBackup ? 14 : 3) * DAY;
}

export function useRecordCount(): number {
  const [n, setN] = useState(0);
  useEffect(() => { let live = true; const f = () => localDataCount().then((c) => live && setN(c)).catch(() => {}); f(); const t = window.setInterval(f, 60000); return () => { live = false; window.clearInterval(t); }; }, []);
  return n;
}
