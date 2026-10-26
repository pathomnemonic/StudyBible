/** Records for the teacher tools. A class keeps its roster; everything that happens in it is a small "classwork" record. */
export interface Student { id: string; name: string; email?: string; note?: string }
export interface Category { id: string; name: string; weight: number }
export interface ClassDoc {
  id: string; name: string; grade?: string; year: string; students: Student[]; categories: Category[];
  /** the cut-offs for letter grades, as percentages */
  scale: [letter: string, min: number][];
  createdAt: number; updatedAt?: number; archived?: boolean;
}
export type Mark = 'P' | 'A' | 'L' | 'E';
export interface SessionResult { studentId: string | null; name: string; score: number; correct: number; answered: number; total: number; joinedAt?: number; submitted?: boolean }
export interface QuestionStat { q: string; kind?: string; correctPct: number; answeredPct: number }
export type ClassWork =
  | { id: string; classId: string; kind: 'session'; date: string; ts: number; startedAt?: number; title: string; mode: 'lesson' | 'game' | 'exam'; code: string; results: SessionResult[]; questions: QuestionStat[]; updatedAt?: number }
  | { id: string; classId: string; kind: 'assessment'; date: string; title: string; category: string; points: number; type: 'game' | 'exam' | 'manual' | 'participation'; sessionId?: string; scores: Record<string, number | null>; /** students whose score the teacher typed in, so automatic updates leave it alone */ edited?: string[]; updatedAt?: number }
  | { id: string; classId: string; kind: 'attendance'; date: string; marks: Record<string, Mark>; updatedAt?: number };

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'participation', name: 'Participation', weight: 20 }, { id: 'quizzes', name: 'Quizzes and games', weight: 30 },
  { id: 'exams', name: 'Exams', weight: 40 }, { id: 'homework', name: 'Homework and projects', weight: 10 },
];
export const DEFAULT_SCALE: [string, number][] = [['A', 90], ['B', 80], ['C', 70], ['D', 60], ['F', 0]];
export const MARK_LABEL: Record<Mark, string> = { P: 'Present', A: 'Absent', L: 'Late', E: 'Excused' };

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const today = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
export const normName = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Find the roster student a joined name belongs to: the exact name, or first name plus last initial. */
export function matchStudent(name: string, students: Student[]): Student | undefined {
  const n = normName(name);
  if (!n) return undefined;
  const exact = students.find((s) => normName(s.name) === n);
  if (exact) return exact;
  const [first, ...rest] = n.split(' ');
  const cands = students.filter((s) => { const [f, ...r] = normName(s.name).split(' '); return f === first && (!rest.length || (r.length && r[r.length - 1][0] === rest[rest.length - 1][0])); });
  return cands.length === 1 ? cands[0] : undefined;
}

export const percent = (score: number | null | undefined, points: number) => (score === null || score === undefined || !points ? null : (score / points) * 100);
export const letter = (pct: number | null, scale: [string, number][]) => (pct === null ? '' : ([...scale].sort((a, b) => b[1] - a[1]).find(([, min]) => pct >= min)?.[0] ?? ''));

export interface Row { student: Student; byAssessment: Record<string, number | null>; byCategory: Record<string, number | null>; total: number | null }
/** Each student's percentage on each assessment, in each category, and overall using the category weights (categories without any scores are left out of the weighting). */
export function gradebook(cls: ClassDoc, assessments: Extract<ClassWork, { kind: 'assessment' }>[]): Row[] {
  return cls.students.map((student) => {
    const byAssessment: Record<string, number | null> = {};
    const sums: Record<string, { got: number; of: number }> = {};
    for (const a of assessments) {
      const sc = a.scores[student.id];
      byAssessment[a.id] = percent(sc, a.points);
      if (sc === null || sc === undefined) continue;
      const s = (sums[a.category] ??= { got: 0, of: 0 });
      s.got += sc; s.of += a.points;
    }
    const byCategory: Record<string, number | null> = {};
    let w = 0, acc = 0;
    for (const c of cls.categories) {
      const s = sums[c.id];
      byCategory[c.id] = s && s.of ? (s.got / s.of) * 100 : null;
      if (byCategory[c.id] !== null && c.weight > 0) { w += c.weight; acc += c.weight * byCategory[c.id]!; }
    }
    return { student, byAssessment, byCategory, total: w ? acc / w : null };
  });
}

export interface AttendanceSummary { present: number; absent: number; late: number; excused: number; days: number; rate: number | null }
export function attendanceSummary(studentId: string, days: Extract<ClassWork, { kind: 'attendance' }>[]): AttendanceSummary {
  const s = { present: 0, absent: 0, late: 0, excused: 0, days: 0, rate: null as number | null };
  for (const d of days) {
    const m = d.marks[studentId];
    if (!m) continue;
    s.days++;
    if (m === 'P') s.present++; else if (m === 'A') s.absent++; else if (m === 'L') s.late++; else s.excused++;
  }
  const counted = s.days - s.excused;
  s.rate = counted > 0 ? ((s.present + s.late) / counted) * 100 : null;
  return s;
}

const q2 = (v: string | number | null | undefined) => { const t = String(v ?? ''); return `"${(/^[=+\-@]/.test(t) ? `'${t}` : t).replace(/"/g, '""')}"`; };
export const toCsv = (rows: (string | number | null | undefined)[][]) => rows.map((r) => r.map(q2).join(',')).join('\n');
