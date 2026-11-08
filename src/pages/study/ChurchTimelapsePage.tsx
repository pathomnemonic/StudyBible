import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getJson } from '../../data/loader';
import { contextLink } from '../../chains/links';
import type { Step } from '../../chains/types';

interface Ev { year: number; place: string; lat: number; lon: number; kind: string; title: string; text: string; council?: number; step?: Step }
const KIND: Record<string, { label: string; color: string }> = {
  foundation: { label: 'Church founded', color: '#4a7bd0' }, council: { label: 'Council', color: '#8a5ac2' }, martyrdom: { label: 'Martyrdom', color: '#c05050' },
  mission: { label: 'Mission', color: '#2f8f6b' }, monastery: { label: 'Monastic', color: '#b9772e' }, schism: { label: 'Division', color: '#777' },
  heresy: { label: 'Controversy', color: '#c0507a' }, saint: { label: 'Saint', color: '#d4a017' }, text: { label: 'Writing', color: '#5a8f9a' }, state: { label: 'World events', color: '#999' },
};
const FIRST = 30, LAST = 1600, FRESH = 40;
const yl = (y: number) => `AD ${y}`;

/** The Church from Pentecost to 1600, drawn on the map as it happened: councils, martyrs, missions and foundations appear in date order. */
export default function ChurchTimelapsePage() {
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [year, setYear] = useState(FIRST);
  const [playing, setPlaying] = useState(false);
  const [kinds, setKinds] = useState<Set<string>>(new Set(Object.keys(KIND)));
  const [pick, setPick] = useState<Ev | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => { import('../../data/church-timeline.json').then((m) => setEvents((m.default as Ev[]).slice().sort((a, b) => a.year - b.year))).catch(() => setEvents([])); }, []);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [38, 20], zoom: 4, minZoom: 3, maxZoom: 8, maxBounds: [[8, -14], [56, 72]], maxBoundsViscosity: 1, attributionControl: false });
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

  const shown = useMemo(() => (events ?? []).filter((e) => e.year <= year && kinds.has(e.kind)), [events, year, kinds]);
  useEffect(() => {
    const g = layer.current; if (!g) return;
    g.clearLayers();
    for (const e of shown) {
      const fresh = year - e.year <= FRESH;
      const c = KIND[e.kind]?.color ?? '#999';
      const mk = L.circleMarker([e.lat, e.lon], { radius: fresh ? 9 : 5, color: fresh ? '#fff' : c, weight: fresh ? 2 : 1, fillColor: c, fillOpacity: fresh ? 1 : 0.65 });
      mk.on('click', () => setPick(e));
      mk.bindTooltip(`${yl(e.year)} · ${e.title}`, { direction: 'top' });
      mk.addTo(g);
    }
  }, [shown, year]);

  useEffect(() => {
    if (!playing) return;
    const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setInterval(() => setYear((y) => { if (y >= LAST) { setPlaying(false); return LAST; } return Math.min(LAST, y + (reduced ? 20 : 5)); }), reduced ? 400 : 110);
    return () => window.clearInterval(t);
  }, [playing]);

  const recent = shown.filter((e) => year - e.year <= 120).slice(-6).reverse();
  const toggle = (k: string) => setKinds((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const link = pick?.step && contextLink(pick.step);
  return (
    <div className="page timelapse">
      <h1>The Church across the centuries</h1>
      <p className="lede">Watch the Church spread and gather from Pentecost to 1600: councils, martyrs, missions and foundations, appearing in date order.</p>
      <div ref={el} className="tl-map" role="img" aria-label={`Map of the Mediterranean world showing ${shown.length} events up to AD ${year}`} />
      <div className="tl-controls">
        <button className="btn primary" onClick={() => { if (year >= LAST) setYear(FIRST); setPlaying((p) => !p); }} aria-pressed={playing}>{playing ? 'Pause' : year >= LAST ? 'Replay' : 'Play'}</button>
        <span className="tl-year" aria-live="polite">{yl(year)}</span>
        <span className="muted small">{shown.length} events</span>
      </div>
      <input className="tl-range" type="range" min={FIRST} max={LAST} value={year} onChange={(e) => { setPlaying(false); setYear(+e.target.value); }} aria-label="Year" />
      <div className="chips tl-legend" role="group" aria-label="Show">
        {Object.entries(KIND).map(([k, v]) => <button key={k} className={`chip${kinds.has(k) ? ' sel' : ''}`} aria-pressed={kinds.has(k)} onClick={() => toggle(k)}><i className="tl-sw" style={{ background: v.color }} />{v.label}</button>)}
      </div>
      {pick && (
        <section className="card tl-pick" aria-label="Selected event">
          <p className="chain-meta"><span className="chain-when big">{yl(pick.year)}</span><span className="muted">{pick.place}</span></p>
          <h2 className="chain-label">{pick.title}</h2>
          <p>{pick.text}</p>
          {pick.step?.quote && <blockquote className="chain-quote"><p>{pick.step.quote}</p><footer className="small muted">{pick.step.label}</footer></blockquote>}
          <p className="small no-print">{link && <Link to={link.to}>{link.text}</Link>}{pick.council && <>{link && ' · '}<Link to={`/study/councils?n=${pick.council}`}>About this council</Link></>} <button className="linklike" onClick={() => setPick(null)}>Close</button></p>
        </section>
      )}
      <h2 className="chain-h2">Just happened</h2>
      {recent.length === 0 ? <p className="muted">Nothing yet. Press Play, or drag the year.</p> : (
        <ul className="list tl-recent">{recent.map((e) => <li key={e.year + e.title}><button className="linklike" onClick={() => { setPick(e); map.current?.panTo([e.lat, e.lon]); }}><strong>{yl(e.year)}</strong> {e.title}</button><span className="muted small"> · {e.place}</span></li>)}</ul>
      )}
      <p className="muted small">The map shows the Mediterranean world and its neighbors, where most of the Church’s first fifteen centuries unfolded; later missions beyond it are not drawn. Dates are the conventional ones, and “c.” dates are approximate. Events from other traditions are included as context and described neutrally.</p>
    </div>
  );
}
