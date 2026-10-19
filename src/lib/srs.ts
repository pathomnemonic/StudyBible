/** Spaced repetition (a small SM-2 variant). Grades: 0 again, 1 hard, 2 good, 3 easy. */
export interface SrsState {
  ease: number; // 1.3 – 3.0
  interval: number; // days
  reps: number; // successful reviews in a row
  lapses: number;
  due: number; // ms timestamp
}
export const DAY = 86400000;

export const newCard = (now = Date.now()): SrsState => ({ ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now });

export function schedule(c: SrsState, grade: 0 | 1 | 2 | 3, now = Date.now()): SrsState {
  let { ease, interval, reps, lapses } = c;
  if (grade === 0) {
    lapses++;
    reps = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
    return { ease, interval, reps, lapses, due: now + 10 * 60 * 1000 }; // see it again in ten minutes
  }
  reps++;
  if (reps === 1) interval = grade === 1 ? 1 : grade === 2 ? 1 : 3;
  else if (reps === 2) interval = grade === 1 ? 3 : grade === 2 ? 6 : 8;
  else interval = Math.max(1, Math.round(interval * (grade === 1 ? 1.2 : ease * (grade === 3 ? 1.3 : 1))));
  ease = Math.min(3, Math.max(1.3, ease + (grade === 3 ? 0.15 : grade === 1 ? -0.15 : 0)));
  return { ease, interval, reps, lapses, due: now + interval * DAY };
}

export const isDue = (c: { due: number }, now = Date.now()) => c.due <= now;

/** Words to blank out: harder as the card matures. Deterministic for a given verse text and level so a retry looks the same. */
export function clozeIndexes(words: string[], reps: number): Set<number> {
  const share = reps < 2 ? 0.2 : reps < 4 ? 0.4 : reps < 6 ? 0.6 : 0.8;
  const candidates = words.map((w, i) => [w, i] as const).filter(([w]) => w.replace(/[^\p{L}]/gu, '').length > 2);
  const want = Math.max(1, Math.round(candidates.length * share));
  // spread evenly, preferring the longer (more meaningful) words
  const ranked = [...candidates].sort((a, b) => b[0].length - a[0].length || a[1] - b[1]).slice(0, want);
  return new Set(ranked.map(([, i]) => i));
}

export const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
