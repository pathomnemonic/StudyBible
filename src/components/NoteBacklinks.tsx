import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '../db/db';

/** Where a note is used: the collections that hold it and the other notes written on the same passage. Computed, never stored, so there is nothing to sync or to go stale. */
export default function NoteBacklinks({ note }: { note: Note }) {
  const info = useLiveQuery(async () => {
    const cols = note.uid ? (await db.collections.toArray()).filter((c) => c.items.some((t) => t.type === 'note' && t.uid === note.uid)) : [];
    const refs = new Set(note.targets.filter((t) => t.type === 'passage').map((t) => (t.type === 'passage' ? t.ref : '')));
    const keys = note.chapterKeys ?? [];
    const others = refs.size && keys.length
      ? (await db.notes.where('chapterKeys').anyOf(keys).toArray()).filter((o) => o.id !== note.id && o.targets.some((t) => t.type === 'passage' && refs.has(t.ref)))
      : [];
    return { cols, others };
  }, [note.id, note.uid, note.updatedAt]);
  if (!info || (!info.cols.length && !info.others.length)) return null;
  return (
    <p className="small muted note-backlinks" aria-label="Where this note is used">
      {info.cols.length > 0 && <>In {info.cols.length === 1 ? 'collection' : 'collections'}: {info.cols.map((c, i) => <span key={c.id}>{i ? ', ' : ''}<Link to={`/collection/${c.id}`}>{c.name}</Link></span>)}. </>}
      {info.others.length > 0 && <>{info.others.length} other {info.others.length === 1 ? 'note' : 'notes'} on the same passage: {info.others.slice(0, 3).map((o, i) => <span key={o.id}>{i ? ', ' : ''}{(o.title || o.body.split('\n')[0] || 'Note').slice(0, 40)}</span>)}{info.others.length > 3 ? '…' : ''}.</>}
    </p>
  );
}
