import type { DeepPrompt } from '../data/deepWaters';
import { seeded, shuffled } from './dailyGame';

/**
 * Which seven prompts a given day gets.
 *
 * The bank is dealt in cycles of D = ceil(N / 7) days, every prompt once per cycle. Each prompt has a fixed home day inside the cycle, chosen so that every
 * day of the home layout is balanced: no day holds more of one family ("places in Acts" and "places in Luke" are one family, as are the saints-by-month
 * questions) than its share, and the themes are spread. A cycle then deals each prompt to a day within WINDOW days of its home, so every cycle is different
 * but a prompt is never nearer to its last appearance than D - 2 * WINDOW days. The deal is pure and random-access: day d is the same on every device,
 * with no stored state and no earlier day needed.
 *
 * When N is not a multiple of seven the cycle is padded with repeats of the largest questions (each repeat is its own unit, kept off the day of its twin).
 * The bank size that tiles exactly is a multiple of seven.
 */
export const DAILY_SIZE = 7;
export const WINDOW = 2;
/** a seed that is safe for any integer, negative included */
const seedFor = (x: number) => ((Math.floor(x) % 2147483647) + 2147483647) % 2147483647;

/** "people-A" and "people-B" are one family, as are "places-ACT" and "places-LUK" are one family; so are "saints-03" and "saints-martyr". Anything else is its own family. */
export const familyOf = (id: string) => id.startsWith('krillion-saint-') ? 'saints' : id.startsWith('krillion-place-') ? 'places' : (/^(places|saints|people|roles)-/.test(id) ? id.split('-')[0] : id);

interface Unit { p: DeepPrompt; key: string; family: string }
interface Layout { units: Unit[]; days: number; homes: Map<string, number>; famCap: Map<string, number> }
const layouts = new Map<string, Layout>();
const cycles = new Map<string, DeepPrompt[][]>();

function unitsOf(prompts: DeepPrompt[], salt: number): Unit[] {
  const sorted = [...prompts].sort((a, b) => a.id.localeCompare(b.id));
  const pad = (DAILY_SIZE - (sorted.length % DAILY_SIZE)) % DAILY_SIZE;
  const extras = [...sorted].sort((a, b) => b.answers.length - a.answers.length || a.id.localeCompare(b.id)).slice(0, pad);
  return [...sorted.map((p) => ({ p, key: p.id })), ...extras.map((p) => ({ p, key: `${p.id}#2` }))].map((u) => ({ ...u, family: familyOf(u.p.id) }));
}

function layoutOf(prompts: DeepPrompt[], salt: number): Layout {
  const sig = `${salt}|${prompts.map((p) => p.id + p.theme).join(',')}`;
  const hit = layouts.get(sig);
  if (hit) return hit;
  const units = unitsOf(prompts, salt);
  const days = Math.max(1, units.length / DAILY_SIZE);
  const famCount = new Map<string, number>();
  for (const u of units) famCount.set(u.family, (famCount.get(u.family) ?? 0) + 1);
  const famCap = new Map([...famCount].map(([f, n]) => [f, Math.ceil(n / days)]));
  // the home layout: each unit goes to the day with the least of its family, then its theme, then the fewest prompts, so families and themes are spread evenly
  const homes = new Map<string, number>();
  const load = Array.from({ length: days }, () => ({ n: 0, fam: new Map<string, number>(), theme: new Map<string, number>(), ids: new Set<string>() }));
  for (const u of shuffled(units, seeded(seedFor(7001 + salt)))) {
    let best = -1;
    let bestScore: number[] = [];
    for (let d = 0; d < days; d++) {
      const l = load[d];
      if (l.n >= DAILY_SIZE || l.ids.has(u.p.id)) continue;
      const score = [l.fam.get(u.family) ?? 0, l.theme.get(u.p.theme) ?? 0, l.n, d];
      if (best < 0 || lessThan(score, bestScore)) { best = d; bestScore = score; }
    }
    if (best < 0) best = load.findIndex((l) => l.n < DAILY_SIZE);
    const l = load[best];
    l.n++; l.ids.add(u.p.id); l.fam.set(u.family, (l.fam.get(u.family) ?? 0) + 1); l.theme.set(u.p.theme, (l.theme.get(u.p.theme) ?? 0) + 1);
    homes.set(u.key, best);
  }
  const out = { units, days, homes, famCap };
  layouts.set(sig, out);
  return out;
}
const lessThan = (a: number[], b: number[]) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]; return false; };

/** One cycle's deal: earliest-deadline-first over each prompt's window around its home day, with family caps as a preference that yields only to a deadline. */
function cycleOf(prompts: DeepPrompt[], salt: number, c: number): DeepPrompt[][] {
  const sig = `${salt}|${c}|${prompts.map((p) => p.id + p.theme).join(',')}`;
  const hit = cycles.get(sig);
  if (hit) return hit;
  const { units, days, homes, famCap } = layoutOf(prompts, salt);
  const rank = new Map(shuffled(units, seeded(seedFor(c * 7919 + 104729 + salt))).map((u, i) => [u.key, i] as const));
  const left = new Map(units.map((u) => [u.key, Math.max(0, homes.get(u.key)! - WINDOW)] as const));
  const deadline = new Map(units.map((u) => [u.key, Math.min(days - 1, homes.get(u.key)! + WINDOW)] as const));
  const todo = new Set(units.map((u) => u.key));
  const byKey = new Map(units.map((u) => [u.key, u] as const));
  const out: DeepPrompt[][] = [];
  const dealt: Unit[][] = [];
  for (let d = 0; d < days; d++) {
    const avail = [...todo].filter((k) => left.get(k)! <= d).sort((a, b) => deadline.get(a)! - deadline.get(b)! || rank.get(a)! - rank.get(b)!);
    const day: Unit[] = [];
    const fam = new Map<string, number>();
    const add = (k: string) => { const u = byKey.get(k)!; day.push(u); todo.delete(k); fam.set(u.family, (fam.get(u.family) ?? 0) + 1); };
    const ok = (k: string) => !day.some((x) => x.p.id === byKey.get(k)!.p.id);
    // a prompt whose window closes today must be dealt today
    for (const k of avail) if (deadline.get(k)! <= d && day.length < DAILY_SIZE && ok(k)) add(k);
    for (const k of avail) if (day.length < DAILY_SIZE && todo.has(k) && ok(k) && (fam.get(byKey.get(k)!.family) ?? 0) < famCap.get(byKey.get(k)!.family)!) add(k);
    for (const k of avail) if (day.length < DAILY_SIZE && todo.has(k) && ok(k)) add(k);
    out.push(day.map((u) => u.p));
    dealt.push(day);
  }
  repair(dealt, homes, famCap);
  for (let d = 0; d < days; d++) out[d] = shuffled(dealt[d].map((u) => u.p), seeded(seedFor(c * 31 + d + salt))); // the order within a day varies by cycle too
  cycles.set(sig, out);
  if (cycles.size > 200) cycles.delete(cycles.keys().next().value as string);
  return out;
}

/**
 * Swap pass: where a day holds more of a family than its cap, trade one of its units for a unit of another family from a day both can move to
 * (each unit stays within WINDOW of its home, so the gap guarantee is untouched). A few passes settle almost every day.
 */
function repair(dealt: Unit[][], homes: Map<string, number>, famCap: Map<string, number>) {
  const days = dealt.length;
  const fits = (u: Unit, d: number) => Math.abs(homes.get(u.key)! - d) <= WINDOW;
  const count = (d: number, f: string) => dealt[d].filter((x) => x.family === f).length;
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    for (let d = 0; d < days; d++) {
      for (const f of new Set(dealt[d].map((u) => u.family))) {
        while (count(d, f) > famCap.get(f)!) {
          let done = false;
          for (const u of dealt[d].filter((x) => x.family === f)) {
            for (let d2 = Math.max(0, d - 2 * WINDOW); d2 <= Math.min(days - 1, d + 2 * WINDOW) && !done; d2++) {
              if (d2 === d || !fits(u, d2) || count(d2, f) + 1 > famCap.get(f)!) continue;
              if (dealt[d2].some((x) => x.p.id === u.p.id)) continue;
              const v = dealt[d2].find((x) => x.family !== f && fits(x, d) && count(d, x.family) + 1 <= famCap.get(x.family)! && !dealt[d].some((y) => y.p.id === x.p.id));
              if (!v) continue;
              dealt[d] = dealt[d].map((x) => (x === u ? v : x));
              dealt[d2] = dealt[d2].map((x) => (x === v ? u : x));
              done = changed = true;
            }
            if (done) break;
          }
          if (!done) break;
        }
      }
    }
    if (!changed) break;
  }
}

/** The seven prompts for day number `day` (any integer; the local calendar day the game already uses). `salt` gives practice runs their own deal. */
export function dailySchedule(prompts: DeepPrompt[], day: number, salt = 0): DeepPrompt[] {
  const { days } = layoutOf(prompts, salt);
  const d = Math.floor(day);
  const c = Math.floor(d / days);
  return cycleOf(prompts, salt, c)[((d % days) + days) % days].slice();
}

/** The cycle length in days for a bank of `n` questions (the shortest gap before a question can return is this minus 2 * WINDOW). */
export const cycleLength = (n: number) => Math.max(1, Math.ceil(n / DAILY_SIZE));
