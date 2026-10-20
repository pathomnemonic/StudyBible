import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../data/loader';
import { parseRefs } from '../../lib/refs';
import { getBook } from '../../lib/canon';

interface Piece { id: string; file: string; title: string; artist: string; date: string; credit: string; page: string; refs: string[]; theme?: string }
interface Old { id: number; file: string; page: string; title: string; artist: string; date: string; credit: string }
interface Lens { entries: { work: number; a: string[] }[] }

/** Every picture in the app on one page, with where it belongs in Scripture. */
export default function GalleryPage() {
  const [all, setAll] = useState<Piece[] | null>(null);
  const [kind, setKind] = useState<'all' | 'paint' | 'dore'>('all');
  const [theme, setTheme] = useState('');
  const [open, setOpen] = useState<Piece | null>(null);
  const [pair, setPair] = useState<Piece | null>(null);
  useEffect(() => {
    Promise.all([getJson<{ works: Piece[] }>('art-more.json', true), getJson<{ works: Old[] }>('art.json', true), getJson<Lens>('lens/art.json', true)]).then(([m, o, l]) => {
      const refsOf = new Map<number, string[]>();
      for (const e of l?.entries ?? []) refsOf.set(e.work, [...(refsOf.get(e.work) ?? []), ...e.a.slice(0, 1)]);
      const old: Piece[] = (o?.works ?? []).map((w) => ({ id: String(w.id), file: w.file, title: w.title, artist: w.artist, date: w.date, credit: w.credit, page: w.page, refs: refsOf.get(w.id) ?? [] }));
      setAll([...(m?.works ?? []), ...old]);
    }).catch(() => setAll([]));
  }, []);
  const themes = useMemo(() => [...new Set((all ?? []).map((p) => p.theme).filter(Boolean) as string[])].sort(), [all]);
  const list = (all ?? []).filter((p) => (kind === 'all' || (kind === 'dore') === p.id.startsWith('dore')) && (!theme || p.theme === theme));
  const where = (p: Piece) => p.refs.slice(0, 2).map((r) => {
    const x = parseRefs(r);
    if (x.ok) return r;
    const id = r.split('.')[0];
    try { return getBook(id).name; } catch { return r; }
  }).join(', ');
  const same = open ? (all ?? []).filter((p) => p.id !== open.id && p.refs[0] && open.refs[0] && p.refs[0].split(/[:.]/).slice(0, 2).join() === open.refs[0].split(/[:.]/).slice(0, 2).join()) : [];
  return (
    <div className="page">
      <h1>Gallery</h1>
      <p className="lede">Paintings and engravings of Bible scenes, all public domain. Tap one to see it larger and where it belongs in Scripture.</p>
      <div className="chips" role="group" aria-label="Filter pictures">
        {([['all', 'All'], ['paint', 'Paintings'], ['dore', 'Doré engravings']] as const).map(([k, l]) => <button key={k} className={`chip${kind === k ? ' sel' : ''}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}
        {themes.length > 0 && <select aria-label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)}><option value="">Any theme</option>{themes.map((t) => <option key={t}>{t}</option>)}</select>}
      </div>
      {all === null && <p className="muted" role="status">Loading pictures…</p>}
      <ul className="gallery-grid">
        {list.map((p) => (
          <li key={p.id}>
            <button onClick={() => { setOpen(p); setPair(null); }} aria-label={`${p.title}, ${p.artist}`}>
              <img src={`${import.meta.env.BASE_URL}${p.file}`} alt="" loading="lazy" decoding="async" />
              <span>{p.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {open && (
        <div className="gallery-view" role="dialog" aria-modal="true" aria-label={open.title} onClick={() => setOpen(null)}>
          <div className="gallery-card" onClick={(e) => e.stopPropagation()}>
            <button className="galaxy-x" onClick={() => setOpen(null)} aria-label="Close">×</button>
            <div className={pair ? 'gallery-pair' : ''}>
              <figure><img src={`${import.meta.env.BASE_URL}${open.file}`} alt={`${open.title}, ${open.artist}`} /></figure>
              {pair && <figure><img src={`${import.meta.env.BASE_URL}${pair.file}`} alt={`${pair.title}, ${pair.artist}`} /></figure>}
            </div>
            <h2>{open.title}</h2>
            <p className="muted small">{[open.artist, open.date].filter(Boolean).join(' · ')}{where(open) ? ` · ${where(open)}` : ''}</p>
            <p className="small muted">{open.credit} <a href={open.page || undefined} target="_blank" rel="noreferrer">Source</a></p>
            {same.length > 0 && <p className="small">Compare with: {same.slice(0, 4).map((p) => <button key={p.id} className="chip" onClick={() => setPair(pair?.id === p.id ? null : p)}>{p.artist.split(' ').slice(-1)[0]}, {p.title.slice(0, 24)}</button>)}</p>}
            {open.refs[0] && <Link className="btn primary" to={`/study/search?q=${encodeURIComponent(open.refs[0])}`}>Read the passage</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
