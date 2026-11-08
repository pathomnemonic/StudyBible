import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getJson } from '../data/loader';

export interface Pin { place: string; lat: number; lon: number; held: boolean; text: string }

/** The offline basemap with a pin for each place whose stamp you hold (filled) and a ring for those still to find. */
export default function PassportMap({ pins, label }: { pins: Pin[]; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [43, 20], zoom: 4, minZoom: 3, maxZoom: 8, maxBounds: [[8, -14], [56, 72]], maxBoundsViscosity: 1, attributionControl: false, keyboard: false });
    m.createPane('base').style.zIndex = '200';
    getJson<{ land: number[][][]; lakes: number[][][]; rivers: number[][][] }>('play/basemap.json', true).then((b) => {
      if (!b || !map.current) return;
      const ll = (r: number[][]) => r.map(([x, y]) => [y, x] as [number, number]);
      for (const r of b.land) L.polygon(ll(r), { stroke: true, weight: 1, color: '#9c8a5e', fillColor: '#e9dfc2', fillOpacity: 1, interactive: false, pane: 'base' }).addTo(m);
      for (const r of b.lakes) L.polygon(ll(r), { stroke: false, fillColor: '#a9c7d8', fillOpacity: 1, interactive: false, pane: 'base' }).addTo(m);
      for (const r of b.rivers) L.polyline(ll(r), { weight: 1.5, color: '#8fb4c9', interactive: false, pane: 'base' }).addTo(m);
    }).catch(() => undefined);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.stop(); m.off(); m.remove(); map.current = null; layer.current = null; };
  }, []);

  useEffect(() => {
    const g = layer.current; if (!g) return;
    g.clearLayers();
    for (const p of pins) {
      const mk = L.circleMarker([p.lat, p.lon], p.held
        ? { radius: 10, color: '#fff', weight: 2, fillColor: '#8a2f39', fillOpacity: 1 }
        : { radius: 6, color: '#8a2f39', weight: 2, dashArray: '3 3', fillColor: '#fff', fillOpacity: 0.5 });
      mk.bindTooltip(`${p.place}: ${p.text}`, { direction: 'top' });
      mk.addTo(g);
    }
  }, [pins]);

  return <div ref={el} className="pp-map" role="img" aria-label={label} />;
}
