/**
 * The line at the foot of every daily card. DEFAULT is the owner's line, kept verbatim. The others rotate with it, a day at a time; ADVENT_ONLY lines
 * join the rotation only on Advent dates. A line may also be chosen by number or given as text for one card. No tagline names a Bible translation
 * (the verse's own citation does that) and none leans on not-for-profit wording: the not-for-profit explanation lives in About, Settings and the tip page.
 */
export const DEFAULT_TAGLINE = 'Download Cathology. The Most Comprehensive Free Catholic Study Bible';
export const TAGLINES: string[] = [
  DEFAULT_TAGLINE,
  'Scripture, the Catechism, and the Church Fathers, all in one free app: Cathology.',
  'Start your morning with Scripture, the saints, and a quiet reflection on Cathology.',
  'Your daily companion for Scripture, saints, and Catholic tradition.',
  'Free forever. No ads. Just Catholic Bible study on Cathology.',
];
export const ADVENT_ONLY: string[] = ['Walk through Advent with daily Scripture, saints, and reflections \u2014 free on Cathology.'];

/** A chosen line (its number in the list, or the text itself), or the one for this date when none is chosen: the owner's line on every other day and the alternates on the days between, in order. */
export function pickTagline(date: string, choice?: number | string | null, opts: { advent?: boolean; list?: string[] } = {}): string {
  const pool = opts.list ?? (opts.advent ? [...TAGLINES, ...ADVENT_ONLY] : TAGLINES);
  if (typeof choice === 'string' && choice.trim()) return choice.trim();
  if (typeof choice === 'number' && pool[choice]) return pool[choice];
  // the default on every other day, the alternates taking the days between in order
  const [first, ...rest] = pool;
  const cycle = rest.flatMap((t) => [first, t]);
  const day = Math.floor(Date.parse(date + 'T00:00:00Z') / 864e5);
  return cycle[((day % cycle.length) + cycle.length) % cycle.length] ?? DEFAULT_TAGLINE;
}
