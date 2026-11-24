// What a day of social posts is made from, taken only from the app's own data. Nothing here writes new religious text:
// the verse is the Douay-Rheims (public domain), the Mass readings are citations only (the lectionary text is copyrighted), the Catechism and Father lines are quotes.
import { readFileSync, existsSync } from 'node:fs';
import { liturgicalDay, parseIso, adventStart, addDays, iso } from '../../src/liturgy/compute';
import { pickDaily, dailyRef } from '../../src/study/dailyPick';
import type { DailyFile } from '../../src/study/dailyTypes';
import { formatRef, type Ref } from '../../src/lib/refs';
import { loadVersification } from '../../src/lib/versification';
import { ADVENT_EVE, ADVENT_REFS, ADVENT_WALK } from '../../src/plans/adventRefs';
import { dailyDeepPrompts } from '../../src/lib/deepWaters';
import { FEAST_FATHERS } from '../../src/data/feastFathers';
import { FEASTS } from '../../src/data/feasts';
import { cccParagraphs, trimVerses } from '../../src/lib/dayCard/content';

const DATA = new URL('../../public/data/', import.meta.url).pathname;
const readJson = <T>(p: string): T | null => (existsSync(DATA + p) ? (JSON.parse(readFileSync(DATA + p, 'utf8')) as T) : null);

let ready = false;
function init() {
  if (ready) return;
  const v = readJson<any>('versification.json');
  if (v) loadVersification(v);
  ready = true;
}

export { MAX_VERSE_CHARS, fixSmallCaps } from '../../src/lib/dayCard/content';

export interface VerseCard { label: string; translation: 'Douay-Rheims'; text: string; verses: string; trimmed: boolean }

const dra = new Map<string, any>();
const draBook = (book: string) => { if (!dra.has(book)) dra.set(book, readJson<any>(`bible/dra/${book}.json`)); return dra.get(book); };

/** Verse text from the Douay-Rheims for an anchor (Vulgate-numbered) reference. A passage is cut at a whole verse when it is too long for a card. */
export function douayVerses(r: Ref): { text: string; first: number; last: number; trimmed: boolean } | null {
  const b = draBook(r.book);
  if (!b || r.c1 !== r.c2) return null; // a card carries one chapter's verses
  const ch = b.chapters.find((c: any) => c.n === r.c1);
  if (!ch) return null;
  const all: [number, string][] = [];
  for (const block of ch.blocks) if (Array.isArray(block[1])) for (const x of block[1]) if (Array.isArray(x) && typeof x[0] === 'number' && typeof x[1] === 'string') all.push([x[0], x[1]]);
  return trimVerses(all, r.v1 ?? 1, r.v2 ?? r.v1 ?? 999);
}

export function verseCard(ref: Ref): VerseCard | null {
  const d = douayVerses(ref);
  if (!d) return null;
  const label = formatRef({ ...ref, v1: d.first, v2: d.last }, { noDual: true });
  return { label, translation: 'Douay-Rheims', text: d.text, verses: `${d.first}${d.last !== d.first ? '-' + d.last : ''}`, trimmed: d.trimmed };
}

/** Catechism paragraphs that quote or cite this verse (from the Catechism's own footnotes), quoting ones first. */
export function cccFor(ref: Ref, max = 3): { n: number; text: string; quotes: boolean }[] {
  const cites = readJson<[number, number, number, number, number, number][]>(`ccc/scripture/${ref.book}.json`);
  const lo = ref.v1 ?? 1, hi = ref.v2 ?? ref.v1 ?? 999;
  const quoting = new Set((cites ?? []).filter((c) => c[0] === ref.c1 && c[2] === ref.c1 && c[3] >= lo && c[1] <= hi && c[5] === 1).map((c) => c[4]));
  return cccParagraphs(cites, ref.c1, ref.v1, ref.v2, max).map((n) => {
    const block = readJson<{ n: number; t: string }[]>(`ccc/p${Math.floor(n / 100)}.json`) ?? [];
    return { n, text: block.find((p) => p.n === n)?.t ?? '', quotes: quoting.has(n) };
  }).filter((p) => p.text);
}

export interface FatherLine { text: string; who: string; work?: string; verified: boolean }

export interface SocialDay {
  date: string;
  liturgical: { name: string; season: string; color: string; rank: string };
  /** citations only: the lectionary wording is copyrighted and is not stored or posted */
  massReadings: { source: string; citations: Record<string, string> } | null;
  dailyWord: { passage: string; verse: VerseCard | null; church: { catechism: { n: number; text: string; quotes: boolean } | null; father: FatherLine | null }; reflectionQuestion: string; needsReview: string[]; saintStatus: 'verified' | 'left-off-unverified' | 'none'; saintNote?: string } | null;
  todaysClimb: { day: number; questions: string[] };
  advent: { day: number; of: number; theme: string | null; passage: string; keyVerse: string | null; catechism: { n: number; text: string; quotes: boolean } | null; verse: VerseCard | null; father: FatherLine | null } | null;
  feastFather: { feast: string; quote: string; author: string; source: string; note: string } | null;
  attribution: string;
}

export const ATTRIBUTION = 'Verse text: Douay-Rheims Bible (public domain). Catechism: Catechism of the Catholic Church (Libreria Editrice Vaticana). Mass reading citations only; lectionary text is not reproduced.';

const dayIndexOf = (d: string) => Math.floor(parseIso(d).getTime() / 864e5); // the same number the game uses for a local calendar day

export function adventDayOf(date: string): number | null {
  const d = parseIso(date);
  const start = adventStart(d.getUTCFullYear());
  const n = Math.round((d.getTime() - start.getTime()) / 864e5) + 1;
  const end = new Date(Date.UTC(d.getUTCFullYear(), 11, 24));
  return n >= 1 && d.getTime() <= end.getTime() ? n : null;
}
export const adventLength = (year: number) => Math.round((Date.UTC(year, 11, 24) - adventStart(year).getTime()) / 864e5) + 1;

/** Parse "Isaiah 45:8", "ISA.45.8" or "ISA.2.1-5"; a modern-numbered reference is converted to the Douay (Vulgate) numbering or reported. */
function toAnchor(text: string): Ref | null {
  init();
  const fake = { ref: text, saint: { text: '', who: '' }, q: '' };
  return dailyRef(fake);
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
/** movable feasts are recognised by the name the liturgical calendar gives the day */
const MOVABLE: [string, RegExp][] = [['ash-wednesday', /^Ash Wednesday/], ['baptism-lord', /Baptism of the Lord/], ['palm-sunday', /^Palm Sunday/], ['holy-thursday', /Holy Thursday|Lord.s Supper/], ['good-friday', /^Good Friday/], ['easter', /^Easter Sunday/], ['ascension', /^The Ascension|Ascension of the Lord/], ['pentecost', /^Pentecost Sunday/], ['trinity', /Most Holy Trinity/], ['corpus-christi', /Body and Blood of Christ/], ['christ-king', /King of the Universe/], ['holy-family', /Holy Family/]];
/** the feast with a "From the Fathers" quote that falls on this date, if any */
export function feastOf(date: string, dayName: string) {
  const d = parseIso(date);
  const fixed = FEASTS.find((f) => FEAST_FATHERS[f.id] && new RegExp(`^${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}$`, 'i').test(f.when.trim()));
  if (fixed) return fixed;
  const mv = MOVABLE.find(([, re]) => re.test(dayName));
  return mv ? FEASTS.find((f) => f.id === mv[0] && FEAST_FATHERS[f.id]) ?? null : null;
}

export function buildDay(date: string): SocialDay {
  init();
  const ld = liturgicalDay(parseIso(date), 'usa');
  const daily = readJson<DailyFile>('daily/index.json');
  const entry = daily ? pickDaily(daily, ld) : null;
  const lect = readJson<{ source: string; days: Record<string, { t: string; r: Record<string, string> }> }>(`lectionary/${date.slice(0, 4)}.json`);
  const L = lect?.days[date];

  const review: string[] = [];
  let dailyWord: SocialDay['dailyWord'] = null;
  if (entry) {
    const ref = toAnchor(entry.ref);
    const verse = ref ? verseCard(ref) : null;
    if (!ref) review.push(`could not place "${entry.ref}" in the Douay numbering: write this verse card by hand`);
    else if (!verse) review.push(`no single-chapter Douay verse text for "${entry.ref}"`);
    const ccc = ref ? cccFor(ref)[0] ?? null : null;
    const father: FatherLine | null = { text: entry.saint.text, who: entry.saint.who, work: entry.saint.work, verified: entry.saint.verified === true };
    // an unverified line is handled by a rule, not by a person: it is left off the card (see saintStatus), and its attribution note is already part of the line's `who`
    dailyWord = { passage: ref && verse ? verse.label : entry.ref, verse, church: { catechism: ccc, father }, reflectionQuestion: entry.q, needsReview: review, saintStatus: father.verified ? 'verified' : 'left-off-unverified', saintNote: father.verified ? undefined : entry.saint.misattributed };
  }

  const n = adventDayOf(date);
  let advent: SocialDay['advent'] = null;
  if (n !== null) {
    const y = parseIso(date).getUTCFullYear();
    const walk = n <= ADVENT_WALK.length ? ADVENT_WALK[n - 1] : ADVENT_EVE[n - ADVENT_WALK.length - 1] ?? null;
    const passage: string = n <= ADVENT_REFS.length ? ADVENT_REFS[n - 1] : (walk as { key?: string } | null)?.key ?? '';
    const shown = (walk as { key?: string } | null)?.key ?? passage; // a day with a key verse shows that verse alone
    const ref = shown ? toAnchor(shown) : null;
    const paras = ref ? cccFor(ref, 6) : [];
    advent = { day: n, of: adventLength(y), theme: walk?.theme ?? null, passage, keyVerse: (walk as { key?: string } | null)?.key ?? null, catechism: paras.find((p) => p.text.length <= 340) ?? paras[0] ?? null, verse: ref ? verseCard(ref) : null, father: null }; // the day's Father line belongs to the day's own reading, not to this plan reading, so it is not paired here
  }

  const feast = feastOf(date, ld.dayName);
  const ff = feast ? FEAST_FATHERS[feast.id] : undefined;

  return {
    date,
    liturgical: { name: ld.dayName, season: ld.seasonName ?? ld.season, color: ld.color ?? 'green', rank: ld.rank ?? '' },
    massReadings: L ? { source: lect!.source, citations: L.r } : null,
    dailyWord,
    todaysClimb: { day: dayIndexOf(date), questions: dailyDeepPrompts(dayIndexOf(date)).map((p) => p.prompt) },
    advent,
    feastFather: ff ? { feast: feast!.name, quote: ff.quote, author: ff.author, source: ff.source, note: ff.note } : null,
    attribution: ATTRIBUTION,
  };
}
