import type { DeepAnswer, DeepPrompt, DeepTheme } from '../data/deepWaters';

/**
 * Basilion questions that are worked out from a complete list by a stated rule ("a saint with the letter Q in the name", "a pope since 1900"). Nothing here is
 * written by hand and nothing is random: the same lists give the same questions, in the same order, with the same ids, on every device.
 *
 * A POOL is a list of answers with a noun ("saint") and a theme. Every rule that picks answers from a pool is applied to every answer, so the answer key for
 * a derived question is exactly the answers of its pool that obey the rule: complete for the pool. When the pool is itself the whole real-world set (the 13
 * Apostles, the words of the Our Father, the popes since 1500) the question is `closed`. When the pool is a long list that can never be complete (saints) the
 * question is open and the game says "not on our list", never "wrong".
 *
 * A candidate question must be easy (some answers that almost everyone would think of), large enough to be fun, and different from every other question of its
 * pool (no two questions may have the same answers, or nearly the same). The bank then takes candidates from the pools in turn, so no pool and no theme
 * crowds the rest.
 */
export interface Pool {
  id: string;
  /** "saint", "word in the Our Father": the thing being named, after "Name a" */
  noun: string;
  theme: DeepTheme;
  /** the list is the whole real-world set */
  closed: boolean;
  answers: DeepAnswer[];
  /** extra rules that depend on facts about each answer (a pope's first year, a book's group) */
  facts?: Record<string, Record<string, number | string>>;
  factRules?: FactRule[];
  /** words that carry no meaning for matching, passed on to each question */
  ignore?: string[];
  /** what the letters belong to: a "name" (default), a "word", a "phrase" or a "title" */
  part?: 'name' | 'word' | 'phrase' | 'title';
  /** the answers end in a Roman numeral ("Pius XII", "Lateran IV"): the numeral is not counted as letters */
  numerals?: boolean;
  /** question texts that replace the rule template for one rule of this pool, keyed `kind|key` (Basilion review, issue 26) */
  textOverride?: Record<string, string>;
  /** the note shown to players, replacing the standard one for this pool (Basilion review, issue 26) */
  contextOverride?: string;
  /** no letter or length rules for this pool (its questions are about facts or about how lists overlap) */
  noLetters?: boolean;
  /** how many questions this pool gives for each one a small pool gives (large pools get more) */
  weight?: number;
}
export interface FactRule { kind: string; key: string; text: string; test: (facts: Record<string, number | string>) => boolean; min?: number }

export interface Candidate { pool: Pool; kind: string; key: string; text: string; answers: DeepAnswer[] }

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/^the /, '');
/** the letters of a name, nothing else */
export const lettersOf = (s: string) => strip(s).replace(/[^a-z]/g, '');
const wordsOf = (s: string) => strip(s).split(/[^a-z0-9']+/).filter(Boolean);
const VOWELS = 'aeiou';
const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const U = (c: string) => c.toUpperCase();
const BIT = (c: string) => 1 << (c.charCodeAt(0) - 97);


/** everything the letter rules ask about one answer, worked out once */
interface Feat { raw: string; l: string; mask: number; cnt: Uint8Array; len: number; words: string[]; vowels: number; dbl: boolean; digit: boolean }
function featOf(raw: string, basis: string): Feat {
  const l = lettersOf(basis);
  const cnt = new Uint8Array(26);
  let mask = 0, vowels = 0;
  for (const c of l) { cnt[c.charCodeAt(0) - 97]++; mask |= BIT(c); if (VOWELS.includes(c)) vowels++; }
  return { raw, l, mask, cnt, len: l.length, words: wordsOf(basis), vowels, dbl: /(.)\1/.test(l), digit: /\d/.test(raw) };
}
const has = (f: Feat, c: string) => (f.mask & BIT(c)) !== 0;

type Part = NonNullable<Pool['part']>;
interface Raw { kind: string; key: string; text: (noun: string, part: Part) => string; test: (f: Feat) => boolean }
const art = (noun: string) => `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`;
const inThe = (part: Part) => (part === 'word' ? 'in it' : `in the ${part}`);
const whose = (part: Part, what: string) => (part === 'word' ? `that ${what}` : `whose ${part} ${what}`);

/** every letter rule, in the order the bank interleaves them. Each asks for ONE thing (a letter in the name, a letter missing from it, how it starts or ends, how long it is): players cannot hold two letter conditions in their head at once, so there are no "both A and B" or "A but no B" rules. */
function letterRules(): Raw[] {
  const out: Raw[] = [];
  for (const x of ALPHA) out.push({ kind: 'has', key: x, text: (n, pt) => `Name ${art(n)} with the letter ${U(x)} ${inThe(pt)}.`, test: (f) => has(f, x) });
  for (const x of ALPHA) out.push({ kind: 'start', key: x, text: (n, pt) => `Name ${art(n)} ${whose(pt, `starts with ${U(x)}`)}.`, test: (f) => f.l[0] === x });
  for (const x of ALPHA) out.push({ kind: 'end', key: x, text: (n, pt) => `Name ${art(n)} ${whose(pt, `ends with ${U(x)}`)}.`, test: (f) => f.l.endsWith(x) });
  for (const x of ALPHA) out.push({ kind: 'without', key: x, text: (n, pt) => `Name ${art(n)} with no ${U(x)} ${inThe(pt)}.`, test: (f) => !has(f, x) });
  for (let n = 3; n <= 24; n++) {
    out.push({ kind: 'atleast', key: String(n), text: (nn, pt) => `Name ${art(nn)} with ${n} or more letters ${inThe(pt)}.`, test: (f) => f.len >= n });
    out.push({ kind: 'atmost', key: String(n), text: (nn, pt) => `Name ${art(nn)} with ${n} letters or fewer ${inThe(pt)}.`, test: (f) => f.len <= n });
  }
  const WORD = ['', 'one word', 'two words', 'three words', 'four words', 'five words'];
  for (let n = 1; n <= 5; n++) out.push({ kind: 'words', key: String(n), text: (nn, pt) => (pt === 'name' ? `Name ${art(nn)} with a ${n}-word name.` : `Name ${art(nn)} that is ${WORD[n]} long.`), test: (f) => f.words.length === n });
  for (const w of ['of', 'the', 'and', 'in', 'to', 'for', 'on']) out.push({ kind: 'hasword', key: w, text: (n, pt) => `Name ${art(n)} with the word “${w}” ${inThe(pt)}.`, test: (f) => f.words.slice(1).includes(w) || (w !== 'the' && f.words.includes(w)) });
  const RANGES: [string, string][] = [['a', 'f'], ['g', 'm'], ['n', 's'], ['t', 'z'], ['a', 'm'], ['n', 'z']];
  for (const [lo, hi] of RANGES) out.push({ kind: 'range', key: lo + hi, text: (n, pt) => `Name ${art(n)} ${whose(pt, `starts with a letter from ${U(lo)} to ${U(hi)}`)}.`, test: (f) => { const c = f.l[0] ?? ''; return c >= lo && c <= hi; } });
  out.push({ kind: 'digit', key: 'any', text: (n, pt) => `Name ${art(n)} with a number ${inThe(pt)}.`, test: (f) => f.digit });
  out.push({ kind: 'vowelstart', key: 'any', text: (n, pt) => `Name ${art(n)} ${whose(pt, 'starts with a vowel')}.`, test: (f) => VOWELS.includes(f.l[0] ?? '') });
  out.push({ kind: 'vowelend', key: 'any', text: (n, pt) => `Name ${art(n)} ${whose(pt, 'ends with a vowel')}.`, test: (f) => VOWELS.includes(f.l.slice(-1)) });
  out.push({ kind: 'consstart', key: 'any', text: (n, pt) => `Name ${art(n)} ${whose(pt, 'starts with a consonant')}.`, test: (f) => { const c = f.l[0] ?? ''; return !!c && !VOWELS.includes(c); } });
  return out;
}
export const LETTER_KINDS = ['hasword', 'range', 'digit', 'has', 'start', 'end', 'without', 'atleast', 'atmost', 'words', 'vowelstart', 'vowelend', 'consstart'];
const RULES = letterRules();
/** The harder letter rules, kept for the Letter Puzzles pack (see src/data/deepWatersPacks.ts): two conditions at once, counting letters or vowels, doubles. They are
 *  never asked in the daily game, where a question has to come to mind at once. */
function puzzleRules(): Raw[] {
  const out: Raw[] = [];
  for (const x of ALPHA) out.push({ kind: 'twice', key: x, text: (n, pt) => `Name ${art(n)} with the letter ${U(x)} twice ${inThe(pt)}.`, test: (f) => f.cnt[x.charCodeAt(0) - 97] >= 2 });
  for (let i = 0; i < 26; i++) for (let j = i + 1; j < 26; j++) {
    const x = ALPHA[i], y = ALPHA[j], m = BIT(x) | BIT(y);
    out.push({ kind: 'both', key: x + y, text: (n, pt) => `Name ${art(n)} with both ${U(x)} and ${U(y)} ${inThe(pt)}.`, test: (f) => (f.mask & m) === m });
  }
  for (const x of ALPHA) for (const y of ALPHA) if (x !== y && 'aeioutrsnlhdm'.includes(y)) {
    out.push({ kind: 'notin', key: x + y, text: (n, pt) => `Name ${art(n)} with ${U(x)} but no ${U(y)} ${inThe(pt)}.`, test: (f) => has(f, x) && !has(f, y) });
  }
  for (const x of ALPHA) for (const y of ALPHA) if (x !== y && VOWELS.includes(y)) {
    out.push({ kind: 'startwith', key: x + y, text: (n, pt) => `Name ${art(n)} ${whose(pt, `starts with ${U(x)} and has ${U(y)} in it`)}.`, test: (f) => f.l[0] === x && f.l.slice(1).includes(y) });
  }
  for (const x of ALPHA) for (const y of ALPHA) {
    out.push({ kind: 'startend', key: x + y, text: (n, pt) => `Name ${art(n)} ${whose(pt, `starts with ${U(x)} and ends with ${U(y)}`)}.`, test: (f) => f.len > 1 && f.l[0] === x && f.l.endsWith(y) });
  }
  for (const x of ALPHA) out.push({ kind: 'second', key: x, text: (n, pt) => `Name ${art(n)} ${whose(pt, `has ${U(x)} as its second letter`)}.`, test: (f) => f.l[1] === x });
  for (let n = 3; n <= 24; n++) out.push({ kind: 'length', key: String(n), text: (nn, pt) => `Name ${art(nn)} with exactly ${n} letters ${inThe(pt)}.`, test: (f) => f.len === n });
  for (let v = 1; v <= 8; v++) out.push({ kind: 'vowels', key: String(v), text: (n, pt) => `Name ${art(n)} with exactly ${v} vowel${v === 1 ? '' : 's'} ${inThe(pt)}.`, test: (f) => f.vowels === v });
  out.push({ kind: 'doubled', key: 'any', text: (n, pt) => `Name ${art(n)} with a double letter ${inThe(pt)}.`, test: (f) => f.dbl });
  out.push({ kind: 'same', key: 'any', text: (n, pt) => `Name ${art(n)} ${whose(pt, 'starts and ends with the same letter')}.`, test: (f) => f.len > 1 && f.l[0] === f.l[f.len - 1] });
  return out;
}
export const PUZZLE_KINDS = ['both', 'notin', 'startwith', 'startend', 'twice', 'second', 'length', 'vowels', 'doubled', 'same'];
const PUZZLE = puzzleRules();



/** how a question's answers are tested for "easy": enough of them are ones almost everyone would name */
const easyEnough = (answers: DeepAnswer[], closed: boolean) => answers.filter((a) => a.tier <= 2).length >= (closed ? 2 : 3);

/**
 * The standard every letter or length question must meet (the same standard the hand-written questions were held to): an open list has at least 60 answers and
 * a closed one at least 12; a list of 40 or more answers has at least five of the six rarity tiers, so there is a ladder to climb; and several answers are ones
 * almost everyone would name. A question about a fact (a pope's era, the books of a group, the words two prayers share) may be smaller, but is held to the
 * same ease and the same completeness.
 */
export interface Limits { minOpen: number; minClosed: number; maxShare: number; minFact: number; tiersFrom: number; tiersNeeded: number }
export const LIMITS: Limits = { minOpen: 60, minClosed: 12, maxShare: 0.72, minFact: 12, tiersFrom: 40, tiersNeeded: 5 };

const sig = (answers: DeepAnswer[]) => answers.map((a) => a.answer).sort().join('|');
const similar = (a: Set<string>, b: Set<string>) => { let both = 0; for (const x of a) if (b.has(x)) both++; return both / (a.size + b.size - both); };

/** all candidate questions of one pool, interleaved by kind so the first few are all different in style */
const PER_POOL_LIMIT = 400;
export function candidatesOf(pool: Pool, puzzle = false): Candidate[] {
  const total = pool.answers.length;
  const per = new Map<string, Candidate[]>();
  const chosen: Set<string>[] = [];
  const factFirst: Candidate[] = [];
  let accepted = 0;
  const consider = (kind: string, key: string, text: string, answers: DeepAnswer[], minOverride?: number, fact = false) => {
    const min = fact ? Math.max(minOverride ?? 0, LIMITS.minFact) : pool.closed ? LIMITS.minClosed : LIMITS.minOpen;
    if (answers.length < min || answers.length > total * LIMITS.maxShare) return;
    if (!fact && answers.length >= LIMITS.tiersFrom && new Set(answers.map((a) => a.tier)).size < LIMITS.tiersNeeded) return;
    // letter rules must be easy (several answers almost everyone would name); a question about a fact need only have one reasonably familiar answer
    if (fact ? !answers.some((a) => a.tier <= 3) : !easyEnough(answers, pool.closed)) return;
    const names = new Set(answers.map((a) => a.answer));
    for (const c of chosen) {
      const lo = Math.min(c.size, names.size), hi = Math.max(c.size, names.size);
      if (lo / hi >= 0.85 && similar(c, names) >= 0.85) return; // far too like a question already taken
    }
    chosen.push(names);
    accepted++;
    const cand = { pool, kind, key, text, answers };
    if (fact) factFirst.push(cand);
    else (per.get(kind) ?? per.set(kind, []).get(kind)!).push(cand);
  };
  // the questions about facts come first (they are the least like each other); then the letter rules, interleaved by kind
  for (const fr of puzzle ? [] : pool.factRules ?? []) {
    const answers = pool.answers.filter((a) => pool.facts?.[a.answer] && fr.test(pool.facts[a.answer]));
    consider(fr.kind, fr.key, fr.text, answers, fr.min, true);
  }
  // a trailing Roman numeral ("XII" in "Pius XII") is part of how the answer is written, not of the name, so letters are counted without it
  const feats = pool.answers.map((a) => featOf(a.answer, pool.numerals ? a.answer.replace(/\s+[IVXL]+$/, '') : a.answer));
  const raw: { r: Raw; answers: DeepAnswer[] }[] = [];
  for (const r of pool.noLetters ? [] : puzzle ? PUZZLE : RULES) {
    if (pool.part === 'word' && r.kind === 'words') continue;
    const answers: DeepAnswer[] = [];
    for (let i = 0; i < feats.length; i++) if (r.test(feats[i])) answers.push(pool.answers[i]);
    if (answers.length) raw.push({ r, answers });
  }
  // order inside a kind: more answers first (they are the easiest)
  raw.sort((a, b) => b.answers.length - a.answers.length || (a.r.kind + a.r.key).localeCompare(b.r.kind + b.r.key));
  for (const { r, answers } of raw) {
    if (accepted >= PER_POOL_LIMIT) break;
    consider(r.kind, r.key, pool.textOverride?.[`${r.kind}|${r.key}`] ?? r.text(pool.noun, pool.part ?? 'name'), answers);
  }
  const ordered: Candidate[] = [...factFirst];
  for (let i = 0; ; i++) {
    let any = false;
    for (const k of puzzle ? PUZZLE_KINDS : LETTER_KINDS) { const list = per.get(k); if (list && list[i]) { ordered.push(list[i]); any = true; } }
    if (!any) break;
  }
  return ordered;
}

const SAFE = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

/** turn a candidate into a bank question */
export function promptOf(c: Candidate): DeepPrompt {
  const { pool } = c;
  const n = c.answers.length;
  return {
    id: `d.${SAFE(pool.id)}.${c.kind}.${SAFE(c.key)}`,
    theme: pool.theme,
    prompt: c.text,
    context: pool.contextOverride ?? (pool.closed ? `A complete list: ${n} answers, and every one is on it.${pool.part === 'word' ? ' Little words (the, of, our, and, a) are not counted.' : ''}` : `Any ${pool.noun} on our list counts. The list is long, but it is not complete.`),
    answers: c.answers,
    ...(pool.closed ? { closed: n } : {}),
    ...(pool.ignore?.length ? { ignore: pool.ignore } : {}),
    derived: { pool: pool.id, kind: c.kind },
  };
}

/** which question a derived entry stands for: the list it comes from, the kind of rule and the rule's key */
export type DerivedEntry = [pool: string, kind: string, key: string];

/**
 * The bank's derived questions: candidates are taken from the pools in turn (a large pool takes several turns to a small pool's one), a theme stops taking once it
 * holds its cap, and a candidate whose answers are exactly those of a question already in the bank is skipped, until `want` questions have been chosen
 * (or every candidate is used). Returns the chosen entries; `materialize` turns them back into questions. This is the slow part, so the build script runs it
 * and stores the entries (src/data/deepWaters.derived.json); the app only materializes them.
 */
export function chooseDerived(pools: Pool[], want: number, themeCap: Record<string, number>, existing: DeepPrompt[] = [], allow: (pool: string, kind: string) => boolean = () => true, puzzle = false): DerivedEntry[] {
  const lists = pools.map((p) => ({ p, c: candidatesOf(p, puzzle).filter((c) => allow(p.id, c.kind)), i: 0 }));
  const taken = new Set(existing.map((p) => sig(p.answers)));
  const perTheme = new Map<string, number>();
  const out: DerivedEntry[] = [];
  let progressed = true;
  while (out.length < want && progressed) {
    progressed = false;
    for (const l of lists) {
      for (let turn = 0; turn < (l.p.weight ?? 1); turn++) {
        if (out.length >= want) break;
        while (l.i < l.c.length && (perTheme.get(l.p.theme) ?? 0) < (themeCap[l.p.theme] ?? 0)) {
          const cand = l.c[l.i++];
          const key = sig(cand.answers);
          if (taken.has(key)) continue;
          taken.add(key);
          out.push([cand.pool.id, cand.kind, cand.key]);
          perTheme.set(l.p.theme, (perTheme.get(l.p.theme) ?? 0) + 1);
          progressed = true;
          break;
        }
      }
    }
  }
  return out;
}

const RULE_BY = new Map([...RULES, ...PUZZLE].map((r) => [`${r.kind}|${r.key}`, r] as const));
const featCache = new WeakMap<Pool, Feat[]>();
const featsOf = (pool: Pool) => {
  let f = featCache.get(pool);
  if (!f) { f = pool.answers.map((a) => featOf(a.answer, pool.numerals ? a.answer.replace(/\s+[IVXL]+$/, '') : a.answer)); featCache.set(pool, f); }
  return f;
};

/** the questions the entries stand for, rebuilt from the pools (fast: one rule applied to one list per question); an entry whose list or rule has gone is skipped */
export function materialize(pools: Pool[], entries: DerivedEntry[]): DeepPrompt[] {
  const byId = new Map(pools.map((p) => [p.id, p] as const));
  const out: DeepPrompt[] = [];
  for (const [poolId, kind, key] of entries) {
    const pool = byId.get(poolId);
    if (!pool) continue;
    const fr = pool.factRules?.find((f) => f.kind === kind && f.key === key);
    if (fr) {
      out.push(promptOf({ pool, kind, key, text: fr.text, answers: pool.answers.filter((a) => pool.facts?.[a.answer] && fr.test(pool.facts[a.answer])) }));
      continue;
    }
    const r = RULE_BY.get(`${kind}|${key}`);
    if (!r) continue;
    const feats = featsOf(pool);
    out.push(promptOf({ pool, kind, key, text: pool.textOverride?.[`${kind}|${key}`] ?? r.text(pool.noun, pool.part ?? 'name'), answers: pool.answers.filter((_, i) => r.test(feats[i])) }));
  }
  return out;
}
