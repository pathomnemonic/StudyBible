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

/** A scene sound for particular chapters (anchor numbering): the sea of Galilee, the desert, a night watch, a burning fire… */
const SCENES: [string, number, number, 'sea' | 'desert' | 'night' | 'fire' | 'thunder' | 'pasture' | 'crowd' | 'rain'][] = [
  ['MAT', 4, 4, 'sea'], ['MAT', 8, 8, 'sea'], ['MAT', 13, 14, 'sea'], ['MRK', 1, 1, 'sea'], ['MRK', 4, 6, 'sea'], ['LUK', 5, 5, 'sea'], ['LUK', 8, 8, 'sea'], ['JHN', 6, 6, 'sea'], ['JHN', 21, 21, 'sea'], ['JON', 1, 2, 'sea'], ['EXO', 14, 15, 'sea'], ['ACT', 27, 27, 'sea'],
  ['EXO', 1, 13, 'desert'], ['EXO', 16, 18, 'desert'], ['EXO', 32, 34, 'desert'], ['NUM', 1, 36, 'desert'], ['DEU', 1, 34, 'desert'], ['MAT', 3, 3, 'desert'], ['1KI', 19, 19, 'desert'],
  ['LUK', 2, 2, 'night'], ['JHN', 3, 3, 'night'], ['MAT', 26, 26, 'night'], ['PSA', 3, 4, 'night'], ['PSA', 90, 90, 'night'], ['PSA', 120, 120, 'night'], ['PSA', 133, 133, 'night'], ['GEN', 28, 28, 'night'],
  ['EXO', 3, 3, 'fire'], ['ACT', 2, 2, 'fire'], ['LEV', 9, 10, 'fire'], ['1KI', 18, 18, 'fire'], ['ISA', 6, 6, 'fire'], ['DAN', 3, 3, 'fire'],
  ['JOB', 38, 41, 'thunder'], ['PSA', 28, 28, 'thunder'], ['EXO', 19, 20, 'thunder'], ['REV', 4, 8, 'thunder'],
  ['PSA', 22, 22, 'pasture'], ['JHN', 10, 10, 'pasture'], ['EZK', 34, 34, 'pasture'], ['LUK', 15, 15, 'pasture'],
  ['ACT', 17, 19, 'crowd'], ['MRK', 11, 11, 'crowd'], ['JHN', 12, 12, 'crowd'], ['LUK', 19, 19, 'crowd'],
  ['GEN', 6, 8, 'rain'],
];
export function passageSound(book: string, chapter: number) {
  return SCENES.find(([b, a, z]) => b === book && chapter >= a && chapter <= z)?.[3] ?? null;
}
