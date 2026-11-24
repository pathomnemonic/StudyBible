// Writes what a day (or a run of days) of social posts is made from, as JSON, from the app's own data. Nothing is posted and no text is written here.
//   npx tsx scripts/social/export.ts --from 2026-11-29 --days 7 [--out social-out]
import { mkdirSync, writeFileSync } from 'node:fs';
import { addDays, iso, parseIso } from '../../src/liturgy/compute';
import { buildDay } from './lib';

const arg = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const from = arg('from', iso(new Date()));
const days = Math.max(1, +arg('days', '1'));
const out = arg('out', 'social-out');
mkdirSync(out, { recursive: true });
const all = [];
for (let i = 0; i < days; i++) {
  const date = iso(addDays(parseIso(from), i));
  const d = buildDay(date);
  all.push(d);
  writeFileSync(`${out}/${date}.json`, JSON.stringify(d, null, 2) + '\n');
}
const flags = all.flatMap((d) => (d.dailyWord?.needsReview ?? []).map((m) => `${d.date}: ${m}`));
console.log(`wrote ${all.length} day(s) to ${out}/`);
const leftOff = all.filter((d) => d.dailyWord?.saintStatus === 'left-off-unverified').length;
if (leftOff) console.log(`\n${leftOff} of ${all.length} day(s) have no verified saint line: their cards leave it off (see scripts/social/audit-saints.ts). This is a rule, not a flag.`);
if (flags.length) console.log('\nNeeds a person before posting:\n' + flags.map((f) => ' - ' + f).join('\n'));
