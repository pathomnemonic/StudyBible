// Chooses the questions that are derived by rule from complete lists, and stores which ones (src/data/deepWaters.derived.json).
//   npx tsx scripts/deepwaters/derive.ts            fail if the stored choice is not what the rules choose now
//   npx tsx scripts/deepwaters/derive.ts --write    rewrite it (after changing a list, a rule or the bank size)
// The choice is slow (every rule is tried on every list), so it is made here and the app only rebuilds the chosen questions from it.
import { readFileSync, writeFileSync } from 'node:fs';
import { BANK_SIZE, BASE_PROMPTS, themeCaps } from '../../src/data/deepWaters';
import { buildPools } from '../../src/data/deepWatersPools';
import { chooseDerived, materialize } from '../../src/lib/deepWatersDerive';
import { isEverydayList, isEverydayRule } from '../../src/data/deepWatersEveryday';

const FILE = new URL('../../src/data/deepWaters.derived.json', import.meta.url).pathname;
const PACK_FILE = new URL('../../src/data/deepWaters.packs.derived.json', import.meta.url).pathname;
const pools = buildPools(BASE_PROMPTS);
const entries = chooseDerived(pools, BANK_SIZE - BASE_PROMPTS.filter(isEverydayList).length, themeCaps, BASE_PROMPTS, isEverydayRule);
// the questions that are not asked in the daily game go to the special packs: the same lists with the rules the daily game leaves out, then the hard letter puzzles
const noCap = Object.fromEntries(Object.keys(themeCaps).map((k) => [k, 1e9]));
const asked = [...BASE_PROMPTS, ...materialize(pools, entries)];
const packA = chooseDerived(pools, 1e9, noCap, asked, (pool, kind) => !isEverydayRule(pool, kind));
const packB = chooseDerived(pools, 1e9, noCap, [...asked, ...materialize(pools, packA)], () => true, true);
const text = JSON.stringify(entries) + '\n';
const packText = JSON.stringify([...packA, ...packB]) + '\n';
if (process.argv.includes('--write')) { writeFileSync(FILE, text); writeFileSync(PACK_FILE, packText); console.log(`wrote ${entries.length} daily and ${packA.length + packB.length} pack derived questions`); }
else if (readFileSync(FILE, 'utf8') !== text || readFileSync(PACK_FILE, 'utf8') !== packText) { console.error('the stored derived questions are not what the rules choose now. Run: npx tsx scripts/deepwaters/derive.ts --write'); process.exit(1); }
else console.log(`derived questions match (${entries.length} daily, ${packA.length + packB.length} in packs)`);
