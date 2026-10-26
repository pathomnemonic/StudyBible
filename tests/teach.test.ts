import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CATEGORIES, DEFAULT_SCALE, attendanceSummary, gradebook, letter, matchStudent, toCsv, type ClassDoc, type ClassWork } from '../src/teach/model';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });

const cls: ClassDoc = { id: 'c1', name: 'Grade 9', year: '2026–2027', createdAt: 1, categories: DEFAULT_CATEGORIES, scale: DEFAULT_SCALE, students: [{ id: 's1', name: 'Maria Lopez' }, { id: 's2', name: 'James Carter' }, { id: 's3', name: 'Anh Nguyen' }] };

describe('names and grades', () => {
  it('matches a joined name to the class list', () => {
    expect(matchStudent('maria lopez', cls.students)?.id).toBe('s1');
    expect(matchStudent('Maria L', cls.students)?.id).toBe('s1');
    expect(matchStudent('James', cls.students)?.id).toBe('s2');
    expect(matchStudent('Zed', cls.students)).toBeUndefined();
    expect(matchStudent('', cls.students)).toBeUndefined();
  });
  it('weights categories and skips ones with no scores yet', () => {
    const asm: Extract<ClassWork, { kind: 'assessment' }>[] = [
      { id: 'a1', classId: 'c1', kind: 'assessment', date: '2026-09-01', title: 'Quiz', category: 'quizzes', points: 100, type: 'game', scores: { s1: 90, s2: 60 } },
      { id: 'a2', classId: 'c1', kind: 'assessment', date: '2026-09-02', title: 'Exam', category: 'exams', points: 50, type: 'exam', scores: { s1: 40, s2: null } },
    ];
    const rows = gradebook(cls, asm);
    // quizzes 30 and exams 40 count, scaled to 70: Maria = (90*30 + 80*40) / 70
    expect(rows[0].total).toBeCloseTo((90 * 30 + 80 * 40) / 70, 5);
    expect(rows[1].total).toBeCloseTo(60, 5); // James has no exam score, so only the quiz counts
    expect(rows[2].total).toBeNull();
    expect(letter(rows[0].total, DEFAULT_SCALE)).toBe('B');
    expect(letter(null, DEFAULT_SCALE)).toBe('');
  });
  it('summarizes attendance, leaving excused days out of the rate', () => {
    const days = (['P', 'L', 'A', 'E'] as const).map((m, i) => ({ id: `d${i}`, classId: 'c1', kind: 'attendance' as const, date: `2026-09-0${i + 1}`, marks: { s1: m } }));
    const a = attendanceSummary('s1', days);
    expect(a).toMatchObject({ present: 1, late: 1, absent: 1, excused: 1, days: 4 });
    expect(a.rate).toBeCloseTo((2 / 3) * 100, 5);
  });
  it('makes safe CSV', () => {
    expect(toCsv([['=BAD()', 'a "q"']])).toBe(`"'=BAD()","a ""q"""`);
  });
});

describe('recording a live session', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); });
  const view = (phase: string, players: any[]): any => ({ code: '123456', phase, qCount: 4, results: { startedAt: 1_000_000, players, questions: [{ q: 'Q1', correctPct: 50, answeredPct: 100 }] } });
  it('takes attendance, matches names, grades and lets the teacher fix an unmatched name', async () => {
    const { db } = await import('../src/db/db');
    const s = await import('../src/teach/store');
    await db.classes.put({ ...cls });
    const meta = { classId: 'c1', title: 'Lesson 1', mode: 'game' as const, date: '2026-09-10' };
    const players = [
      { id: 'p1', name: 'Maria Lopez', score: 2000, correct: 3, answered: 4, total: 4, joinedAt: 1_000_100, submitted: true },
      { id: 'p2', name: 'Jamie C', score: 500, correct: 1, answered: 2, total: 4, joinedAt: 1_000_000 + 5 * 60_000, submitted: true },
    ];
    await s.recordSession(view('question', players), meta);
    let att = (await db.classwork.get('att:c1:2026-09-10')) as any;
    expect(att.marks).toEqual({ s1: 'P' }); // nothing graded or marked absent until the session ends
    await s.recordSession(view('ended', players), meta);
    att = (await db.classwork.get('att:c1:2026-09-10')) as any;
    expect(att.marks).toMatchObject({ s1: 'P', s2: 'A', s3: 'A' });
    const quiz = (await db.classwork.get('asm:123456')) as any;
    expect(quiz.scores.s1).toBeCloseTo(75, 5);
    expect(quiz.scores.s3).toBeNull();
    const part = (await db.classwork.get('part:123456')) as any;
    expect(part.scores.s1).toBe(100);
    // the teacher says "Jamie C" is James Carter: he becomes present (late), and gets his score
    await s.mapPlayer('sess:123456', 'Jamie C', 's2');
    att = (await db.classwork.get('att:c1:2026-09-10')) as any;
    expect(att.marks.s2).toBe('L');
    expect(((await db.classwork.get('asm:123456')) as any).scores.s2).toBeCloseTo(25, 5);
    // a hand-typed score survives a later automatic update
    await s.setScore(((await db.classwork.get('asm:123456')) as any), 's1', 99);
    await s.recordSession(view('ended', players), meta);
    expect(((await db.classwork.get('asm:123456')) as any).scores.s1).toBe(99);
    // and a mark the teacher set by hand is not replaced
    await s.setMark('c1', '2026-09-10', 's3', 'E');
    await s.recordSession(view('ended', players), meta);
    expect(((await db.classwork.get('att:c1:2026-09-10')) as any).marks.s3).toBe('E');
  });
});
