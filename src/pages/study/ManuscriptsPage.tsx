import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getJson } from '../../data/loader';
import { parseRefs } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { useEditions } from '../../data/EditionsContext';
import { readerPath } from '../../lib/nav';

interface Ms { id: number; title: string; date: string; culture: string; medium: string; credit: string; page: string; ref: string | null; about: string; thumb: string; images: string[] }

/** Open-access manuscript photographs (The Met, CC0) with a zoomable viewer. Images load from the museum when opened. */
export default function ManuscriptsPage() {
  const [sp, setSp] = useSearchParams();
  const [list, setList] = useState<Ms[]>([]);
  const [page, setPage] = useState(0);
  const [z, setZ] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const { get, editions } = useEditions();
  useEffect(() => {
    getJson<{ works: Ms[] }>('manuscripts.json', true).then((d) => setList(d?.works ?? []));
  }, []);
  const cur = list.find((m) => String(m.id) === sp.get('m'));
  useEffect(() => {
    setPage(0);
    setZ({ k: 1, x: 0, y: 0 });
  }, [cur?.id]);
  useEffect(() => setZ({ k: 1, x: 0, y: 0 }), [page]);

  if (cur) {
    const ed = get('dra') ?? editions[0];
    let link: string | null = null;
    if (cur.ref) {
      const p = parseRefs(cur.ref);
      if (p.ok) link = readerPath(ed, convertRef('kjv', 'vulgate', p.refs[0].ref).ref);
    }
    const zoom = (d: number) => setZ((s) => ({ ...s, k: Math.max(1, Math.min(6, s.k * d)) }));
    return (
      <div className="page">
        <button className="linklike" onClick={() => setSp({})}>← All manuscripts</button>
        <h1 style={{ marginTop: 6 }}>{cur.title}</h1>
        <p className="muted">{cur.date} · {cur.culture} · {cur.medium}</p>
        <p>{cur.about}</p>
        <div className="ms-viewer" onWheel={(e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 0.87); }} onPointerDown={(e) => { drag.current = { x: e.clientX - z.x, y: e.clientY - z.y }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }} onPointerMove={(e) => drag.current && setZ((s) => ({ ...s, x: e.clientX - drag.current!.x, y: e.clientY - drag.current!.y }))} onPointerUp={() => (drag.current = null)}>
          <img src={cur.images[page]} alt={`${cur.title}, image ${page + 1} of ${cur.images.length}`} draggable={false} style={{ transform: `translate(${z.x}px, ${z.y}px) scale(${z.k})` }} />
        </div>
        <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          <button className="btn small" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous image">‹</button>
          <span className="muted small">Image {page + 1} of {cur.images.length}</span>
          <button className="btn small" onClick={() => setPage((p) => Math.min(cur.images.length - 1, p + 1))} disabled={page >= cur.images.length - 1} aria-label="Next image">›</button>
          <button className="btn small" onClick={() => zoom(1.4)} aria-label="Zoom in">＋</button>
          <button className="btn small" onClick={() => zoom(0.7)} aria-label="Zoom out">－</button>
          <button className="btn small ghost" onClick={() => setZ({ k: 1, x: 0, y: 0 })}>Reset</button>
          {link && <Link className="btn small" to={link}>Read this passage</Link>}
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>{cur.credit}. Public domain (CC0). <a href={cur.page} target="_blank" rel="noreferrer">Catalogue record at The Met</a>. Scroll or pinch to zoom, drag to move. The photographs load from the museum's servers.</p>
      </div>
    );
  }
  return (
    <div className="page">
      <h1>Manuscripts</h1>
      <p className="lede">Real pages, from a fourth-century fragment of John to medieval Bibles, Gospel books and Psalters. Choose one to look closely; zoom in on the writing.</p>
      <div className="ms-grid">
        {list.map((m) => (
          <button key={m.id} className="ms-card" onClick={() => setSp({ m: String(m.id) })}>
            <img src={m.thumb} alt="" loading="lazy" />
            <span className="ms-t">{m.title}</span>
            <span className="muted small">{m.date}</span>
          </button>
        ))}
      </div>
      <p className="muted small">Photographs: The Metropolitan Museum of Art open-access programme (CC0). For the great codices (Vaticanus, Sinaiticus, Alexandrinus) see the links in each passage's manuscript notes; those images are not public domain to reuse here.</p>
    </div>
  );
}
