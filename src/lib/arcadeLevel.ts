/**
 * A player level for the games front door, worked out from what the app already records on this device (games finished, days played, the current streak).
 * It is only a reward: it unlocks nothing, is not shared, and is not a score.
 */
export interface Level { level: number; xp: number; into: number; need: number }

/** 10 XP per finished game, 25 per day played, 5 per day of the current streak. The first level costs 80 XP and each later level costs 40 more than the one before. */
export function levelOf(games: number, days: number, streak: number): Level {
  const xp = Math.max(0, games) * 10 + Math.max(0, days) * 25 + Math.max(0, streak) * 5;
  let level = 1;
  let floor = 0;
  let cost = 80;
  while (xp >= floor + cost) { floor += cost; cost += 40; level++; }
  return { level, xp, into: xp - floor, need: cost };
}
