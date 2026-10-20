import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOKS, GROUPS, getBook } from '../../lib/canon';
import { bookMatrix, topLinks, type BookMatrix } from '../../study/bookLinks';
import { getBooksInfo, type BookInfo } from '../../study/refData';
import type { Galaxy } from '../../study/galaxy/scene';

const webgl = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

/** Walk through the Bible as a galaxy: fly to a book, open it, and follow the threads that bind it to others. */
export default function GalaxyPage() {
  const host = useRef<HTMLDivElement>(null);
  const gx = useRef<Galaxy | null>(null);
  const matrix = useRef<BookMatrix | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [info, setInfo] = useState<Record<string, BookInfo> | null>(null);
  const [ok] = useState(webgl);
  const [ready, setReady] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    bookMatrix().then((m) => { matrix.current = m; force((x) => x + 1); });
    getBooksInfo().then(setInfo);
  }, []);
  useEffect(() => {
    if (!ok || !host.current) return;
    let dead = false;
    import('../../study/galaxy/scene').then(({ Galaxy }) => {
      if (dead || !host.current) return;
      gx.current = new Galaxy(host.current, { onSelect: setSel, onGroup: setGroup }, (id) => (id && matrix.current ? topLinks(matrix.current, id, 7).map((x) => x[0]) : []));
      setReady(true);
    });
    return () => {
      dead = true;
      gx.current?.dispose();
      gx.current = null;
    };
  }, [ok]);

  const open = (id: string) => { gx.current?.openBook(id); setSel(id); };
  const order = BOOKS.map((b) => b.id);
  const step = (d: number) => {
    const i = sel ? order.indexOf(sel) : d > 0 ? -1 : 0;
    open(order[(i + d + order.length) % order.length]);
  };
  const key = (e: React.KeyboardEvent) => {
    const g = gx.current;
    if (!g) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' && e.shiftKey) step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Escape') g.overview();
    else if (e.key === 'w' || e.key === '+') g.move(14);
    else if (e.key === 's' || e.key === '-') g.move(-14);
    else if (e.key === 'ArrowUp') g.look(0, 0.08);
    else if (e.key === 'ArrowDown') g.look(0, -0.08);
    else return;
    e.preventDefault();
  };
  if (!ok)
    return (
      <div className="page">
        <h1>Scripture universe</h1>
        <p className="lede">This browser cannot draw the 3D galaxy. The flat <Link to="/study/constellation">Constellation</Link> shows the same connections.</p>
      </div>
    );
  const links = sel && matrix.current ? topLinks(matrix.current, sel, 7) : [];
  const b = sel ? getBook(sel) : null;
  const bi = sel ? info?.[sel] : null;
  return (
    <div className="galaxy-page">
      <div className="galaxy" ref={host} tabIndex={0} role="application" aria-label="Galaxy of the 73 books. Arrow keys move between books, W and S fly forward and back, Escape returns to the overview." onKeyDown={key} />
      {!ready && <div className="galaxy-veil" role="status">Gathering the stars…</div>}
      <header className="galaxy-head">
        <h1>Scripture universe</h1>
        {!sel && <p>Drag to look around, scroll or pinch to fly. Choose a star to travel to a book.</p>}
      </header>
      <nav className="galaxy-groups" aria-label="Regions of the canon">
        {GROUPS.map((g) => <button key={g.name} className={group === g.name ? 'on' : ''} onClick={() => gx.current?.openGroup(g.name)}>{g.name.replace(' Books', '').replace('General Letters', 'Letters').replace('Pauline Letters', 'Paul')}</button>)}
        <button onClick={() => { gx.current?.overview(); setSel(null); }}>Overview</button>
      </nav>
      <div className="galaxy-pick">
        <label className="visually-hidden" htmlFor="gx-book">Go to a book</label>
        <select id="gx-book" value={sel ?? ''} onChange={(e) => e.target.value && open(e.target.value)}>
          <option value="">Go to a book…</option>
          {BOOKS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>
      {b && (
        <aside className="galaxy-card" aria-live="polite">
          <button className="galaxy-x" onClick={() => { gx.current?.overview(); setSel(null); }} aria-label="Close and return to the overview">×</button>
          <div className="galaxy-kicker">{b.group}</div>
          <h2>{b.name}</h2>
          <p className="galaxy-meta">{[bi?.author, bi?.date].filter(Boolean).join(' · ')}</p>
          {bi && <p>{bi.intro.length > 260 ? bi.intro.slice(0, bi.intro.lastIndexOf(' ', 260)) + '…' : bi.intro}</p>}
          {links.length > 0 && (
            <>
              <div className="galaxy-kicker">Threads lead to</div>
              <div className="galaxy-links">{links.map(([id]) => <button key={id} onClick={() => open(id)}>{getBook(id).name}</button>)}</div>
            </>
          )}
          <div className="galaxy-actions">
            <Link className="btn primary" to={`/read/dra/${b.id}/1`}>Read {b.name}</Link>
            <button className="btn" onClick={() => step(-1)} aria-label="Previous book">‹</button>
            <button className="btn" onClick={() => step(1)} aria-label="Next book">›</button>
          </div>
        </aside>
      )}
    </div>
  );
}
