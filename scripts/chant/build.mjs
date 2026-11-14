// Builds public/data/hymns/chant.json: the square-note scores (GABC) for the hymns page.
// Source: GregoBase (https://gregobase.selapa.net), CC0 (https://gregobase.selapa.net/?page_id=2). One chosen score per hymn; the ids below were chosen
// because the sung text matches the hymn's Latin text already in hymns.json (tests/chant.test.ts re-checks this on every run).
// Run:  node scripts/chant/build.mjs   (needs the network; the result is committed, the app never calls GregoBase)
import { readFileSync, writeFileSync } from 'node:fs';
const PICKS = { 'veni-creator': 14258, 'dies-irae': 1198, 'vexilla-regis': 19728, 'pange-lingua': 8670, 'tantum-ergo': 2176, 'o-salutaris': 17870, 'adoro-te': 15688, 'regina-caeli': 1976, 'salve-regina': 2715, 'te-deum': 16704 };
const head = (g, k) => new RegExp(`^${k}:(.*?);?\\s*$`, 'm').exec(g)?.[1]?.trim() ?? '';
const items = [];
for (const [hymnId, id] of Object.entries(PICKS)) {
  const r = await fetch(`https://gregobase.selapa.net/download.php?id=${id}&format=gabc&elem=1`);
  if (!r.ok) throw new Error(`GregoBase ${id}: ${r.status}`);
  const raw = (await r.text()).replace(/\r\n/g, '\n').trim() + '\n';
  if (!raw.includes('%%')) throw new Error(`GregoBase ${id}: not a GABC file`);
  // some GregoBase files repeat their header block before the music; keep one header and the music after the last separator
  const parts = raw.split('%%');
  const gabc = parts.length > 2 ? `${parts[0].trim()}\n%%\n${parts[parts.length - 1].trim()}\n` : raw;
  items.push({ hymnId, gregobaseId: id, name: head(gabc, 'name'), book: head(gabc, 'book'), transcriber: head(gabc, 'transcriber'), mode: head(gabc, 'mode'), officePart: head(gabc, 'office-part'), gabc });
}
const out = {
  about: 'Square-note scores from GregoBase (https://gregobase.selapa.net), released into the public domain (CC0). Each is one transcription of the chant, in the book named; other books sing the same text to other melodies. Notation is drawn in your browser by Exsurge (MIT).',
  fetched: new Date().toISOString().slice(0, 10),
  items,
};
writeFileSync(new URL('../../public/data/hymns/chant.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${items.length} scores`, items.map((i) => `${i.hymnId}=${i.gregobaseId}`).join(' '));
