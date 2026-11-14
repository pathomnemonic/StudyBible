// Builds public/data/lens/greek/<BOOK>.json: for each New Testament verse, the places where the Greek editions differ in a way that changes the
// translation, as worded by STEPBible's TAGNT (Tyndale House Cambridge and STEPBible.org, CC BY 4.0, https://github.com/STEPBible/STEPBible-Data).
// Only the notes TAGNT itself writes are kept (nothing is composed here). Run: node scripts/stepbible/build.mjs  (needs the network; output is committed)
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE = 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/';
const FILES = ['TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt', 'TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt'];
const BOOK = { Mat: 'MAT', Mrk: 'MRK', Luk: 'LUK', Jhn: 'JHN', Act: 'ACT', Rom: 'ROM', '1Co': '1CO', '2Co': '2CO', Gal: 'GAL', Eph: 'EPH', Php: 'PHP', Col: 'COL', '1Th': '1TH', '2Th': '2TH', '1Ti': '1TI', '2Ti': '2TI', Tit: 'TIT', Phm: 'PHM', Heb: 'HEB', Jas: 'JAS', '1Pe': '1PE', '2Pe': '2PE', '1Jn': '1JN', '2Jn': '2JN', '3Jn': '3JN', Jud: 'JUD', Rev: 'REV' };
const clean = (s) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').replace(/^[\^v]\s*/, '').trim();
const byBook = {}; let seen = 0, dropped = 0;
for (const f of FILES) {
  const r = await fetch(BASE + f); if (!r.ok) throw new Error(`${f}: ${r.status}`);
  for (const line of (await r.text()).split('\n')) {
    const m = /^([1-3]?[A-Za-z]{2,3})\.(\d+)\.(\d+)#(\d+)=(\S+)\t/.exec(line);
    if (!m) continue;
    const cols = line.split('\t'); const note = clean(cols[13] ?? '');
    if (!note) continue;
    seen++;
    const book = BOOK[m[1]]; if (!book) { dropped++; continue; }
    // the note names its own kind: "… is only in …" (a reading some editions lack) or "… occurs in … instead of …" (two readings)
    const kind = /\binstead of\b/.test(note) ? 'differs' : /\bis only in\b/.test(note) ? 'only' : null;
    if (!kind) { dropped++; continue; }
    (byBook[book] ??= []).push({ c: +m[2], v: +m[3], w: +m[4], t: m[5], kind, note });
  }
}
mkdirSync(new URL('../../public/data/lens/greek/', import.meta.url), { recursive: true });
let total = 0;
for (const [book, items] of Object.entries(byBook)) {
  items.sort((a, b) => a.c - b.c || a.v - b.v || a.w - b.w);
  const out = { book, source: 'STEPBible TAGNT (Translators Amalgamated Greek NT), Tyndale House Cambridge and STEPBible.org, CC BY 4.0', url: 'https://github.com/STEPBible/STEPBible-Data', items: items.map(({ c, v, kind, note }) => ({ c, v, kind, note })) };
  writeFileSync(new URL(`../../public/data/lens/greek/${book}.json`, import.meta.url), JSON.stringify(out) + '\n');
  total += items.length;
}
console.log(`notes seen ${seen}, kept ${total} in ${Object.keys(byBook).length} books, dropped ${dropped}`);
