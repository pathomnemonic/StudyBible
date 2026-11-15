import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { chapterKeysOf } from '../../db/ops';
import { dataHealth, type Finding } from '../../lib/dataHealth';
import { applyRepairs, planRepairs, restorableItems, undoRepairs, type Repair, type UndoRecord } from '../../lib/dataRepair';
import { restoreFromTrash } from '../../lib/trash';
import { loadEditions } from '../../data/loader';

/** A check of your own data for references that lead nowhere. It reports first; a fix is made only when you press its button, a safety copy is kept first, and it can be undone. */
export default function DataHealth() {
  const [found, setFound] = useState<Finding[] | null>(null);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [restorable, setRestorable] = useState<ReturnType<typeof restorableItems>>([]);
  const [undo, setUndo] = useState<UndoRecord[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const run = async (keepMsg = false) => {
    // A previous scan is no longer authoritative once a new scan starts.
    setFound(null);
    setRepairs([]);
    setRestorable([]);
    const [notes, highlights, bookmarks, collections, userPlans, trash] = await Promise.all([db.notes.toArray(), db.highlights.toArray(), db.bookmarks.toArray(), db.collections.toArray(), db.userPlans.toArray(), db.trash.toArray()]);
    const input = { notes, highlights, bookmarks, collections, userPlans } as never;
    const { editions } = await loadEditions();
    const anchor = editions.find((e) => e.id === 'vulgate');
    if (!anchor) throw new Error('The Vulgate reference counts are unavailable; no semantic reference check was run.');
    setFound(dataHealth(input, anchor));
    setRepairs(planRepairs(input, chapterKeysOf, editions));
    setRestorable(restorableItems(collections, trash));
    if (!keepMsg) { setMsg(''); setUndo([]); }
  };
  const fix = async (list: Repair[]) => {
    setBusy('repair'); setError('');
    try {
      const u = await applyRepairs(list);
      setUndo(u);
      setMsg(`Fixed ${list.length} ${list.length === 1 ? 'place' : 'places'}. A safety copy was kept first.`);
      try { await run(true); } catch (e) { setRepairs([]); setError(`The repair was committed, but the check could not refresh: ${e instanceof Error ? e.message : 'unknown error'}`); }
    } catch (e) { setError(e instanceof Error ? e.message : 'The repair failed. No changes were made.'); }
    finally { setBusy(null); }
  };
  return (
    <div className="card" aria-label="Data health check">
      <h2 className="card-title">Check your data</h2>
      <p className="muted small">Looks for notes, collections and plans that point at something that is no longer here, or at a passage address the app cannot read. Running the check changes nothing. Where the fix is certain, a button offers it; nothing is changed until you press one, and you can undo it.</p>
      <button className="btn" disabled={!!busy} onClick={() => { setBusy('check'); setError(''); void run().catch((e) => setError(e instanceof Error ? e.message : 'The check could not be completed.')).finally(() => setBusy(null)); }}>{busy === 'check' ? 'Checking…' : 'Run the check'}</button>
      {error && <p role="alert" className="small">{error}</p>}
      {msg && <p role="status" className="small">{msg} {undo.length > 0 && <button className="btn small" disabled={!!busy} onClick={async () => { setBusy('undo'); setError(''); try { await undoRepairs(undo); setUndo([]); setMsg('Undone: the earlier addresses are back.'); try { await run(true); } catch (e) { setRepairs([]); setError(`Undo committed, but the check could not refresh: ${e instanceof Error ? e.message : 'unknown error'}`); } } catch (e) { setError(e instanceof Error ? e.message : 'Undo failed.'); } finally { setBusy(null); } }}>{busy === 'undo' ? 'Undoing…' : 'Undo'}</button>}</p>}
      {found && (found.length === 0
        ? <p role="status">Nothing wrong found.</p>
        : (
          <>
            {repairs.length > 0 && (
              <section aria-label="Fixes ready">
                <h3 className="h-sm">Fixes ready ({repairs.length})</h3>
                <ul className="dl-list">{repairs.map((r) => <li key={r.key}><span><strong>{r.where}</strong>: {r.changes.join('; ')}.</span><button className="btn small" disabled={!!busy} aria-busy={busy === 'repair'} onClick={() => void fix([r])}>{busy === 'repair' ? 'Fixing…' : 'Fix this'}</button></li>)}</ul>
                {repairs.length > 1 && <button className="btn small primary" disabled={!!busy} aria-busy={busy === 'repair'} onClick={() => void fix(repairs)}>{busy === 'repair' ? 'Fixing…' : `Fix all ${repairs.length}`}</button>}
              </section>
            )}
            {restorable.length > 0 && (
              <section aria-label="Can be restored">
                <h3 className="h-sm">Can be restored from Recently deleted ({restorable.length})</h3>
                <ul className="dl-list">{restorable.map((r) => <li key={r.trashId}><span>Collection “{r.collection}” holds {r.what} that you deleted.</span><button className="btn small" disabled={!!busy} aria-busy={busy === 'restore-' + r.trashId} onClick={async () => { setBusy('restore-' + r.trashId); setError(''); try { const restored = await restoreFromTrash(r.trashId); setMsg(restored ? 'Restored.' : 'This item was already restored or is no longer in Recently deleted.'); try { await run(true); } catch (e) { setRestorable([]); setError(restored ? `Restore committed, but the check could not refresh: ${e instanceof Error ? e.message : 'unknown error'}` : `The item was not restored, and the check could not refresh: ${e instanceof Error ? e.message : 'unknown error'}`); } } catch (e) { setError(e instanceof Error ? e.message : 'Restore failed.'); } finally { setBusy(null); } }}>{busy === 'restore-' + r.trashId ? 'Restoring…' : 'Restore'}</button></li>)}</ul>
              </section>
            )}
            <h3 className="h-sm">Everything found ({found.length})</h3>
            <ul className="dl-list" role="status">{found.map((f, i) => <li key={i}><span><strong>{f.where}</strong> {f.what}.</span>{f.to && <Link className="btn small" to={f.to}>Open</Link>}</li>)}</ul>
          </>
        ))}
    </div>
  );
}
