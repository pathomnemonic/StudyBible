import { useEffect, useState } from 'react';

/** Today's number, in the player's own time zone, so a daily puzzle changes at their midnight. */
export const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
export const seeded = (seed: number) => { let s = (seed * 2654435761) % 4294967296 || 1; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; };
export function shuffled<T>(a: T[], rnd: () => number): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

const key = (game: string) => `sb:daily:${game}`;
/** Remember that today's puzzle of a game was finished, with a short result to show on the Games page. */
export function markDailyDone(game: string, result: string) { try { localStorage.setItem(key(game), JSON.stringify({ day: dayIndex(), result })); } catch { /* private mode */ } }
export function dailyDone(game: string): string | null { try { const v = JSON.parse(localStorage.getItem(key(game)) ?? 'null') as { day: number; result: string } | null; return v && v.day === dayIndex() ? v.result : null; } catch { return null; } }
export function useDailyDone(game: string) { const [r, setR] = useState(() => dailyDone(game)); useEffect(() => setR(dailyDone(game)), [game]); return r; }
