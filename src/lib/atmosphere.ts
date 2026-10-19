/**
 * Reading atmosphere: a restrained colour and texture identity for each kind of book, with a few passage-level moods
 * (a desert light for the Exodus, a storm sky for Job, dawn for the Resurrection). It only tints the backdrop; the text,
 * its contrast and its size are never changed. Everything here is decoration and can be switched off in Settings.
 */
export type AtmosphereMode = 'off' | 'book' | 'passage';

export type Mood = 'law' | 'history' | 'wisdom' | 'psalms' | 'prophets' | 'gospels' | 'acts' | 'epistles' | 'revelation' | 'storm' | 'dawn' | 'dusk' | 'night' | 'firstlight' | 'pasture' | 'newcreation';

const G = (ids: string, mood: Mood) => Object.fromEntries(ids.split(' ').map((b) => [b, mood]));
const BOOK_MOOD: Record<string, Mood> = {
  ...G('GEN EXO LEV NUM DEU', 'law'),
  ...G('JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH TOB JDT EST 1MA 2MA', 'history'),
  ...G('PRO ECC SNG WIS SIR', 'wisdom'),
  ...G('JOB', 'storm'),
  PSA: 'psalms',
  ...G('ISA JER LAM BAR EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL', 'prophets'),
  ...G('MAT MRK LUK JHN', 'gospels'),
  ACT: 'acts',
  ...G('ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD', 'epistles'),
  REV: 'revelation',
};

/** Passage moods, in the anchor (Vulgate) chapter numbering the reader already uses. [book, firstChapter, lastChapter, mood] */
const PASSAGE_MOOD: [string, number, number, Mood][] = [
  ['GEN', 1, 2, 'firstlight'],
  ['PSA', 22, 22, 'pasture'], // Psalm 23 in the English numbering
  ['MAT', 2, 2, 'night'],
  ['LUK', 2, 2, 'night'],
  ['MAT', 26, 27, 'dusk'],
  ['MRK', 14, 15, 'dusk'],
  ['LUK', 22, 23, 'dusk'],
  ['JHN', 18, 19, 'dusk'],
  ['MAT', 28, 28, 'dawn'],
  ['MRK', 16, 16, 'dawn'],
  ['LUK', 24, 24, 'dawn'],
  ['JHN', 20, 21, 'dawn'],
  ['REV', 21, 22, 'newcreation'],
];

export function atmosphereFor(book: string, chapter: number, mode: AtmosphereMode): Mood | null {
  if (mode === 'off') return null;
  if (mode === 'passage') {
    const hit = PASSAGE_MOOD.find(([b, a, z]) => b === book && chapter >= a && chapter <= z);
    if (hit) return hit[3];
  }
  return BOOK_MOOD[book] ?? null;
}

/** A sound that suits a mood, offered when "match the passage" is on. */
export const MOOD_SOUND: Partial<Record<Mood, 'rain' | 'wind' | 'stream'>> = {
  law: 'wind',
  storm: 'rain',
  prophets: 'wind',
  psalms: 'stream',
  pasture: 'stream',
  wisdom: 'stream',
  dawn: 'wind',
};
