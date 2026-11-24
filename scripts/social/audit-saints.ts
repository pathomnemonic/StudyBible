// Lists the dates that have no VERIFIED saint or Father line in the app's daily data (a card leaves an unverified line off, so these dates need a decision).
//   npx tsx scripts/social/audit-saints.ts [--from 2026-11-29] [--days 365]
import { readFileSync } from 'node:fs';
import { addDays, iso, liturgicalDay, parseIso } from '../../src/liturgy/compute';
import { pickDaily } from '../../src/study/dailyPick';
import type { DailyFile } from '../../src/study/dailyTypes';

const arg = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const file = JSON.parse(readFileSync(new URL('../../public/data/daily/index.json', import.meta.url).pathname, 'utf8')) as DailyFile;
const from = arg('from', '2026-11-29'), days = +arg('days', '365');
const missing: { date: string; why: string }[] = [];
for (let i = 0; i < days; i++) {
  const date = iso(addDays(parseIso(from), i));
  const e = pickDaily(file, liturgicalDay(parseIso(date), 'usa'));
  if (!e?.saint?.text) missing.push({ date, why: 'no saint line' });
  else if (e.saint.verified !== true) missing.push({ date, why: e.saint.misattributed ? 'unverified (attribution doubtful)' : 'unverified' });
}
const ranges: string[] = [];
for (let i = 0; i < missing.length;) { let j = i; while (j + 1 < missing.length && missing[j + 1].date === iso(addDays(parseIso(missing[j].date), 1)) && missing[j + 1].why === missing[i].why) j++; ranges.push(i === j ? `${missing[i].date} (${missing[i].why})` : `${missing[i].date} to ${missing[j].date} (${missing[i].why})`); i = j + 1; }
console.log(`${missing.length} of ${days} days from ${from} have no verified saint line.`);
console.log(ranges.join('\n'));
