import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyStep } from './verify';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export interface WalkStop { place: string; ref: string; quote: string; what: string; echo: string }
export interface Walk { id: string; title: string; theme: string; stops: WalkStop[]; readNext?: number[] }
export function loadWalks(): Walk[] {
  const f = join(ROOT, 'src', 'data', 'walks.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : [];
}
export function checkWalks(ws: Walk[]): string[] {
  const bad: string[] = [];
  const places: { n: string; lat: number; lon: number }[] = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'maps', 'places.json'), 'utf8')).filter(Boolean);
  const ids = new Set<string>();
  for (const w of ws) {
    if (ids.has(w.id)) bad.push(`${w.id}: duplicate id`); ids.add(w.id);
    if (!w.title || !w.theme || w.theme.length < 40) bad.push(`${w.id}: title/theme missing`);
    if (!w.stops || w.stops.length < 5) bad.push(`${w.id}: needs at least 5 stops`);
    (w.stops ?? []).forEach((s, i) => {
      const where = `${w.id} stop ${i + 1} (${s.place})`;
      if (!places.some((p) => p.n === s.place)) bad.push(`${where}: place not in public/data/maps/places.json (use the exact name)`);
      if (!s.what || s.what.length < 30 || !s.echo || s.echo.length < 30) bad.push(`${where}: what/echo too short`);
      bad.push(...verifyStep({ kind: 'scripture', label: s.ref, ref: s.ref, quote: s.quote, note: s.what } as any, where));
      if (!s.quote) bad.push(`${where}: quote missing`);
    });
  }
  return bad;
}
if (process.argv[1] && process.argv[1].endsWith('check-walks.ts')) {
  const ws = loadWalks(); const bad = checkWalks(ws);
  bad.forEach((b) => console.log(b));
  console.log(`${ws.length} walks, ${ws.reduce((n, w) => n + w.stops.length, 0)} stops`);
  console.log(bad.length ? `${bad.length} problems` : 'walks ok');
  process.exit(bad.length ? 1 : 0);
}
