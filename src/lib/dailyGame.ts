import { useEffect, useState } from 'react';

/** Today's number, in the player's own time zone, so a daily puzzle changes at their midnight. */
export const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
export const seeded = (seed: number) => { let s = (seed * 2654435761) % 4294967296 || 1; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; };
export function shuffled<T>(a: T[], rnd: () => number): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

const key = (game: string) => `sb:daily:${game}`;
/** Remember that today's puzzle of a game was finished, with a short result to show on the Games page. */
export function markDailyDone(game: string, result: string, perfect = false) { try { localStorage.setItem(key(game), JSON.stringify({ day: dayIndex(), result })); } catch { /* private mode */ } recordPlay(game, { perfect }); }
export function dailyDone(game: string): string | null { try { const v = JSON.parse(localStorage.getItem(key(game)) ?? 'null') as { day: number; result: string } | null; return v && v.day === dayIndex() ? v.result : null; } catch { return null; } }
export function useDailyDone(game: string) { const [r, setR] = useState(() => dailyDone(game)); useEffect(() => setR(dailyDone(game)), [game]); return r; }

/* Streaks and trophies: everything stays in this browser. */
const PLAYS = 'sb:plays:v1';
const TROPHIES = 'sb:trophies:v1';
interface Plays { days: number[]; games: Record<string, number>; perfect: Record<string, number>; dailyByDay: Record<string, string[]> }
const emptyPlays = (): Plays => ({ days: [], games: {}, perfect: {}, dailyByDay: {} });
export const loadPlays = (): Plays => { try { return { ...emptyPlays(), ...(JSON.parse(localStorage.getItem(PLAYS) ?? '{}') as Partial<Plays>) }; } catch { return emptyPlays(); } };
export const loadTrophies = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(TROPHIES) ?? '{}') as Record<string, number>; } catch { return {}; } };

export interface Trophy { id: string; icon: string; title: string; how: string }
export const DAILY_IDS = ['verbum', 'quartets', 'saintguess', 'whoami', 'whosaid', 'whichbook', 'chain', 'pilgrim'];
export const ALL_GAMES = ['verbum', 'quartets', 'whosaid', 'whichbook', 'chain', 'pilgrim', 'crossword', 'cloister', 'prophet', 'charades', 'wordsearch', 'saintguess', 'whoami', 'artdetective', 'doctrineladder', 'familyquiz'];
export const TROPHY_LIST: Trophy[] = [
  { id: 'first', icon: '🌱', title: 'First steps', how: 'Finish any game.' },
  { id: 'streak3', icon: '🔥', title: 'Three in a row', how: 'Play on 3 days in a row.' },
  { id: 'streak7', icon: '🕯️', title: 'A full week', how: 'Play on 7 days in a row.' },
  { id: 'streak30', icon: '⛪', title: 'A month of days', how: 'Play on 30 days in a row.' },
  { id: 'allDailies', icon: '🌟', title: 'Daily set', how: 'Finish every daily puzzle on one day.' },
  { id: 'ace', icon: '🎯', title: 'Sharp', how: 'Finish a game with a top score.' },
  { id: 'aces5', icon: '🏆', title: 'Five sharp', how: 'Finish five games with a top score.' },
  { id: 'games10', icon: '📖', title: 'Regular', how: 'Finish 10 games in all.' },
  { id: 'games50', icon: '📜', title: 'Devoted', how: 'Finish 50 games in all.' },
  { id: 'sampler', icon: '🎲', title: 'Sampler', how: 'Try five different games.' },
  { id: 'allTried', icon: '🗝️', title: 'Everything tried', how: 'Try every game.' },
  { id: 'crossword', icon: '✏️', title: 'Puzzler', how: 'Solve a crossword.' },
];
const dayStreak = (days: number[], today = dayIndex()) => {
  const set = new Set(days); let d = set.has(today) ? today : today - 1, n = 0;
  while (set.has(d)) { n++; d--; }
  return n;
};
export const currentStreak = () => dayStreak(loadPlays().days);

/** Note that a game was finished today, and hand out any trophy that earns. Returns the trophies newly earned. */
export function recordPlay(game: string, opts: { perfect?: boolean; solved?: boolean } = {}): Trophy[] {
  try {
    const p = loadPlays();
    const today = dayIndex();
    if (!p.days.includes(today)) p.days = [...p.days, today].slice(-400);
    p.games[game] = (p.games[game] ?? 0) + 1;
    if (opts.perfect) p.perfect[game] = (p.perfect[game] ?? 0) + 1;
    if (DAILY_IDS.includes(game)) { const set = new Set(p.dailyByDay[today] ?? []); set.add(game); p.dailyByDay = { [today]: [...set] }; }
    localStorage.setItem(PLAYS, JSON.stringify(p));
    const have = loadTrophies();
    const total = Object.values(p.games).reduce((a, b) => a + b, 0);
    const aces = Object.values(p.perfect).reduce((a, b) => a + b, 0);
    const streak = dayStreak(p.days, today);
    const earned: Record<string, boolean> = {
      first: total >= 1, streak3: streak >= 3, streak7: streak >= 7, streak30: streak >= 30,
      allDailies: DAILY_IDS.every((g) => (p.dailyByDay[today] ?? []).includes(g)),
      ace: aces >= 1, aces5: aces >= 5, games10: total >= 10, games50: total >= 50,
      sampler: Object.keys(p.games).length >= 5, allTried: ALL_GAMES.every((g) => p.games[g]),
      crossword: !!(opts.solved && game === 'crossword') || !!have.crossword,
    };
    const fresh = TROPHY_LIST.filter((t) => earned[t.id] && !have[t.id]);
    if (fresh.length) { for (const t of fresh) have[t.id] = today; localStorage.setItem(TROPHIES, JSON.stringify(have)); }
    if (fresh.length && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('studybible:trophy', { detail: fresh }));
    return fresh;
  } catch { return []; }
}
