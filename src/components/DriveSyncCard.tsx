import { useState } from 'react';
import { useSettings } from '../lib/store';
import { driveSyncEnabled } from '../lib/driveSyncFlag';
import { driveAvailable } from '../sync/drive';
import { accountIsSyncing, disableDriveSync, driveSyncNow, enableDriveSync } from '../sync/driveSync';
import { useSync } from '../sync/state';

const fmt = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Sync between devices through the reader's own Google Drive. Shows nothing unless the build has the switch (src/lib/driveSyncFlag.ts). */
export default function DriveSyncCard() {
  const [s] = useSettings();
  const account = useSync();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  if (!driveSyncEnabled() || s.localOnly) return null;
  const run = async (f: () => Promise<unknown>, ok: string | ((r: any) => string)) => {
    setBusy(true); setMsg('');
    try { const r = await f(); setMsg(typeof ok === 'function' ? ok(r) : ok); } catch (e: any) { setMsg(e?.message ?? 'That did not work.'); } finally { setBusy(false); }
  };
  const signedInElsewhere = !!account.user || accountIsSyncing();
  return (
    <div className="card" id="drive-sync">
      <h2 className="card-title">Sync between your devices through Google Drive</h2>
      <p className="small">Keeps your notes, highlights, bookmarks, journal and progress the same on every device where you turn this on. They travel through a hidden folder in <strong>your own</strong> Google Drive that only this app can open; nothing goes to any server of ours.</p>
      {!driveAvailable() && <div className="notice">Google Drive is not set up in this copy of the app (see docs/DRIVE_SYNC.md).</div>}
      {signedInElsewhere && <div className="notice">You are signed in to an account, which already syncs your library. Sign out of it to sync through Google Drive instead.</div>}
      {driveAvailable() && !signedInElsewhere && !s.drive.sync && (
        <button className="btn primary" disabled={busy} onClick={() => run(enableDriveSync, (r) => `Turned on. Sent ${r.pushed} and received ${r.pulled} items.`)}>Turn on sync through Google Drive</button>
      )}
      {driveAvailable() && !signedInElsewhere && s.drive.sync && (
        <>
          <p className="small">On. {s.drive.syncOk ? <>Last synced: <strong>{fmt(s.drive.syncOk)}</strong>.</> : 'Not synced yet.'} {s.drive.syncError && <span className="warn">Last problem: {s.drive.syncError}</span>}</p>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={busy} onClick={() => run(() => driveSyncNow(true), (r) => `Synced. Sent ${r.pushed} and received ${r.pulled} items.`)}>Sync now</button>
            <button className="btn ghost" disabled={busy} onClick={() => run(() => disableDriveSync(false), 'Turned off on this device. The copies on your Drive stay there.')}>Turn off</button>
            <button className="btn ghost" disabled={busy} onClick={() => { if (confirm('Turn off and delete the sync copies from your Google Drive?\n\nYour notes stay on every device. Other devices will no longer be able to sync until this is turned on again.')) void run(() => disableDriveSync(true), (n) => `Turned off and removed ${n} files from your Drive.`); }}>Turn off and delete from Drive</button>
          </div>
          <p className="muted small">Google gives this app a key that lasts an hour. If sync stops with a message about signing in again, press Sync now once.</p>
        </>
      )}
      {msg && <div className="small" role="status">{msg}</div>}
    </div>
  );
}
