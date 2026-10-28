import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';

type Kind = 'all' | 'read' | 'listen' | 'library' | 'catechism';
const KIND_OF: Record<string, Kind> = { read: 'read', finished: 'read', episode: 'listen', video: 'listen', work: 'library', catechism: 'catechism' };
const FILTERS: [Kind, string][] = [['all', 'All'], ['read', 'Bible'], ['listen', 'Listening'], ['library', 'Library'], ['catechism', 'Catechism']];

/** Everything you opened recently, newest first, kept on this device. */
export default function HistoryPage() {
  const [s] = useSettings();
  const [kind, setKind] = useState<Kind>('all');
  const rows = useLiveQuery(() => db.history.orderBy('ts').reverse().limit(400).toArray(), []);
  const link = (type: string, ref: string): string | null => {
    if (type === 'read') { const [b, c] = ref.split('.'); return b && c ? `/read/${s.defaultEdition}/${b}/${c}` : null; }
    if (type === 'episode') return `/listen/episode/${ref}`;
    if (type === 'catechism') return `/study/catechism/${ref}`;
    if (type === 'work') return `/room/work/${ref}`;
    if (type === 'video') return '/listen?tab=videos';
    return null;
  };
  const groups = useMemo(() => {
    const out = new Map<string, NonNullable<typeof rows>>();
    let last = '';
    for (const r of rows ?? []) {
      if (kind !== 'all' && KIND_OF[r.type] !== kind) continue;
      const key = `${r.type}:${r.ref}`;
      if (key === last) continue; // one line for a chapter you reloaded
      last = key;
      const day = new Date(r.ts).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      out.set(day, [...(out.get(day) ?? []), r]);
    }
    return [...out.entries()];
  }, [rows, kind]);
  const clear = async () => { if (confirm('Clear your reading and listening history on this device? Notes, highlights and progress are kept.')) await db.history.clear(); };
  return (
    <div className="page history">
      <h1>History</h1>
      <div className="row between">
        <div className="seg" role="tablist" aria-label="Show">
          {FILTERS.map(([k, l]) => <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)}>{l}</button>)}
        </div>
        <button className="btn small ghost" onClick={() => void clear()} disabled={!rows?.length}>Clear</button>
      </div>
      {rows && groups.length === 0 && <p className="muted">Nothing here yet. What you read, hear and open will show up here.</p>}
      {groups.map(([day, items]) => (
        <section key={day}>
          <h2 className="eyebrow-h">{day}</h2>
          <ul className="list">
            {items.map((r) => {
              const to = link(r.type, r.ref);
              const time = new Date(r.ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
              return <li key={r.id}>{to ? <Link to={to} className="t">{r.label}</Link> : <span>{r.label}</span>} <span className="muted small">· {time}{r.type === 'finished' ? ' · finished' : ''}</span></li>;
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
