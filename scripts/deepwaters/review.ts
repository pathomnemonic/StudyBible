// Records, for every Deep Waters question, a hash of what a person has to check (its text, whether it names a closed set, and every answer with its tier),
// and whether a person has checked it. A question whose content changes loses its review.
//   npx tsx scripts/deepwaters/review.ts            fail if src/data/deepWaters.review.json no longer matches the questions
//   npx tsx scripts/deepwaters/review.ts --write    rewrite it (new and changed questions become "unreviewed"; unchanged reviewed ones stay reviewed)
//   npx tsx scripts/deepwaters/review.ts --report   print coverage: answers per question, tier spread, unreviewed counts, days before a question can repeat
// To record a review, edit the entry by hand: "status": "reviewed", "reviewedBy", "reviewedOn", "notes". Do not mark a question reviewed unless someone read every answer.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { DEEP_WATERS } from '../../src/data/deepWaters';
import { DAILY_SIZE } from '../../src/lib/deepWatersSchedule';

const FILE = new URL('../../src/data/deepWaters.review.json', import.meta.url).pathname;
interface Entry { id: string; sha256: string; answers: number; status: 'unreviewed' | 'reviewed'; reviewedBy?: string; reviewedOn?: string; notes?: string }
const hashOf = (p: (typeof DEEP_WATERS)[number]) => createHash('sha256').update(JSON.stringify({ id: p.id, prompt: p.prompt, closed: p.closed ?? null, ignore: p.ignore ?? [], answers: p.answers })).digest('hex');
const prev: Entry[] = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, 'utf8')) as { entries: Entry[] }).entries : [];
const entries: Entry[] = DEEP_WATERS.map((p) => {
  const h = hashOf(p);
  const old = prev.find((e) => e.id === p.id);
  return old && old.sha256 === h ? old : { id: p.id, sha256: h, answers: p.answers.length, status: 'unreviewed' as const };
});
const text = JSON.stringify({ about: 'Review records for the Deep Waters questions. A question whose answers or tiers change is unreviewed again. See scripts/deepwaters/review.ts.', entries }, null, 1) + '\n';

if (process.argv.includes('--report')) {
  const answers = DEEP_WATERS.reduce((n, p) => n + p.answers.length, 0);
  console.log(`${DEEP_WATERS.length} questions, ${answers} answers; ${entries.filter((e) => e.status === 'reviewed').length} reviewed, ${entries.filter((e) => e.status === 'unreviewed').length} unreviewed`);
  const themes: Record<string, number> = {};
  for (const p of DEEP_WATERS) themes[p.theme] = (themes[p.theme] ?? 0) + 1;
  console.log('by theme:', Object.entries(themes).map(([t, n]) => `${t} ${n}`).join(', '));
  console.log(`a question cannot come back for ${Math.floor(DEEP_WATERS.length / DAILY_SIZE)} days (${DEEP_WATERS.length} questions, ${DAILY_SIZE} a day)`);
  const thin = DEEP_WATERS.filter((p) => !p.closed && p.answers.length < 25);
  console.log(`open questions with fewer than 25 answers: ${thin.map((p) => `${p.id}(${p.answers.length})`).join(' ') || 'none'}`);
} else if (process.argv.includes('--write')) {
  writeFileSync(FILE, text);
  console.log(`wrote ${entries.length} records (${entries.filter((e) => e.status === 'unreviewed').length} unreviewed)`);
} else if (!existsSync(FILE) || readFileSync(FILE, 'utf8') !== text) {
  console.error('src/data/deepWaters.review.json does not match the questions. Run: npx tsx scripts/deepwaters/review.ts --write');
  process.exit(1);
} else console.log('review records match');
