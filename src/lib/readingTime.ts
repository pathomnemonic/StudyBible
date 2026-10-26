import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

const day = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const GOAL = 'sb:readgoal';
export const getGoal = () => { try { return Number(localStorage.getItem(GOAL)) || 15; } catch { return 15; } };
export const setGoal = (m: number) => { try { localStorage.setItem(GOAL, String(m)); } catch { /* storage unavailable */ } };

/** Count minutes spent reading: time passes only while the page is visible and the reader has scrolled, tapped or pressed a key in the last minute. */
export function useReadingTime(active = true) {
  useEffect(() => {
    if (!active) return;
    let last = Date.now();
    const poke = () => { last = Date.now(); };
    const evs = ['scroll', 'keydown', 'pointerdown', 'touchstart', 'wheel'] as const;
    evs.forEach((e) => window.addEventListener(e, poke, { passive: true }));
    const id = setInterval(async () => {
      if (document.hidden || Date.now() - last > 60_000) return;
      const key = `rt:${day()}`;
      const row = await db.cache.get(key);
      await db.cache.put({ key, value: String(Number(row?.value ?? 0) + 10) as unknown as string, ts: Date.now() });
    }, 10_000);
    return () => { clearInterval(id); evs.forEach((e) => window.removeEventListener(e, poke)); };
  }, [active]);
}

/** Minutes today, the streak of days that met the goal, and the last two weeks. */
export function useReadingStats() {
  const rows = useLiveQuery(() => db.cache.where('key').startsWith('rt:').toArray(), []) ?? [];
  const secs = new Map(rows.map((r) => [r.key.slice(3), Number(r.value)]));
  const goal = getGoal();
  const today = Math.floor((secs.get(day()) ?? 0) / 60);
  let streak = 0;
  const d = new Date();
  if (today < goal) d.setDate(d.getDate() - 1); // today may still be in progress
  for (;;) { if (Math.floor((secs.get(day(d)) ?? 0) / 60) >= goal) { streak++; d.setDate(d.getDate() - 1); } else break; }
  const week = Array.from({ length: 14 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() - (13 - i)); return { day: day(x), min: Math.floor((secs.get(day(x)) ?? 0) / 60) }; });
  return { today, goal, streak, week };
}
