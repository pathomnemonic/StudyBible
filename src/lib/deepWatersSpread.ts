/* Pure (types only): the data files use it, so it must not import from them at run time. */
import type { DeepAnswer, DeepPrompt } from '../data/deepWaters';

/**
 * Spreads a list's answers over all six scores by rank, keeping the order the authors gave them (rarer stays rarer). Hand-set tiers left most lists without a top score
 * and bunched the rest; this gives every open list its easy, middling and rare answers. Lists with a fixed set of answers are left alone.
 */
const BAND_EDGES = [0.3, 0.52, 0.72, 0.86, 0.95, 1];
export function spreadTiers<T extends DeepPrompt>(prompt: T): T {
  const n = prompt.answers.length;
  if (prompt.closed || n < 3) return prompt;
  // a list whose tiers already reach the top and cover most of the scale (or were calibrated from a measured source) is left exactly as it is
  const used = new Set(prompt.answers.map((a) => a.tier));
  if (prompt.source || (used.has(6) && used.size >= 5)) return prompt;
  const order = prompt.answers.map((a, i) => ({ a, i })).sort((x, y) => x.a.tier - y.a.tier || x.i - y.i);
  const tierOf = new Map<DeepAnswer, DeepAnswer['tier']>();
  order.forEach(({ a }, r) => {
    const q = (r + 0.5) / n;
    let t = (BAND_EDGES.findIndex((e) => q <= e) + 1) as DeepAnswer['tier'];
    if (r === n - 1) t = 6; else if (r === n - 2 && n >= 5 && t < 5) t = 5;
    tierOf.set(a, t);
  });
  return { ...prompt, answers: prompt.answers.map((a) => ({ ...a, tier: tierOf.get(a)! })) };
}
