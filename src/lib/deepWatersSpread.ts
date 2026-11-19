/* Pure (types only): the data files use it, so it must not import from them at run time. */
import type { DeepAnswer, DeepPrompt } from '../data/deepWaters';

/**
 * Exactly one answer per open list is worth the top score. If a list has several top-tier answers, the last one (the rarest, in the order the lists are written)
 * keeps it and the others drop to the tier below; if it has none, its rarest answer takes it. Lists with a fixed set of answers are left alone.
 */
export function singleTop<T extends DeepPrompt>(prompt: T): T {
  const n = prompt.answers.length;
  if (prompt.closed || n < 3) return prompt;
  const tops = prompt.answers.map((a, i) => (a.tier === 6 ? i : -1)).filter((i) => i >= 0);
  if (tops.length === 1) return prompt;
  let keep = tops.length ? tops[tops.length - 1] : -1;
  if (keep < 0) { // none yet: the rarest answer (highest tier, and the later one among equals)
    let best = 0;
    prompt.answers.forEach((a, i) => { if (a.tier >= prompt.answers[best].tier) best = i; });
    keep = best;
  }
  return { ...prompt, answers: prompt.answers.map((a, i) => (i === keep ? { ...a, tier: 6 as const } : a.tier === 6 ? { ...a, tier: 5 as const } : a)) };
}

/**
 * Spreads a list's answers over the scores by rank, keeping the order the authors gave them (rarer stays rarer), so every open list has its easy, middling and rare
 * answers and exactly one top answer. Lists calibrated from a measured source keep their tiers (apart from the single top). Lists with a fixed set of answers are left alone.
 */
const BAND_EDGES = [0.18, 0.43, 0.68, 0.88]; // tiers 1 to 4; the rest is tier 5, and the single rarest answer is tier 6
export function spreadTiers<T extends DeepPrompt>(prompt: T): T {
  const n = prompt.answers.length;
  if (prompt.closed || n < 3) return prompt;
  if (prompt.source) return singleTop(prompt);
  const order = prompt.answers.map((a, i) => ({ a, i })).sort((x, y) => x.a.tier - y.a.tier || x.i - y.i);
  const tierOf = new Map<DeepAnswer, DeepAnswer['tier']>();
  order.forEach(({ a }, r) => {
    const q = (r + 0.5) / n;
    const band = BAND_EDGES.findIndex((e) => q <= e);
    tierOf.set(a, (r === n - 1 ? 6 : band < 0 ? 5 : band + 1) as DeepAnswer['tier']);
  });
  return { ...prompt, answers: prompt.answers.map((a) => ({ ...a, tier: tierOf.get(a)! })) };
}
