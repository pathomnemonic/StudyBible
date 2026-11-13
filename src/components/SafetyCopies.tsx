import { useEffect, useState } from 'react';
import { listSnapshots, restoreSnapshot, saveBackupFile, snapshotIfDue, type Snapshot } from '../lib/safety';
import { fmtBytes } from '../lib/offlineAudio';
import BackupStatusCard from './BackupStatusCard';

/** The daily safety copies kept on this device, with a way back, plus a one-tap backup file. */
export default function SafetyCopies() {
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [msg, setMsg] = useState('');
  const [tick, setTick] = useState(0);
  const [bad, setBad] = useState('');
  const load = () => listSnapshots().then(setSnaps).catch(() => {});
  useEffect(() => { void load(); }, []);
  return (
    <>
    <BackupStatusCard refreshKey={tick} />
    <div className="card">
      <h3>Safety copies and backup file</h3>
      <p className="muted small">A copy of your notes, highlights and progress is kept on this device each day (the last five). They guard against a mistake or a bad import. They do not survive clearing this browser’s data, so also save a backup file somewhere else.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={async () => { setBad(''); try { const how = await saveBackupFile(); setMsg(how === 'shared' ? 'Shared. Keep that file somewhere safe.' : 'Downloaded. Check that the file is in your Downloads and keep a copy somewhere safe.'); setTick((n) => n + 1); } catch (e) { if ((e as Error)?.name !== 'AbortError') { setMsg(''); setBad(`The backup file could not be made: ${(e as Error)?.message || 'unknown error'}. Nothing was saved.`); } } }}>Save or share a backup file</button>
        <button className="btn" onClick={async () => { setBad(''); try { setMsg((await snapshotIfDue(true)) ? 'Safety copy made.' : 'There is nothing to copy yet.'); void load(); setTick((n) => n + 1); } catch (e) { setMsg(''); setBad(`The safety copy could not be stored (the browser’s storage may be full or blocked): ${(e as Error)?.message || 'unknown error'}.`); } }}>Make a safety copy now</button>
      </div>
      {msg && <p className="small" role="status">{msg}</p>}
      {bad && <p className="small bs-bad" role="alert">{bad}</p>}
      <ul className="dl-list">
        {snaps.map((x) => (
          <li key={x.key}><span>{new Date(x.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} <span className="muted small">{x.records.toLocaleString()} items · {fmtBytes(x.bytes)}</span></span>
            <button className="btn small" onClick={async () => { if (!confirm('Restore this copy? Anything in it that is missing now comes back; a copy of the current state is kept first.')) return; try { const n = await restoreSnapshot(x.key); setMsg(`Restored ${n} items.`); void load(); } catch (e) { setMsg((e as Error).message); } }}>Restore</button></li>
        ))}
        {!snaps.length && <li className="muted small">No safety copies yet. The first one is made a little after you start writing.</li>}
      </ul>
    </div>
    </>
  );
}
