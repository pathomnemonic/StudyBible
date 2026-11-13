import { describe, expect, it } from 'vitest';
import { pacingSchedule, unitSpans } from '../src/curriculum/pacing';

const lessons = Array.from({ length: 6 }, (_, i) => ({ id: `l${i + 1}`, title: `Lesson ${i + 1}`, unit: i < 3 ? 1 : 2 }));

describe('pacing a grade over the year', () => {
  it('puts one lesson on each teaching day, in order', () => {
    const { rows, endsOn } = pacingSchedule({ lessons, start: '2026-09-07', days: [1, 3] }); // Mondays and Wednesdays
    expect(rows.map((r) => r.date)).toEqual(['2026-09-07', '2026-09-09', '2026-09-14', '2026-09-16', '2026-09-21', '2026-09-23']);
    expect(rows.map((r) => r.lessonId)).toEqual(['l1', 'l2', 'l3', 'l4', 'l5', 'l6']);
    expect(endsOn).toBe('2026-09-23');
  });
  it('skips single days and whole breaks', () => {
    const { rows } = pacingSchedule({ lessons, start: '2026-09-07', days: [1, 3], skip: ['2026-09-09'], breaks: [['2026-09-14', '2026-09-18']] });
    expect(rows.map((r) => r.date)).toEqual(['2026-09-07', '2026-09-21', '2026-09-23', '2026-09-28', '2026-09-30', '2026-10-05']);
  });
  it('can teach two lessons on a day', () => {
    const { rows } = pacingSchedule({ lessons, start: '2026-09-07', days: [1], perDay: 2 });
    expect(rows.map((r) => r.date)).toEqual(['2026-09-07', '2026-09-07', '2026-09-14', '2026-09-14', '2026-09-21', '2026-09-21']);
  });
  it('gives nothing back when there are no teaching days or no lessons', () => {
    expect(pacingSchedule({ lessons, start: '2026-09-07', days: [] }).rows).toEqual([]);
    expect(pacingSchedule({ lessons: [], start: '2026-09-07', days: [1] }).endsOn).toBeNull();
  });
  it('reports where each unit starts and ends', () => {
    const { rows } = pacingSchedule({ lessons, start: '2026-09-07', days: [1, 3] });
    expect(unitSpans(rows)).toEqual([{ unit: 1, from: '2026-09-07', to: '2026-09-14', lessons: 3 }, { unit: 2, from: '2026-09-16', to: '2026-09-23', lessons: 3 }]);
  });
});
