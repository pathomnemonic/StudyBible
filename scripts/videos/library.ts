/**
 * Builds the searchable video library from channel upload lists gathered from YouTube's public pages (see data/curated/videos/README.md),
 * and finds the videos whose titles name a Bible passage ("Genesis 1-3", "John 6:35") so they can be attached to it.
 * Usage: npx tsx scripts/videos/library.ts <raw-dir>
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseRefs } from '../../src/lib/refs';

const raw = process.argv[2];
const NAME_FIX: Record<string, string> = { 'Matt Fradd': 'Pints with Aquinas (Matt Fradd)', 'Bishop Robert Barron': 'Bishop Robert Barron', 'Discerning Hearts®': 'Discerning Hearts' };
const SKIP = /#shorts?\b|daily mass|holy mass|^mass for|live ?stream|livestream|\blive:|rosary live|full episode of|sneak peek|promo\b|trailer\b/i;
const chans = new Map<string, Map<string, string>>();
for (const f of readdirSync(raw).filter((x) => x.startsWith('full_'))) {
  const d = JSON.parse(readFileSync(join(raw, f), 'utf8')) as Record<string, { name: string | null; videos: Record<string, string> }>;
  for (const v of Object.values(d)) {
    if (!v.name) continue;
    const name = NAME_FIX[v.name] ?? v.name;
    const m = chans.get(name) ?? new Map();
    for (const [id, t] of Object.entries(v.videos)) m.set(id, t);
    chans.set(name, m);
  }
}
// also what earlier crawls found (playlists of the same channels), so nothing is lost when a channel page paged badly
const extra = JSON.parse(readFileSync(join(raw, 'extra.json'), 'utf8')) as Record<string, Record<string, string>>;
for (const [name, vs] of Object.entries(extra)) { const m = chans.get(name) ?? new Map(); for (const [id, t] of Object.entries(vs)) m.set(id, t); chans.set(name, m); }

const names = [...chans.keys()].sort((a, b) => a.localeCompare(b));
const seen = new Set<string>();
const videos: [string, string, number][] = [];
const auto: { id: string; title: string; channel: string; refs: string[] }[] = [];
const REF = /\b((?:[1-3]|I{1,3})\s?)?(?:Gen(?:esis)?|Ex(?:odus)?|Lev(?:iticus)?|Num(?:bers)?|Deut(?:eronomy)?|Josh(?:ua)?|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Tobit|Judith|Esther|Maccabees|Job|Psalms?|Proverbs|Ecclesiastes|Wisdom|Sirach|Isaiah|Jeremiah|Lamentations|Baruch|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+(\d{1,3})(?::(\d{1,3})(?:\s?[-–]\s?\d{1,3})?)?(?:\s?[-–]\s?\d{1,3})?/g;
for (const name of names) {
  const ci = names.indexOf(name);
  for (const [id, title] of chans.get(name)!) {
    if (seen.has(id) || title.length < 8 || SKIP.test(title)) continue;
    seen.add(id);
    videos.push([id, title.trim(), ci]);
    const refs = new Set<string>();
    for (const m of title.matchAll(REF)) {
      const s = m[0].replace(/\s+/g, ' ').trim();
      const p = parseRefs(s);
      // a chapter-only mention of a short word such as "John 6" is fine; require the parse to consume the whole string
      if (p.ok && p.refs.length === 1) refs.add(s.replace(/–/g, '-'));
    }
    if (refs.size && refs.size <= 3) auto.push({ id, title: title.trim(), channel: name, refs: [...refs] });
  }
}
writeFileSync('public/data/media/video_library.json', JSON.stringify({ about: 'Videos from Catholic channels, listed from the channels’ public pages. Not individually checked; some creators disable embedding.', channels: names, videos }));
writeFileSync(join(raw, 'auto.json'), JSON.stringify(auto));
console.log(names.length, 'channels', videos.length, 'videos', auto.length, 'with a passage in the title');
