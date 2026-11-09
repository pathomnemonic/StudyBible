import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildMenu, ideasOf } from '../src/curriculum/options';
import { contentPoints, isGuidance } from '../src/curriculum/teachpoints';
import type { GradeData, LessonSpec } from '../src/curriculum/model';
import { bandOf } from '../src/curriculum/pedagogy';

const dir = join(__dirname, '..', 'public', 'data', 'curriculum');
const grades: GradeData[] = readdirSync(dir).filter((f) => /^grade-.*\.json$/.test(f)).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const all: { g: GradeData; l: LessonSpec }[] = grades.flatMap((g) => g.units.flatMap((u) => u.lessons.map((l) => ({ g, l }))));
const gl = JSON.parse(readFileSync(join(dir, 'glossary.json'), 'utf8'));
const words = (t: string) => t.split(/\s+/).filter(Boolean);
const sentences = (t: string) => (t.match(/[^.!?]+[.!?]+/g) ?? [t]);
/** Flesch-Kincaid grade, rough but steady enough to catch text that is far above its band */
function fk(t: string) {
  const w = words(t); if (!w.length) return 0;
  const syl = w.reduce((n, x) => n + Math.max(1, (x.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g) ?? []).length), 0);
  return 0.39 * (w.length / sentences(t).length) + 11.8 * (syl / w.length) - 15.59;
}
const CAP: Record<string, number> = { primary: 5, elementary: 8, middle: 11, high: 14, adult: 18 };

describe('lesson quality gates', () => {
  it('teacher guidance never becomes an idea to teach or a line spoken to a class', () => {
    const bad: string[] = [];
    for (const { g, l } of all) {
      for (const idea of ideasOf(l)) if (isGuidance(idea) && idea !== l.idea) bad.push(`${l.id}: ${idea.slice(0, 60)}`);
      const m = buildMenu(l, g.band, gl, 'paper');
      for (const c of m.concepts) if (/^aim:/i.test(c.concept)) bad.push(`${l.id}: concept ${c.concept.slice(0, 40)}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('the learner never sees the teacher guidance lines', () => {
    for (const { l } of all) for (const p of contentPoints(l)) expect(isGuidance(p), `${l.id}: ${p.slice(0, 50)}`).toBe(false);
  });

  it('every lesson still has an idea, a question, a Scripture reference, Catechism numbers and a quiz', () => {
    const bad = all.filter(({ l }) => !l.idea || !l.question || !l.scripture || !l.ccc || !(l.quiz && l.quiz.length >= 3)).map(({ l }) => l.id);
    expect(bad).toEqual([]);
  });

  it('where a lesson has the full learner layer, it is complete and at the right reading level', () => {
    const bad: string[] = [];
    for (const { g, l } of all) {
      if (!l.explain) continue;
      if (!l.objectives?.length) bad.push(`${l.id}: explain without objectives`);
      if (!l.remember || l.remember.length < 3 || l.remember.length > 5) bad.push(`${l.id}: remember needs 3 to 5 lines`);
      if (!l.materials?.length) bad.push(`${l.id}: no materials list`);
      const text = l.explain.join(' ').replace(/\([^)]*\)/g, ''); // the references stay in the text; judge the prose around them
      const grade = fk(text);
      if (grade > CAP[bandOf(g.band).id]) bad.push(`${l.id}: reading level ${grade.toFixed(1)} is above the cap for ${g.band}`);
      const n = words(l.explain.join(' ')).length;
      if (n < 120 || n > 420) bad.push(`${l.id}: explanation is ${n} words (aim for 150 to 300)`);
      if (/\b(Students will|Use child-friendly|Teacher)\b/.test(l.explain.join(' '))) bad.push(`${l.id}: teacher wording in the learner text`);
    }
    expect(bad).toEqual([]);
  });
});
