import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPlaces, getPlacesByBook, type Place } from '../../data/content';
import { BOOKS } from '../../lib/canon';
import { parseRefId } from '../../lib/refs';
import RefLink from '../../components/RefLink';

/** Interactive map of places named in Scripture (OpenBible.info geocoding, CC BY 4.0) on OpenStreetMap tiles. */
export default function MapsPage() {
  const [sp, setSp] = useSearchParams();
  const [places, setPlaces] = useState<(Place | null)[]>([]);
  const [q, setQ] = useState('');
  const [book, setBook] = useState(sp.get('book') ?? '');
  const [inBook, setInBook] = useState<Set<number> | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef<Map<number, L.CircleMarker>>(new Map());
  const sel = sp.get('place') != null ? +sp.get('place')! : null;

  useEffect(() => {
    getPlaces().then((p) => setPlaces(p ?? []));
  }, []);
  useEffect(() => {
    if (!book) return setInBook(null);
    getPlacesByBook(book).then((l) => setInBook(new Set((l ?? []).map((e) => e[2]))));
  }, [book]);

  const visible = useMemo(() => {
    const lc = q.trim().toLowerCase();
    return places
      .map((p, i) => ({ p, i }))
      .filter(({ p, i }) => p && (!inBook || inBook.has(i)) && (!lc || p.n.toLowerCase().includes(lc) || p.r?.toLowerCase().includes(lc)))
      .sort((a, b) => a.p!.n.localeCompare(b.p!.n));
  }, [places, q, inBook]);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [31.8, 35.2], zoom: 7, worldCopyJump: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 14, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    markers.current.clear();
    const pts: L.LatLngExpression[] = [];
    for (const { p, i } of visible) {
      const c = L.circleMarker([p!.lat, p!.lon], { radius: 5, weight: 1, color: '#6b1f29', fillColor: p!.a ? '#d9a3aa' : '#8a2f39', fillOpacity: 0.85 });
      c.bindTooltip(p!.n + (p!.a ? ' (approx.)' : ''));
      c.on('click', () => setSp((x) => (x.set('place', String(i)), x), { replace: true }));
      c.addTo(g);
      markers.current.set(i, c);
      pts.push([p!.lat, p!.lon]);
    }
    if (book && pts.length && map.current) map.current.fitBounds(L.latLngBounds(pts as L.LatLngTuple[]).pad(0.2), { maxZoom: 9 });
  }, [visible, book]);

  const chosen = sel != null ? places[sel] : null;
  useEffect(() => {
    if (chosen && map.current) {
      map.current.setView([chosen.lat, chosen.lon], Math.max(map.current.getZoom(), 9));
      markers.current.get(sel!)?.openTooltip();
    }
  }, [sel, chosen]);

  return (
    <div className="page wide">
      <h1>Maps</h1>
      <p className="lede">Places named in Scripture. Locations are scholarly best guesses; paler dots are less certain.</p>
      <div className="maps-layout">
        <div>
          <div className="row" style={{ marginBottom: 8 }}>
            <input type="search" placeholder="Find a place…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a place" />
            <select value={book} onChange={(e) => setBook(e.target.value)} aria-label="Only places in book">
              <option value="">All books</option>
              {BOOKS.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="map-canvas" ref={el} role="application" aria-label="Map of biblical places" />
          <p className="muted small">Map data © OpenStreetMap contributors. Place data © OpenBible.info, CC BY 4.0. The map needs a connection.</p>
        </div>
        <aside className="card map-side">
          {chosen ? (
            <>
              <div className="row between">
                <h2 className="card-title">{chosen.n}</h2>
                <button className="btn small ghost" onClick={() => setSp((x) => (x.delete('place'), x), { replace: true })}>Close</button>
              </div>
              {chosen.r && <p className="muted small">Same site as {chosen.r}</p>}
              {chosen.c && <p className="muted small">{chosen.c}</p>}
              {chosen.a && <p className="notice">Location approximate.</p>}
              <p className="small">
                Mentioned in ({chosen.nv}):{' '}
                {chosen.v.map((id) => {
                  const r = parseRefId(id);
                  return r ? <span key={id} style={{ marginRight: 8 }}><RefLink id={id} /></span> : null;
                })}
                {chosen.nv > chosen.v.length && <span className="muted"> and {chosen.nv - chosen.v.length} more</span>}
              </p>
            </>
          ) : (
            <>
              <h2 className="card-title">{visible.length} places</h2>
              <ul className="list map-list">
                {visible.slice(0, 300).map(({ p, i }) => (
                  <li key={i}>
                    <button className="linklike" onClick={() => setSp((x) => (x.set('place', String(i)), x), { replace: true })}>{p!.n}</button>
                  </li>
                ))}
              </ul>
              {visible.length > 300 && <p className="muted small">Showing the first 300; narrow with the search box.</p>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
