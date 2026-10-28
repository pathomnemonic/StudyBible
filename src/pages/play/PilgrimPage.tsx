import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPlaces, type Place } from '../../data/content';
import { parseRefId, formatRef } from '../../lib/refs';
import { dayIndex, markDailyDone, seeded, shuffled } from '../../lib/dailyGame';

const ROUNDS = 5;
/** Regions and rivers are too wide to point at. */
const BROAD = new Set(['Asia', 'Assyria', 'Babylon', 'Beyond the River', 'Canaan', 'Cush', 'Edom', 'Egypt', 'Euphrates', 'Galilee', 'Gilead', 'Jordan', 'Judea', 'Lebanon', 'Macedonia', 'Moab', 'Negeb', 'Nile', 'Bashan', 'Midian', 'Amalek', 'Arabah', 'Carmel']);
const points = (km: number) => Math.round(100 * Math.pow(0.5, km / 120));
const km = (a: [number, number], b: [number, number]) => L.latLng(a).distanceTo(L.latLng(b)) / 1000;

/** Where in the Bible lands is it? Tap the map for a place named in Scripture; the closer you are, the more you score. */
export default function PilgrimPage() {
  const [pool, setPool] = useState<Place[] | null>(null);
  const [seed, setSeed] = useState(dayIndex());
  const [daily, setDaily] = useState(true);
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [last, setLast] = useState<{ d: number; pts: number } | null>(null);
  const [hint, setHint] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  useEffect(() => { getPlaces().then((l) => setPool((l ?? []).filter((p): p is Place => !!p && !p.a && (p.nv ?? 0) >= 8 && !/\d/.test(p.n) && !BROAD.has(p.n)))); }, []);
  const rounds = pool ? shuffled(pool, seeded(seed + 9)).slice(0, ROUNDS) : [];
  const q = rounds[i];
  const done = !!pool && i >= ROUNDS;

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [33, 35], zoom: 4, worldCopyJump: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', { maxZoom: 9, attribution: '© OpenStreetMap contributors © CARTO' }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, [done, !!pool]); // eslint-disable-line react-hooks/exhaustive-deps
  const answered = useRef(false);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const onClick = (e: L.LeafletMouseEvent) => { if (answered.current) return; setGuess([e.latlng.lat, e.latlng.lng]); };
    m.on('click', onClick);
    return () => { m.off('click', onClick); };
  }, [pool, done]);
  useEffect(() => { answered.current = !!last; }, [last]);
  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    if (guess) L.circleMarker(guess, { radius: 7, color: '#6b1f29', fillColor: '#8a2f39', fillOpacity: 0.9 }).addTo(g);
    if (last && q) {
      const a: [number, number] = [q.lat, q.lon];
      L.circleMarker(a, { radius: 7, color: '#1b1405', fillColor: '#c9a227', fillOpacity: 1 }).bindTooltip(q.n, { permanent: true }).addTo(g);
      if (guess) { L.polyline([guess, a], { color: '#6b1f29', dashArray: '4 6' }).addTo(g); map.current?.fitBounds(L.latLngBounds([guess, a]).pad(0.5), { maxZoom: 8 }); }
    }
  }, [guess, last, q]);

  const lock = () => { if (!q || !guess) return; const d = km(guess, [q.lat, q.lon]); const pts = points(d); setScore((s) => s + pts); setLast({ d, pts }); };
  const next = () => { setGuess(null); setLast(null); setHint(false); setI((n) => n + 1); map.current?.setView([33, 35], 4); };
  useEffect(() => { if (done && daily) markDailyDone('pilgrim', `${score}/${ROUNDS * 100}`); }, [done]); // eslint-disable-line
  const again = () => { setDaily(false); setSeed(Math.floor(Math.random() * 1e6)); setI(0); setScore(0); setGuess(null); setLast(null); };
  const share = () => { const t = `Pin the Place ${daily ? dayIndex() : 'practice'}: ${score}/${ROUNDS * 100}`; if (navigator.share) navigator.share({ text: t }).catch(() => undefined); else navigator.clipboard?.writeText(t).catch(() => undefined); };
  const first = q?.v?.[0] ? parseRefId(q.v[0]) : null;

  if (!pool) return <div className="page"><h1>Pin the Place</h1><p className="muted">Loading…</p></div>;
  return (
    <div className="page pilgrim">
      <h1>Pin the Place</h1>
      {done ? (
        <div className="ws-end"><p className="ws-score">{score} of {ROUNDS * 100}</p><p className="muted">{score > 350 ? 'You could lead the pilgrimage.' : 'Every map you open helps.'}</p><div className="row" style={{ justifyContent: 'center', gap: 8 }}><button className="btn" onClick={share}>Share result</button><button className="btn ghost" onClick={again}>Play another five</button></div></div>
      ) : (
        <>
          <p className="pg-ask">Where is <strong>{q?.n}</strong>? <span className="muted small">({i + 1} of {ROUNDS})</span></p>
          {hint && q && <p className="muted small">{first ? `It appears in ${formatRef(first)}.` : ''}{q.c ? ` ${q.c}.` : ''}</p>}
          <div ref={el} className="pg-map" aria-label="Map: tap where you think the place is" />
          <div className="row" style={{ gap: 8, margin: '8px 0' }}>
            {!last ? (<><button className="btn primary" onClick={lock} disabled={!guess}>Lock in my guess</button><button className="btn ghost" onClick={() => setHint(true)} disabled={hint}>Hint</button></>) : (<><span><strong>{Math.round(last.d)} km away: +{last.pts}</strong></span><button className="btn primary" onClick={next}>{i + 1 === ROUNDS ? 'See my score' : 'Next place'}</button></>)}
          </div>
          <p className="muted small">Map tiles need a connection. Score {score}.</p>
        </>
      )}
    </div>
  );
}
