import { HAND_PROMPTS, BASE_PROMPTS, DEEP_PLAYABLE, DEEP_WATERS, type DeepPrompt } from './deepWaters';
import { materialize, type DerivedEntry } from '../lib/deepWatersDerive';
import { buildPools } from './deepWatersPools';
import { CHATGPT_PROMPTS } from './deepWatersChatGPT';
import PACK_ENTRIES from './deepWaters.packs.derived.json';
import { DEEP_ROUNDS } from '../lib/deepWaters';
import { singleTop, spreadTiers } from '../lib/deepWatersSpread';
import { dailySchedule, familyOf } from '../lib/deepWatersSchedule';
import { seeded, shuffled } from '../lib/dailyGame';

/**
 * The special packs of Basilion, like the themed packs in the games it is modelled on. The daily game asks only what comes to mind at once; everything else the
 * game holds (the places named in one book of the Bible, a saint by feast month, the words of a prayer, church councils, the Roman Curia, and the letter puzzles
 * with two conditions at once) lives here, for the player who wants it. A pack is seven questions drawn from its own questions, a fresh deal each time, and is not
 * counted in the daily streak. Each question belongs to one pack.
 */
export interface Pack { id: string; name: string; blurb: string; hard: boolean; match: (p: DeepPrompt) => boolean }

const bare = (id: string) => id.replace(/^(authored\d?-|ported-|gpt-)/, '');
const pool = (p: DeepPrompt) => (p.derived ? p.derived.pool : bare(p.id));
const PRAYERS = /^(magnificat|psalm-23|our-father|hail-mary|hail-holy-queen|memorare|act-of-contrition|st-michael|anima-christi|angel-of-god|glory-be|beatitudes|ten-commandments|apostles-creed)$/;
const SCHOLAR = /^(councils|heresies|theology|theology-terms|catholic-classics|fathers|fathers-works|augustine-works|aquinas-works|encyclicals|deuterocanon|ancient-sees|late-medieval-theologians|martyrdom-texts|francis-canonizations|vatican-ii-documents|rites|abbeys|english-martyrs|pius|popes-20c|popes-since-1500|popes|doctors|latin|latin-worship|liturgical-books|church-historians|latin-prayers|apostolic-constitutions|motu-proprio|apostolic-letters|curial-.*|archdioceses|apostolic-vicariates|orders|mass|sacred-music|seven-churches|marian-litany|early-martyrs|johannine-titles|revelation-images|foreign-rulers|minor-prophets|pauline-coworkers|romans16-women|prophets-before-kings|women-in-acts|pauls-first-journey|patron-countries|patron-illnesses|patron-professions|encyclicals|councils)$/;

export const PACKS: Pack[] = [
  { id: 'places', name: 'Bible Places', blurb: 'The places named in one book of the Bible, and places by distance and direction.', hard: true, match: (p) => p.theme === 'places' && (/^places-/.test(pool(p)) || /^(bible-places|places-in-.*)$/.test(pool(p)) || /^places-x-/.test(bare(p.id))) },
  { id: 'saints', name: 'Saints A to Z', blurb: 'Saints by letter, by feast month and by role, and saints\' first names.', hard: false, match: (p) => p.theme === 'saints' || /^saints-/.test(pool(p)) },
  { id: 'people', name: 'People of the Bible', blurb: 'People of the Bible by letter and by book.', hard: false, match: (p) => /^people-|^bible-people$|^bible-women$|^roles-women$/.test(pool(p)) || p.theme === 'people' },
  { id: 'prayers', name: 'Words of the Prayers', blurb: 'Name a word in the Our Father, the Hail Mary, the Creed, the Magnificat and more.', hard: false, match: (p) => PRAYERS.test(pool(p)) },
  { id: 'letters', name: 'Letter Play', blurb: 'Name something with, or without, a letter: saints, places, prayers and more.', hard: false, match: (p) => Boolean(p.derived) },
  { id: 'scholar', name: 'Scholar\'s Pack', blurb: 'Councils, heresies, the Fathers, encyclicals, the Roman Curia, archdioceses and other specialist lists.', hard: true, match: (p) => SCHOLAR.test(pool(p)) || /^longtail-|^curial|^gpt-/.test(p.id) },
  { id: 'puzzles', name: 'Letter Puzzles', blurb: 'Two letter conditions at once, or counting letters. Hard on purpose.', hard: true, match: (p) => Boolean(p.derived && ['both', 'notin', 'startwith', 'startend', 'twice', 'second', 'length', 'vowels', 'doubled', 'same'].includes(p.derived.kind)) },
  { id: 'more', name: 'Odds and Ends', blurb: 'Everything else the game knows: gifts, vestments, instruments, rivers and more.', hard: false, match: () => true },
];
/** a question goes to the first of these that wants it (the hard puzzles first, the catch-all last) */
const CLAIM_ORDER = ['puzzles', 'prayers', 'scholar', 'places', 'people', 'saints', 'letters', 'more'];
/** Every question the game can deal: the daily bank, the hand-written lists the daily game leaves out, and the questions only the packs ask. Loaded only when a pack is opened. */
export const DEEP_ALL: DeepPrompt[] = [...DEEP_WATERS, ...CHATGPT_PROMPTS.map(spreadTiers), ...materialize(buildPools(HAND_PROMPTS), PACK_ENTRIES as DerivedEntry[]).map(singleTop)];
const playable = new Set(DEEP_PLAYABLE.map((p) => p.id));
const claimed = new Map<string, DeepPrompt[]>(PACKS.map((k) => [k.id, []]));
for (const p of DEEP_ALL) {
  if (playable.has(p.id)) continue;
  const pack = CLAIM_ORDER.map((id) => PACKS.find((k) => k.id === id)!).find((k) => k.match(p));
  if (pack) claimed.get(pack.id)!.push(p);
}
/** the questions of a pack */
export const packPrompts = (id: string): DeepPrompt[] => claimed.get(id) ?? [];
export const packById = (id: string | null | undefined) => PACKS.find((k) => k.id === id) ?? null;

/** Seven questions from one pack: a fresh deal for each seed, never two from the same list when the pack is big enough to avoid it. */
export function packDeepPrompts(packId: string, seed: number): DeepPrompt[] {
  const pool = shuffled(packPrompts(packId), seeded(seed * 7919 + 17));
  const out: DeepPrompt[] = []; const used = new Set<string>();
  for (const p of pool) { const f = familyOf(p.id); if (used.has(f)) continue; used.add(f); out.push(p); if (out.length === DEEP_ROUNDS) return out; }
  for (const p of pool) { if (!out.includes(p)) out.push(p); if (out.length === DEEP_ROUNDS) return out; }
  return [...out, ...dailySchedule(DEEP_PLAYABLE, seed, 99173)].slice(0, DEEP_ROUNDS); // a pack with fewer than seven questions is topped up from the daily bank
}
