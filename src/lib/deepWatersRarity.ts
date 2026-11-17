import type { DeepTier } from '../data/deepWaters';

/**
 * Turning a familiarity score into a rarity tier.
 *
 * The original game ranks answers with a familiarity database, then a person checks the result. Here the scores are counts the app can measure from its own
 * data (how often a name appears in the Bible text, how long its entry is in a reference work, whether it is on a curated list). Within one question the
 * answers are ranked by score and cut into five bands, so every question has easy answers and deep cuts whatever its size. A person's override beats the rank.
 */
export const TIER_CUTS = [0.08, 0.2, 0.4, 0.65, 0.9] as const; // top 8% tier 1, then 12%, 20%, 25%, 25%, and the last 10% tier 6

/** Higher score = more familiar. Equal scores always get the same tier (a tie is never split by input order, and a group takes the band of its worst-ranked member). */
export function tiersByFamiliarity(scores: number[]): DeepTier[] {
  const n = scores.length;
  if (!n) return [];
  const order = scores.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const tiers = new Array<DeepTier>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && order[j + 1][0] === order[i][0]) j++;
    // a group of ties lands in one band, set by its worst-ranked member: a large group of equally obscure answers must be deep cuts, not middling
    const mid = j / n;
    const tier = (mid < TIER_CUTS[0] ? 1 : mid < TIER_CUTS[1] ? 2 : mid < TIER_CUTS[2] ? 3 : mid < TIER_CUTS[3] ? 4 : mid < TIER_CUTS[4] ? 5 : 6) as DeepTier;
    for (let k = i; k <= j; k++) tiers[order[k][1]] = tier;
    i = j + 1;
  }
  return tiers;
}

/** Count whole-word, case-insensitive occurrences of `name` in `haystack` (already lower case). */
export function countMentions(haystack: string, name: string): number {
  const needle = name.toLowerCase().replace(/[^a-z0-9' ]/g, '').trim();
  if (needle.length < 3) return 0;
  let n = 0, at = 0;
  const isWord = (c: string | undefined) => !!c && /[a-z0-9]/.test(c);
  for (;;) {
    at = haystack.indexOf(needle, at);
    if (at < 0) return n;
    if (!isWord(haystack[at - 1]) && !isWord(haystack[at + needle.length])) n++;
    at += needle.length;
  }
}
