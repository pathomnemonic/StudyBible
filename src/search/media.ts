import { getJson } from '../data/loader';
import { getLibraryIndex } from '../data/content';
import { recordedWorkIds } from '../data/librivox';
import { getShows, loadShow } from '../data/podcasts';
import { fold, parseQuery, searchEpisodes } from './engine';

export interface MediaHit { id: string; kind: 'Bible in a Year' | 'Podcast' | 'Episode' | 'Audiobook' | 'Video'; title: string; sub?: string; to?: string; url?: string }

let videos: Promise<{ channels: string[]; videos: [string, string, number][] } | null> | null = null;
const getVideos = () => (videos ??= getJson<{ channels: string[]; videos: [string, string, number][] }>('media/video_library.json', true).catch(() => null));

/** One search over what the Media tab holds: Bible in a Year days, podcasts and their year-long programs, audiobooks, and videos. */
export async function searchMedia(raw: string): Promise<MediaHit[]> {
  const q = parseQuery(raw);
  const words = [...q.terms, ...q.phrases].map((w) => fold(w)).filter((w) => w.length >= 2);
  if (!words.length) return [];
  const has = (s: string) => { const f = fold(s); return words.every((w) => f.includes(w)); };
  const out: MediaHit[] = [];
  const [biay, shows, lib, rec, vids] = await Promise.all([searchEpisodes(q).catch(() => []), getShows().catch(() => null), getLibraryIndex().catch(() => null), recordedWorkIds().catch(() => new Set<string>()), getVideos()]);
  for (const e of biay.slice(0, 8)) out.push({ id: e.id, kind: 'Bible in a Year', title: e.title, sub: e.subtitle, to: e.href });
  for (const s of shows?.shows ?? []) if (has(`${s.title} ${s.host} ${s.publisher} ${s.note}`)) out.push({ id: `show-${s.id}`, kind: 'Podcast', title: s.title, sub: s.host, to: `/listen?tab=podcasts&show=${s.id}` });
  for (const w of lib?.works ?? []) if (rec.has(w.id) && has(`${w.title} ${w.author}`)) out.push({ id: `book-${w.id}`, kind: 'Audiobook', title: w.title, sub: w.author, to: `/room/work/${w.id}/0` });
  // episodes of the year-long programs (small, so searched in full)
  for (const s of (shows?.shows ?? []).filter((x) => x.programme)) {
    const d = await loadShow(s.id).catch(() => null);
    for (const e of (d?.episodes ?? []).filter((x) => has(`${x.title} ${x.description}`)).slice(0, 4)) out.push({ id: e.id, kind: 'Episode', title: e.title, sub: s.title, to: `/listen?tab=programmes` });
  }
  let n = 0;
  for (const [id, title, ch] of vids?.videos ?? []) { if (has(title)) { out.push({ id: `v-${id}`, kind: 'Video', title, sub: vids?.channels[ch], url: `https://www.youtube.com/watch?v=${id}` }); if (++n >= 15) break; } }
  return out;
}
