import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyStep } from './verify';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export interface TimelineEvent { year: number; place: string; lat: number; lon: number; kind: string; title: string; text: string; council?: number; step?: any }
export function loadTimeline(): TimelineEvent[] {
  const f = join(ROOT, 'src', 'data', 'church-timeline.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : [];
}
const KINDS = new Set(['foundation', 'council', 'martyrdom', 'mission', 'monastery', 'schism', 'heresy', 'saint', 'text', 'state']);
export function checkTimeline(ev: TimelineEvent[]): string[] {
  const bad: string[] = [];
  const src = readFileSync(join(ROOT, 'src', 'data', 'councils.ts'), 'utf8');
  const councilYear = new Map<number, number>();
  for (const m of src.matchAll(/\{ n: (\d+), name: '[^']*', years: '(\d+)/g)) councilYear.set(+m[1], +m[2]);
  const titles = new Set<string>(); let last = -9999;
  ev.forEach((e, i) => {
    const w = `event ${i + 1} (${e.title})`;
    if (!KINDS.has(e.kind)) bad.push(`${w}: kind ${e.kind}`);
    if (e.lat < 8 || e.lat > 52 || e.lon < -12 || e.lon > 70) bad.push(`${w}: outside map bounds`);
    if (e.year < last) bad.push(`${w}: out of order`); last = e.year;
    if (titles.has(e.title)) bad.push(`${w}: duplicate title`); titles.add(e.title);
    if (!e.text || e.text.length < 30) bad.push(`${w}: text too short`);
    if (e.kind === 'council') { if (!e.council) bad.push(`${w}: council number missing`); else if (councilYear.get(e.council) !== e.year) bad.push(`${w}: year ${e.year} does not match council ${e.council} (${councilYear.get(e.council)})`); }
    if (e.step) bad.push(...verifyStep(e.step, w));
  });
  return bad;
}
if (process.argv[1] && process.argv[1].endsWith('check-timeline.ts')) {
  const ev = loadTimeline(); const bad = checkTimeline(ev);
  bad.forEach((b) => console.log(b));
  console.log(`${ev.length} events, ${ev.filter((e) => e.step).length} with verified steps`);
  console.log(bad.length ? `${bad.length} problems` : 'timeline ok');
  process.exit(bad.length ? 1 : 0);
}
