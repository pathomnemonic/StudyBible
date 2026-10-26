import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { LiveView } from '../live/types';
import { DEFAULT_CATEGORIES, DEFAULT_SCALE, matchStudent, today, uid, type ClassDoc, type ClassWork, type Mark, type SessionResult, type Student } from './model';

type Session = Extract<ClassWork, { kind: 'session' }>;
type Assessment = Extract<ClassWork, { kind: 'assessment' }>;
type Attendance = Extract<ClassWork, { kind: 'attendance' }>;

export const useClasses = () => useLiveQuery(() => db.classes.toArray(), []);
export const useClass = (id: string) => useLiveQuery(() => db.classes.get(id), [id]);
export const useWork = (classId: string) => useLiveQuery(() => db.classwork.where('classId').equals(classId).toArray(), [classId]) ?? [];
export const sessionsOf = (w: ClassWork[]) => w.filter((x): x is Session => x.kind === 'session').sort((a, b) => b.ts - a.ts);
export const assessmentsOf = (w: ClassWork[]) => w.filter((x): x is Assessment => x.kind === 'assessment').sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
export const attendanceOf = (w: ClassWork[]) => w.filter((x): x is Attendance => x.kind === 'attendance').sort((a, b) => a.date.localeCompare(b.date));

export async function createClass(name: string, grade?: string): Promise<string> {
  const id = uid();
  const y = new Date().getFullYear(), m = new Date().getMonth();
  await db.classes.put({ id, name: name.trim() || 'My class', grade, year: m >= 7 ? `${y}–${y + 1}` : `${y - 1}–${y}`, students: [], categories: DEFAULT_CATEGORIES, scale: DEFAULT_SCALE, createdAt: Date.now() });
  return id;
}
export const saveClass = (c: ClassDoc) => db.classes.put({ ...c, updatedAt: Date.now() });
export async function deleteClass(id: string) {
  await db.transaction('rw', db.classes, db.classwork, async () => {
    await db.classwork.where('classId').equals(id).delete();
    await db.classes.delete(id);
  });
}
export const newStudent = (name: string): Student => ({ id: uid(), name: name.trim() });

/** Add names, one per line (a comma-separated "Last, First" line is kept as written). Skips names already on the list. */
export async function addStudents(c: ClassDoc, text: string): Promise<number> {
  const have = new Set(c.students.map((s) => s.name.toLowerCase()));
  const add = text.split(/\n+/).map((l) => l.trim()).filter((l) => l && !have.has(l.toLowerCase())).map(newStudent);
  if (add.length) await saveClass({ ...c, students: [...c.students, ...add] });
  return add.length;
}

export interface HostMeta { classId: string; title: string; mode: 'lesson' | 'game' | 'exam'; date: string }

/** Keep the class record for a live session up to date: who came, how they did, and (once it ends) the attendance and the gradebook. */
export async function recordSession(v: LiveView, meta: HostMeta) {
  const cls = await db.classes.get(meta.classId);
  if (!cls || !v.results) return;
  const id = `sess:${v.code}`;
  const old = (await db.classwork.get(id)) as Session | undefined;
  const mapped = new Map<string, string | null>((old?.results ?? []).map((r) => [r.name, r.studentId]));
  const results: SessionResult[] = v.results.players.map((p) => ({
    studentId: mapped.has(p.name) ? mapped.get(p.name)! : matchStudent(p.name, cls.students)?.id ?? null,
    name: p.name, score: p.score, correct: p.correct, answered: p.answered, total: v.settings.mode === 'race' || v.settings.mode === 'build' ? p.total : v.qCount || p.total, joinedAt: p.joinedAt, submitted: p.submitted,
  }));
  const rec: Session = { id, classId: meta.classId, kind: 'session', date: old?.date ?? meta.date, ts: old?.ts ?? Date.now(), startedAt: v.results.startedAt || old?.startedAt, title: meta.title, mode: meta.mode, code: v.code, results, questions: v.results.questions.map((q) => ({ q: q.q, correctPct: q.correctPct, answeredPct: q.answeredPct })) };
  await db.classwork.put(rec);
  await applySession(rec, v.phase === 'ended', rec.startedAt);
}

/** Turn a session record into attendance marks and gradebook entries. Safe to run again after the teacher fixes who a name belongs to. */
export async function applySession(s: Session, ended: boolean, startedAt = 0) {
  const cls = await db.classes.get(s.classId);
  if (!cls) return;
  // attendance: whoever joined is present (late if they came well after the start); a teacher's own marks are never overwritten
  const attId = `att:${s.classId}:${s.date}`;
  const att = ((await db.classwork.get(attId)) as Attendance | undefined) ?? { id: attId, classId: s.classId, kind: 'attendance' as const, date: s.date, marks: {} };
  const marks: Record<string, Mark> = { ...att.marks };
  const auto = new Set(((await db.cache.get(`att-auto:${attId}`))?.value as unknown as string[] | undefined) ?? []);
  for (const r of s.results) {
    if (!r.studentId) continue;
    const cur = marks[r.studentId];
    if (cur && !auto.has(r.studentId)) continue;
    marks[r.studentId] = startedAt && r.joinedAt && r.joinedAt > startedAt + 3 * 60_000 ? 'L' : 'P';
    auto.add(r.studentId);
  }
  if (ended) for (const st of cls.students) if (!marks[st.id]) { marks[st.id] = 'A'; auto.add(st.id); }
  await db.classwork.put({ ...att, marks });
  await db.cache.put({ key: `att-auto:${attId}`, value: [...auto] as unknown as string, ts: Date.now() });
  if (!ended) return;
  // gradebook
  const q = s.results[0]?.total || 0;
  if (s.mode === 'game' || s.mode === 'exam') {
    const scores: Record<string, number | null> = {};
    for (const st of cls.students) { const r = s.results.find((x) => x.studentId === st.id); scores[st.id] = r ? (s.mode === 'exam' ? r.score : r.total ? (r.correct / r.total) * 100 : 0) : null; }
    const a: Assessment = { id: `asm:${s.code}`, classId: s.classId, kind: 'assessment', date: s.date, title: s.title, category: s.mode === 'exam' ? 'exams' : 'quizzes', points: 100, type: s.mode, sessionId: s.id, scores };
    const prev = (await db.classwork.get(a.id)) as Assessment | undefined;
    // grades the teacher typed in by hand are kept
    const kept = Object.fromEntries((prev?.edited ?? []).map((k) => [k, prev!.scores[k] ?? null]));
    await db.classwork.put({ ...a, scores: { ...a.scores, ...kept }, edited: prev?.edited });
  }
  if (s.mode !== 'exam') {
    const scores: Record<string, number | null> = {};
    for (const st of cls.students) { const r = s.results.find((x) => x.studentId === st.id); scores[st.id] = r ? (s.mode === 'lesson' || !q ? 100 : Math.min(100, (r.answered / q) * 100)) : null; }
    await db.classwork.put({ id: `part:${s.code}`, classId: s.classId, kind: 'assessment', date: s.date, title: `${s.title} (participation)`, category: 'participation', points: 100, type: 'participation', sessionId: s.id, scores } as Assessment);
  }
}

/** Say which student a joined name is, then redo attendance and grades. */
export async function mapPlayer(sessionId: string, name: string, studentId: string | null) {
  const s = (await db.classwork.get(sessionId)) as Session | undefined;
  if (!s) return;
  const next = { ...s, results: s.results.map((r) => (r.name === name ? { ...r, studentId } : r)) };
  await db.classwork.put(next);
  await applySession(next, true, next.startedAt);
}

export async function setMark(classId: string, date: string, studentId: string, mark: Mark | null) {
  const id = `att:${classId}:${date}`;
  const att = ((await db.classwork.get(id)) as Attendance | undefined) ?? { id, classId, kind: 'attendance' as const, date, marks: {} };
  const marks = { ...att.marks };
  if (mark) marks[studentId] = mark; else delete marks[studentId];
  await db.classwork.put({ ...att, marks });
  // once the teacher sets a mark by hand it stops being an automatic one
  const auto = new Set(((await db.cache.get(`att-auto:${id}`))?.value as unknown as string[] | undefined) ?? []);
  if (auto.delete(studentId)) await db.cache.put({ key: `att-auto:${id}`, value: [...auto] as unknown as string, ts: Date.now() });
}
export async function setScore(a: Assessment, studentId: string, value: number | null) {
  const edited = [...new Set([...(a.edited ?? []), studentId])];
  await db.classwork.put({ ...a, scores: { ...a.scores, [studentId]: value }, edited });
}
export async function addAssessment(classId: string, title: string, category: string, points: number, date = today()) {
  await db.classwork.put({ id: uid(), classId, kind: 'assessment', date, title: title.trim() || 'Assignment', category, points: points || 100, type: 'manual', scores: {} });
}
