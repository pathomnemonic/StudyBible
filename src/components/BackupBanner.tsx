import { useState } from 'react';
import { Link } from 'react-router-dom';
import { backupDue, saveBackupFile, snoozeBackup, useRecordCount } from '../lib/safety';
import { useSync } from '../sync/state';
import { useSettings } from '../lib/store';

/** A quiet nudge, only when there is something to lose and no copy of it anywhere else. */
export default function BackupBanner() {
  const records = useRecordCount();
  const sync = useSync();
  const [s] = useSettings();
  const [gone, setGone] = useState(false);
  const [msg, setMsg] = useState('');
  void s.lastBackup;
  if (gone || !backupDue({ records, signedIn: !!sync.user })) return null;
  const save = async () => { try { const how = await saveBackupFile(); setMsg(how === 'shared' ? 'Saved. Keep that file somewhere safe.' : 'Downloaded. Keep that file somewhere safe.'); window.setTimeout(() => setGone(true), 2500); } catch { /* cancelled */ } };
  return (
    <div className="backup-banner" role="note">
      <span><strong>Back up your notes.</strong> They live only in this browser. {records.toLocaleString()} items would be lost if its storage were cleared.</span>
      {msg ? <span role="status">{msg}</span> : (
        <span className="row" style={{ gap: 6 }}>
          <button className="btn small primary" onClick={save}>Save a backup</button>
          {sync.server === 'available' && <Link className="btn small" to="/account">Account</Link>}
          <button className="btn small ghost" onClick={() => { snoozeBackup(7); setGone(true); }}>Later</button>
        </span>
      )}
    </div>
  );
}
