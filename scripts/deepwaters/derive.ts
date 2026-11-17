// Chooses the questions that are derived by rule from complete lists, and stores which ones (src/data/deepWaters.derived.json).
//   npx tsx scripts/deepwaters/derive.ts            fail if the stored choice is not what the rules choose now
//   npx tsx scripts/deepwaters/derive.ts --write    rewrite it (after changing a list, a rule or the bank size)
// The choice is slow (every rule is tried on every list), so it is made here and the app only rebuilds the chosen questions from it.
import { readFileSync, writeFileSync } from 'node:fs';
import { BANK_SIZE, BASE_PROMPTS, themeCaps } from '../../src/data/deepWaters';
import { buildPools } from '../../src/data/deepWatersPools';
import { chooseDerived } from '../../src/lib/deepWatersDerive';

const FILE = new URL('../../src/data/deepWaters.derived.json', import.meta.url).pathname;
const entries = chooseDerived(buildPools(BASE_PROMPTS), BANK_SIZE - BASE_PROMPTS.length, themeCaps, BASE_PROMPTS);
const text = JSON.stringify(entries) + '\n';
if (process.argv.includes('--write')) { writeFileSync(FILE, text); console.log(`wrote ${entries.length} derived questions`); }
else if (readFileSync(FILE, 'utf8') !== text) { console.error('src/data/deepWaters.derived.json is not what the rules choose now. Run: npx tsx scripts/deepwaters/derive.ts --write'); process.exit(1); }
else console.log(`derived questions match (${entries.length})`);
