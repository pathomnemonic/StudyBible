import { Link } from 'react-router-dom';
import { useLiveQuery } from '../lib/live';
import { db } from '../db/db';
import { forgetRecent, usePins, type Entry } from '../lib/pins';

const KIND = { collection: 'Collection', plan: 'Plan', note: 'Note' } as const;

/** What you pinned and what you opened lately, at the top of the library. Shows nothing until there is something to show. */
export default function PinnedRecent() {
  const { pins, recent } = usePins();
  const pinnedNotes = useLiveQuery(() => db.notes.filter((n) => !!n.pinned).toArray(), []) ?? [];
  const noteEntries: Entry[] = pinnedNotes.map((n) => ({ kind: 'note', id: String(n.id), title: n.title || n.body.split('\n')[0].slice(0, 50) || 'Note', to: `/library/notes/${n.id}` }));
  const pinned = [...pins.filter((p) => p.kind !== 'note'), ...noteEntries];
  const pinKeys = new Set(pinned.map((p) => `${p.kind}:${p.id}`));
  const lately = recent.filter((r) => !pinKeys.has(`${r.kind}:${r.id}`));
  if (!pinned.length && !lately.length) return null;
  return (
    <section className="card" aria-label="Pinned and recent">
      {pinned.length > 0 && (
        <>
          <h2 className="h-sm" style={{ marginTop: 0 }}>Pinned</h2>
          <ul className="list" data-pinned>{pinned.map((e) => <li key={`${e.kind}:${e.id}`}><span className="chip">{KIND[e.kind]}</span> <Link to={e.to}>{e.title}</Link></li>)}</ul>
        </>
      )}
      {lately.length > 0 && (
        <>
          <div className="row between"><h2 className="h-sm" style={{ marginTop: 0 }}>Recently opened</h2><button className="btn small ghost" onClick={forgetRecent}>Clear this list</button></div>
          <ul className="list" data-recent>{lately.map((e) => <li key={`${e.kind}:${e.id}`}><span className="chip">{KIND[e.kind]}</span> <Link to={e.to}>{e.title}</Link></li>)}</ul>
        </>
      )}
    </section>
  );
}
