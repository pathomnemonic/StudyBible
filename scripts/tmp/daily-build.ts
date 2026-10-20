import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { parseRefs, refId } from '../../src/lib/refs';
const src = JSON.parse(readFileSync('/tmp/claude-0/cathology/entries.json', 'utf8'));
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
// corpus for verification of saint quotes
const corpus: string[] = [];
for (const f of readdirSync('public/data/library/works')) {
  if (!f.endsWith('.json')) continue;
  const w = JSON.parse(readFileSync(`public/data/library/works/${f}`, 'utf8'));
  for (const s of w.sections) for (const p of s.paras) corpus.push(norm(p));
}
const big = corpus.join(' | ');
const out: any[] = [];
let bad = 0, verified = 0;
for (const [key, e] of Object.entries<any>(src)) {
  const m = /^(.*?)\s*\((.*?)\)\s*$/.exec(e.verse.source);
  const label = (m ? m[1] : e.verse.source).replace(/^Isaias/, 'Isaiah').replace(/^Osee/, 'Hosea').replace(/^Aggeus/, 'Haggai').replace(/^Abdias/, 'Obadiah').replace(/^Sophonias/, 'Zephaniah').replace(/^Malachias/, 'Malachi').replace(/^Jonas/, 'Jonah').replace(/^Micheas/, 'Micah').replace(/^Habacuc/, 'Habakkuk').replace(/^Zacharias/, 'Zechariah').replace(/^Aggeus/, 'Haggai').replace(/^Ecclesiasticus/, 'Sirach').replace(/^Canticle of Canticles/, 'Song of Songs').replace(/^Machabees/, 'Maccabees').replace(/^(\d) Paralipomenon/, '$1 Chronicles').replace(/^(\d) Kings/, '$1 Kings').replace(/^Josue/, 'Joshua').replace(/^Jeremias/, 'Jeremiah').replace(/^Ezechiel/, 'Ezekiel').replace(/^Daniel/, 'Daniel').replace(/^Nehemias/, 'Nehemiah').replace(/^Esdras/, 'Ezra').replace(/^Tobias/, 'Tobit').replace(/^Judas/, 'Jude').replace(/^Apocalypse/, 'Revelation').replace(/^Sapientia/, 'Wisdom');
  const p = parseRefs(label);
  if (!p.ok) { bad++; console.log('unparsed', key, label); continue; }
  const r = p.refs[0].ref;
  const text = e.saint.text as string;
  const words = norm(text).split(' ');
  let ok = false;
  for (let i = 0; i + 7 <= words.length && !ok; i++) ok = big.includes(words.slice(i, i + 7).join(' '));
  if (ok) verified++;
  out.push({ key, ref: refId(r), label, saint: { text, who: e.saint.source.replace(/^St\.\s*/, 'St. '), work: e.saint.work, verified: ok }, question: e.question });
}
writeFileSync('/tmp/claude-0/daily-draft.json', JSON.stringify(out, null, 1));
console.log(out.length, 'entries, unparsed', bad, 'verified saint quotes', verified);
