import { describe, expect, it } from 'vitest';
import { segmentsFor } from '../src/curriculum/LessonRun';
import { BANDS, ADULT } from '../src/curriculum/pedagogy';

const lesson = { id: 'x', title: 'T', idea: 'God made us. See CCC 1.', ccc: '1', scripture: 'Gen 1:1', vocab: [], question: 'Why?', activity: 'Draw it', prayer: null, talk: ['q1'], unit: { n: 1, title: 'U', pillar: 'Creed', eq: '', lessons: [] } };

describe('lesson in a box', () => {
  it('turns every band plan into timed steps that fill the class length', () => {
    for (const b of [...BANDS, ADULT]) {
      const segs = segmentsFor(lesson, b, { minutes: 45 });
      expect(segs.length).toBe(b.plan.length);
      expect(segs.every((s) => s.minutes >= 2 && s.say.length > 0)).toBe(true);
      const sum = segs.reduce((a, s) => a + s.minutes, 0);
      expect(Math.abs(sum - 45)).toBeLessThanOrEqual(4);
    }
  });
  it('removes catechism citations from spoken text', () => {
    const t = segmentsFor(lesson, BANDS[1], {}).flatMap((s) => s.say).join(' ');
    expect(t).not.toMatch(/\(CCC/);
  });
});
