import { db } from '../db/db';
import { exportAll, importAll } from '../db/ops';
import { getSettings, updateSettings } from '../lib/store';

/**
 * Backup to the person's own Google Drive: a hidden app folder (scope drive.appdata) that only this app can see, and that does not
 * show up among their files. The app stays local-first: the database in the browser is the working copy, and this keeps a few dated
 * copies of it (the last good ones are kept, so one bad save cannot overwrite the only backup).
 *
 * Nothing is sent until the person connects Drive, and nothing goes to any server of ours: the browser talks to Google directly.
 */
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const KEEP = 7;
const SAME_DAY_MS = 12 * 3600 * 1000;
const NAME = /^studybible-backup-(\d{8}-\d{4})\.json$/;

declare global { interface Window { google?: any } }

export const clientId = () => (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || getSettings().drive.clientId || '';
export const driveAvailable = () => !getSettings().localOnly && !!clientId();

let token: { value: string; exp: number } | null = null;
let gis: Promise<void> | null = null;
const loadGis = () => (gis ??= new Promise<void>((res, rej) => {
  if (window.google?.accounts?.oauth2) return res();
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.onload = () => res();
  s.onerror = () => { gis = null; rej(new Error('Google sign-in could not be loaded. Check your connection.')); };
  document.head.appendChild(s);
}));

/** An access token, asking Google only if needed; `interactive` allows the sign-in window (it must come from a tap). */
async function getToken(interactive: boolean): Promise<string> {
  if (token && token.exp > Date.now() + 60_000) return token.value;
  await loadGis();
  return new Promise<string>((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId(),
      scope: SCOPE,
      callback: (r: any) => {
        if (r.error || !r.access_token) return reject(new Error(r.error_description || r.error || 'Google did not give access.'));
        token = { value: r.access_token, exp: Date.now() + (+r.expires_in || 3600) * 1000 };
        resolve(token.value);
      },
      error_callback: (e: any) => reject(new Error(e?.type === 'popup_closed' ? 'The Google window was closed.' : e?.message || 'Google sign-in failed.')),
    });
    client.requestAccessToken({ prompt: interactive ? (getSettings().drive.connected ? '' : 'consent') : 'none' });
  });
}

async function api(path: string, init: RequestInit & { interactive?: boolean } = {}) {
  const t = await getToken(!!init.interactive);
  const r = await fetch(`https://www.googleapis.com${path}`, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${t}` } });
  if (r.status === 401) { token = null; throw new Error('Google asked to sign in again.'); }
  if (!r.ok) throw new Error(`Google Drive said ${r.status}.`);
  return r;
}

export interface BackupFile { id: string; name: string; modified: string; size: number }
const stamp = (d = new Date()) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

export async function listBackups(interactive = false): Promise<BackupFile[]> {
  const r = await api(`/drive/v3/files?spaces=appDataFolder&orderBy=modifiedTime desc&pageSize=50&fields=files(id,name,modifiedTime,size)`, { interactive });
  const j = await r.json();
  return (j.files ?? []).filter((f: any) => NAME.test(f.name)).map((f: any) => ({ id: f.id, name: f.name, modified: f.modifiedTime, size: +f.size || 0 }));
}

export async function connect(): Promise<void> {
  if (!driveAvailable()) throw new Error('Google Drive backup is not set up in this copy of the app.');
  await getToken(true);
  updateSettings({ drive: { ...getSettings().drive, connected: true, lastError: '' } });
  void navigator.storage?.persist?.();
  await backupNow(true);
}

export function disconnect() {
  try { if (token) window.google?.accounts?.oauth2?.revoke?.(token.value); } catch { /* none */ }
  token = null;
  updateSettings({ drive: { ...getSettings().drive, connected: false, lastError: '' } });
}

/** Upload the current data. Within twelve hours of the newest copy it replaces that copy; otherwise it adds a new one, and the oldest beyond seven go. */
export async function backupNow(interactive = false): Promise<void> {
  const body = await exportAll();
  const files = await listBackups(interactive);
  const newest = files[0];
  const boundary = 'sbbackup' + Math.random().toString(36).slice(2);
  const reuse = newest && Date.now() - +new Date(newest.modified) < SAME_DAY_MS;
  const meta = reuse ? {} : { name: `studybible-backup-${stamp()}.json`, parents: ['appDataFolder'] };
  const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  await api(`/upload/drive/v3/files${reuse ? `/${newest!.id}` : ''}?uploadType=multipart`, { method: reuse ? 'PATCH' : 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart, interactive });
  const all = reuse ? files : [{ id: '', name: '', modified: '', size: 0 }, ...files];
  for (const f of all.slice(KEEP)) if (f.id) await api(`/drive/v3/files/${f.id}`, { method: 'DELETE', interactive }).catch(() => undefined);
  updateSettings({ drive: { ...getSettings().drive, lastOk: Date.now(), lastError: '' }, lastBackup: Date.now() });
}

export async function restoreBackup(id: string, mode: 'merge' | 'replace'): Promise<number> {
  const r = await api(`/drive/v3/files/${id}?alt=media`, { interactive: true });
  return importAll(await r.text(), mode);
}

// ---- keep it current: a short while after the data changes, and at most about every ten minutes
let timer = 0;
let lastRun = 0;
let started = false;
export function startDriveBackup() {
  if (started) return;
  started = true;
  const schedule = () => {
    const s = getSettings();
    if (!s.drive.connected || s.localOnly || !clientId()) return;
    window.clearTimeout(timer);
    const wait = Math.max(90_000, 10 * 60_000 - (Date.now() - lastRun));
    timer = window.setTimeout(async () => {
      lastRun = Date.now();
      try { await backupNow(false); } catch (e: any) { updateSettings({ drive: { ...getSettings().drive, lastError: e?.message ?? 'Backup failed' } }); }
    }, wait);
  };
  for (const t of ['notes', 'highlights', 'bookmarks', 'journal', 'memory', 'planProgress', 'userLinks', 'media', 'folders', 'collections', 'userXrefs']) {
    const table = (db as any)[t];
    if (!table?.hook) continue;
    for (const h of ['creating', 'updating', 'deleting']) table.hook(h, () => { setTimeout(schedule, 0); });
  }
  // a quiet daily checkpoint when the app opens
  if (getSettings().drive.connected && Date.now() - getSettings().drive.lastOk > 24 * 3600_000) schedule();
}
