import { DEEP_PLAYABLE, DEEP_WATERS, type DeepAnswer, type DeepPrompt } from '../data/deepWaters';
import { dailySchedule } from './deepWatersSchedule';
import { deepTokens } from './deepWatersTokens';
export { deepTokens };

export const DEEP_ROUNDS = 7;
export const DEEP_SECONDS = 45;
export const DEEP_POINTS: Record<DeepAnswer['tier'], number> = { 1: 10, 2: 15, 3: 30, 4: 60, 5: 85, 6: 100 };
export const DEEP_TIER_NAMES: Record<DeepAnswer['tier'], string> = {
  1: 'The doors', 2: 'The nave', 3: 'The loggia', 4: 'The drum', 5: 'The dome', 6: 'The cross'
};

/* ---------- matching ---------- */

export const normalizeDeepAnswer = (value: string) => deepTokens(value).join(' ');

/** Edit distance of at most 1 (one insertion, deletion, substitution or swap of neighbours). */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    if (a.slice(i + 1) === b.slice(i + 1)) return true; // one substitution
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2); // one swap
  }
  const [long, short] = a.length > b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < short.length && long[i] === short[i]) i++;
  return long.slice(i + 1) === short.slice(i);
}

/** Same words, except that one long word of the guess may have a single typo. Numbers and short words must match exactly. */
function closeEnough(guess: string[], answer: string[]): boolean {
  if (guess.length !== answer.length) return false;
  let typos = 0;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) continue;
    if (guess[i].length < 6 || answer[i].length < 6 || /\d/.test(guess[i] + answer[i]) || !withinOneEdit(guess[i], answer[i])) return false;
    if (++typos > 1) return false;
  }
  return true;
}

export type DeepMatch =
  | { status: 'match'; answer: DeepAnswer; exact: boolean }
  /** the guess is close to more than one listed answer, so none is chosen */
  | { status: 'ambiguous'; options: DeepAnswer[] }
  | { status: 'none' };

interface KeyedAnswer { entry: DeepAnswer; keys: string[][] }
const keyCache = new WeakMap<DeepPrompt, KeyedAnswer[]>();
function keyed(prompt: DeepPrompt): KeyedAnswer[] {
  let k = keyCache.get(prompt);
  if (!k) { k = prompt.answers.map((entry) => ({ entry, keys: [entry.answer, ...(entry.aliases ?? [])].map((a) => deepTokens(a, prompt.ignore)) })); keyCache.set(prompt, k); }
  return k;
}

export function matchDeepAnswer(prompt: DeepPrompt, guess: string): DeepMatch {
  const g = deepTokens(guess, prompt.ignore);
  if (!g.length) return { status: 'none' };
  const gk = g.join(' ');
  const all = keyed(prompt);
  const exact = all.filter((a) => a.keys.some((k) => k.join(' ') === gk));
  if (exact.length === 1) return { status: 'match', answer: exact[0].entry, exact: true };
  if (exact.length > 1) return { status: 'ambiguous', options: exact.map((a) => a.entry) };
  // a single typo in a long word is forgiven, but never by guessing between two answers
  const near = all.filter((a) => a.keys.some((k) => closeEnough(g, k)));
  if (near.length === 1) return { status: 'match', answer: near[0].entry, exact: false };
  if (near.length > 1) return { status: 'ambiguous', options: near.map((a) => a.entry) };
  // part of several answers ("Lateran", "Mary"): say it is not specific enough, never pick one
  const part = all.filter((a) => a.keys.some((k) => k.length > g.length && g.every((w) => k.includes(w))));
  if (part.length > 1) return { status: 'ambiguous', options: part.map((a) => a.entry) };
  // names of people: the name everyone uses counts ("Bernadette" for Bernadette Soubirous, "Kolbe" for Maximilian Kolbe) when it can mean only one answer on the list.
  // Only for people a player would know by that name (the easier tiers): "Christopher" is not "Christopher Magallanes". A first name alone does not count for a name with an epithet ("John" for John of the Cross), because that is another John's name as much as his.
  if (part.length === 1 && g.length === 1 && NAME_THEMES.has(prompt.theme) && part[0].entry.tier <= 3 && isGivenAndFamily(part[0].entry.answer, g[0])) return { status: 'match', answer: part[0].entry, exact: false };
  // actions and things (not names): the same words in another form ("visiting the sick"), or the key word of one easy answer ("pray" for "Pray the rosary")
  if (!NAME_THEMES.has(prompt.theme)) {
    const lg = looseTokens(guess, prompt.ignore);
    if (lg.length) {
      const lk = lg.join(' ');
      const loose = looseKeyed(prompt);
      const same = loose.filter((a) => a.keys.some((k) => k.join(' ') === lk));
      if (same.length === 1) return { status: 'match', answer: same[0].entry, exact: false };
      if (same.length > 1) return { status: 'ambiguous', options: same.map((a) => a.entry) };
      const sub = loose.filter((a) => a.entry.tier <= 3 && a.keys.some((k) => k.length > lg.length && k.length <= 3 && lg.every((w) => k.includes(w))));
      if (sub.length === 1) return { status: 'match', answer: sub[0].entry, exact: false };
      if (sub.length > 1) return { status: 'ambiguous', options: sub.map((a) => a.entry) };
    }
  }
  return { status: 'none' };
}

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

const NAME_THEMES = new Set(['saints', 'people', 'church-history']);

/** Little words and verb endings that people vary when they type an action ("visiting the sick", "help the poor people", "pray for others"). */
const LOOSE_IGNORED = new Set(['to', 'for', 'in', 'on', 'at', 'with', 'by', 'people', 'person', 'someone', 'others', 'other', 'those', 'your', 'my', 'their', 'who', 'is', 'are', 'be', 'it', 'them', 'all', 'some', 'more']);
export function looseTokens(value: string, ignore: readonly string[] = []): string[] {
  const out: string[] = [];
  for (const w of deepTokens(value, ignore)) {
    if (LOOSE_IGNORED.has(w)) continue;
    let n = w;
    if (n.length > 5 && n.endsWith('ing')) n = n.slice(0, -3);
    else if (n.length > 4 && n.endsWith('ed')) n = n.slice(0, -2);
    else if (n.length > 4 && n.endsWith('es')) n = n.slice(0, -2);
    if (n.length > 3 && n.endsWith('e')) n = n.slice(0, -1);
    out.push(n);
  }
  return out.sort();
}
const looseCache = new WeakMap<DeepPrompt, { entry: DeepAnswer; keys: string[][] }[]>();
function looseKeyed(prompt: DeepPrompt) {
  let k = looseCache.get(prompt);
  if (!k) { k = prompt.answers.map((entry) => ({ entry, keys: [entry.answer, ...(entry.aliases ?? [])].map((a) => looseTokens(a, prompt.ignore)).filter((t) => t.length) })); looseCache.set(prompt, k); }
  return k;
}
const EPITHET_WORDS = new Set(['of', 'the', 'de', 'da', 'di', 'del', 'della', 'des', 'du', 'von', 'van', 'der', 'la', 'le', 'el', 'al', 'ibn', 'bar', 'ben']);
/** "Bernadette Soubirous", "Padre Pio": two words, no "of X" or "de X" epithet, and the guess is one of the two */
function isGivenAndFamily(answer: string, token: string): boolean {
  const words = answer.split(/\s+/).filter((w) => !/^(saint|st\.?|blessed|bl\.?)$/i.test(w));
  if (words.length !== 2 || words.some((w) => EPITHET_WORDS.has(w.toLowerCase()))) return false;
  return words.some((w) => deepTokens(w)[0] === token);
}

/** The scored answer for a guess, or null. Kept for callers that only need the answer. */
export function findDeepAnswer(prompt: DeepPrompt, guess: string): DeepAnswer | null {
  const m = matchDeepAnswer(prompt, guess);
  return m.status === 'match' ? m.answer : null;
}

/** What to tell a player about a guess that scored nothing. A set that is the whole set can say "not one of them"; an open set must not say "wrong". */
export function deepMissMessage(prompt: DeepPrompt, match: DeepMatch): string {
  if (match.status === 'ambiguous') return `That could mean ${match.options.slice(0, 3).map((o) => o.answer).join(' or ')}. Be a little more specific.`;
  return prompt.closed
    ? `That is not one of the ${prompt.closed}. Try another.`
    : 'Not on our list yet. It may still be right, and the list is not complete. Try another answer while time remains.';
}

/* ---------- the daily and practice sets ---------- */

/** The seven prompts for a local calendar day, the same on every device. See src/lib/deepWatersSchedule.ts for how they are dealt. */
export function dailyDeepPrompts(day: number): DeepPrompt[] {
  return dailySchedule(DEEP_PLAYABLE, day);
}
/** A practice run: its own deal, chosen by `seed`, that never reproduces a daily set. */
export function practiceDeepPrompts(seed: number): DeepPrompt[] {
  return dailySchedule(DEEP_PLAYABLE, seed, 99173);
}

/* ---------- suggestions and hints ---------- */

/** Edit distance between two strings (insertions, deletions, substitutions). */
export function deepEditDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

/**
 * Answers a guess is close to, offered as choices the player taps and then locks in themselves; a suggestion is never accepted for them.
 * Offered only when the guess itself did not match (a match, or an ambiguous guess, needs no suggestion).
 */
export function suggestDeepAnswers(prompt: DeepPrompt, guess: string, limit = 3): DeepAnswer[] {
  const target = deepTokens(guess, prompt.ignore).join(' ');
  if (target.length < 4 || matchDeepAnswer(prompt, guess).status !== 'none') return [];
  const maxDistance = Math.max(1, Math.floor(target.length * 0.22));
  const found = new Map<string, { answer: DeepAnswer; distance: number }>();
  for (const entry of prompt.answers) {
    const distance = Math.min(...[entry.answer, ...(entry.aliases ?? [])].map((name) => deepEditDistance(target, deepTokens(name, prompt.ignore).join(' '))));
    if (distance <= maxDistance) {
      const prev = found.get(entry.answer);
      if (!prev || distance < prev.distance) found.set(entry.answer, { answer: entry, distance });
    }
  }
  return [...found.values()].sort((a, b) => a.distance - b.distance || a.answer.answer.localeCompare(b.answer.answer)).slice(0, limit).map((x) => x.answer);
}

/** A nudge that does not give the answer away: how many answers there are, or the first letter and length of one middling answer. Deterministic per question. */
export function deepHint(prompt: DeepPrompt): string {
  const mid = [...prompt.answers].filter((a) => a.tier === 3).sort((a, b) => a.answer.localeCompare(b.answer));
  const pick = (mid.length ? mid : prompt.answers)[0];
  const clue = pick ? `One accepted answer begins with \u201c${pick.answer[0]}\u201d and has ${pick.answer.replace(/[^A-Za-z\u00C0-\u017F]/g, '').length} letters.` : '';
  return prompt.closed ? `There are exactly ${prompt.closed} possible answers. ${clue}` : `Many answers are possible. ${clue}`;
}
