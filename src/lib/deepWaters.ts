import { DEEP_WATERS, type DeepAnswer, type DeepPrompt } from '../data/deepWaters';
import { seeded, shuffled } from './dailyGame';

export const DEEP_ROUNDS = 7;
export const DEEP_SECONDS = 25;
export const DEEP_POINTS: Record<DeepAnswer['tier'], number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };
export const DEEP_TIER_NAMES: Record<DeepAnswer['tier'], string> = {
  1: 'Common', 2: 'Less common', 3: 'Uncommon', 4: 'Rare', 5: 'Deep cut'
};

/* ---------- matching ---------- */

const ROMAN: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8', ix: '9', x: '10', xi: '11', xii: '12', xiii: '13', xiv: '14', xv: '15', xvi: '16', xvii: '17', xviii: '18', xix: '19', xx: '20', xxi: '21', xxii: '22', xxiii: '23' };
const ORDINAL: Record<string, string> = { first: '1', second: '2', third: '3', fourth: '4', fifth: '5', sixth: '6', seventh: '7', eighth: '8', ninth: '9', tenth: '10', '1st': '1', '2nd': '2', '3rd': '3', '4th': '4', '5th': '5', '6th': '6' };
/** Words that never decide which answer is meant. */
const COMMON_IGNORED = new Set(['the', 'of', 'our', 'and', 'saint', 'saints', 'st', 'pope', 'a', 'an']);

/**
 * The comparison form of a string: lower case, no accents, no punctuation (an apostrophe is dropped, not turned into a gap), no little words,
 * Roman numerals and ordinals as digits, a plural "s" removed, and the remaining words sorted so that word order does not matter.
 * `ignore` adds words that carry no meaning for one prompt ("council" in "Council of Trent").
 */
export function deepTokens(value: string, ignore: readonly string[] = []): string[] {
  const words = value
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/œ/g, 'oe')
    .replace(/['’`]/g, '')
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    if (COMMON_IGNORED.has(w) || ignore.includes(w)) continue;
    const n = ORDINAL[w] ?? ROMAN[w] ?? w;
    out.push(/^\d+$/.test(n) ? n : n.length > 3 && n.endsWith('s') && !n.endsWith('ss') ? n.slice(0, -1) : n);
  }
  return out.sort();
}
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
  return { status: 'none' };
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

/** Stable daily set; the prompt bank and order are the same for every visit on a given local day. */
export function dailyDeepPrompts(day: number): DeepPrompt[] {
  return shuffled(DEEP_WATERS, seeded(day + 78031)).slice(0, DEEP_ROUNDS);
}
export function practiceDeepPrompts(seed: number): DeepPrompt[] {
  return shuffled(DEEP_WATERS, seeded(seed + 99173)).slice(0, DEEP_ROUNDS);
}
