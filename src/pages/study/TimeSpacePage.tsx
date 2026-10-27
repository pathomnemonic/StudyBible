import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPlaces, type Place } from '../../data/content';
import { getJourneys, getWorld, type Journey, type World } from '../../study/refData';
import RefChips from '../../components/RefChips';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** conventional year ranges (negative = BC) used only to place finds and journeys on the slider */
const SPAN: Record<string, [number, number]> = {
  patriarchs: [-2000, -1700], exodus: [-1300, -1200], judges: [-1200, -1050], monarchy: [-1050, -930], divided: [-930, -722],
  judah: [-722, -400], 'second-temple': [-515, 70], jesus: [-6, 30], church: [30, 100],
};
const JOURNEY_ERA: Record<string, string> = { abraham: 'patriarchs', exodus: 'exodus', jesus: 'jesus', paul1: 'church', paul2: 'church', paul3: 'church', paulrome: 'church' };
const yearOf = (d: string): number | null => {
  const m = /(\d{2,4})/.exec(d);
  if (!m) return null;
  return /BC/.test(d) ? -+m[1] : +m[1];
};
const strip = (s: string) => s.replace(/ \d$/, '');

/** One slider through biblical time. The map shows where the story is, the cards what the finds and journeys say, and earlier places fade behind. */
export default function TimeSpacePage() {
  const [world, setWorld] = useState<World | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [places, setPlaces] = useState<Map<string, Place>>(new Map());
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    getWorld().then(setWorld);
    getJourneys().then((d) => setJourneys(d?.journeys ?? []));
    getPlaces().then((p) => setPlaces(new Map((p ?? []).filter((x): x is Place => !!x).map((x) => [x.n, x]))));
  }, []);
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [33, 36], zoom: 5 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);
  const eras = world?.eras ?? [];
  const era = eras[i];
  const finds = useMemo(() => {
    if (!era || !world) return [];
    const [a, b] = SPAN[era.id] ?? [0, 0];
    return world.finds.filter((f) => { const y = yearOf(f.date); return y !== null && y >= a && y <= b; });
  }, [era, world]);
  const jr = journeys.filter((j) => era && JOURNEY_ERA[j.id] === era.id);

  useEffect(() => {
    const g = layer.current;
    if (!g || !era || !places.size) return;
    g.clearLayers();
    const now: L.LatLngTuple[] = [];
    eras.slice(0, i).forEach((e) => e.places.forEach((n) => {
      const p = places.get(n);
      if (p) L.circleMarker([p.lat, p.lon], { radius: 4, color: '#8d84b8', weight: 1, fillOpacity: 0.25, opacity: 0.4 }).bindTooltip(`${strip(n)} (${e.title})`).addTo(g);
    }));
    era.places.forEach((n) => {
      const p = places.get(n);
      if (!p) return;
      now.push([p.lat, p.lon]);
      L.circleMarker([p.lat, p.lon], { radius: 9, color: '#b9a8ff', weight: 3, fillColor: '#b9a8ff', fillOpacity: 0.9 }).bindTooltip(strip(n), { permanent: true, direction: 'right', offset: [8, 0] }).addTo(g);
    });
    jr.forEach((j) => {
      const pts = j.stops.map((s) => places.get(s.place)).filter((p): p is Place => !!p).map((p) => [p.lat, p.lon] as L.LatLngTuple);
      L.polyline(pts, { color: j.color, weight: 3, opacity: 0.7, dashArray: j.caution ? '6 6' : undefined }).bindTooltip(j.title).addTo(g);
      now.push(...pts);
    });
    if (now.length && map.current) map.current.fitBounds(L.latLngBounds(now).pad(0.35), { animate: !reduced(), maxZoom: 8 });
  }, [i, era, places, eras, jr.length]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((x) => (x + 1 >= eras.length ? (setPlaying(false), x) : x + 1)), 4500);
    return () => clearInterval(t);
  }, [playing, eras.length]);

  return (
    <div className="page wide">
      <h1>Time and place</h1>
      <p className="lede">Slide through the biblical story.</p>
      <div className="ts-slider">
        <button className="btn small primary" aria-pressed={playing} onClick={() => { if (!playing && i >= eras.length - 1) setI(0); setPlaying(!playing); }}>{playing ? 'Pause' : 'Play'}</button>
        <input type="range" min={0} max={Math.max(0, eras.length - 1)} value={i} onChange={(e) => setI(+e.target.value)} aria-label="Era" aria-valuetext={era ? `${era.title}, ${era.dates}` : ''} />
      </div>
      <div className="ts-labels" aria-hidden="true">{eras.map((e, n) => <button key={e.id} className={n === i ? 'on' : ''} tabIndex={-1} onClick={() => setI(n)}>{e.title.replace(/^The /, '')}</button>)}</div>
      <div className="maps-layout">
        <div>
          <div className="map-canvas" ref={el} role="application" aria-label="Map of the era" />
          <p className="muted small">Map © OpenStreetMap contributors; place data © OpenBible.info, CC BY 4.0. Needs a connection.</p>
        </div>
        <aside className="card map-side">
          {era && (
            <>
              <h2 className="card-title">{era.title}</h2>
              <p className="muted small" style={{ margin: 0 }}>{era.dates}</p>
              <p>{era.summary}</p>
              <p className="small"><RefChips text={era.refs} /></p>
              <p className="small"><strong>Context:</strong> {era.context}</p>
              {finds.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', margin: '10px 0 4px' }}>Finds from the period</h3>
                  <ul className="list">{finds.map((f) => <li key={f.name}><strong>{f.name}</strong> <span className="muted small">{f.date}</span><div className="small">{f.note}</div></li>)}</ul>
                </>
              )}
              {jr.length > 0 && <p className="small">Journeys on the map: {jr.map((j) => <Link key={j.id} className="chip" style={{ marginRight: 4 }} to={`/study/world?j=${j.id}`}>{j.title}</Link>)}</p>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
