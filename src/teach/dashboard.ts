import type { ClassDoc, ClassWork, QuestionStat } from './model';

/** Pure aggregations for the teacher dashboard. A "session" is one finished live class kept in the class record. */
export type Session = Extract<ClassWork, { kind: 'session' }>;
/** Where a session's questions came from, saved when the room was opened: the grade, the lessons, and which lesson each question text belongs to. */
export interface LessonTag { g: string; lessons: string[]; owner: Record<string, string> }

/** The score that counts for a player: percent of the class's questions answered right (or the exam score). */
export const playerPct = (s: Session, r: Session['results'][number]): number => (s.mode === 'exam' ? r.score : r.total ? (r.correct / r.total) * 100 : 0);

/** Average percent over everyone who joined; null for a lesson-only session (there was no quiz to score). */
export function sessionAverage(s: Session): number | null {
  if (s.mode === 'lesson' || !s.results.length) return null;
  return s.results.reduce((a, r) => a + playerPct(s, r), 0) / s.results.length;
}

export interface TaughtDay { date: string; titles: string[]; sessions: number; joined: number }
/** Lessons taught, newest day first. Two sessions on the same lesson the same day are counted once in the title list. */
export function lessonsTaught(sessions: Session[]): TaughtDay[] {
  const by = new Map<string, TaughtDay>();
  for (const s of sessions) {
    const d = by.get(s.date) ?? { date: s.date, titles: [], sessions: 0, joined: 0 };
    if (!d.titles.includes(s.title)) d.titles.push(s.title);
    d.sessions += 1; d.joined += s.results.length;
    by.set(s.date, d);
  }
  return [...by.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export interface AvgPoint { id: string; date: string; title: string; avg: number; joined: number }
/** Average score of each scored session, oldest first (so a chart reads left to right). */
export function averages(sessions: Session[]): AvgPoint[] {
  return sessions.flatMap((s) => { const a = sessionAverage(s); return a === null ? [] : [{ id: s.id, date: s.date, title: s.title, avg: Math.round(a), joined: s.results.length }]; })
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

const norm = (q: string) => q.toLowerCase().replace(/\s+/g, ' ').trim();
export interface Missed { q: string; correctPct: number; asked: number; players: number; lessonId?: string; grade?: string }
/**
 * Questions across sessions, hardest first. The same question asked in several sessions is merged and its "right" percentage
 * is weighted by how many students answered. Questions nobody answered are left out.
 */
export function missedQuestions(sessions: Session[], tagOf: (s: Session) => LessonTag | undefined = () => undefined, limit = 10): Missed[] {
  const acc = new Map<string, { q: string; right: number; n: number; asked: number; lessonId?: string; grade?: string }>();
  for (const s of sessions) {
    const tag = tagOf(s);
    for (const q of s.questions as QuestionStat[]) {
      const players = s.results.length;
      const n = (q.answeredPct / 100) * players;
      if (!(n > 0)) continue;
      const k = norm(q.q);
      const cur = acc.get(k) ?? { q: q.q, right: 0, n: 0, asked: 0 };
      cur.right += (q.correctPct / 100) * n; cur.n += n; cur.asked += 1;
      const lessonId = tag?.owner[q.q] ?? tag?.owner[norm(q.q)] ?? (tag?.lessons.length === 1 ? tag.lessons[0] : undefined);
      if (lessonId && !cur.lessonId) { cur.lessonId = lessonId; cur.grade = tag?.g; }
      acc.set(k, cur);
    }
  }
  return [...acc.values()].map((v) => ({ q: v.q, correctPct: Math.round((v.right / v.n) * 100), asked: v.asked, players: Math.round(v.n), lessonId: v.lessonId, grade: v.grade }))
    .sort((a, b) => a.correctPct - b.correctPct || b.players - a.players || a.q.localeCompare(b.q)).slice(0, limit);
}

export interface Reteach { grade: string; lessonId: string; missed: number; avgCorrect: number }
/** Lessons whose questions were missed most. Only questions under `under` percent right count; lessons are ranked by how many such questions, then by how badly. */
export function reteachList(missed: Missed[], under = 60): Reteach[] {
  const by = new Map<string, { grade: string; lessonId: string; n: number; sum: number }>();
  for (const m of missed) {
    if (!m.lessonId || !m.grade || m.correctPct >= under) continue;
    const k = `${m.grade}/${m.lessonId}`;
    const cur = by.get(k) ?? { grade: m.grade, lessonId: m.lessonId, n: 0, sum: 0 };
    cur.n += 1; cur.sum += m.correctPct; by.set(k, cur);
  }
  return [...by.values()].map((v) => ({ grade: v.grade, lessonId: v.lessonId, missed: v.n, avgCorrect: Math.round(v.sum / v.n) }))
    .sort((a, b) => b.missed - a.missed || a.avgCorrect - b.avgCorrect || a.lessonId.localeCompare(b.lessonId));
}

export interface Absent { id: string; name: string; lastSeen: string | null; daysAgo: number | null }
const dayNum = (iso: string) => Math.floor(Date.parse(`${iso}T12:00:00Z`) / 86400000);
/** Students on the class list who have not joined a live session in the last `days` days (or ever). Longest away first. */
export function notJoinedRecently(cls: ClassDoc, sessions: Session[], todayIso: string, days = 14): Absent[] {
  const last = new Map<string, string>();
  for (const s of sessions) for (const r of s.results) if (r.studentId && (!last.get(r.studentId) || s.date > last.get(r.studentId)!)) last.set(r.studentId, s.date);
  const t = dayNum(todayIso);
  return cls.students.map((st) => { const d = last.get(st.id) ?? null; return { id: st.id, name: st.name, lastSeen: d, daysAgo: d ? t - dayNum(d) : null }; })
    .filter((a) => a.daysAgo === null || a.daysAgo > days)
    .sort((a, b) => (b.daysAgo ?? 1e9) - (a.daysAgo ?? 1e9) || a.name.localeCompare(b.name));
}
