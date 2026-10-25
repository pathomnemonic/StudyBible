import { useEffect, useState } from 'react';
import { useSettings } from '../lib/store';
import { backupNow, clientId, connect, disconnect, driveAvailable, listBackups, restoreBackup, type BackupFile } from '../sync/drive';

const fmt = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Back up to Google Drive: connect once, and a dated copy is kept up to date by itself. */
export default function DriveBackup({ compact = false }: { compact?: boolean }) {
  const [s, set] = useSettings();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [files, setFiles] = useState<BackupFile[] | null>(null);
  const on = s.drive.connected;
  const run = async (f: () => Promise<unknown>, ok: string) => {
    setBusy(true); setMsg('');
    try { await f(); setMsg(ok); } catch (e: any) { setMsg(e?.message ?? 'That did not work.'); } finally { setBusy(false); }
  };
  useEffect(() => { setFiles(null); }, [on]);
  if (s.localOnly) return compact ? null : <p className="muted small">Local-only mode is on, so Google Drive backup is off.</p>;

  if (compact) {
    if (on || Date.now() < s.drive.nudgeUntil || !driveAvailable()) return null;
    return (
      <div className="backup-nudge" role="note">
        <div><strong>Keep your notes safe.</strong> Everything you write lives only in this browser. If its storage is cleared, or you change phones, it is gone. Back it up to your own Google Drive (a private app folder that no one else sees) and it keeps itself up to date.</div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn primary small" disabled={busy} onClick={() => run(connect, 'Connected. Your first backup is saved.')}>Back up to Google Drive</button>
          <button className="btn ghost small" onClick={() => set({ drive: { ...s.drive, nudgeUntil: Date.now() + 30 * 86400000 } })}>Not now</button>
        </div>
        {msg && <div className="small" role="status">{msg}</div>}
      </div>
    );
  }
  return (
    <div className="card" id="drive-backup">
      <h2 className="card-title">Back up to Google Drive</h2>
      <p className="small">Your notes, highlights, bookmarks, journal and progress are kept in this browser. If that storage is cleared, they are lost. Connect Google Drive and the app saves a dated copy of everything to a private folder only it can see (it does not appear among your files), updates it a few minutes after you make changes, and keeps the last {7} copies, so one bad save cannot destroy a good one.</p>
      {!driveAvailable() && (
        <div className="notice">
          <p style={{ margin: '0 0 6px' }}>Google Drive backup is not switched on in this copy of the app: it needs a Google OAuth client ID (free to create, <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">Google Cloud console</a>, a “Web application” client with this site’s address as an authorised JavaScript origin, and the Drive API enabled). The site’s owner sets it once; see docs/DRIVE_BACKUP.md.</p>
          <label className="field"><span>Client ID (optional, for your own copy)</span><input value={s.drive.clientId} placeholder="123…apps.googleusercontent.com" onChange={(e) => set({ drive: { ...s.drive, clientId: e.target.value.trim() } })} /></label>
        </div>
      )}
      {driveAvailable() && !on && <button className="btn primary" disabled={busy} onClick={() => run(connect, 'Connected. Your first backup is saved.')}>Connect Google Drive</button>}
      {on && (
        <>
          <p className="small">Connected. {s.drive.lastOk ? <>Last backup: <strong>{fmt(s.drive.lastOk)}</strong>.</> : 'No backup yet.'} {s.drive.lastError && <span className="warn">Last problem: {s.drive.lastError} Press “Back up now” to sign in again.</span>}</p>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={busy} onClick={() => run(() => backupNow(true), 'Backed up.')}>Back up now</button>
            <button className="btn" disabled={busy} onClick={() => run(async () => setFiles(await listBackups(true)), 'These are the copies on your Drive.')}>See saved copies</button>
            <button className="btn ghost" onClick={() => { disconnect(); setMsg('Disconnected. The copies on your Drive stay there.'); }}>Disconnect</button>
          </div>
          {files && (
            <ul className="list" style={{ marginTop: 8 }}>
              {files.length === 0 && <li className="muted">No copies yet.</li>}
              {files.map((f) => (
                <li key={f.id} className="row between">
                  <span>{fmt(+new Date(f.modified))} <span className="muted small">{Math.max(1, Math.round(f.size / 1024))} KB</span></span>
                  <span className="row" style={{ gap: 6 }}>
                    <button className="btn small" disabled={busy} onClick={() => run(async () => { const n = await restoreBackup(f.id, 'merge'); setMsg(`Added ${n} items from this copy to this device.`); }, '')}>Merge in</button>
                    <button className="btn small danger" disabled={busy} onClick={() => confirm('Replace everything on this device with this copy?') && run(async () => { const n = await restoreBackup(f.id, 'replace'); setMsg(`Restored ${n} items.`); }, '')}>Restore</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {msg && <p className="small" role="status">{msg}</p>}
      <p className="muted small">Only this app’s own private folder on your Drive is used (scope: drive.appdata). Disconnecting does not delete the copies. Your Google account and these copies are between you and Google; nothing goes to any server of ours.{clientId() ? '' : ''}</p>
    </div>
  );
}
