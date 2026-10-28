import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { BOOKS } from '../lib/canon';
import { useSettings } from '../lib/store';

/** All 73 books, each filling in as you read its chapters. Counted from what you have opened and read on this device. */
export default function BibleProgressPage() {
  const [s] = useSettings();
  const rows = useLiveQuery(() => db.history.where('type').anyOf('read', 'finished').toArray(), []);
  const read = useMemo(() => { const m = new Map<string, Set<number>>(); for (const r of rows ?? []) { const [b, c] = r.ref.split('.'); if (b && +c) { (m.get(b) ?? m.set(b, new Set()).get(b)!).add(+c); } } return m; }, [rows]);
  const total = BOOKS.reduce((a, b) => a + b.chapters, 0);
  const done = BOOKS.reduce((a, b) => a + Math.min(b.chapters, read.get(b.id)?.size ?? 0), 0);
  const groups = [...new Set(BOOKS.map((b) => b.group))];
  return (
    <div className="page bible-progress">
      <h1>Your Bible</h1>
      <p className="muted">{done} of {total} chapters read ({Math.round((100 * done) / total)}%). A book fills in as you read its chapters.</p>
      <div className="bp-total" role="img" aria-label={`${Math.round((100 * done) / total)} percent of the Bible read`}><i style={{ width: `${(100 * done) / total}%` }} /></div>
      {groups.map((g) => (
        <section key={g}>
          <h2 className="eyebrow-h">{g}</h2>
          <div className="bp-grid">
            {BOOKS.filter((b) => b.group === g).map((b) => {
              const n = Math.min(b.chapters, read.get(b.id)?.size ?? 0);
              const pct = Math.round((100 * n) / b.chapters);
              return (
                <Link key={b.id} to={`/read/${s.defaultEdition}/${b.id}/1`} className={`bp-book${pct === 100 ? ' full' : ''}`} aria-label={`${b.name}: ${n} of ${b.chapters} chapters`}>
                  <strong>{b.abbr}</strong><span>{n}/{b.chapters}</span><i style={{ height: `${pct}%` }} />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
