import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOKS, getBook } from '../../lib/canon';
import { bookMatrix, pairLinks, topLinks, type BookMatrix } from '../../study/bookLinks';

const W = 560;
const C = W / 2;
const R = 230;

/** Every book as a star on one ring; arcs are cross-references, weighted by how strongly the tradition's reference data links them. */
export default function ConstellationPage() {
  const [m, setM] = useState<BookMatrix | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    bookMatrix().then(setM);
  }, []);

  const pos = useMemo(
    () =>
      Object.fromEntries(
        BOOKS.map((b, i) => {
          const a = (2 * Math.PI * i) / BOOKS.length - Math.PI / 2;
          return [b.id, { x: C + R * Math.cos(a), y: C + R * Math.sin(a), a }];
        }),
      ),
    [],
  );

  const links = useMemo(() => (m ? pairLinks(m, 450) : []), [m]);

  const shown = sel ? links.filter((l) => l.a === sel || l.b === sel) : links.slice(0, 160);
  const top = m && sel ? topLinks(m, sel) : [];

  return (
    <div className="page">
      <h1>Constellation</h1>
      <p className="lede">All 73 books on one ring, Old Testament down the right, New Testament down the left.</p>
      <div className="constellation">
        <svg viewBox={`0 0 ${W} ${W}`} role="group" aria-label="Cross-reference constellation of the 73 books">
          {shown.map((l) => {
            const p = pos[l.a], q = pos[l.b];
            return <path key={l.a + l.b} d={`M${p.x},${p.y} Q${C},${C} ${q.x},${q.y}`} fill="none" stroke={sel ? 'var(--accent)' : 'var(--text-faint, #8a8a99)'} strokeWidth={0.5 + l.n * 2.5} opacity={sel ? 0.25 + l.n * 0.6 : 0.12 + l.n * 0.45} />;
          })}
          {BOOKS.map((b) => {
            const p = pos[b.id];
            const on = sel === b.id || (sel && top.some(([t]) => t === b.id));
            const left = Math.cos(p.a) < 0;
            return (
              <g key={b.id} tabIndex={0} role="button" aria-label={`${b.abbr}, ${b.name}${sel === b.id ? ', selected' : ''}`} onClick={() => setSel(sel === b.id ? null : b.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(sel === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                <circle cx={p.x} cy={p.y} r={11} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={sel === b.id ? 7 : on ? 5.5 : 3.8} fill={b.testament === 'OT' ? 'var(--accent)' : 'var(--accent-2, #7fb8d6)'} opacity={sel && !on ? 0.35 : 1} />
                <text x={p.x + Math.cos(p.a) * 11} y={p.y + Math.sin(p.a) * 11 + 3} fontSize="8" textAnchor={left ? 'end' : 'start'} fill="var(--text)" opacity={sel && !on ? 0.35 : 0.9}>{b.abbr}</text>
              </g>
            );
          })}
          {!m && <text x={C} y={C} textAnchor="middle" fill="var(--text)" fontSize="12">Gathering the stars…</text>}
        </svg>
        <aside className="constellation-side" aria-live="polite">
          {sel ? (
            <>
              <h2>{getBook(sel).name}</h2>
              <p className="muted">Most strongly bound to:</p>
              <ol>
                {top.map(([t]) => (
                  <li key={t}><button className="linklike" onClick={() => setSel(t)}>{getBook(t).name}</button></li>
                ))}
              </ol>
              <Link className="btn" to={`/read/dra/${sel}/1`}>Read {getBook(sel).name}</Link>
            </>
          ) : (
            <p className="muted">Nothing chosen. The brightest arcs are the best-trodden paths between books, such as the Gospels and the Psalms and Isaiah.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
