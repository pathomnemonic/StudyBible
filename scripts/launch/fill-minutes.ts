// Fills in the length of every YouTube resource in the apologetics tracks that lacks one, and reports any that are gone or private.
// Uses the official YouTube Data API (videos.list), so it needs YOUTUBE_API_KEY. Run: YOUTUBE_API_KEY=... npx tsx scripts/launch/fill-minutes.ts
// Then re-run scripts/launch/make-lesson-links.ts so the lessons pick the lengths up.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const key = process.env.YOUTUBE_API_KEY;
if (!key) { console.log('No YOUTUBE_API_KEY: nothing to do.'); process.exit(0); }
const dir = join(process.cwd(), 'src/data/apologetics/tracks');
const idOf = (u: string) => /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/.exec(u)?.[1];
const seconds = (iso: string) => { const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso); return m ? (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + +(m[3] ?? 0) : 0; };

const files = readdirSync(dir).filter((x) => x.endsWith('.json'));
const tracks = files.map((f) => ({ f, raw: readFileSync(join(dir, f), 'utf8') })).map((x) => ({ ...x, t: JSON.parse(x.raw) as { resources: { id: string; url: string; minutes?: number }[] } }));
const ids = [...new Set(tracks.flatMap((x) => x.t.resources.map((r) => idOf(r.url)).filter((v): v is string => !!v)))];
const len = new Map<string, number>();
for (let i = 0; i < ids.length; i += 50) {
  const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=${ids.slice(i, i + 50).join(',')}&key=${key}`);
  if (!r.ok) { console.error('API error', r.status); process.exit(1); }
  const j = (await r.json()) as { items: { id: string; contentDetails: { duration: string }; status: { privacyStatus: string; embeddable: boolean } }[] };
  for (const it of j.items) { if (it.status.privacyStatus === 'private' || !it.status.embeddable) console.log('NOT EMBEDDABLE/PRIVATE', it.id); len.set(it.id, seconds(it.contentDetails.duration)); }
}
let filled = 0;
for (const x of tracks) {
  let changed = false;
  for (const r of x.t.resources) {
    const v = idOf(r.url);
    if (!v) continue;
    if (!len.has(v)) { console.log('GONE', x.f, r.id, r.url); continue; }
    const m = Math.max(1, Math.round(len.get(v)! / 60));
    if (r.minutes !== m) { r.minutes = m; changed = true; filled++; }
  }
  if (changed) writeFileSync(join(dir, x.f), JSON.stringify(x.t, null, 2) + (x.raw.endsWith('\n') ? '\n' : ''));
}
console.log({ videos: ids.length, updated: filled });
