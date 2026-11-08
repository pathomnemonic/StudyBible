import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getJson } from '../../data/loader';
import { getPlaces, type Place } from '../../data/content';
import ShareLinkButton from '../../components/ShareLinkButton';

interface Stop { place: string; ref: string; quote: string; what: string; echo: string }
interface Walk { id: string; title: string; theme: string; stops: Stop[]; readNext?: number[] }
const refText = (ref: string) => { const m = /^([A-Z0-9]{3})\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(ref); return m ? { book: m[1], c: m[2], v: `${m[3]}${m[4] ? `-${m[4]}` : ''}` } : null; };

/** A thread of Scripture followed through the real places where it happens, in the order it unfolds. */
export default function WalksPage() {
  const { id } = useParams();
  const [walks, setWalks] = useState<Walk[] | null>(null);
  const [places, setPlaces] = useState<Map<string, Place> | null>(null);
  useEffect(() => { import('../../data/walks.json').then((m) => setWalks(m.default as Walk[])).catch(() => setWalks([])); getPlaces().then((l) => setPlaces(new Map((l ?? []).filter((p): p is Place => !!p).map((p) => [p.n, p])))); }, []);
  if (!walks || !places) return <div className="page"><p className="center-note">Loading…</p></div>;
  const w = id ? walks.find((x) => x.id === id) : undefined;
  if (w) return <WalkView w={w} places={places} />;
  return (
    <div className="page walks">
      <h1>Walks through the Bible</h1>
      <p className="lede">Follow one thread of Scripture across the map, stop by stop, and see how places answer one another.</p>
      {id && <p className="callout">We couldn’t find that walk. Here is the list.</p>}
      {walks.length === 0 && <p className="muted">Coming soon.</p>}
      <ul className="list chain-list">{walks.map((x) => <li key={x.id}><Link className="t" to={`/study/walks/${x.id}`}>{x.title}</Link> <span className="muted small">{x.stops.length} stops</span><p className="muted small" style={{ margin: '2px 0 0' }}>{x.theme}</p></li>)}</ul>
    </div>
  );
}

function WalkView({ w, places }: { w: Walk; places: Map<string, Place> }) {
  const [i, setI] = useState(0);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pts = w.stops.map((s) => places.get(s.place)).map((p) => (p ? ([p.lat, p.lon] as [number, number]) : null));
  useEffect(() => { setI(0); }, [w.id]);
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [32, 36], zoom: 6, minZoom: 3, maxZoom: 9, attributionControl: false });
    m.createPane('base').style.zIndex = '200';
    getJson<{ land: number[][][]; lakes: number[][][]; rivers: number[][][] }>('play/basemap.json', true).then((b) => {
      if (!b || !map.current) return;
      const ll = (r: number[][]) => r.map(([x, y]) => [y, x] as [number, number]);
      for (const r of b.land) L.polygon(ll(r), { stroke: true, weight: 1, color: '#9c8a5e', fillColor: '#e9dfc2', fillOpacity: 1, interactive: false, pane: 'base' }).addTo(m);
      for (const r of b.lakes) L.polygon(ll(r), { stroke: false, fillColor: '#a9c7d8', fillOpacity: 1, interactive: false, pane: 'base' }).addTo(m);
      for (const r of b.rivers) L.polyline(ll(r), { weight: 1.5, color: '#8fb4c9', interactive: false, pane: 'base' }).addTo(m);
    });
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.stop(); m.off(); m.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    const g = layer.current, m = map.current; if (!g || !m) return;
    g.clearLayers();
    const real = pts.filter((p): p is [number, number] => !!p);
    if (real.length > 1) L.polyline(real, { color: '#8a2f39', weight: 2, dashArray: '5 7', opacity: 0.8 }).addTo(g);
    w.stops.forEach((s, k) => {
      const p = pts[k]; if (!p) return;
      const here = k === i;
      L.circleMarker(p, { radius: here ? 11 : 7, color: here ? '#1b1405' : '#fff', weight: 2, fillColor: here ? '#c9a227' : k < i ? '#8a2f39' : '#999', fillOpacity: 1 })
        .bindTooltip(`${k + 1}. ${s.place}`, { permanent: here, direction: 'top' }).on('click', () => setI(k)).addTo(g);
    });
    const cur = pts[i];
    if (cur) m.flyTo(cur, Math.max(m.getZoom(), 6), { duration: 0.6 });
  }, [i, w, places]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = w.stops[i];
  const r = refText(s.ref);
  const last = i === w.stops.length - 1;
  return (
    <div className="page walks">
      <p className="small no-print"><Link to="/study/walks">← Walks through the Bible</Link></p>
      <h1>{w.title}</h1>
      <p className="lede">{w.theme}</p>
      <div ref={el} className="tl-map" role="img" aria-label={`Map of the walk: stop ${i + 1}, ${s.place}`} />
      <ol className="walk-dots no-print" aria-label="Stops">{w.stops.map((x, k) => <li key={k}><button className={`chip${k === i ? ' sel' : ''}`} aria-current={k === i} onClick={() => setI(k)}>{k + 1}. {x.place}</button></li>)}</ol>
      <section className="card walk-stop" aria-live="polite">
        <p className="chain-meta"><span className="chain-when big">Stop {i + 1} of {w.stops.length}</span><span className="muted">{s.place}</span></p>
        <h2 className="chain-label">{s.ref.replace(/\./g, ' ').replace(/^(\S+) (\d+) (.*)$/, '$1 $2:$3')}</h2>
        <blockquote className="chain-quote"><p>{s.quote}</p></blockquote>
        <p>{s.what}</p>
        <p><strong>{last ? 'Where it leads' : 'How it echoes ahead'}.</strong> {s.echo}</p>
        {r && <p className="small no-print"><Link to={`/read/webc/${r.book}/${r.c}?v=${r.v}`}>Read it in the Bible</Link></p>}
        <div className="row no-print" style={{ gap: 8 }}>
          <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
          <button className="btn primary" disabled={last} onClick={() => setI(i + 1)}>Next stop</button>
        </div>
      </section>
      {w.readNext && w.readNext.length > 0 && <p className="small">In the Catechism: {w.readNext.map((n, k) => <span key={n}>{k > 0 && ', '}<Link to={`/study/catechism/${n}`}>§{n}</Link></span>)}</p>}
      <p className="no-print"><ShareLinkButton path={`/study/walks/${w.id}`} title={w.title} /></p>
      <p className="muted small">Quotations are from the World English Bible, Catholic edition, and are checked against the text built into this app. Locations are scholarly best guesses; some are approximate. Readings of one place as echoing another follow the Church’s typological tradition.</p>
    </div>
  );
}
