// Builds public/data/lens/greek/<BOOK>.json: for each New Testament verse, the places where the Greek editions differ in a way that changes the
// translation, as worded by STEPBible's TAGNT (Tyndale House Cambridge and STEPBible.org, CC BY 4.0, https://github.com/STEPBible/STEPBible-Data).
// Only the notes TAGNT itself writes are kept (nothing is composed here); the `kind` tag is the app's own classification of a note by its wording.
//
// Pinned: the source files are fetched at the exact upstream commit and SHA-256 recorded in scripts/stepbible/sources.lock.json. If a fetched file
// does not hash to the lock the run fails and writes nothing, so upstream drift can never enter the data unnoticed.
//   node scripts/stepbible/build.mjs                       rebuild from the pinned commit (needs the network; output is committed)
//   node scripts/stepbible/build.mjs --update-lock --commit=<40-hex sha>   intentionally move to another upstream commit: rewrites the lock, then review the diff
// Numbering: TAGNT states its references follow NRSV versification (see its header). Every chapter and verse is checked against the verse counts of the
// app's English-tradition editions (not the KJV tradition, and not a chapter count alone); a note for a verse that does not exist there fails the run.
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
const LOCK = new URL('./sources.lock.json', import.meta.url);
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const updateLock = process.argv.includes('--update-lock');
const lock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : null;
const COMMIT = updateLock ? arg('commit') : lock?.commit;
if (!/^[0-9a-f]{40}$/.test(COMMIT ?? '')) throw new Error('Need a pinned 40-character upstream commit: scripts/stepbible/sources.lock.json, or --update-lock --commit=<sha>');
const DIR = 'Translators%20Amalgamated%20OT%2BNT/';
const BASE = `https://raw.githubusercontent.com/STEPBible/STEPBible-Data/${COMMIT}/${DIR}`;
const FILES = ['TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt', 'TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt'];
const NUMBERING = 'NRSV versification, as stated in the TAGNT header; checked against the verse counts of the app\'s English-tradition editions';
const BOOK = { Mat: 'MAT', Mrk: 'MRK', Luk: 'LUK', Jhn: 'JHN', Act: 'ACT', Rom: 'ROM', '1Co': '1CO', '2Co': '2CO', Gal: 'GAL', Eph: 'EPH', Php: 'PHP', Col: 'COL', '1Th': '1TH', '2Th': '2TH', '1Ti': '1TI', '2Ti': '2TI', Tit: 'TIT', Phm: 'PHM', Heb: 'HEB', Jas: 'JAS', '1Pe': '1PE', '2Pe': '2PE', '1Jn': '1JN', '2Jn': '2JN', '3Jn': '3JN', Jud: 'JUD', Rev: 'REV' };
const clean = (s) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').replace(/^[\^v]\s*/, '').trim();
const byBook = {}; let seen = 0, dropped = 0;
const fetched = [];
for (const f of FILES) {
  const r = await fetch(BASE + f); if (!r.ok) throw new Error(`${f}: ${r.status}`);
  const text = await r.text();
  fetched.push({ file: decodeURIComponent(f), sha256: createHash('sha256').update(text).digest('hex'), bytes: Buffer.byteLength(text) });
  for (const line of text.split('\n')) {
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
if (updateLock) writeFileSync(LOCK, JSON.stringify({ about: 'The exact upstream files the Greek-edition notes were built from. Change only deliberately (build.mjs --update-lock).', repository: 'https://github.com/STEPBible/STEPBible-Data', commit: COMMIT, files: fetched }, null, 1) + '\n');
else for (const f of fetched) {
  const want = lock.files.find((x) => x.file === f.file);
  if (!want || want.sha256 !== f.sha256) throw new Error(`${f.file} does not match the pinned source (commit ${COMMIT}): got ${f.sha256}, locked ${want?.sha256}. Nothing was written.`);
}
// every note must be for a verse that exists in the source's own numbering
const ed = JSON.parse(readFileSync(new URL('../../public/data/editions.json', import.meta.url), 'utf8')).editions.filter((e) => e.scheme === 'english');
const maxV = (b, c) => Math.max(0, ...ed.map((e) => e.verseCounts?.[b]?.[c - 1] ?? 0));
const bad = Object.entries(byBook).flatMap(([b, items]) => items.filter((i) => i.v < 1 || i.v > maxV(b, i.c)).map((i) => `${b} ${i.c}:${i.v} (that chapter has ${maxV(b, i.c)} verses)`));
if (bad.length) throw new Error(`Notes for verses that do not exist in ${NUMBERING}:\n  ${bad.join('\n  ')}\nNothing was written.`);
import { mkdirSync } from 'node:fs';
mkdirSync(new URL('../../public/data/lens/greek/', import.meta.url), { recursive: true });
let total = 0;
for (const [book, items] of Object.entries(byBook)) {
  items.sort((a, b) => a.c - b.c || a.v - b.v || a.w - b.w);
  const out = { book, source: 'STEPBible TAGNT (Translators Amalgamated Greek NT), Tyndale House Cambridge and STEPBible.org, CC BY 4.0', url: 'https://github.com/STEPBible/STEPBible-Data', upstream: { commit: COMMIT, files: fetched.map(({ file, sha256 }) => ({ file, sha256 })) }, numbering: NUMBERING, provenance: { note: 'Source-authored: the note text is TAGNT\'s own, unaltered apart from tag removal.', kind: 'App classification: "only" or "differs", set from the wording of the note.' }, items: items.map(({ c, v, kind, note }) => ({ c, v, kind, note })) };
  writeFileSync(new URL(`../../public/data/lens/greek/${book}.json`, import.meta.url), JSON.stringify(out) + '\n');
  total += items.length;
}
console.log(`notes seen ${seen}, kept ${total} in ${Object.keys(byBook).length} books, dropped ${dropped}`);
