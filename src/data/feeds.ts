import { BRAND } from '../lib/brand';
import { db } from '../db/db';
import type { BiayEpisode } from './content';
import type { Show, ShowData } from './podcasts';
import { registerEpisodes } from './podcasts';

/** Podcasts the reader adds by search or feed link. Episodes are read from the show's own public feed and kept for an hour. */
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
export const userShowId = (feed: string) => `u-${hash(feed)}`;

const PROXIES = [(u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`, (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`];
async function fetchText(url: string): Promise<string> {
  const tries: (() => Promise<Response>)[] = [() => fetch(url), () => fetch(`/api/feed?url=${encodeURIComponent(url)}`), ...PROXIES.map((p) => () => fetch(p(url)))];
  let last = '';
  for (const t of tries) {
    try {
      const r = await t();
      const ct = r.headers.get('content-type') ?? '';
      if (!r.ok) { last = `HTTP ${r.status}`; continue; }
      const text = await r.text();
      if (/<(rss|feed)\b/i.test(text.slice(0, 2000))) return text;
      last = ct.includes('html') ? 'That link is a web page, not a feed.' : 'Not a podcast feed.';
    } catch (e) { last = (e as Error).message; }
  }
  throw new Error(`Could not read that feed (${last}).`);
}

const txt = (el: Element | null | undefined, sel: string) => el?.querySelector(sel)?.textContent?.trim() ?? '';
const tagNS = (el: Element, name: string) => el.getElementsByTagName(name)[0]?.textContent?.trim() ?? '';
const secs = (s: string): number | null => { if (!s) return null; if (/^\d+$/.test(s)) return +s; const p = s.split(':').map(Number); return p.some(Number.isNaN) ? null : p.reduce((a, x) => a * 60 + x, 0); };
/** Show notes as text, keeping line breaks (so a list of timestamps stays a list). */
export const notesLines = (h: string) => h
  .replace(/<br\s*\/?>|<\/(p|li|div|h\d|tr)>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#8217;/g, "'")
  .replace(/[ \t\u00a0]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{2,}/g, '\n').trim();
/** "12:34 Topic", "(1:02:03) Topic" and "[00:00] - Topic" lines in show notes become chapters. Needs three or more, rising, starting near the beginning, so one stray "12:30" in a sentence is never a chapter. */
export function chaptersFromNotes(text: string): { t: number; title: string }[] {
  const out: { t: number; title: string }[] = [];
  for (const line of text.split('\n')) {
    const m = /^[\s\-•*·\u2022]*[([]?((?:\d{1,2}:)?\d{1,2}:\d{2})[)\]]?\s*[-–—:.]?\s*(.{2,90}?)\s*$/.exec(line);
    if (!m) continue;
    const t = secs(m[1]);
    if (t == null || (out.length && t <= out[out.length - 1].t)) continue;
    out.push({ t, title: m[2].replace(/^[-–—:.\s]+/, '') });
  }
  return out.length >= 3 && out[0].t <= 120 ? out : [];
}
/** A Podcasting 2.0 chapters file ({"chapters":[{"startTime":0,"title":"…"}]}), read from the feed's <podcast:chapters url="…">. */
export async function fetchChapters(url: string): Promise<{ t: number; title: string }[]> {
  const tries: (() => Promise<Response>)[] = [() => fetch(url), ...PROXIES.map((p) => () => fetch(p(url)))];
  for (const t of tries) {
    try {
      const r = await t(); if (!r.ok) continue;
      const j = JSON.parse(await r.text());
      const list = (Array.isArray(j?.chapters) ? j.chapters : []).filter((c: any) => typeof c?.startTime === 'number' && c.title && c.toc !== false);
      const out = list.map((c: any) => ({ t: Math.max(0, Math.round(c.startTime)), title: String(c.title).slice(0, 90) })).sort((a: any, b: any) => a.t - b.t);
      if (out.length) return out;
    } catch { /* try the next route */ }
  }
  return [];
}
const plain = (h: string) => new DOMParser().parseFromString(h, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? '';

export interface ParsedFeed { title: string; host: string; image: string; page: string; description: string; episodes: (Omit<BiayEpisode, 'id'> & { guid: string })[] }
export function parseFeed(xml: string): ParsedFeed {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('That is not a readable feed.');
  const ch = doc.querySelector('channel');
  if (!ch) throw new Error('That is not a podcast feed.');
  const title = txt(ch, ':scope > title');
  const host = tagNS(ch, 'itunes:author') || txt(ch, ':scope > managingEditor') || title;
  const image = ch.getElementsByTagName('itunes:image')[0]?.getAttribute('href') ?? txt(ch, ':scope > image > url');
  const episodes = [...ch.querySelectorAll(':scope > item')].map((it) => {
    const enc = it.querySelector('enclosure');
    const audio = (enc?.getAttribute('url') ?? '').replace(/^http:\/\//, 'https://');
    const t = txt(it, 'title');
    const d = new Date(txt(it, 'pubDate'));
    const rawNotes = tagNS(it, 'itunes:summary') || txt(it, 'description') || tagNS(it, 'content:encoded');
    const full = plain(rawNotes);
    const chapters = chaptersFromNotes(notesLines(tagNS(it, 'content:encoded') || rawNotes));
    const chaptersUrl = it.getElementsByTagName('podcast:chapters')[0]?.getAttribute('url')?.replace(/^http:\/\//, 'https://') || undefined;
    return { guid: txt(it, 'guid') || audio || t, day: null, year: null, kind: 'bonus' as const, title: plain(t), short: plain(t), date: Number.isNaN(+d) ? '' : d.toISOString().slice(0, 10), duration: secs(tagNS(it, 'itunes:duration')), audio, page: txt(it, 'link') || txt(ch, ':scope > link'), description: full.slice(0, 900), passages: [] as string[], passageSource: '', chapters: chapters.length ? chapters : undefined, chaptersUrl };
  }).filter((e) => e.audio.startsWith('https://')).sort((a, b) => b.date.localeCompare(a.date));
  return { title, host, image, page: txt(ch, ':scope > link'), description: plain(txt(ch, ':scope > description')).slice(0, 400), episodes };
}

export async function addUserShow(feed: string, known?: { title?: string; host?: string; image?: string }): Promise<Show> {
  const url = feed.trim().replace(/^feed:\/\//, 'https://').replace(/^http:\/\//, 'https://');
  if (!/^https:\/\//.test(url)) throw new Error('A feed link starts with https://');
  const parsed = parseFeed(await fetchText(url));
  const id = userShowId(url);
  await cacheEpisodes(id, parsed);
  const key = `podcast:${id}`;
  if (!(await db.saved.where('key').equals(key).first())) await db.saved.add({ key, type: 'podcast', label: parsed.title || known?.title || url, url, createdAt: Date.now(), meta: { host: parsed.host || known?.host, image: parsed.image || known?.image, page: parsed.page } });
  return toShow(id, url, parsed);
}
const toShow = (id: string, feed: string, p: { title: string; host: string; page: string; description: string; episodes: unknown[] } & Partial<ParsedFeed>): Show => ({ id, title: p.title, host: p.host, publisher: '', programme: false, tradition: null, category: 'Yours', note: p.description ?? '', page: p.page || feed, episodes: p.episodes.length, latest: (p.episodes as { date: string }[])[0]?.date ?? '' });

async function cacheEpisodes(id: string, p: ParsedFeed) {
  const eps: BiayEpisode[] = p.episodes.map((e) => ({ ...e, id: `${id}-${hash(e.guid)}`, album: p.title, artist: p.host })).slice(0, 400);
  await db.cache.put({ key: `userpod:${id}`, value: JSON.stringify({ meta: { id, title: p.title, host: p.host, image: p.image, page: p.page, description: p.description }, episodes: eps }), ts: Date.now() });
}

/** The reader's own podcasts, from what is saved (and synced). */
export async function listUserShows(): Promise<Show[]> {
  const rows = await db.saved.where('type').equals('podcast').toArray();
  return Promise.all(rows.map(async (r) => {
    const id = r.key.slice(8);
    const c = await db.cache.get(`userpod:${id}`);
    const d = c ? (JSON.parse(String(c.value)) as { meta: { description?: string; page?: string }; episodes: BiayEpisode[] }) : null;
    return { id, title: r.label, host: r.meta?.host ?? '', publisher: '', programme: false, tradition: null, category: 'Yours', note: d?.meta.description ?? '', page: r.meta?.page || r.url || '', episodes: d?.episodes.length ?? 0, latest: d?.episodes[0]?.date ?? '' };
  }));
}
export async function loadUserShow(id: string): Promise<ShowData | null> {
  const row = await db.saved.where('key').equals(`podcast:${id}`).first();
  if (!row?.url) return null;
  const c = await db.cache.get(`userpod:${id}`);
  let parsed: { meta: Record<string, string>; episodes: BiayEpisode[] } | null = c ? JSON.parse(String(c.value)) : null;
  if (!parsed || Date.now() - (c?.ts ?? 0) > 3600_000) {
    try { const p = parseFeed(await fetchText(row.url)); await cacheEpisodes(id, p); parsed = JSON.parse(String((await db.cache.get(`userpod:${id}`))!.value)); } catch { /* keep the older list, if any */ }
  }
  if (!parsed) return null;
  registerEpisodes(parsed.episodes);
  return { meta: parsed.meta, episodes: parsed.episodes };
}
export async function removeUserShow(id: string) { await db.saved.where('key').equals(`podcast:${id}`).delete(); await db.cache.delete(`userpod:${id}`); await db.cache.delete(`follow:${id}`); }

/** Search the public podcast directory (Apple's, which lists nearly every show with its feed). */
export async function searchPodcasts(term: string): Promise<{ title: string; host: string; feed: string; image: string; count: number }[]> {
  const r = await fetch(`https://itunes.apple.com/search?media=podcast&limit=12&term=${encodeURIComponent(term)}`);
  if (!r.ok) throw new Error('The podcast directory could not be reached.');
  const d = (await r.json()) as { results: { collectionName: string; artistName: string; feedUrl?: string; artworkUrl100?: string; trackCount?: number }[] };
  return d.results.filter((x) => x.feedUrl).map((x) => ({ title: x.collectionName, host: x.artistName, feed: x.feedUrl!, image: x.artworkUrl100 ?? '', count: x.trackCount ?? 0 }));
}

/** OPML: the list of shows other podcast apps export and import. */
export function parseOpml(xml: string): { title: string; feed: string }[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return [...doc.querySelectorAll('outline[xmlUrl], outline[xmlurl]')].map((o) => ({ title: o.getAttribute('title') || o.getAttribute('text') || '', feed: o.getAttribute('xmlUrl') || o.getAttribute('xmlurl') || '' })).filter((x) => /^https?:\/\//.test(x.feed));
}
export async function exportOpml(): Promise<string> {
  const rows = await db.saved.where('type').equals('podcast').toArray();
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0"><head><title>${BRAND.name} podcasts</title></head><body>\n${rows.map((r) => `  <outline type="rss" text="${esc(r.label)}" title="${esc(r.label)}" xmlUrl="${esc(r.url ?? '')}"/>`).join('\n')}\n</body></opml>`;
}
