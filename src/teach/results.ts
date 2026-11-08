import { db } from '../db/db';
import type { LiveView } from '../live/types';
import type { QuestionStat } from './model';

/** What is kept when any live session ends, class or not: the title, date and per-question results, so the dashboard can show quick quizzes too. */
export interface SavedResults { code: string; title: string; date: string; ts: number; players: number; avg: number | null; questions: QuestionStat[] }
const KEY = 'sess-results:';
const isoToday = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };

/** Keep a finished session's per-question results on this device. Safe to call again for the same code: it replaces the record. */
export async function saveSessionResults(code: string, v: Pick<LiveView, 'title' | 'results' | 'qCount'>): Promise<void> {
  if (!v.results) return;
  const ps = v.results.players;
  const pct = ps.map((p) => (p.total ? (p.correct / p.total) * 100 : 0));
  const rec: SavedResults = { code, title: v.title, date: isoToday(), ts: v.results.startedAt || Date.now(), players: ps.length, avg: pct.length ? Math.round(pct.reduce((a, b) => a + b, 0) / pct.length) : null, questions: v.results.questions.map((q) => ({ q: q.q, correctPct: q.correctPct, answeredPct: q.answeredPct })) };
  const old = await db.cache.get(KEY + code);
  if (old) { try { const o = JSON.parse(String(old.value)) as SavedResults; rec.date = o.date; rec.ts = o.ts; } catch { /* replace */ } }
  await db.cache.put({ key: KEY + code, value: JSON.stringify(rec), ts: Date.now() });
}
export async function loadSavedResults(): Promise<SavedResults[]> {
  const rows = await db.cache.where('key').startsWith(KEY).toArray();
  return rows.flatMap((r) => { try { return [JSON.parse(String(r.value)) as SavedResults]; } catch { return []; } }).sort((a, b) => b.ts - a.ts);
}
