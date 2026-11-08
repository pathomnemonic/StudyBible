import { describe, expect, it } from 'vitest';
import { averages, lessonsTaught, missedQuestions, notJoinedRecently, reteachList, sessionAverage, type Session } from '../src/teach/dashboard';
import { bonusFor, toBank } from '../src/curriculum/bonusTrivia';
import { buildPlan, gradeForAge, mondayOf, nextLesson, planText, weekDates } from '../src/teach/parent';
import type { ClassDoc } from '../src/teach/model';
import type { TQ } from '../src/lib/trivia';

const r = (studentId: string | null, name: string, correct: number, total = 10) => ({ studentId, name, score: 0, correct, answered: total, total });
const S = (id: string, date: string, title: string, results: Session['results'], questions: Session['questions'], mode: Session['mode'] = 'game'): Session =>
  ({ id, classId: 'c', kind: 'session', date, ts: Date.parse(date), title, mode, code: id, results, questions });
const cls = { id: 'c', name: 'G5', year: 'x', createdAt: 1, categories: [], scale: [], students: [{ id: 'a', name: 'Ann' }, { id: 'b', name: 'Bo' }, { id: 'z', name: 'Zed' }] } as ClassDoc;
const s1 = S('s1', '2026-10-01', 'Baptism', [r('a', 'Ann', 8), r('b', 'Bo', 4)], [{ q: 'What is water for?', correctPct: 40, answeredPct: 100 }, { q: 'Who baptized Jesus?', correctPct: 90, answeredPct: 100 }]);
const s2 = S('s2', '2026-10-20', 'Baptism', [r('a', 'Ann', 10), r('b', 'Bo', 6), r(null, 'Guest', 2)], [{ q: 'what is water for? ', correctPct: 70, answeredPct: 100 }, { q: 'Skipped', correctPct: 0, answeredPct: 0 }]);
const s3 = S('s3', '2026-10-20', 'Eucharist', [r('a', 'Ann', 5)], [], 'lesson');

describe('dashboard aggregations', () => {
  it('averages sessions and skips lesson-only ones', () => {
    expect(sessionAverage(s1)).toBe(60);
    expect(sessionAverage(s3)).toBeNull();
    expect(averages([s2, s1, s3]).map((p) => [p.id, p.avg])).toEqual([['s1', 60], ['s2', 60]]);
  });
  it('lists lessons taught by day, newest first', () => {
    const t = lessonsTaught([s1, s2, s3]);
    expect(t.map((d) => d.date)).toEqual(['2026-10-20', '2026-10-01']);
    expect(t[0].titles).toEqual(['Baptism', 'Eucharist']);
    expect(t[0].joined).toBe(4);
  });
  it('merges repeated questions weighted by players and drops unanswered ones', () => {
    const m = missedQuestions([s1, s2]);
    expect(m.map((x) => x.q)).toEqual(['What is water for?', 'Who baptized Jesus?']);
    expect(m[0].correctPct).toBe(58); // (0.4*2 + 0.7*3) / 5 = 0.58
    expect(m[0].asked).toBe(2);
  });
  it('builds the reteach list from tagged sessions', () => {
    const tag = { g: '5', lessons: ['l1', 'l2'], owner: { 'What is water for?': 'l1', 'Who baptized Jesus?': 'l2' } };
    const rt = reteachList(missedQuestions([s1, s2], () => tag, 50));
    expect(rt).toEqual([{ grade: '5', lessonId: 'l1', missed: 1, avgCorrect: 58 }]);
  });
  it('finds students who have not joined lately', () => {
    const a = notJoinedRecently(cls, [s1, s2], '2026-11-08', 14);
    expect(a.map((x) => [x.name, x.daysAgo])).toEqual([['Zed', null], ['Ann', 19], ['Bo', 19]]);
    expect(notJoinedRecently(cls, [s1, s2], '2026-10-25', 14).map((x) => x.name)).toEqual(['Zed']);
  });
});

describe('bonus trivia', () => {
  const tq = (id: string, q: string, ccc?: number): TQ => ({ id, d: 1, q, o: ['a', 'b', 'c', 'd'], a: 1, why: '', src: { kind: 'ccc', label: 'x', ccc } });
  it('prefers catechism-number hits and shared words, ignores the rest', () => {
    const bank = { doctrine: [tq('1', 'Unrelated thing about sheep'), tq('2', 'Anything', 1213), tq('3', 'Baptism uses what element?')] };
    const got = bonusFor(bank, { title: 'Baptism, the gate', ccc: '1210-1216' }, 5);
    expect(got.map((g) => g.q.id)).toEqual(['2']);
    expect(toBank(got[0].q)).toMatchObject({ type: 'mc', correct: [1], kind: 'trivia' });
  });
});

describe('parent plan', () => {
  it('works out grades, weeks and the next lesson', () => {
    expect(gradeForAge(5)).toBe('K'); expect(gradeForAge(7)).toBe('1'); expect(gradeForAge(11)).toBe('5'); expect(gradeForAge(18)).toBe('YA');
    expect(mondayOf('2026-11-08')).toBe('2026-11-02');
    expect(weekDates('2026-11-02')[6]).toBe('2026-11-08');
    expect(nextLesson(3, [0, 2])).toBe(1); expect(nextLesson(2, [0, 1])).toBeNull();
  });
  it('lays out a week with a lesson per child and Sunday Mass', () => {
    const kid = { id: 'k', name: 'Maria', grade: '5' };
    const days = buildPlan({ monday: '2026-11-02', kids: [{ kid, grade: '5', index: 0, lesson: { id: 'l', title: 'T', question: 'Q?', activity: 'A' } }], saint: { who: 'St X', text: 'hi' }, prayer: { id: 'p', title: 'Hail Mary', text: '...' } });
    expect(days).toHaveLength(7);
    expect(days[0].items[0].to).toBe('/study/curriculum/5/l');
    expect(days[6].items[0].kind).toBe('mass');
    expect(planText(days, [kid], '2026-11-02')).toContain('[ ] Maria: lesson');
  });
});
