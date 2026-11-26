// Builds src/data/deepWaters.generated.json (the Deep Waters questions that come from the app's own data) and src/data/deepWaters.sources.json (where each came from).
//   npx tsx scripts/deepwaters/build.ts          rewrite both files
//   npx tsx scripts/deepwaters/build.ts --check  fail if the committed files are not what this script produces now
// Deterministic: the same inputs always give the same bytes. Rarity: src/lib/deepWatersRarity.ts. Manual tier corrections: scripts/deepwaters/overrides.json.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { WHO_AM_I } from '../../src/data/whoami';
import { WHO_AM_I_2 } from '../../src/data/whoami2';
import { NAME_SAINTS } from '../../src/data/confirmationSaints';
import { BOOKS } from '../../src/lib/canon';
import { deepTokens } from '../../src/lib/deepWatersTokens';
import { countMentions, tiersByFamiliarity } from '../../src/lib/deepWatersRarity';
import type { DeepAnswer, DeepPrompt, DeepTheme } from '../../src/data/deepWaters';

const ROOT = new URL('../../', import.meta.url).pathname;
const read = (p: string) => readFileSync(ROOT + p, 'utf8');
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const inputs: { path: string; sha256: string }[] = [];
const track = (p: string) => { const t = read(p); inputs.push({ path: p, sha256: sha(t) }); return t; };

interface Override { prompt: string; answer: string; tier: 1 | 2 | 3 | 4 | 5 | 6; reason: string }
const overrides: Override[] = existsSync(ROOT + 'scripts/deepwaters/overrides.json') ? JSON.parse(track('scripts/deepwaters/overrides.json')) : [];

const SMALL = new Set(['of', 'the', 'de', 'di', 'da', 'del', 'van', 'von', 'and', 'in', 'le', 'la']);
const title = (s: string) => s.toLowerCase().split(/(\s+)/).map((w, i) => (SMALL.has(w) && i > 0 ? w : w.replace(/(^|[-'’])([a-zà-ÿ])/g, (_m, a, b) => a + b.toUpperCase()))).join('');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ---------- the Bible text, for counting how often a name appears ---------- */
const BOOK_NAMES: Record<string, string> = Object.fromEntries(BOOKS.map((b) => [b.id, b.name]));
const bookText = new Map<string, string>();
{
  const dir = 'public/data/bible/webc/';
  let all = '';
  for (const f of readdirSync(ROOT + dir).filter((x) => x.endsWith('.json')).sort()) {
    const raw = read(dir + f); all += raw;
    const d = JSON.parse(raw) as { id: string; chapters: { blocks: [string, unknown][] }[] };
    const parts: string[] = [];
    for (const ch of d.chapters) for (const b of ch.blocks) if (Array.isArray(b[1])) for (const it of b[1] as unknown[]) if (Array.isArray(it) && typeof it[1] === 'string') parts.push(it[1]);
    bookText.set(d.id, parts.join(' '));
  }
  inputs.push({ path: dir + '*.json (concatenated, sorted)', sha256: sha(all) });
}
const wholeBible = [...bookText.values()].join(' ');
const whole = wholeBible.toLowerCase();

const prompts: DeepPrompt[] = [];
const sourceNotes: { id: string; from: string; rule: string }[] = [];
const finish = (id: string, theme: DeepTheme, prompt: string, context: string, source: string, entries: { name: string; aliases: string[]; score: number }[], rule: string, minAnswers = 12) => {
  // one answer per name: the best score wins, aliases are pooled
  const byName = new Map<string, { name: string; aliases: Set<string>; score: number }>();
  for (const e0 of entries) {
    // "Egypt's" is Egypt; "Sidon the Great" and "Great Sidon" are one name. Answers are merged by their comparison form.
    const e = { ...e0, name: e0.name.replace(/['’]s$/, '') };
    const k = deepTokens(e.name).join(' ');
    const cur = byName.get(k);
    if (cur) { cur.score = Math.max(cur.score, e.score); e.aliases.forEach((a) => cur.aliases.add(a)); } else byName.set(k, { name: e.name, aliases: new Set(e.aliases), score: e.score });
  }
  const list = [...byName.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  if (list.length < minAnswers) { console.log(`skip ${id}: only ${list.length} answers`); return; }
  const tiers = tiersByFamiliarity(list.map((l) => l.score));
  const answers: DeepAnswer[] = list.map((l, i) => {
    const o = overrides.find((x) => x.prompt === id && x.answer.toLowerCase() === l.name.toLowerCase());
    const aliases = [...l.aliases].filter((a) => a.toLowerCase() !== l.name.toLowerCase());
    return { answer: l.name, tier: o ? o.tier : tiers[i], ...(aliases.length ? { aliases } : {}) };
  });
  // an override can lift an answer out of the band its score earned; the list is presented in tier order
  // (the sort is stable, so answers keep their score order inside a tier)
  answers.sort((a, b) => a.tier - b.tier);
  prompts.push({ id, theme, prompt, context, source, answers });
  sourceNotes.push({ id, from: source, rule });
};

/* ---------- 1. places, by book ---------- */
{
  const places = JSON.parse(track('public/data/maps/places.json')) as { n: string; c?: string; nv: number }[];
  const bySlot = (i: number) => places[i];
  const bookDir = 'public/data/maps/by-book/';
  for (const f of readdirSync(ROOT + bookDir).filter((x) => x.endsWith('.json')).sort()) {
    const b = f.replace('.json', '');
    const bn = BOOK_NAMES[b];
    if (!bn) continue;
    // [chapter, verse, place index] for every verse of the book that names a place
    const triples = JSON.parse(track(bookDir + f)) as [number, number, number][];
    const verses = new Map<number, number>();
    for (const t of triples) verses.set(t[2], (verses.get(t[2]) ?? 0) + 1);
    const found: { name: string; aliases: string[]; score: number }[] = [];
    for (const [idx, inBook] of verses) {
      const p = bySlot(idx);
      if (!p) continue;
      // names carry a disambiguation number ("Antioch 1", "Antioch 2"); the answer is the name and the number is dropped
      const rawName = p.n.replace(/\s+\d+(?::\d+)?$/, '').trim();
      // Basilion review (issue 26): spelling variants of one place (Beth-shan, Kiriath-arim, Hazar-susim, Mount Moriah, Bethlehem Ephrathah)
      // are one answer, scored under the canonical name with the variant as an accepted form
      const PLACE_VARIANT_OF: Record<string, string> = { 'Beth-shan': 'Beth-shean', 'Kiriath-arim': 'Kiriath-jearim', 'Hazar-susim': 'Hazar-susah', 'Mount Moriah': 'Moriah', 'Bethlehem Ephrathah': 'Bethlehem' };
      const name = PLACE_VARIANT_OF[rawName] ?? rawName;
      if (name.length < 3 || /[^A-Za-z '\-.]/.test(name)) continue;
      const now = p.c && /^Now /.test(p.c) ? p.c.replace(/^Now /, '').replace(/[.]$/, '').trim() : '';
      const aliases = [...(now.length >= 3 && !/[^A-Za-z '\-.]/.test(now) ? [now] : []), ...(PLACE_VARIANT_OF[rawName] ? [rawName] : [])];
      found.push({ name, aliases, score: Math.log(1 + p.nv) + 1.5 * Math.log(1 + inBook) });
    }
    if (found.length < 20) continue;
    // the count in the note is the number of answers actually scored, after finish() merges names that share a comparison form
    const answerCount = new Set(found.map((x) => deepTokens(x.name.replace(/['’]s$/, '')).join(' '))).size;
    finish(`places-${b}`, 'places', `Name a place mentioned in ${bn}.`,
      `Scripture names towns, regions, rivers and mountains. This list has the ${answerCount} places the app's map data finds in ${bn}; it is long but may not be complete.`,
      'maps/places.json and maps/by-book (OpenBible geocoding, as shipped in the app\'s maps)', found,
      'places the app\'s own maps list for the book (by-book triples); tier ranks log(1+verses naming the place in the whole Bible) + 1.5 log(1+verses naming it in this book)');
  }
}

/* ---------- 2. people of the Bible ---------- */
{
  const names = [...WHO_AM_I, ...WHO_AM_I_2].map((w) => w.name);
  inputs.push({ path: 'src/data/whoami.ts + src/data/whoami2.ts (names)', sha256: sha(names.join('\n')) });
  finish('bible-people', 'people', 'Name a person in the Bible.', 'The Bible names hundreds of people, from the first man to the last apostle. This list is long but not complete.', 'the app\'s Who Am I game lists',
    names.map((n) => ({ name: n, aliases: [], score: Math.log(1 + countMentions(whole, n)) })),
    'names from the Who Am I game; tier ranks log(1+mentions in the WEB-C Bible)');
}

/* ---------- 3. saints ---------- */
{
  interface S { name: string; aliases: string[]; score: number; month?: number; desc: string }
  const saints: S[] = [];
  const modern: Record<string, string> = { Jerom: 'Jerome', Lewis: 'Louis', Catharine: 'Catherine', 'Francis of Assisium': 'Francis of Assisi', 'Thomas of Aquino': 'Thomas Aquinas', 'Catharine of Sienna': 'Catherine of Siena', 'Catharine de Ricci': 'Catherine de Ricci', 'Thomas Ov Villanova': 'Thomas of Villanova', 'Gregory Vii': 'Gregory VII' };
  // Basilion review (issue 26): these headings are garbled by the Butler OCR (Will Kd, Rom Ark', Die Ob Deodatus, Kilian Bishop)
  // or are fragments of a longer heading (Chef, Cloud, Gal), and parse into entries that are not a saint's name.
  // The saints themselves stand in the lists under their clean headings (Willehad, Gall), so the garbled entries are dropped.
  const EXCLUDED_SAINT_NAMES = new Set(['Will Kd', 'Chef', 'Cloud', 'Gal', 'Die Ob Deodatus', "Rom Ark'", 'Kilian Bishop']);
  // Basilion review (issue 26): Peter of Luxemburg and John Columbini are Blesseds, not canonized saints, in a saints list
  for (const n of ['Peter of Luxemburg', 'John Columbini']) EXCLUDED_SAINT_NAMES.add(n);
  // Basilion review (issue 26): two names for one saint are one answer, scored under the first listed form with the variant accepted
  const SAINT_VARIANT_OF: Record<string, string> = { 'Antony of Padua': 'Anthony of Padua', 'Ephrem of Edessa': 'Ephrem', 'Mary Magdalen': 'Mary Magdalene', 'Vincent of Paul': 'Vincent de Paul', 'Isidore of Madrid': 'Isidore the Farmer', Canut: 'Canutus' };
  // Basilion review (issue 26): Butler's place spellings in the "of Place" aliases, corrected
  const SAINT_ALIAS_CORRECTIONS: Record<string, string> = { 'Catharine of Sienna': 'Catharine of Siena', 'Fidelis of Sigmarengen': 'Fidelis of Sigmaringen', 'Kentigern of Glasco': 'Kentigern of Glasgow', 'Rupert of Saltzbourg': 'Rupert of Salzburg', 'Virgil of Saltzburg': 'Virgil of Salzburg', 'Willibald of Aichstadt': 'Willibald of Eichstätt', 'Ulric of Ausburg': 'Ulric of Augsburg', 'Corbinian of Frisingen': 'Corbinian of Freising', 'Burckard of Wurtzburg': 'Burckard of Würzburg', 'Eleutherius of Tournay': 'Eleutherius of Tournai', 'Piat of Tournay': 'Piat of Tournai', 'Hugh of Cluni': 'Hugh of Cluny', 'Odo of Cluni': 'Odo of Cluny', 'Odilo of Cluni': 'Odilo of Cluny', 'Maieul of Cluni': 'Maieul of Cluny', 'Amand of Bourdeaux': 'Amand of Bordeaux', 'Memmius of Chalons': 'Memmius of Châlons', 'Poppo of Stavelo': 'Poppo of Stavelot' };
  // Basilion review (issue 26): Irenaeus of Lyons is the scored saint; Irenaeus of Sirmium is a different saint and not his alias
  const SAINT_ALIAS_DROPS = new Set(['Irenaeus of Sirmium']);
  // a corrected form whose Butler spelling is an OCR garble rather than a real spelling is not kept as an alias
  const NO_RAW_ALIAS = new Set(['Thomas Ov Villanova']);
  const dir = 'public/data/saints/butler/';
  for (const f of readdirSync(ROOT + dir).filter((x) => /^\d\d\.json$/.test(x)).sort()) {
    const x = JSON.parse(track(dir + f)) as { month: string; days: Record<string, { heading: string; text: string[] }[]> };
    for (const arr of Object.values(x.days)) for (const e of arr) {
      // the OCR keeps the hyphen of a word broken across lines (CANTER- BURY, LINDIS- FARNE); join the word again
      // (a fragment of at least two letters: a lone initial before the hyphen, as in "C- ARCHBISHOP", is not a broken word)
      const h = e.heading.replace(/\.$/, '').trim().replace(/([A-Z][A-Z])-\s+([A-Z])/g, '$1$2');
      const m = /^(?:SAINTS?|SS?\.|ST\.|S\.)\s*([A-Z][A-Z'’\- ]+?)(?:,\s*(.*))?$/.exec(h);
      if (!m) continue;
      const base = m[1].trim();
      if (/ AND | OR |\bII+\b/.test(base) || base.split(' ').length > 4 || !/^[A-Z'’\- ]+$/.test(base)) continue;
      const body = e.text.join(' ');
      const words = body.split(/\s+/).length;
      const first = base.split(' ')[0].replace(/[^A-Za-z]/g, '');
      const hits = (body.match(new RegExp(first, 'gi')) ?? []).length;
      // an OCR slip in a heading does not recur in the entry's own text, so a name must appear several times there
      if (first.length < 3 || hits < 3 || words < 150) continue;
      const nm = title(base);
      const desc = (m[2] ?? '').toUpperCase();
      const ofPlace = /\bOF ([A-Z][A-Z'’\- ]+?)(?:,|$)/.exec(desc);
      // an alias "X of Place" is kept only if the place recurs in the entry text (an OCR slip in a heading does not)
      const placeWord = ofPlace?.[1].split(' ')[0].replace(/[^A-Za-z]/g, '') ?? '';
      const placeOk = !!ofPlace && placeWord.length >= 4 && (body.match(new RegExp(placeWord, 'gi')) ?? []).length >= 2;
      // an "of Place" alias that only repeats a word of the name itself (John Capistran of Capistran) adds nothing and is dropped
      const placeWords = ofPlace ? title(ofPlace[1]).toLowerCase().split(' ') : [];
      const aliases = ofPlace && placeOk && !/\b(THE|HIS|HER|ALL|OUR)\b/.test(ofPlace[1]) && ofPlace[1].split(' ').length <= 2 && !placeWords.some((w) => nm.toLowerCase().split(' ').includes(w)) ? [`${modern[nm] ?? nm} of ${title(ofPlace[1])}`] : [];
      if (!EXCLUDED_SAINT_NAMES.has(modern[nm] ?? nm)) saints.push({ name: modern[nm] ?? nm, aliases: [...aliases, ...(modern[nm] && !NO_RAW_ALIAS.has(nm) ? [nm] : [])], score: Math.log(1 + words), month: +x.month, desc });
    }
  }
  inputs.push({ path: 'src/data/confirmationSaints.ts (names, feasts)', sha256: sha(NAME_SAINTS.map((n) => `${n.name}|${n.feast}`).join('\n')) });
  const CURATED_BONUS = 4; // a saint on the app's own list of well-known saints is at least this familiar
  for (const n of NAME_SAINTS) {
    const month = +n.feast.slice(0, 2);
    const known = saints.find((s) => s.name.toLowerCase() === n.name.replace(/\s*\(.*\)\s*$/, '').toLowerCase());
    if (known) { known.score += CURATED_BONUS; known.month ??= month; continue; }
    // "Teresa Benedicta of the Cross (Edith Stein)": the name and, in brackets, another name for the same saint
    const paren = /^(.*?)\s*\((.*)\)\s*$/.exec(n.name);
    saints.push({ name: paren ? paren[1] : n.name, aliases: paren ? [paren[2]] : [], score: Math.log(8000) + CURATED_BONUS * 0.25, month, desc: '' });
  }
  // merge the variant spellings into their canonical saint before any list is built from the array
  {
    const byName = new Map(saints.map((s) => [s.name, s] as const));
    for (const [variant, canonical] of Object.entries(SAINT_VARIANT_OF)) {
      const v = byName.get(variant), c = byName.get(canonical);
      if (v && c) { if (!c.aliases.includes(variant)) c.aliases.push(variant); for (const a of v.aliases) if (!c.aliases.includes(a)) c.aliases.push(a); c.score = Math.max(c.score, v.score); saints.splice(saints.indexOf(v), 1); }
      else if (v) { v.aliases.push(v.name); v.name = canonical; }
    }
  }
  const SAINT_ALIAS_ADDITIONS: Record<string, string> = { 'Eucherius of Orleans': 'Eucherius of Orléans', 'Anian of Orleans': 'Anian of Orléans' };
  const to = (s: S) => { const aliases = s.aliases.map((a) => SAINT_ALIAS_CORRECTIONS[a] ?? a).filter((a) => !SAINT_ALIAS_DROPS.has(a)); for (const a of [...aliases]) if (SAINT_ALIAS_ADDITIONS[a] && !aliases.includes(SAINT_ALIAS_ADDITIONS[a])) aliases.push(SAINT_ALIAS_ADDITIONS[a]); return { name: s.name, aliases, score: s.score }; };
  const src = 'Butler\'s Lives of the Saints (1903 edition, Project Gutenberg #20450) as shipped in public/data/saints/butler, and the app\'s own list of well-known saints';
  const rule = 'names parsed from Butler entry headings; accepted only if the name recurs at least 3 times in the entry text and the entry has 150 or more words; tier ranks log(1+entry words), plus a bonus for the app\'s list of well-known saints';
  finish('saints-any', 'saints', 'Name a saint.', 'Thousands of saints are honoured across the Church year. This list follows Butler\'s Lives of the Saints and the app\'s own saints; it is long but not complete.', src, saints.map(to), rule, 40);
  for (let m = 1; m <= 12; m++) {
    finish(`saints-${String(m).padStart(2, '0')}`, 'saints', `Name a saint whose feast falls in ${MONTHS[m - 1]}.`, `Dates follow Butler's Lives of the Saints and the app's own saints, so a modern calendar may differ for a few days. This list is long but not complete.`, src,
      saints.filter((s) => s.month === m).map(to), rule + '; filtered by the month of the feast', 20);
  }
  const KINDS: [string, string, RegExp][] = [
    ['martyr', 'Name a saint who was a martyr.', /\bMARTYRS?\b/], ['bishop', 'Name a saint who was a bishop.', /\b(BISHOP|ARCHBISHOP)\b/], ['abbot', 'Name a saint who was an abbot or abbess.', /\b(ABBOT|ABBESS)\b/],
    ['virgin', 'Name a saint who was a virgin.', /\bVIRGIN\b/], ['widow', 'Name a saint who was a widow.', /\bWIDOW\b/], ['hermit', 'Name a saint who was a hermit or an anchoret.', /\b(HERMIT|ANCHORET)\b/], ['pope', 'Name a saint who was a pope.', /\bPOPE\b/],
  ];
  for (const [id, q, re] of KINDS) {
    finish(`saints-${id}`, 'saints', q, 'The headings in Butler\'s Lives of the Saints name each saint\'s state or office. This list is long but not complete.', src, saints.filter((s) => re.test(s.desc)).map(to), rule + `; filtered by the heading naming the state or office (${re.source})`, 25);
  }
  // by the first letter of the name (a letter with fewer than 20 saints is pooled with the other short letters)
  const letters = [...new Set(saints.map((x) => x.name[0].toUpperCase()))].filter((c) => /[A-Z]/.test(c)).sort();
  const ofLetter = (c: string) => saints.filter((x) => x.name[0].toUpperCase() === c);
  const uniqS = (c: string) => new Set(ofLetter(c).map((x) => deepTokens(x.name).join(' '))).size;
  const shortLetters = letters.filter((c) => uniqS(c) < 20);
  for (const c of letters.filter((x) => !shortLetters.includes(x))) {
    finish(`saints-letter-${c}`, 'saints', `Name a saint whose name begins with ${c}.`, 'Thousands of saints are honoured across the Church year. This list follows Butler\'s Lives of the Saints and the app\'s own saints; it is long but not complete.', src, ofLetter(c).map(to), rule + '; filtered by the first letter of the name', 20);
  }
  // the short letters are pooled in as few questions as keep each at about 50 answers
  const pools: string[][] = [];
  let cur: string[] = []; let curN = 0;
  for (const c of shortLetters) { cur.push(c); curN += uniqS(c); if (curN >= 50) { pools.push(cur); cur = []; curN = 0; } }
  if (cur.length) { if (pools.length && curN < 12) pools[pools.length - 1].push(...cur); else pools.push(cur); }
  for (const pool of pools) {
    const lab = pool.length > 1 ? pool.slice(0, -1).join(', ') + ' or ' + pool[pool.length - 1] : pool[0];
    finish(`saints-letter-${pool.join('')}`, 'saints', `Name a saint whose name begins with ${lab}.`, 'These are the less common first letters of saints\' names. This list follows Butler\'s Lives of the Saints and the app\'s own saints; it is long but not complete.', src, pool.flatMap(ofLetter).map(to), rule + '; filtered by first letter, short letters pooled', 12);
  }

}

/* ---------- 4. people of the Bible, by initial and by role (STEPBible TIPNR names, CC BY 4.0) ---------- */
{
  interface N { name: string; kind: string; type?: string; meaning?: string }
  const stepDir = 'public/data/reference/step/';
  const people: N[] = [];
  // Basilion review (issue 26): variant spellings of one person (Jerimoth, Joiada, Joiarib, Nethanel, Shimon, Beerah, Beraiah,
  // Aridatha, Hizki, Hizkiah, Sallu, Mattattah, Shammah) are one answer, scored under the first listed form with the variant accepted
  const PEOPLE_VARIANT_OF: Record<string, string> = { Jerimoth: 'Jeremoth', Joiada: 'Jehoiada', Joiarib: 'Jehoiarib', Nethanel: 'Neriah', Shimon: 'Shimeon', Beerah: 'Beera', Beraiah: 'Bera', Aridatha: 'Aridai', Hizki: 'Jehizkiah', Hizkiah: 'Jehizkiah', Sallu: 'Sallai', Mattattah: 'Mattatha', Shammah: 'Shamma' };
  const PEOPLE_ALIASES: Record<string, string[]> = {};
  for (const [v, c] of Object.entries(PEOPLE_VARIANT_OF)) (PEOPLE_ALIASES[c] ??= []).push(v);
  for (const f of readdirSync(ROOT + stepDir).filter((x) => /^names-\d+\.json$/.test(x)).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)))) {
    // Azariahu is STEPBible's variant form of Azariah, one man listed twice; the Basilion review (issue 26) keeps the Azariah entry only
    for (const e of JSON.parse(track(stepDir + f)) as N[]) if (e.kind === 'person' && e.name !== 'Azariahu' && !(e.name in PEOPLE_VARIANT_OF) && /^[A-Z][A-Za-z'\- ]{2,}$/.test(e.name)) people.push(e);
  }
  const src = 'STEP Bible (Tyndale House Cambridge) TIPNR names, CC BY 4.0, as shipped in public/data/reference/step; the one-line meanings are machine-written by STEPBible and are only used to sort names into roles';
  const scoreOf = (n: string) => Math.log(1 + countMentions(whole, n));
  const entryOf = (n: N) => ({ name: n.name, aliases: [...(PEOPLE_ALIASES[n.name] ?? [])], score: scoreOf(n.name) });
  const initials = [...new Set(people.map((x) => x.name[0]))].sort();
  // a letter with fewer than 20 names is pooled with the other short letters into one question
  const byLetter = new Map(initials.map((ch) => [ch, people.filter((x) => x.name[0] === ch)] as const));
  const uniq = (ch: string) => new Set(byLetter.get(ch)!.map((x) => deepTokens(x.name).join(' '))).size;
  const rare = initials.filter((ch) => uniq(ch) < 20);
  for (const ch of initials.filter((c) => !rare.includes(c))) {
    finish(`people-${ch}`, 'people', `Name a person in the Bible whose name begins with ${ch}.`, 'The Bible names thousands of people, many only once. This list follows STEPBible\'s name list; it is long but may not be complete.', src,
      byLetter.get(ch)!.map(entryOf), 'person names from the STEPBible TIPNR list filtered by first letter; tier ranks log(1+mentions in the WEB-C Bible)', 20);
  }
  if (rare.length) {
    const label = rare.length > 1 ? rare.slice(0, -1).join(', ') + ' or ' + rare[rare.length - 1] : rare[0];
    finish(`people-${rare.join('')}`, 'people', `Name a person in the Bible whose name begins with ${label}.`, 'These are the less common first letters of Bible names. This list follows STEPBible\'s name list; it is long but may not be complete.', src,
      rare.flatMap((ch) => byLetter.get(ch)!).map(entryOf), 'person names from the STEPBible TIPNR list filtered by first letter, the letters with fewer than 20 names pooled; tier ranks log(1+mentions in the WEB-C Bible)', 12);
  }
  // Roles such as "king" or "prophet" are not generated: STEPBible's one-line meanings describe namesakes as well as the famous bearer of a name (a prophet Ahab, a king Ishmael), and
  // leave out well-known kings, so a role list built from them would accept and reject the wrong answers. Only the objective field (Female) is used.
  // Basilion review (issue 26): Lappidoth, Jahdai, Gibea, Machbenah, Aramitess and Hodiah stand in STEPBible's Female sort but are
  // a husband, a male descendant, two places in "father of" constructions, a gentilic and a husband; they are not women
  const NOT_WOMEN = new Set(['Lappidoth', 'Jahdai', 'Gibea', 'Machbenah', 'Aramitess', 'Hodiah']);
  finish('roles-women', 'people', 'Name a woman in the Bible.', 'The Bible names many women, from the first generations to the women at the tomb. This list follows STEPBible\'s name list; it is long but not complete.', src,
    people.filter((x) => x.type === 'Female' && !NOT_WOMEN.has(x.name) && x.name !== 'Shelomoth').map((x) => x.name === 'Shelomith' ? { ...entryOf(x), aliases: [...entryOf(x).aliases, 'Shelomoth'] } : entryOf(x)), 'names STEPBible marks Female; tier ranks log(1+mentions in the WEB-C Bible)', 12);
}

/* ---------- write ---------- */
// one prompt per line: compact for the bundle, and a change to one prompt is one changed line in a diff
const out = '[\n' + prompts.map((p) => JSON.stringify(p)).join(',\n') + '\n]\n';
const srcOut = JSON.stringify({
  about: 'Where each generated Deep Waters question comes from. `inputs` are the data files it was built from; if one changes, `npx tsx scripts/deepwaters/build.ts` must be run and its output reviewed.',
  inputs: inputs.sort((a, b) => a.path.localeCompare(b.path)),
  prompts: sourceNotes,
}, null, 1) + '\n';
const files: [string, string][] = [['src/data/deepWaters.generated.json', out], ['src/data/deepWaters.sources.json', srcOut]];
if (process.argv.includes('--check')) {
  const stale = files.filter(([p, t]) => !existsSync(ROOT + p) || read(p) !== t).map(([p]) => p);
  if (stale.length) { console.error('Out of date: ' + stale.join(', ') + '\nRun: npx tsx scripts/deepwaters/build.ts'); process.exit(1); }
  console.log('deep waters data is up to date');
} else {
  for (const [p, t] of files) writeFileSync(ROOT + p, t);
  console.log(`wrote ${prompts.length} prompts, ${prompts.reduce((n, p) => n + p.answers.length, 0)} answers`);
  for (const p of prompts) console.log(`  ${p.id.padEnd(16)} ${String(p.answers.length).padStart(4)}  ${p.prompt}`);
}
