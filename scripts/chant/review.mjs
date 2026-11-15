// Records (or checks) the review of every chant score in public/data/hymns/chant.json against its hymn text. Offline.
//   node scripts/chant/review.mjs            prints the ordered comparison for every score and exits 1 if chant-review.json no longer matches
//   node scripts/chant/review.mjs --write    rewrites chant-review.json from chant.json. Do this only after reading the comparison and
//                                            updating each entry's `explanation`; an entry that says UNREVIEWED fails tests/chant.test.ts.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { reviewEntry } from './compare.mjs';
const dir = new URL('../../public/data/hymns/', import.meta.url);
const chant = JSON.parse(readFileSync(new URL('chant.json', dir), 'utf8'));
const hymns = JSON.parse(readFileSync(new URL('hymns.json', dir), 'utf8')).hymns;
const file = new URL('chant-review.json', dir);
const prev = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { entries: [] };
const entries = chant.items.map((i) => {
  const old = prev.entries.find((e) => e.hymnId === i.hymnId) ?? {};
  const unchanged = old.gabcSha256 && reviewEntry(i, hymns.find((h) => h.id === i.hymnId), old).gabcSha256 === old.gabcSha256;
  // a changed score loses its review: the explanation and date are not carried over
  return reviewEntry(i, hymns.find((h) => h.id === i.hymnId), unchanged ? old : { textRepeats: old.textRepeats });
});
for (const e of entries) console.log(`${e.hymnId.padEnd(14)} ordered ${e.minOrdered}  coverage ${e.minCoverage}  unsung: ${e.unsungInScore.join(' ') || '-'}  | extra: ${e.sungNotInText.join(' ') || '-'}`);
if (process.argv.includes('--write')) { writeFileSync(file, JSON.stringify({ about: 'Review records for the chant scores. A score whose GABC no longer hashes to gabcSha256 has changed since a person checked it.', entries }, null, 1) + '\n'); console.log('wrote chant-review.json'); }
else if (JSON.stringify(entries) !== JSON.stringify(prev.entries)) { console.error('chant-review.json does not match chant.json'); process.exit(1); }
