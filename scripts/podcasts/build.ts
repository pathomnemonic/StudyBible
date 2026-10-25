import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Builds the episode lists for the podcasts in the Listen tab from each show's own public RSS feed.
 * Only metadata is kept (title, date, length, the publisher's page and audio address, a short description). The audio is
 * streamed from the publisher; nothing is copied or re-hosted. Run:  npx tsx scripts/podcasts/build.ts [id ...]
 */
const ROOT = process.cwd();
const OUT = join(ROOT, 'public/data/media');
mkdirSync(join(OUT, 'podcast'), { recursive: true });
const shows: any[] = JSON.parse(readFileSync(join(ROOT, 'data/curated/podcasts.json'), 'utf8'));
const only = process.argv.slice(2);

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', textNodeName: '#t', processEntities: false });
const text = (v: any): string => (v == null ? '' : typeof v === 'object' ? String(v['#t'] ?? '') : String(v));
const dec = (h: string) => h.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&rsquo;/g, '’').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const plain = (h: string) => dec(dec(h).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const secs = (d: any): number | null => {
  const s = text(d).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return +s;
  const p = s.split(':').map(Number);
  if (p.some(Number.isNaN)) return null;
  return p.reduce((a, x) => a * 60 + x, 0);
};

/** Catechism paragraph ranges named in a description, e.g. "paragraphs 1-25" or "CCC 2258–2262". */
function cccRanges(t: string): [number, number][] {
  const out: [number, number][] = [];
  for (const m of t.matchAll(/(?:paragraphs?|CCC|catechism(?: of the catholic church)?)\s*(?:nos?\.?|numbers?|#|§)?\s*(\d{1,4})(?:\s*[-–]\s*(\d{1,4}))?/gi)) {
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a >= 1 && b <= 2865 && b >= a) out.push([a, b]);
  }
  return out;
}

async function build(show: any) {
  const res = await fetch(show.feed, { headers: { 'User-Agent': 'StudyBible-podcast-index (+https://github.com/pathomnemonic/StudyBible)' }, signal: AbortSignal.timeout(60000), redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = parser.parse(await res.text());
  const ch = xml.rss?.channel;
  const items: any[] = [].concat(ch?.item ?? []);
  let eps = items.map((it) => {
    const enc = it.enclosure?.['@url'] as string | undefined;
    const title = plain(text(it.title));
    const full = plain(text(it['itunes:summary'] || it.description || it['content:encoded']));
    const desc = full.slice(0, 600);
    const num = +text(it['itunes:episode']) || null;
    const day = show.programme ? (num ?? (/\bday\s+(\d{1,3})\b/i.exec(title)?.[1] ? +/\bday\s+(\d{1,3})\b/i.exec(title)![1] : null)) : null;
    const guid = text(it.guid) || enc || title;
    return {
      id: `pod-${show.id}-${createHash('sha1').update(guid).digest('hex').slice(0, 10)}`,
      day,
      year: (() => { const m = /\((20\d\d)\)\s*$/.exec(title); return m ? +m[1] : null; })(),
      kind: (day ? 'day' : 'bonus') as 'day' | 'bonus',
      title,
      short: title.replace(/^day\s+\d+\s*[:\-–]\s*/i, ''),
      date: (() => { const d = new Date(text(it.pubDate)); return Number.isNaN(+d) ? '' : d.toISOString().slice(0, 10); })(),
      duration: secs(it['itunes:duration']),
      audio: enc ?? '',
      page: text(it.link) || show.page,
      description: desc,
      passages: [] as string[],
      ccc: show.id === 'catechism-in-a-year' ? cccRanges(full) : undefined,
      passageSource: '',
    };
  }).filter((e) => e.audio.startsWith('https://') || e.audio.startsWith('http://'));
  // https only: a plain-http enclosure cannot be played from a secure page
  eps = eps.map((e) => ({ ...e, audio: e.audio.replace(/^http:\/\//, 'https://') }));
  eps.sort((a, b) => b.date.localeCompare(a.date));
  const total = eps.length;
  if (!show.programme && show.cap) eps = eps.slice(0, show.cap);
  const data = { meta: { id: show.id, title: show.title, host: show.host, publisher: show.publisher, page: show.page, feed: show.feed, retrieved: new Date().toISOString().slice(0, 10), total: String(total), kept: String(eps.length) }, episodes: eps };
  writeFileSync(join(OUT, 'podcast', `${show.id}.json`), JSON.stringify(data));
  return { id: show.id, title: show.title, host: show.host, publisher: show.publisher, programme: !!show.programme, tradition: show.tradition ?? null, note: show.note ?? '', page: show.page, episodes: eps.length, latest: eps[0]?.date ?? '' };
}

let previous: any[] = [];
try { previous = JSON.parse(readFileSync(join(OUT, 'podcasts.json'), 'utf8')).shows; } catch { /* first run */ }
const index: any[] = [];
for (const s of shows.filter((x) => !only.length || only.includes(x.id))) {
  try {
    const r = await build(s);
    index.push(r);
    console.log(`ok   ${s.id}: ${r.episodes} episodes, latest ${r.latest}`);
  } catch (e: any) {
    console.error(`FAIL ${s.id}: ${e.message} (keeping the previous list)`);
    const old = previous.find((x) => x.id === s.id);
    if (old) index.push(old);
  }
}
if (!only.length) writeFileSync(join(OUT, 'podcasts.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), shows: index }, null, 1));
