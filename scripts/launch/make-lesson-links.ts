// Gives each lesson that an apologetics track points at the track's own curated watch/listen resources and debate material.
// A lesson gets what sits in the same level of the same track: the track's videos, talks, debates and podcasts, and its argument chains, claims and heresies.
// Writes public/data/curriculum/lesson-extras.json.   Run: npx tsx scripts/launch/make-lesson-links.ts
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dir = join(root, 'src/data/apologetics/tracks');
interface Res { id: string; title: string; creator: string; kind: string; url: string; minutes?: number; why: string; audience: string; level: number }
interface Step { kind: string; id?: string; type?: string; why?: string; source?: { type: string; id: string } }
interface Track { id: string; title: string; levels: { n: number; steps: Step[] }[]; resources: Res[] }
const PLAYABLE = new Set(['video', 'talk', 'debate', 'podcast', 'series']);
const RANK: Record<string, number> = { video: 0, talk: 1, series: 2, debate: 3, podcast: 4 };

const out: Record<string, { tracks: { id: string; title: string }[]; watch: { title: string; creator: string; kind: string; url: string; minutes?: number; why: string; track: string }[]; read: { title: string; creator: string; kind: string; url: string; minutes?: number; why: string; track: string }[]; debate: { type: string; id: string }[] }> = {};
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const t = JSON.parse(readFileSync(join(dir, f), 'utf8')) as Track;
  if (t.id === 'example') continue;
  const res = new Map(t.resources.map((r) => [r.id, r]));
  for (const lv of t.levels) {
    const lessons = lv.steps.filter((s) => s.kind === 'inapp' && s.type === 'lesson').map((s) => s.id!);
    if (!lessons.length) continue;
    const watch = lv.steps.filter((s) => s.kind === 'resource').map((s) => res.get(s.id!)).filter((r): r is Res => !!r && PLAYABLE.has(r.kind));
    const debate = lv.steps.filter((s) => (s.kind === 'inapp' && ['chain', 'claim', 'heresy'].includes(s.type!)) || s.kind === 'drill').map((s) => (s.kind === 'drill' ? { type: s.source!.type, id: s.source!.id } : { type: s.type!, id: s.id! }));
    for (const id of lessons) {
      const o = (out[id] ??= { tracks: [], watch: [], read: [], debate: [] });
      if (!o.tracks.some((x) => x.id === t.id)) o.tracks.push({ id: t.id, title: t.title });
      for (const r of watch) if (!o.watch.some((w) => w.url === r.url)) o.watch.push({ title: r.title, creator: r.creator, kind: r.kind, url: r.url, minutes: r.minutes, why: r.why, track: t.id });
      for (const d of debate) if (!o.debate.some((x) => x.type === d.type && x.id === d.id)) o.debate.push(d);
    }
  }
}
// the featured questions name their tracks: they get the easiest videos, talks and debates of those tracks and every chain, claim and heresy the tracks use
const featured = JSON.parse(readFileSync(join(root, 'data/curated/featured-lessons.json'), 'utf8')) as { items: { id: string; band: string; q: string; tracks: string[] }[] };
for (const it of featured.items) {
  const o = (out[it.id] = { tracks: [] as { id: string; title: string }[], watch: [] as any[], read: [] as any[], debate: [] as { type: string; id: string }[] });
  const readPool: any[] = [];
  for (const tid of it.tracks) {
    const t = JSON.parse(readFileSync(join(dir, `${tid}.json`), 'utf8')) as Track & { title: string };
    o.tracks.push({ id: t.id, title: t.title });
    const res = new Map(t.resources.map((r) => [r.id, r]));
    for (const lv of t.levels) for (const s of lv.steps) {
      if (s.kind === 'resource') { const r = res.get(s.id!); if (r && PLAYABLE.has(r.kind) && !o.watch.some((w) => w.url === r.url)) o.watch.push({ title: r.title, creator: r.creator, kind: r.kind, url: r.url, minutes: r.minutes, why: r.why, track: t.id, level: r.level } as never); }
      if (s.kind === 'resource') { const r = res.get(s.id!) as (Res & { free?: boolean }) | undefined; if (r && ['article', 'tract'].includes(r.kind) && r.free !== false && !readPool.some((x) => x.url === r.url)) readPool.push({ title: r.title, creator: r.creator, kind: r.kind, url: r.url, minutes: r.minutes, why: r.why, track: t.id, level: r.level }); }
      const d = s.kind === 'drill' ? { type: s.source!.type, id: s.source!.id } : s.kind === 'inapp' && ['chain', 'claim', 'heresy'].includes(s.type!) ? { type: s.type!, id: s.id! } : null;
      if (d && !o.debate.some((x) => x.type === d.type && x.id === d.id)) o.debate.push(d);
    }
  }
  readPool.sort((a, b) => a.level - b.level);
  o.read = readPool.slice(0, 3).map(({ level, ...r }) => r);
}
for (const o of Object.values(out)) {
  (o as any).read ??= [];
  o.watch.sort((a: any, b: any) => ((a.level ?? 1) - (b.level ?? 1)) || (RANK[a.kind] ?? 9) - (RANK[b.kind] ?? 9));
  o.watch = o.watch.slice(0, 4).map(({ ...w }: any) => { delete w.level; return w; });
  o.debate = o.debate.slice(0, 4);
}
writeFileSync(join(root, 'public/data/curriculum/lesson-extras.json'), JSON.stringify(out));
writeFileSync(join(root, 'public/data/curriculum/featured.json'), JSON.stringify(featured.items.map((i) => ({ id: i.id, band: i.band, q: i.q }))));
const n = Object.keys(out).length, w = Object.values(out).filter((o) => o.watch.length).length, d = Object.values(out).filter((o) => o.debate.length).length;
console.log(`${n} lessons linked; ${w} with something to watch or hear; ${d} with debate material`);
