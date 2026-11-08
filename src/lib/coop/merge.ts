/** The shared board of a co-op word game. Pure functions: every device merges what it hears the same way and so ends with the same board. */
export interface Guess { i: number; w: string; by: string; name: string; ts: number }

/** Which of two guesses for the same row stands: the later one, and on a tie the larger member id, then the word. */
export function wins(a: Guess, b: Guess): boolean {
  if (a.ts !== b.ts) return a.ts > b.ts;
  if (a.by !== b.by) return a.by > b.by;
  return a.w >= b.w;
}
const ok = (g: Guess, cap: number) => g && Number.isInteger(g.i) && g.i >= 0 && g.i < cap && typeof g.w === 'string' && /^[a-z]{5}$/.test(g.w) && typeof g.by === 'string' && typeof g.ts === 'number';

/** Merge two sets of guesses keyed by row. Order and repetition do not matter (commutative, associative, idempotent). */
export function mergeGuesses(a: Guess[], b: Guess[], cap = 6): Guess[] {
  const m = new Map<number, Guess>();
  for (const g of [...a, ...b]) {
    if (!ok(g, cap)) continue;
    const cur = m.get(g.i);
    if (!cur || (wins(g, cur) && !(g.ts === cur.ts && g.by === cur.by && g.w === cur.w))) m.set(g.i, g);
  }
  return [...m.values()].sort((x, y) => x.i - y.i);
}

/** The rows that count: an unbroken run from row 0, ending at the first right answer. */
export function board(all: Guess[], answer: string, cap = 6): Guess[] {
  const out: Guess[] = [];
  const byRow = new Map(all.map((g) => [g.i, g]));
  for (let i = 0; i < cap; i++) {
    const g = byRow.get(i);
    if (!g) break;
    out.push(g);
    if (g.w === answer) break;
  }
  return out;
}
export const solved = (rows: Guess[], answer: string) => rows.some((g) => g.w === answer);
export const finished = (rows: Guess[], answer: string, cap = 6) => solved(rows, answer) || rows.length >= cap;
/** The next free row for a new guess. */
export const nextRow = (rows: Guess[]) => rows.length;
/** Was my guess pushed out of its row by someone else's at the same moment? */
export function lost(mine: Guess, rows: Guess[]): boolean {
  const g = rows.find((r) => r.i === mine.i);
  return !!g && !(g.by === mine.by && g.ts === mine.ts && g.w === mine.w);
}
