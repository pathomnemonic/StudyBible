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

interface Override { prompt: string; answer: string; tier: 1 | 2 | 3 | 4 | 5; reason: string }
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
      const name = p.n.replace(/\s+\d+(?::\d+)?$/, '').trim();
      if (name.length < 3 || /[^A-Za-z '\-.]/.test(name)) continue;
      const now = p.c && /^Now /.test(p.c) ? p.c.replace(/^Now /, '').replace(/[.]$/, '').trim() : '';
      const aliases = now.length >= 3 && !/[^A-Za-z '\-.]/.test(now) ? [now] : [];
      found.push({ name, aliases, score: Math.log(1 + p.nv) + 1.5 * Math.log(1 + inBook) });
    }
    if (found.length < 20) continue;
    finish(`places-${b}`, 'places', `Name a place mentioned in ${bn}.`,
      `Scripture names towns, regions, rivers and mountains. This list has the ${new Set(found.map((x) => x.name)).size} places the app's map data finds in ${bn}; it is long but may not be complete.`,
      'maps/places.json and maps/by-book (OpenBible geocoding, as shipped in the app\'s maps)', found,
      'places the app\'s own maps list for the book (by-book triples); tier ranks log(1+verses naming the place in the whole Bible) + 1.5 log(1+verses naming it in this book)');
  }
}

/* ---------- 2. people of the Bible ---------- */
{
  const names = [...WHO_AM_I, ...WHO_AM_I_2].map((w) => w.name);
  inputs.push({ path: 'src/data/whoami.ts + src/data/whoami2.ts (names)', sha256: sha(names.join('\n')) });
  finish('bible-people', 'scripture', 'Name a person in the Bible.', 'The Bible names hundreds of people, from the first man to the last apostle. This list is long but not complete.', 'the app\'s Who Am I game lists',
    names.map((n) => ({ name: n, aliases: [], score: Math.log(1 + countMentions(whole, n)) })),
    'names from the Who Am I game; tier ranks log(1+mentions in the WEB-C Bible)');
}

/* ---------- 3. saints ---------- */
{
  interface S { name: string; aliases: string[]; score: number; month?: number; desc: string }
  const saints: S[] = [];
  const modern: Record<string, string> = { Jerom: 'Jerome', Lewis: 'Louis', Catharine: 'Catherine', 'Francis of Assisium': 'Francis of Assisi', 'Thomas of Aquino': 'Thomas Aquinas' };
  const dir = 'public/data/saints/butler/';
  for (const f of readdirSync(ROOT + dir).filter((x) => /^\d\d\.json$/.test(x)).sort()) {
    const x = JSON.parse(track(dir + f)) as { month: string; days: Record<string, { heading: string; text: string[] }[]> };
    for (const arr of Object.values(x.days)) for (const e of arr) {
      const h = e.heading.replace(/\.$/, '').trim();
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
      const aliases = ofPlace && placeOk && !/\b(THE|HIS|HER|ALL|OUR)\b/.test(ofPlace[1]) && ofPlace[1].split(' ').length <= 2 ? [`${modern[nm] ?? nm} of ${title(ofPlace[1])}`] : [];
      saints.push({ name: modern[nm] ?? nm, aliases: [...aliases, ...(modern[nm] ? [nm] : [])], score: Math.log(1 + words), month: +x.month, desc });
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
  const to = (s: S) => ({ name: s.name, aliases: s.aliases, score: s.score });
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
