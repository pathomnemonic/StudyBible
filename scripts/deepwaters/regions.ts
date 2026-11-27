// Builds src/data/deepWaters.regions.json: Basilion questions about WHERE places are and WHICH BOOKS name them, worked out from the app's own map data
// (OpenBible geocoding as shipped in public/data/maps). No letter rules. Every question needs at least 60 places; sets that are nearly the same are dropped.
//   npx tsx scripts/deepwaters/regions.ts          rewrite the file
//   npx tsx scripts/deepwaters/regions.ts --check  fail if the committed file is not what this script produces now
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { BOOKS } from '../../src/lib/canon';
import { tiersByFamiliarity } from '../../src/lib/deepWatersRarity';
import { deepTokens } from '../../src/lib/deepWatersTokens';
import type { DeepPrompt } from '../../src/data/deepWaters';

const ROOT = new URL('../../', import.meta.url).pathname;
interface Pl { n: string; c?: string; r?: string; lat?: number; lon?: number; nv: number }
const places = JSON.parse(readFileSync(ROOT + 'public/data/maps/places.json', 'utf8')) as Pl[];
const bookDir = ROOT + 'public/data/maps/by-book/';
const inBook = new Map<string, Set<number>>();
for (const f of readdirSync(bookDir).filter((x) => x.endsWith('.json'))) {
  const t = JSON.parse(readFileSync(bookDir + f, 'utf8')) as [number, number, number][];
  inBook.set(f.replace('.json', ''), new Set(t.map((x) => x[2])));
}
const bookName: Record<string, string> = Object.fromEntries(BOOKS.map((b) => [b.id, b.name]));
const nameOf = (p: Pl) => p.n.replace(/\s+\d+(?::\d+)?$/, '').trim();
const okName = (p: Pl) => { const n = nameOf(p); return n.length >= 3 && !/[^A-Za-z '\-.]/.test(n); };
const km = (a: number, b: number, c: number, d: number) => { const q = Math.PI / 180; const x = Math.sin(((c - a) * q) / 2) ** 2 + Math.cos(a * q) * Math.cos(c * q) * Math.sin(((d - b) * q) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };

const OT = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'TOB', 'JDT', 'EST', '1MA', '2MA', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'WIS', 'SIR', 'ISA', 'JER', 'LAM', 'BAR', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'];
const NT = ['MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'];
const GROUPS: Record<string, { ids: string[]; label: string }> = {
  law: { ids: ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'], label: 'the five books of the Law' },
  history: { ids: ['JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'TOB', 'JDT', 'EST', '1MA', '2MA'], label: 'the historical books of the Old Testament' },
  wisdom: { ids: ['JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'WIS', 'SIR'], label: 'the wisdom books' },
  prophets: { ids: ['ISA', 'JER', 'LAM', 'BAR', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'], label: 'the prophets' },
  gospels: { ids: ['MAT', 'MRK', 'LUK', 'JHN'], label: 'the four Gospels' },
  letters: { ids: ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'], label: 'the letters and Revelation' },
  ot: { ids: OT, label: 'the Old Testament' },
  nt: { ids: NT, label: 'the New Testament' },
  kingdoms: { ids: ['1SA', '2SA', '1KI', '2KI', '1CH', '2CH'], label: 'the books of Samuel, Kings and Chronicles' },
  major: { ids: ['ISA', 'JER', 'EZK', 'DAN'], label: 'the four major prophets' },
  nonlaw: { ids: [...OT.filter((x) => !['GEN', 'EXO', 'LEV', 'NUM', 'DEU'].includes(x))], label: 'the Old Testament after the Law' },
};
const slotsOf = (ids: string[]) => { const s = new Set<number>(); for (const id of ids) for (const i of inBook.get(id) ?? []) s.add(i); return s; };
const booksNaming = (i: number) => [...inBook.values()].filter((s) => s.has(i)).length;

interface Cand { id: string; prompt: string; context: string; slots: Set<number>; exclude?: string }
/* Basilion review (issue 26): in these lists the shorter name is the same feature as the kept tier 6 answer under its
   fuller name (the valley Ezekiel also calls the Valley of the Travelers), scored twice in one list. The Zered case is
   settled the other way by Class B batch 11: the Valley of Zered folds into Zered, which stays as the one answer. */
const EXCLUDED_ANSWERS: Record<string, string[]> = {
  'dir-east-in-prophets': ['Valley of Hamon-gog'],
  'dir-transjordan-in-prophets': ['Valley of Hamon-gog'],
};
/* Class B batch 12: the dir-abroad records ask for places outside the Holy Land and Egypt, so Egyptian
   places are excluded from every one of them. The box alone does not do it: it stops at latitude 29, so
   Upper Egypt (Thebes at about 25.7) reads as "abroad". Applied by candidate id in the build loop below,
   so a dir-abroad list generated for any book group gets the exclusion, not only the four named before. */
const EGYPTIAN = ['Pathros', 'Thebes', 'Syene', 'Pelusium', 'Hanes', 'Alexandria'];
/* Basilion review (issue 26), Class B batches 9 to 12: variant forms of one place are one answer, scored under the
   canonical name with the variant as an accepted form. Keys are comparison forms, so "Sidon the Great" and
   "Great Sidon" hit the same entry. Folds chain: Chinnereth folds to Sea of Chinnereth, which itself folds to
   Sea of Galilee where that fold applies. */
const keyOf = (n: string) => deepTokens(n).join(' ');
const foldMapOf = (pairs: [string, string][]) => new Map(pairs.map(([v, c]) => [keyOf(v), c] as const));
const FOLD_PAIRS_X: [string, string][] = [
  ['Bethlehem Ephrathah', 'Bethlehem'], ['Babel', 'Babylon'], ['Horeb', 'Sinai'], ['Mount Horeb', 'Sinai'], ['Mount Sinai', 'Sinai'],
  ['Place of a Skull', 'Golgotha'], ['The Skull', 'Golgotha'], ['Akeldama', 'Field of Blood'], ['Olivet', 'Mount of Olives'],
  ['Hermon', 'Mount Hermon'], ['Kiriath-sepher', 'Debir'], ['Kiriath-sannah', 'Debir'], ['Raamses', 'Rameses'],
  ['Tehaphnehes', 'Tahpanhes'], ['Sea of Tiberias', 'Sea of Galilee'], ['Sea of Chinnereth', 'Sea of Galilee'], ['Chinnereth', 'Sea of Chinnereth'],
  ['Gennesaret', 'Sea of Galilee'], ['Laish', 'Dan'], ['Leshem', 'Dan'], ['Great Sidon', 'Sidon'], ['Ptolemais', 'Acco'],
  ['Peniel', 'Penuel'], ['Michmas', 'Michmash'], ['Perez-uzza', 'Perez-uzzah'], ['Nahalol', 'Nahalal'], ['Mishal', 'Mashal'],
  ['Hukok', 'Hukkok'], ['Beth-shan', 'Beth-shean'], ['Rimmono', 'Rimmon'], ['Timnath-serah', 'Timnath-heres'],
  ['Vale of Succoth', 'Valley of Succoth'], ['Sea of the Arabah', 'Salt Sea'], ['Beth-baal-meon', 'Baal-meon'],
  ['Valley of Shittim', 'Shittim'], ['Berothah', 'Berothai'], ['Cuth', 'Cuthah'], ['Maacath', 'Maacah'],
];
/* batch 10 folds, for the places-x-in-* records (and the dir records, which take batches 9 and 10 together):
   in these records the lake keeps Sea of Chinnereth as its own answer, so that one batch 9 fold does not apply */
const FOLD_PAIRS_IN_EXTRA: [string, string][] = [
  ['Jabneh', 'Jabneel'], ['Moserah', 'Moseroth'], ['Kidron', 'Kidron Valley'], ['Jahzah', 'Jahaz'],
  ['The Stone Pavement', 'Gabbatha'], ['Mount Sinai', 'Sinai'],
];
/* batches 11 and 12 folds, for the places-x-dir-* records only (including the Hamath-zobah name form of 2 Chronicles 8:3) */
const FOLD_PAIRS_DIR_EXTRA: [string, string][] = [
  ['Babylonia', 'Babylon'], ['Valley of the Arnon', 'Arnon'], ['Valley of Zered', 'Zered'], ['Kadesh-barnea', 'Kadesh'],
  ['Eloth', 'Elath'], ['Azotus', 'Ashdod'], ['Mount Seir', 'Seir'], ['Luz', 'Bethel'], ['Kiriath-arba', 'Hebron'],
  ['Zobah-Hamath', 'Hamath-zobah'],
];
const FOLDS_X = foldMapOf(FOLD_PAIRS_X);
const FOLDS_IN = foldMapOf([...FOLD_PAIRS_X.filter(([v]) => v !== 'Sea of Chinnereth'), ...FOLD_PAIRS_IN_EXTRA]);
const FOLDS_DIR = foldMapOf([...FOLD_PAIRS_X, ...FOLD_PAIRS_IN_EXTRA, ...FOLD_PAIRS_DIR_EXTRA]);
/* Class B batches 8, 9, 10 and 12: entries that are not places (persons, peoples, temple spaces and bare generic
   labels), the separate Ephrath and Ephrathah entries (batch 9), and the composite Lower and Upper Beth-horon */
const EXCLUDED_X = new Set(['Solomon', 'Mount', 'Jebusite', 'Judean', 'Angle', 'Sur', 'Mortar', 'Plain', 'East', 'River', 'Straight',
  'Most Holy Place', 'Holy Place', 'Hall of Judgment', 'Hall of Pillars', 'Hall of the Throne', "Solomon's Portico",
  'Esau', 'Nimrod', 'Rahab', 'Ham', 'Ephrath', 'Ephrathah', 'Lower and Upper Beth-horon'].map(keyOf));
const EXCLUDED_IN = new Set([...EXCLUDED_X, ...['Terah', 'Gog', 'Baal', 'Bilhah', 'Cherub', 'Jeshua'].map(keyOf)]);
const EXCLUDED_DIR = new Set([...EXCLUDED_X, ...['Gog', 'Second Quarter'].map(keyOf)]);
const cands: Cand[] = [];
const geo = (i: number) => places[i].lat !== undefined && places[i].lon !== undefined;

/* where: distance from a well-known city */
const ANCHORS: [string, string, number, number][] = [
  ['jerusalem', 'Jerusalem', 31.778, 35.235], ['bethlehem', 'Bethlehem', 31.705, 35.2], ['nazareth', 'Nazareth', 32.7, 35.3], ['capernaum', 'Capernaum', 32.88, 35.575],
  ['damascus', 'Damascus', 33.51, 36.29], ['rome', 'Rome', 41.9, 12.5], ['babylon', 'Babylon', 32.54, 44.42], ['cairo', 'Cairo', 30.04, 31.24], ['antioch', 'Antioch in Syria', 36.2, 36.16],
  ['ephesus', 'Ephesus', 37.94, 27.34], ['corinth', 'Corinth', 37.9, 22.88], ['athens', 'Athens', 37.97, 23.73], ['tyre', 'Tyre', 33.27, 35.2], ['hebron', 'Hebron', 31.53, 35.1],
  ['shechem', 'Shechem', 32.21, 35.28], ['jericho', 'Jericho', 31.86, 35.46], ['gaza', 'Gaza', 31.5, 34.47], ['beersheba', 'Beersheba', 31.25, 34.79], ['sinai', 'Mount Sinai', 28.54, 33.97],
  ['nineveh', 'Nineveh', 36.36, 43.15], ['haran', 'Haran', 36.87, 39.03],
];
for (const [key, label, la, lo] of ANCHORS) for (const r of [25, 50, 100, 200, 400, 800, 1500, 3000]) {
  const slots = new Set(places.map((_, i) => i).filter((i) => geo(i) && km(la, lo, places[i].lat!, places[i].lon!) <= r));
  // the anchor place itself is not scored in its own radius list: the question names it, so it would hand the player a free answer
  cands.push({ id: `near-${key}-${r}`, prompt: `Name a place in the Bible within about ${r} kilometers of ${label}.`, context: `Distances are measured from ${label} to the place as the app's map data (OpenBible) locates it today; the same name can be more than one place, and some sites are only roughly placed.`, slots, exclude: key === 'antioch' ? 'Antioch' : label });
}
/* which books: groups of books */
const GK = Object.keys(GROUPS);
for (const g of GK) cands.push({ id: `in-${g}`, prompt: `Name a place mentioned in ${GROUPS[g].label}.`, context: `Counted from the app's map data, which lists the places named in each verse; it is long but may not be complete.`, slots: slotsOf(GROUPS[g].ids) });
cands.push({ id: 'in-both-testaments', prompt: 'Name a place mentioned in both the Old and the New Testament.', context: 'Counted from the app\'s map data: places the data finds in at least one Old Testament book and at least one New Testament book.', slots: new Set([...slotsOf(OT)].filter((i) => slotsOf(NT).has(i))) });
for (const g of ['law', 'history', 'prophets', 'gospels', 'letters']) for (const h of ['law', 'history', 'prophets', 'gospels', 'letters']) {
  if (g >= h) continue;
  const a = slotsOf(GROUPS[g].ids), b = slotsOf(GROUPS[h].ids);
  cands.push({ id: `both-${g}-${h}`, prompt: `Name a place mentioned in both ${GROUPS[g].label} and ${GROUPS[h].label}.`, context: 'Counted from the app\'s map data: places found in at least one book of each group.', slots: new Set([...a].filter((i) => b.has(i))) });
  cands.push({ id: `only-${g}-${h}`, prompt: `Name a place mentioned in ${GROUPS[g].label} but not in ${GROUPS[h].label}.`, context: 'Counted from the app\'s map data: places found in the first group and in none of the books of the second.', slots: new Set([...a].filter((i) => !b.has(i))) });
  cands.push({ id: `only-${h}-${g}`, prompt: `Name a place mentioned in ${GROUPS[h].label} but not in ${GROUPS[g].label}.`, context: 'Counted from the app\'s map data: places found in the first group and in none of the books of the second.', slots: new Set([...b].filter((i) => !a.has(i))) });
}
/* how often named */
for (const n of [2, 3, 4, 5, 6, 8, 10]) cands.push({ id: `books-${n}`, prompt: `Name a place mentioned in at least ${n} different books of the Bible.`, context: 'Counted from the app\'s map data, which lists the places named in each book.', slots: new Set(places.map((_, i) => i).filter((i) => booksNaming(i) >= n)) });
for (const n of [1, 2, 3]) cands.push({ id: `onebook-${n}`, prompt: n === 1 ? 'Name a place mentioned in only one book of the Bible.' : `Name a place mentioned in only ${n === 2 ? 'two' : 'three'} books of the Bible.`, context: 'Counted from the app\'s map data, which lists the places named in each book.', slots: new Set(places.map((_, i) => i).filter((i) => booksNaming(i) === n)) });
/* group x direction from Jerusalem */
const J: [number, number] = [31.778, 35.235];
const DIRS: [string, string, (la: number, lo: number) => boolean][] = [
  ['north', 'north of Jerusalem', (la) => la > J[0] + 0.3], ['south', 'south of Jerusalem', (la) => la < J[0] - 0.3], ['east', 'east of Jerusalem', (_la, lo) => lo > J[1] + 0.3], ['west', 'west of Jerusalem', (_la, lo) => lo < J[1] - 0.3],
  ['holyland', 'inside the Holy Land', (la, lo) => la >= 31.1 && la <= 33.4 && lo >= 34.2 && lo <= 36.0], ['abroad', 'outside the Holy Land and Egypt', (la, lo) => !(la >= 29 && la <= 33.5 && lo >= 31 && lo <= 36)],
  ['transjordan', 'east of the Jordan River', (la, lo) => lo > 35.6 && la > 29 && la < 34], ['coast', 'on the Mediterranean coast of the Holy Land', (la, lo) => lo < 34.95 && lo > 34 && la > 31 && la < 34],
];
for (const [dk, dl, f] of DIRS) {
  cands.push({ id: `dir-${dk}`, prompt: `Name a place in the Bible ${dl.startsWith('inside') || dl.startsWith('outside') || dl.startsWith('on ') ? 'that is ' : 'that lies '}${dl}.`, context: `Placed by the app's map data (OpenBible geocoding); where scholars disagree the data takes one view, and some sites are only roughly placed.`, slots: new Set(places.map((_, i) => i).filter((i) => geo(i) && f(places[i].lat!, places[i].lon!))) });
  for (const g of GK) {
    const gs = slotsOf(GROUPS[g].ids);
    // the cardinal directions read "north of Jerusalem" etc; every other direction phrase is used as it stands
    // (the old string surgery mangled "east of the Jordan River" into "eastof the Jordan River of Jerusalem")
    const dirPhrase = dk === 'north' || dk === 'south' || dk === 'east' || dk === 'west' ? `${dk} of Jerusalem` : dl;
    cands.push({ id: `dir-${dk}-in-${g}`, prompt: `Name a place mentioned in ${GROUPS[g].label} that is ${dirPhrase}.`, context: `Placed by the app's map data (OpenBible geocoding) and counted from the places it lists in those books; some sites are only roughly placed.`, slots: new Set([...gs].filter((i) => geo(i) && f(places[i].lat!, places[i].lon!))) });
  }
}

/* build */
const prompts: DeepPrompt[] = [];
const kept: Set<string>[] = [];
for (const c of cands) {
  const folds = c.id.startsWith('dir-') ? FOLDS_DIR : c.id.startsWith('in-') ? FOLDS_IN : FOLDS_X;
  const excluded = c.id.startsWith('dir-') ? EXCLUDED_DIR : c.id.startsWith('in-') ? EXCLUDED_IN : EXCLUDED_X;
  const excludedAnswers = [...(EXCLUDED_ANSWERS[c.id] ?? []), ...(c.id === 'dir-abroad' || c.id.startsWith('dir-abroad-in-') ? EGYPTIAN : [])];
  // the anchor's own name, folded the way answers are folded: the exclusion must still bite when the map
  // names the anchor by a folded form (Sinai, for the anchor listed as Mount Sinai; Horeb folds there too)
  let excludeName = c.exclude;
  if (excludeName) { const seenE = new Set<string>(); let n = excludeName; while (folds.has(keyOf(n)) && !seenE.has(keyOf(n))) { seenE.add(keyOf(n)); n = folds.get(keyOf(n))!; } excludeName = n; }
  const byKey = new Map<string, { name: string; aliases: string[]; score: number }>();
  for (const i of c.slots) {
    const p = places[i];
    if (!okName(p)) continue;
    const raw = nameOf(p).replace(/['’]s$/, '');
    if (c.exclude && raw === c.exclude) continue;
    if (excludedAnswers.includes(raw)) continue;
    if (excluded.has(keyOf(raw))) continue;
    // fold variant forms to their canonical place, following the chain (Chinnereth to Sea of Chinnereth to Sea of Galilee)
    let name = raw;
    { const seen = new Set<string>(); let n = raw; while (folds.has(keyOf(n)) && !seen.has(keyOf(n))) { seen.add(keyOf(n)); n = folds.get(keyOf(n))!; } name = n; }
    // a variant of the anchor place folds into the anchor's name; the anchor itself is not scored in its own radius list
    if (excludeName && name === excludeName) continue;
    const k = deepTokens(name).join(' ');
    const now = p.c && /^Now /.test(p.c) ? p.c.replace(/^Now /, '').replace(/[.]$/, '').trim() : '';
    const score = Math.log(1 + p.nv) + 0.5 * Math.log(1 + booksNaming(i));
    const cur = byKey.get(k);
    if (!cur) byKey.set(k, { name, aliases: [...(now.length >= 3 && !/[^A-Za-z '\-.]/.test(now) ? [now] : []), ...(name !== raw ? [raw] : [])], score });
    else { cur.score = Math.max(cur.score, score); if (name !== raw && !cur.aliases.includes(raw)) cur.aliases.push(raw); }
  }
  if (byKey.size < 60) continue;
  const keys = new Set(byKey.keys());
  if (kept.some((t) => { let both = 0; for (const x of keys) if (t.has(x)) both++; return both / (keys.size + t.size - both) >= 0.8; })) continue;
  const list = [...byKey.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const tiers = tiersByFamiliarity(list.map((l) => l.score));
  if (list.length >= 40 && new Set(tiers).size < 5) continue;
  if (list.length > 700) continue;
  kept.push(keys);
  prompts.push({ id: `places-x-${c.id}`, theme: 'places', prompt: c.prompt, context: c.context.replace('Counted', `Counted`) + ` This list has ${list.length} places.`, source: 'maps/places.json and maps/by-book (OpenBible geocoding, as shipped in the app\'s maps)', answers: list.map((l, i) => ({ answer: l.name, tier: tiers[i], ...(l.aliases.length && l.aliases[0].toLowerCase() !== l.name.toLowerCase() ? { aliases: l.aliases } : {}) })) });
}
const out = '[\n' + prompts.map((p) => JSON.stringify(p)).join(',\n') + '\n]\n';
const file = ROOT + 'src/data/deepWaters.regions.json';
if (process.argv.includes('--check')) {
  if (!existsSync(file) || readFileSync(file, 'utf8') !== out) { console.error('Out of date: src/data/deepWaters.regions.json\nRun: npx tsx scripts/deepwaters/regions.ts'); process.exit(1); }
  console.log('regions data is up to date');
} else {
  writeFileSync(file, out);
  console.log(`wrote ${prompts.length} questions from ${cands.length} candidates`);
  for (const p of prompts) console.log(`  ${p.id.padEnd(30)} ${String(p.answers.length).padStart(4)}  ${p.prompt}`);
}
