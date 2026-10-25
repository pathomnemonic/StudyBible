import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPlaces, type Place } from '../../data/content';
import { getJourneys, getWorld, type Journey, type World } from '../../study/refData';
import RefChips from '../../components/RefChips';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The biblical world: journeys on the map, historical eras and archaeological finds. */
export default function WorldPage() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') ?? 'journeys';
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [world, setWorld] = useState<World | null>(null);
  const [places, setPlaces] = useState<Map<string, Place>>(new Map());
  const [idx, setIdx] = useState<Map<string, number>>(new Map());
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const jid = sp.get('j') ?? 'paul1';
  const journey = journeys.find((j) => j.id === jid);

  useEffect(() => {
    getJourneys().then((d) => setJourneys(d?.journeys ?? []));
    getWorld().then(setWorld);
    getPlaces().then((p) => {
      const arr = p ?? [];
      setPlaces(new Map(arr.filter((x): x is Place => !!x).map((x) => [x.n, x])));
      setIdx(new Map(arr.map((x, i) => [x?.n ?? '', i] as [string, number]).filter(([n]) => n)));
    });
  }, []);
  useEffect(() => setStep(0), [jid]);

  useEffect(() => {
    if (tab !== 'journeys' || !el.current || map.current) return;
    const m = L.map(el.current, { center: [34, 30], zoom: 5 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, [tab]);

  useEffect(() => {
    const g = layer.current;
    if (!g || !journey || !places.size) return;
    g.clearLayers();
    const pts: L.LatLngTuple[] = [];
    journey.stops.forEach((s, i) => {
      const p = places.get(s.place);
      if (!p) return;
      pts.push([p.lat, p.lon]);
      const cur = i === step;
      L.circleMarker([p.lat, p.lon], { radius: cur ? 9 : 6, color: journey.color, weight: cur ? 3 : 1, fillColor: journey.color, fillOpacity: cur ? 1 : 0.55 })
        .bindTooltip(`${i + 1}. ${s.place.replace(/ \d$/, '')}`)
        .on('click', () => setStep(i))
        .addTo(g);
    });
    L.polyline(pts, { color: journey.color, weight: 3, opacity: 0.7, dashArray: journey.caution ? '6 6' : undefined }).addTo(g);
    const cur = places.get(journey.stops[step]?.place);
    if (cur && map.current) {
      if (step === 0 && pts.length > 1) map.current.fitBounds(L.latLngBounds(pts).pad(0.25), { animate: !reduced() });
      else map.current.panTo([cur.lat, cur.lon], { animate: !reduced() });
    }
  }, [journey, places, step]);

  useEffect(() => {
    if (!playing || !journey) return;
    const t = setInterval(() => setStep((s) => (s + 1 >= journey.stops.length ? (setPlaying(false), s) : s + 1)), 3000);
    return () => clearInterval(t);
  }, [playing, journey]);

  const stop = journey?.stops[step];
  return (
    <div className="page wide">
      <h1>The biblical world</h1>
      <div className="segmented" role="tablist" style={{ marginBottom: 12 }}>
        {[['journeys', 'Journeys'], ['eras', 'Eras and settings'], ['finds', 'Archaeology']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setSp(k === 'journeys' ? {} : { tab: k })}>{l}</button>
        ))}
      </div>

      {tab === 'journeys' && (
        <>
          <div className="row" style={{ marginBottom: 8 }}>
            <select value={jid} onChange={(e) => setSp({ j: e.target.value })} aria-label="Journey">
              {journeys.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <button className="btn small" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← Previous</button>
            <button className="btn small" onClick={() => setStep((s) => Math.min((journey?.stops.length ?? 1) - 1, s + 1))} disabled={!journey || step >= journey.stops.length - 1}>Next →</button>
            <button className="btn small primary" aria-pressed={playing} onClick={() => { if (!playing && journey && step >= journey.stops.length - 1) setStep(0); setPlaying(!playing); }}>{playing ? 'Pause' : 'Play'}</button>
          </div>
          {journey && <p className="lede">{journey.summary}</p>}
          {journey?.caution && <div className="notice">{journey.caution}</div>}
          <div className="maps-layout">
            <div>
              <div className="map-canvas" ref={el} role="application" aria-label={`Map of ${journey?.title ?? 'the journey'}`} />
              <p className="muted small">Map © OpenStreetMap contributors; place data © OpenBible.info, CC BY 4.0. Needs a connection.</p>
            </div>
            <aside className="card map-side">
              {stop && journey && (
                <>
                  <p className="muted small" style={{ margin: 0 }}>Stop {step + 1} of {journey.stops.length}</p>
                  <h2 className="card-title">{stop.place.replace(/ \d$/, '')}</h2>
                  <p>{stop.note}</p>
                  <p className="small"><RefChips text={stop.ref} /></p>
                  {places.get(stop.place)?.a && <p className="notice">Location approximate.</p>}
                  <ol className="list" style={{ paddingLeft: 20 }}>
                    {journey.stops.map((s, i) => (
                      <li key={i}><button className={`linklike${i === step ? ' on' : ''}`} onClick={() => setStep(i)}>{s.place.replace(/ \d$/, '')}</button></li>
                    ))}
                  </ol>
                </>
              )}
            </aside>
          </div>
          <p className="small"><Link to="/study/maps">All places on the map →</Link></p>
        </>
      )}

      {tab === 'eras' && world && (
        <ol className="era-list">
          {world.eras.map((e) => (
            <li key={e.id} className="card">
              <h2 className="card-title">{e.title} <span className="muted small">{e.dates}</span></h2>
              <p>{e.summary}</p>
              <p className="small"><RefChips text={e.refs} /></p>
              <p className="small"><strong>Context:</strong> {e.context}</p>
              <p className="small">Places: {e.places.map((p) => <Link key={p} to={`/study/maps?place=${idx.get(p) ?? ''}`} className="chip" style={{ marginRight: 4 }}>{p.replace(/ \d$/, '')}</Link>)}</p>
            </li>
          ))}
        </ol>
      )}

      {tab === 'finds' && world && (
        <ul className="list">
          {world.finds.map((f) => (
            <li key={f.name}>
              <strong>{f.name}</strong> <span className="muted small">{f.date} · {f.where}</span>
              <div>{f.note}</div>
              <div className="small"><RefChips text={f.refs} /></div>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">Eras, dates and finds are summarized for this app in cautious language; dates are conventional estimates and several are debated. Check a reputable archaeological reference before quoting a detail.</p>
    </div>
  );
}
