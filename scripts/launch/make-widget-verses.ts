/** Builds public/widgets/verses.json: the verse-of-the-day list with its text (WEB-Catholic), so the service worker can feed the Windows widget without the app open.
 *  Run: npx tsx scripts/launch/make-widget-verses.ts */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSE_OF_DAY } from '../../src/study/verseOfDay';
import { parseRefs, formatRef } from '../../src/lib/refs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out: { ref: string; text: string }[] = [];
for (const r of VERSE_OF_DAY) {
  const p = parseRefs(r); if (!p.ok) throw new Error(`cannot read ${r}`);
  const ref = p.refs[0].ref;
  const d = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'bible', 'webc', `${ref.book}.json`), 'utf8'));
  const ch = d.chapters.find((c: any) => c.n === ref.c1); if (!ch) throw new Error(`no chapter for ${r}`);
  const a = ref.v1 ?? 1, b = ref.v2 ?? ref.v1 ?? 999; let text = '';
  for (const blk of ch.blocks) for (const v of blk[1] ?? []) if (Array.isArray(v) && typeof v[0] === 'number' && v[0] >= a && v[0] <= b) text += (text ? ' ' : '') + v[1];
  if (!text) throw new Error(`no text for ${r}`);
  out.push({ ref: formatRef(ref, { noDual: true }), text: text.length > 320 ? text.slice(0, 320).replace(/\s+\S*$/, '') + '…' : text });
}
writeFileSync(join(ROOT, 'public', 'widgets', 'verses.json'), JSON.stringify(out));
console.log(`${out.length} verses`);
