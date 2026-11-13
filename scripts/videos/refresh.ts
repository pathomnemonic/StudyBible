/**
 * Adds each creator's newest YouTube uploads to the video library (public/data/media/video_library.json).
 * Channels are listed in data/curated/video-channels.json. Uploads come from YouTube's Data API when YOUTUBE_API_KEY is set (the uploads playlist,
 * one quota unit per channel), and otherwise from each channel's public upload feed. Only titles and ids are kept; the video stays on YouTube.
 * Registry ids are confirmed ones, so the daily run trusts them; an unconfirmed id can be checked by calling mergeUploads without `trusted`, which skips a channel whose newest uploads do not overlap the listed ones.
 * Run:  npx tsx scripts/videos/refresh.ts   (the scheduled deploy runs it every day; it keeps the committed library if anything fails)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildManifest } from '../ingest/manifest';

/** The optional fourth item is 1 for a YouTube Short, so the app can keep Shorts apart from full videos. */
export type LibVideo = [id: string, title: string, channel: number, short?: 1];

/** A Short answers /shorts/<id> with 200; any other video is redirected to its watch page. */
export async function isShort(id: string): Promise<boolean> {
  try { return (await fetch(`https://www.youtube.com/shorts/${id}`, { method: 'HEAD', redirect: 'manual' })).status === 200; } catch { return false; }
}

/** Marks the Shorts among these videos (a few at a time, to stay polite). */
export async function markShorts(vs: LibVideo[]): Promise<number> {
  let n = 0;
  for (let i = 0; i < vs.length; i += 8) {
    await Promise.all(vs.slice(i, i + 8).map(async (v) => { if (v.length < 4 && (await isShort(v[0]))) { v[3] = 1; n++; } }));
  }
  return n;
}
const SKIP = /#shorts?\b|daily mass|holy mass|^mass for|live ?stream|livestream|\blive:|rosary live|full episode of|sneak peek|promo\b|trailer\b/i;
const MIN_OVERLAP = 1;

/** Adds the uploads that are not listed yet. Returns what was added, or why the channel was skipped. */
export function mergeUploads(videos: LibVideo[], channel: number, uploads: { id: string; title: string }[], trusted = false): { added: LibVideo[]; skipped?: string } {
  const have = new Set(videos.map((v) => v[0]));
  const mine = new Set(videos.filter((v) => v[2] === channel).map((v) => v[0]));
  const overlap = uploads.filter((u) => mine.has(u.id)).length;
  // the registry's ids were each confirmed from a video page, so `trusted` skips the overlap check, which wrongly skips busy channels whose listed videos are older than their newest 15 uploads
  if (!trusted && mine.size > 0 && uploads.length > 5 && overlap < MIN_OVERLAP) return { added: [], skipped: 'no overlap with the listed videos: probably the wrong channel id' };
  const added = uploads.filter((u) => u.id && u.title && !have.has(u.id) && !SKIP.test(u.title)).map((u): LibVideo => [u.id, u.title.replace(/\s+/g, ' ').trim(), channel]);
  return { added };
}

/** The uploads in a YouTube channel feed (newest first). */
export function parseFeed(xml: string): { id: string; title: string }[] {
  const dec = (s: string) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  return [...xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)].map((m) => ({ id: /<yt:videoId>([^<]+)</.exec(m[0])?.[1] ?? '', title: dec(/<media:title>([^<]*)</.exec(m[0])?.[1] ?? /<title>([^<]*)</.exec(m[0])?.[1] ?? '') })).filter((e) => e.id);
}

async function uploadsFor(channelId: string): Promise<{ id: string; title: string }[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${'UU' + channelId.slice(2)}&key=${key}`);
    if (!r.ok) throw new Error(`API ${r.status}`);
    const j = (await r.json()) as { items: { snippet: { title: string; resourceId: { videoId: string } } }[] };
    return j.items.map((i) => ({ id: i.snippet.resourceId.videoId, title: i.snippet.title }));
  }
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`feed ${r.status}`);
  return parseFeed(await r.text());
}

async function main() {
  const LIB = 'public/data/media/video_library.json';
  const lib = JSON.parse(readFileSync(LIB, 'utf8')) as { about: string; channels: string[]; videos: LibVideo[] };
  const reg = JSON.parse(readFileSync('data/curated/video-channels.json', 'utf8')) as { channels: { name: string; id: string }[] };
  let total = 0, failed = 0;
  for (const c of reg.channels) {
    const idx = lib.channels.indexOf(c.name);
    if (idx < 0) { console.log(`${c.name}: not in the library's channel list`); continue; }
    try {
      const { added, skipped } = mergeUploads(lib.videos, idx, await uploadsFor(c.id), true);
      if (skipped) { console.log(`${c.name}: skipped, ${skipped}`); continue; }
      await markShorts(added);
      lib.videos.unshift(...added); total += added.length; // the library is newest first, so new uploads go in front
      console.log(`${c.name}: ${added.length} new`);
    } catch (e) { failed += 1; console.log(`${c.name}: ${(e as Error).message}`); }
    await new Promise((r) => setTimeout(r, 400));
  }
  if (failed === reg.channels.length) { console.log('No channel could be read; keeping the committed library.'); return; }
  (lib as { updated?: string }).updated = new Date().toISOString().slice(0, 10);
  if (total) { writeFileSync(LIB, JSON.stringify(lib)); buildManifest(); }
  console.log(`${total} new videos.`);
}
if (process.argv[1]?.endsWith('refresh.ts')) void main();
