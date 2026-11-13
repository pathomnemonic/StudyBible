import { useEffect, useState } from 'react';
import { backupStatus, type BackupStatus } from '../lib/safety';
import { useSync } from '../sync/state';
import { useSettings } from '../lib/store';

const when = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** A plain account of where your writing is kept, separating copies inside this browser from copies somewhere else. */
export default function BackupStatusCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const sync = useSync();
  const [s] = useSettings();
  const [st, setSt] = useState<BackupStatus | null>(null);
  useEffect(() => { let live = true; backupStatus(!!sync.user).then((x) => live && setSt(x)).catch(() => undefined); return () => { live = false; }; }, [sync.user, s.lastFileBackup, s.drive.lastOk, s.drive.connected, refreshKey]);
  if (!st) return null;
  const outside = st.fileAt || st.driveAt || st.accountSync;
  return (
    <div className="card backup-status" aria-label="Where your writing is kept">
      <h3>Where your writing is kept</h3>
      <dl className="bs-list">
        <div><dt>In this browser</dt><dd>{st.items.toLocaleString()} {st.items === 1 ? 'item' : 'items'} (notes, highlights, journal, progress). Clearing this browser’s site data, removing the browser profile or losing this device would erase them.</dd></div>
        <div><dt>Safety copies in this browser</dt><dd>{st.snapshots ? `${st.snapshots} kept, the latest ${when(st.snapshotAt)}. ` : 'None yet. '}They protect against a mistake or a bad import. They are stored in the same place as your notes, so they are <strong>not</strong> a backup against clearing the browser’s data.</dd></div>
        <div><dt>Backup outside this browser</dt><dd>
          {!outside && <strong>None yet. </strong>}
          {st.fileAt > 0 && <>Backup file saved {when(st.fileAt)}. </>}
          {st.driveConnected ? (st.driveAt ? <>Google Drive copy {when(st.driveAt)}. </> : <>Google Drive is connected; no copy has finished yet. </>) : null}
          {st.driveError && <span className="bs-bad">Google Drive backup failed: {st.driveError} </span>}
          {st.accountSync && <>Synced to your account. </>}
          {outside && st.changedSince > 0 && <span className="bs-warn">{st.changedSince.toLocaleString()} {st.changedSince === 1 ? 'change' : 'changes'} since then {st.changedSince === 1 ? 'is' : 'are'} only in this browser.</span>}
          {outside && st.changedSince === 0 && <>Everything is in that copy.</>}
        </dd></div>
      </dl>
    </div>
  );
}
