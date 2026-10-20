import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOKS, getBook } from '../../lib/canon';
import { getXrefs } from '../../data/loader';

const W = 560;
const C = W / 2;
const R = 230;

type Matrix = Record<string, Record<string, number>>;

/** Every book as a star on one ring; arcs are cross-references, weighted by how strongly the tradition's reference data links them. */
export default function ConstellationPage() {
  const [m, setM] = useState<Matrix | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const out: Matrix = {};
      await Promise.all(
        BOOKS.map(async (b) => {
          const f = await getXrefs(b.id).catch(() => null);
          const row: Record<string, number> = (out[b.id] = {});
          for (const targets of Object.values(f ?? {})) {
            for (const [ref, votes] of targets as [string, number][]) {
              const t = ref.split('.')[0];
              if (t === b.id || !(t in Object.fromEntries(BOOKS.map((x) => [x.id, 1])))) continue;
              row[t] = (row[t] ?? 0) + Math.sqrt(votes || 1);
            }
          }
        }),
      );
      if (live) setM(out);
    })();
    return () => {
      live = false;
    };
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

  const links = useMemo(() => {
    if (!m) return [];
    const pair: Record<string, number> = {};
    for (const a of Object.keys(m)) for (const [b, w] of Object.entries(m[a])) {
      const k = a < b ? `${a}|${b}` : `${b}|${a}`;
      pair[k] = (pair[k] ?? 0) + w;
    }
    const all = Object.entries(pair).sort((x, y) => y[1] - x[1]);
    const max = all[0]?.[1] ?? 1;
    return all.slice(0, 450).map(([k, w]) => ({ a: k.split('|')[0], b: k.split('|')[1], w, n: w / max }));
  }, [m]);

  const shown = sel ? links.filter((l) => l.a === sel || l.b === sel) : links.slice(0, 160);
  const top = sel
    ? Object.entries(m?.[sel] ?? {})
        .map(([b, w]) => [b, w + (m?.[b]?.[sel] ?? 0)] as [string, number])
        .sort((x, y) => y[1] - x[1])
        .slice(0, 8)
    : [];

  return (
    <div className="page">
      <h1>Constellation</h1>
      <p className="lede">All 73 books on one ring, Old Testament down the right, New Testament down the left. Arcs show how often the cross-references join two books. Choose a star to see what it is bound to.</p>
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
              <g key={b.id} tabIndex={0} role="button" aria-label={`${b.name}${sel === b.id ? ', selected' : ''}`} onClick={() => setSel(sel === b.id ? null : b.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(sel === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
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
