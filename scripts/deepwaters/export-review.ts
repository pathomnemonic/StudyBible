// Writes the 679 unreviewed Basilion review records as plain-text batches a panel (or a person) can read, one record per question or per derived list.
//   npx tsx scripts/deepwaters/export-review.ts [--out review-out] [--per 20]
// Each record: the question as players see it, the note shown after the answer, what the answers were checked against (basis), whether the list is closed,
// and every answer with its tier (1 = most common, 6 = rarest = 100 points). Nothing here changes the bank.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DEEP_WATERS } from '../../src/data/deepWaters';

const arg = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const out = arg('out', 'review-out'), per = +arg('per', '20');
const review = JSON.parse(readFileSync(new URL('../../src/data/deepWaters.review.json', import.meta.url).pathname, 'utf8')) as { entries: { id: string; status: string }[] };
const POINTS = { 1: 20, 2: 35, 3: 50, 4: 65, 5: 80, 6: 100 } as Record<number, number>;
const ans = (p: (typeof DEEP_WATERS)[number]) => p.answers.map((a) => `  - [${a.tier}] ${a.answer}${a.aliases?.length ? ` (also accepted: ${a.aliases.join('; ')})` : ''}`).join('\n');
const one = (p: (typeof DEEP_WATERS)[number]) => `Question: ${p.prompt}\nNote shown to players: ${p.context}\nChecked against: ${p.basis ?? p.source ?? '(not recorded)'}\nList is ${p.closed ? `complete (${p.closed} items)` : 'open (not exhaustive)'}\nAnswers (${p.answers.length}), [tier] answer:\n${ans(p)}`;

const records = review.entries.filter((e) => e.status === 'unreviewed').map((e) => {
  if (e.id.startsWith('derived:')) {
    const pool = e.id.slice(8);
    const list = DEEP_WATERS.filter((p) => p.derived?.pool === pool);
    return `RECORD ${e.id} (a list of ${list.length} questions worked out by rule from one complete list)\n\n${list.map(one).join('\n\n')}`;
  }
  const p = DEEP_WATERS.find((x) => x.id === e.id);
  return `RECORD ${e.id}\n\n${p ? one(p) : '(question not found)'}`;
});
mkdirSync(out, { recursive: true });
const header = `Basilion answer-key review. Points by tier: ${Object.entries(POINTS).map(([t, v]) => `${t}=${v}`).join(', ')}. Tier 1 is the most common answer, tier 6 the rarest.\n\n`;
let n = 0;
for (let i = 0; i < records.length; i += per) { n++; writeFileSync(`${out}/batch-${String(n).padStart(3, '0')}.txt`, header + records.slice(i, i + per).join('\n\n----------------------------------------\n\n') + '\n'); }
console.log(`${records.length} records in ${n} batches of up to ${per} in ${out}/`);
