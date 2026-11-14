import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface ProfilePin { key: string; name: string; lat: number; lon: number; href: string }

/** Place profiles that have a known location, as points. Opening a pin leads to the profile (a plain link, so it works from the keyboard list too). */
export default function ProfilesMap({ pins, label, onOpen }: { pins: ProfilePin[]; label: string; onOpen: (href: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const open = useRef(onOpen);
  open.current = onOpen;
  useEffect(() => {
    if (!el.current || !pins.length) return;
    const m = L.map(el.current, { center: [pins[0].lat, pins[0].lon], zoom: 7, worldCopyJump: true, fadeAnimation: false, zoomAnimation: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 14, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
    const pts: L.LatLngTuple[] = [];
    for (const p of pins) {
      const c = L.circleMarker([p.lat, p.lon], { radius: 7, weight: 1, color: '#6b1f29', fillColor: '#8a2f39', fillOpacity: 0.85 }).addTo(m);
      c.bindTooltip(p.name);
      c.on('click', () => open.current(p.href));
      pts.push([p.lat, p.lon]);
    }
    if (pts.length > 1) m.fitBounds(L.latLngBounds(pts).pad(0.2), { maxZoom: 9, animate: false });
    else m.setView(pts[0], 9, { animate: false });
    return () => { m.remove(); };
  }, [pins]);
  return <div ref={el} role="img" aria-label={label} className="profiles-map" style={{ height: 320, width: '100%', borderRadius: 8 }} />;
}
