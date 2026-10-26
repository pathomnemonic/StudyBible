import { useEffect, useState } from 'react';
import { listSnapshots, restoreSnapshot, saveBackupFile, snapshotIfDue, type Snapshot } from '../lib/safety';
import { fmtBytes } from '../lib/offlineAudio';

/** The daily safety copies kept on this device, with a way back, plus a one-tap backup file. */
export default function SafetyCopies() {
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [msg, setMsg] = useState('');
  const load = () => listSnapshots().then(setSnaps).catch(() => {});
  useEffect(() => { void load(); }, []);
  return (
    <div className="card">
      <h3>Safety copies and backup file</h3>
      <p className="muted small">A copy of your notes, highlights and progress is kept on this device each day (the last five). They guard against a mistake or a bad import. They do not survive clearing this browser’s data, so also save a backup file somewhere else.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={async () => { try { const how = await saveBackupFile(); setMsg(how === 'shared' ? 'Shared.' : 'Downloaded.'); } catch { /* cancelled */ } }}>Save or share a backup file</button>
        <button className="btn" onClick={async () => { setMsg((await snapshotIfDue(true)) ? 'Safety copy made.' : 'There is nothing to copy yet.'); void load(); }}>Make a safety copy now</button>
      </div>
      {msg && <p className="small" role="status">{msg}</p>}
      <ul className="dl-list">
        {snaps.map((x) => (
          <li key={x.key}><span>{new Date(x.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} <span className="muted small">{x.records.toLocaleString()} items · {fmtBytes(x.bytes)}</span></span>
            <button className="btn small" onClick={async () => { if (!confirm('Restore this copy? Anything in it that is missing now comes back; a copy of the current state is kept first.')) return; try { const n = await restoreSnapshot(x.key); setMsg(`Restored ${n} items.`); void load(); } catch (e) { setMsg((e as Error).message); } }}>Restore</button></li>
        ))}
        {!snaps.length && <li className="muted small">No safety copies yet. The first one is made a little after you start writing.</li>}
      </ul>
    </div>
  );
}
