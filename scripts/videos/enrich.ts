/**
 * Adds each video's length and upload date to public/data/media/video_meta.json, using YouTube's official Data API
 * (videos.list: 1 quota unit per 50 videos, so the whole library costs well under one day's free quota).
 *
 * Usage:  YOUTUBE_API_KEY=your-key npx tsx scripts/videos/enrich.ts
 * Get a key free at https://console.cloud.google.com (enable "YouTube Data API v3", create an API key).
 * It is safe to stop and run again: videos already done are skipped. Then run the manifest step so downloads include it:
 *   npx tsx -e "import { buildManifest } from './scripts/ingest/manifest'; buildManifest();"
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { isoSeconds } from '../../src/lib/isoDuration';

const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) { console.error('Set YOUTUBE_API_KEY (see the comment at the top of this file).'); process.exit(1); }
const LIB = 'public/data/media/video_library.json';
const OUT = 'public/data/media/video_meta.json';
const lib = JSON.parse(readFileSync(LIB, 'utf8')) as { videos: [string, string, number][] };
const have: { about?: string; d: Record<string, [number, number]> } = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { d: {} };
have.about = 'Length in seconds and upload date (yyyymmdd) of each video, from the YouTube Data API. Videos missing here were private, removed or not yet fetched.';
const todo = lib.videos.map((v) => v[0]).filter((id) => !(id in have.d));
console.log(`${todo.length} videos to look up (${Object.keys(have.d).length} already done)`);

const save = () => writeFileSync(OUT, JSON.stringify(have));
for (let i = 0; i < todo.length; i += 50) {
  const ids = todo.slice(i, i + 50);
  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${ids.join(',')}&key=${KEY}`;
  const r = await fetch(url);
  if (!r.ok) { console.error('API error', r.status, (await r.text()).slice(0, 300)); save(); process.exit(1); }
  const j = (await r.json()) as { items: { id: string; contentDetails: { duration: string }; snippet: { publishedAt: string } }[] };
  const found = new Set<string>();
  for (const it of j.items) {
    found.add(it.id);
    have.d[it.id] = [isoSeconds(it.contentDetails.duration), +it.snippet.publishedAt.slice(0, 10).replace(/-/g, '')];
  }
  for (const id of ids) if (!found.has(id)) have.d[id] = [0, 0]; // private or removed: remember so we do not ask again
  if ((i / 50) % 20 === 0) { save(); console.log(`${Math.min(i + 50, todo.length)} / ${todo.length}`); }
}
save();
console.log('done');
