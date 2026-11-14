import GameHelp from '../../components/GameHelp';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPlaces, type Place } from '../../data/content';
import { getJson } from '../../data/loader';
import { parseRefId, formatRef } from '../../lib/refs';
import ShareButton from '../../components/ShareButton';
import { distanceKm, pinPoints } from '../../lib/gameLogic';
import { dayIndex, markDailyDone, seeded, shuffled } from '../../lib/dailyGame';

const ROUNDS = 5;
/** Regions and rivers are too wide to point at. */
const BROAD = new Set(['Asia', 'Assyria', 'Babylon', 'Beyond the River', 'Canaan', 'Cush', 'Edom', 'Egypt', 'Euphrates', 'Galilee', 'Gilead', 'Jordan', 'Judea', 'Lebanon', 'Macedonia', 'Moab', 'Negeb', 'Nile', 'Bashan', 'Midian', 'Amalek', 'Arabah', 'Carmel']);
const points = pinPoints;
const km = distanceKm;

/** Where in the Bible lands is it? Tap the map for a place named in Scripture; the closer you are, the more you score. */
export default function PilgrimPage() {
  const [pool, setPool] = useState<Place[] | null>(null);
  const [seed, setSeed] = useState(dayIndex());
  const [daily, setDaily] = useState(true);
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [log, setLog] = useState<number[]>([]);
  const [last, setLast] = useState<{ d: number; pts: number } | null>(null);
  const [hint, setHint] = useState(false);
  const [latIn, setLatIn] = useState('');
  const [lonIn, setLonIn] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  useEffect(() => { getPlaces().then((l) => setPool((l ?? []).filter((p): p is Place => !!p && !p.a && (p.nv ?? 0) >= 4 && !/\d/.test(p.n) && !BROAD.has(p.n)))); }, []);
  const rounds = pool ? shuffled(pool, seeded(seed + 9)).slice(0, ROUNDS) : [];
  const q = rounds[i];
  const done = !!pool && i >= ROUNDS;

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [33, 35], zoom: 4, minZoom: 3, maxZoom: 8, worldCopyJump: false, maxBounds: [[8, -12], [52, 70]], maxBoundsViscosity: 1, attributionControl: false });
    m.createPane('base').style.zIndex = '200';
    // an offline map with no labels: land, lakes and four rivers drawn from public-domain Natural Earth outlines
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
      if (guess) { L.polyline([guess, a], { color: '#6b1f29', dashArray: '4 6' }).addTo(g); map.current?.fitBounds(L.latLngBounds([guess, a]).pad(0.5), { maxZoom: 8, animate: false }); }
    }
  }, [guess, last, q]);

  const pinAt = (lat: number, lon: number) => { if (answered.current || Number.isNaN(lat) || Number.isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { setPinMsg('Enter a latitude from -90 to 90 and a longitude from -180 to 180.'); return; } setGuess([lat, lon]); setPinMsg(`Pin placed at ${lat.toFixed(2)}, ${lon.toFixed(2)}.`); map.current?.panTo([lat, lon], { animate: false }); };
  const pinCentre = () => { const c = map.current?.getCenter(); if (c) pinAt(c.lat, c.lng); };
  const lock = () => { if (!q || !guess) return; const d = km(guess, [q.lat, q.lon]); const pts = points(d); setScore((s) => s + pts); setLog((l) => [...l, pts]); setLast({ d, pts }); };
  const next = () => { setGuess(null); setLast(null); setHint(false); setPinMsg(''); setI((n) => n + 1); map.current?.setView([33, 35], 4, { animate: false }); };
  useEffect(() => { if (done && daily) markDailyDone('pilgrim', `${score}/${ROUNDS * 100}`, score >= 400); }, [done]); // eslint-disable-line
  const again = () => { setDaily(false); setSeed(Math.floor(Math.random() * 1e6)); setI(0); setScore(0); setLog([]); setGuess(null); setLast(null); };
  const shareText = () => `Pin the Place ${daily ? '#' + dayIndex() : 'practice'} 📍 ${score}/${ROUNDS * 100}\n${log.map((p) => (p >= 80 ? '🟩' : p >= 50 ? '🟨' : p >= 20 ? '🟧' : '🟥')).join('')}`;
  const first = q?.v?.[0] ? parseRefId(q.v[0]) : null;

  if (!pool) return <div className="page"><h1>Pin the Place</h1><p className="muted">Loading…</p></div>;
  return (
    <div className="page pilgrim">
      <h1>Pin the Place</h1>
      <GameHelp how={["Read the place name, then put a pin where you think it is on the map.", "With a mouse or touch, tap the map. Without one, type a latitude and longitude, or move the map with the arrow keys and press Place pin at the map centre.", "Lock in your guess to see how far away you were. Closer scores more, up to 100.", "Five places a round."]} />
      {done ? (
        <div className="ws-end"><p className="ws-score">{score} of {ROUNDS * 100}</p><p className="muted">{score > 350 ? 'You could lead the pilgrimage.' : 'Every map you open helps.'}</p><div className="row" style={{ justifyContent: 'center', gap: 8 }}><ShareButton text={shareText()} path="/play/pilgrim" label="Share result" className="btn" /><button className="btn ghost" onClick={again}>Play another five</button></div></div>
      ) : (
        <>
          <p className="pg-ask">Where is <strong>{q?.n}</strong>? <span className="muted small">({i + 1} of {ROUNDS})</span></p>
          {hint && q && <p className="muted small">{first ? `It appears in ${formatRef(first)}.` : ''}{q.c ? ` ${q.c}.` : ''}</p>}
          <div ref={el} className="pg-map" role="application" aria-label="Map. Tap where you think the place is, or use the arrow keys to move the map and the pin buttons." onKeyDown={(e) => { if (e.key === 'Enter' && !last) { e.preventDefault(); pinCentre(); } }} />
          {!last && (
            <fieldset className="pg-kb" style={{ border: 0, padding: 0, margin: '6px 0' }}>
              <legend className="small"><strong>Without the mouse or touch</strong></legend>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
                <button type="button" className="btn small" onClick={pinCentre}>Place pin at the map centre</button>
                <label className="small">Latitude <input type="number" step="any" inputMode="decimal" value={latIn} onChange={(e) => setLatIn(e.target.value)} style={{ width: 90 }} /></label>
                <label className="small">Longitude <input type="number" step="any" inputMode="decimal" value={lonIn} onChange={(e) => setLonIn(e.target.value)} style={{ width: 90 }} /></label>
                <button type="button" className="btn small" disabled={latIn === '' || lonIn === ''} onClick={() => pinAt(+latIn, +lonIn)}>Place pin at these numbers</button>
              </div>
            </fieldset>
          )}
          <p className="small" role="status" aria-live="polite">{pinMsg || (guess ? `Pin placed at ${guess[0].toFixed(2)}, ${guess[1].toFixed(2)}.` : 'No pin yet.')}</p>
          <div className="row" style={{ gap: 8, margin: '8px 0' }}>
            {!last ? (<><button className="btn primary" onClick={lock} disabled={!guess}>Lock in my guess</button><button className="btn ghost" onClick={() => setHint(true)} disabled={hint}>Hint</button></>) : (<><span><strong>{Math.round(last.d)} km away: +{last.pts}</strong></span><button className="btn primary" onClick={next}>{i + 1 === ROUNDS ? 'See my score' : 'Next place'}</button></>)}
          </div>
          <p className="muted small">Score {score}. Map outlines: Natural Earth.</p>
        </>
      )}
    </div>
  );
}
