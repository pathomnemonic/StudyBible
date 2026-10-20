import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOKS, GROUPS, getBook } from '../../lib/canon';
import { bookMatrix, topLinks, type BookMatrix } from '../../study/bookLinks';
import { getBooksInfo, type BookInfo } from '../../study/refData';
import type { Galaxy } from '../../study/galaxy/scene';
import { getJson } from '../../data/loader';

interface LibWork { id: string; title: string; author: string; authorId: string; cat: string; year: string; kind: string; words: number; cites: number; books: [string, number][] }
interface LibData { cats: { id: string; name: string; blurb: string }[]; works: LibWork[] }

const webgl = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

/** The works that cite a book most, for the card and the threads. */
function topWorks(d: LibData | null, book: string, n: number) {
  if (!d) return [];
  return d.works.map((w) => ({ w, n: w.books.find((b) => b[0] === book)?.[1] ?? 0 })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, n).map((x) => x.w);
}

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
  const lib = useRef<LibData | null>(null);
  const [libData, setLibData] = useState<LibData | null>(null);
  const [libGroup, setLibGroup] = useState<string | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    bookMatrix().then((m) => { matrix.current = m; force((x) => x + 1); });
    getBooksInfo().then(setInfo);
    getJson<LibData>('library/galaxy.json', true).then((d) => { lib.current = d; setLibData(d); });
  }, []);
  useEffect(() => {
    if (!ok || !host.current) return;
    let dead = false;
    import('../../study/galaxy/scene').then(({ Galaxy }) => {
      if (dead || !host.current) return;
      gx.current = new Galaxy(host.current, { onSelect: setSel, onGroup: setGroup }, (id) => {
        if (!id) return [];
        if (id.startsWith('lib:')) return (lib.current?.works.find((w) => `lib:${w.id}` === id)?.books ?? []).slice(0, 5).map((b) => b[0]);
        const books = matrix.current ? topLinks(matrix.current, id, 6).map((x) => x[0]) : [];
        return [...books, ...topWorks(lib.current, id, 3).map((w) => `lib:${w.id}`)];
      });
      setReady(true);
    });
    return () => {
      dead = true;
      gx.current?.dispose();
      gx.current = null;
    };
  }, [ok]);

  useEffect(() => { if (ready && libData) gx.current?.addLibrary(libData); }, [ready, libData]);
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
  const isLib = !!sel && sel.startsWith('lib:');
  const work = isLib ? libData?.works.find((w) => `lib:${w.id}` === sel) ?? null : null;
  const links = sel && !isLib && matrix.current ? topLinks(matrix.current, sel, 7) : [];
  const b = sel && !isLib ? getBook(sel) : null;
  const bi = sel && !isLib ? info?.[sel] : null;
  const citing = b ? topWorks(libData, b.id, 5) : [];
  return (
    <div className="galaxy-page">
      <div className="galaxy" ref={host} tabIndex={0} role="application" aria-label="Galaxy of the 73 books. Arrow keys move between books, W and S fly forward and back, Escape returns to the overview." onKeyDown={key} />
      {!ready && <div className="galaxy-veil" role="status">Gathering the stars…</div>}
      <header className="galaxy-head">
        <h1>Scripture universe</h1>
        {!sel && <p>Drag to look around, scroll or pinch to fly. Choose a star to travel to a book. Beyond the canon, rings of stars are the Fathers, saints, councils and catechisms, each beside the books it speaks about.</p>}
      </header>
      <nav className="galaxy-groups" aria-label="Regions of the canon">
        {GROUPS.map((g) => <button key={g.name} className={group === g.name ? 'on' : ''} onClick={() => gx.current?.openGroup(g.name)}>{g.name.replace(' Books', '').replace('General Letters', 'Letters').replace('Pauline Letters', 'Paul')}</button>)}
        <button onClick={() => { gx.current?.overview(); setSel(null); }}>Overview</button>
      </nav>
      {libData && (
        <nav className="galaxy-groups galaxy-groups-lib" aria-label="Saints, Fathers and Church documents around the canon">
          <span className="galaxy-kicker">Beyond the canon</span>
          {libData.cats.map((c) => <button key={c.id} className={group === c.name ? 'on' : ''} title={c.blurb} onClick={() => { gx.current?.openGroup(c.name); setSel(null); }}>{c.name}</button>)}
        </nav>
      )}
      <div className="galaxy-pick">
        <label className="visually-hidden" htmlFor="gx-book">Go to a book</label>
        <select id="gx-book" value={sel ?? ''} onChange={(e) => e.target.value && open(e.target.value)}>
          <option value="">Go to a book…</option>
          <optgroup label="Books of the Bible">{BOOKS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>
          {libData?.cats.map((c) => <optgroup key={c.id} label={c.name}>{libData.works.filter((w) => w.cat === c.id).map((w) => <option key={w.id} value={`lib:${w.id}`}>{w.author.split(' of ')[0]}: {w.title.slice(0, 50)}</option>)}</optgroup>)}
        </select>
      </div>
      {work && (
        <aside className="galaxy-card" aria-live="polite">
          <button className="galaxy-x" onClick={() => { gx.current?.overview(); setSel(null); }} aria-label="Close and return to the overview">×</button>
          <div className="galaxy-kicker">{libData?.cats.find((c) => c.id === work.cat)?.name}</div>
          <h2>{work.title}</h2>
          <p className="galaxy-meta">{[work.author, work.year].filter(Boolean).join(' · ')}</p>
          <p>{Math.round(work.words / 1000)}k words{work.cites ? `, ${work.cites} places tied to Scripture` : ''}. It sits beside the books it speaks about most.</p>
          {work.books.length > 0 && (
            <>
              <div className="galaxy-kicker">Speaks most about</div>
              <div className="galaxy-links">{work.books.slice(0, 5).map(([id]) => <button key={id} onClick={() => open(id)}>{getBook(id).name}</button>)}</div>
            </>
          )}
          <div className="galaxy-actions"><Link className="btn primary" to={`/study/works/${work.id}/0`}>Read it</Link></div>
        </aside>
      )}
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
          {citing.length > 0 && (
            <>
              <div className="galaxy-kicker">Fathers and saints on it</div>
              <div className="galaxy-links">{citing.map((w) => <button key={w.id} onClick={() => open(`lib:${w.id}`)}>{w.author.split(' of ')[0]}: {w.title.slice(0, 26)}</button>)}</div>
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
