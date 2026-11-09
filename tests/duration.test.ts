import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildSlides } from '../src/curriculum/LessonSlides';
import { estimateTime, activityMinutes } from '../src/curriculum/duration';
import { bandOf } from '../src/curriculum/pedagogy';
import { parseQuiz, type GradeData } from '../src/curriculum/model';

const dir = join(__dirname, '..', 'public', 'data', 'curriculum');
const gl = JSON.parse(readFileSync(join(dir, 'glossary.json'), 'utf8'));
const grades: GradeData[] = readdirSync(dir).filter((f) => /^grade-.*\.json$/.test(f)).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

describe('lesson length and slide depth', () => {
  const rows: Record<string, { n: number; cls: number; self: number; slides: number; content: number }> = {};
  for (const g of grades) for (const u of g.units) for (const l of u.lessons) {
    const slides = buildSlides({ lesson: { ...l, unit: u }, grade: g, gl, band: bandOf(g.band), passages: [], ccc: [], videos: [], art: [], story: '', prayer: null as never, quiz: (l.quiz ?? []).map(parseQuiz), base: '' });
    const t = estimateTime(slides, g.band, l.activity);
    const r = (rows[g.band] ??= { n: 0, cls: 0, self: 0, slides: 0, content: 0 });
    r.n++; r.cls += t.classMinutes; r.self += t.selfMinutes; r.slides += t.slides; r.content += t.contentSlides;
  }
  it('reads the minutes an activity names, else a default for the age', () => {
    expect(activityMinutes('“Commandment charades” (25 min). Write cards', 'elementary')).toBe(25);
    expect(activityMinutes('Draw a picture', 'primary')).toBe(8);
  });
  it('every band has a believable length and real teaching slides (not only framing)', () => {
    const out = Object.entries(rows).map(([b, r]) => `${b}: ${r.n} lessons, class ${(r.cls / r.n).toFixed(0)} min, alone ${(r.self / r.n).toFixed(0)} min, ${(r.slides / r.n).toFixed(1)} slides, ${(r.content / r.n).toFixed(1)} teaching slides`);
    console.log(out.join('\n'));
    for (const [b, r] of Object.entries(rows)) {
      expect(r.cls / r.n, `${b} class minutes`).toBeGreaterThan(20);
      expect(r.cls / r.n, `${b} class minutes`).toBeLessThan(120);
      expect(r.self / r.n, `${b} self minutes`).toBeGreaterThan(5);
      expect(r.content / r.n, `${b} teaching slides`).toBeGreaterThanOrEqual(b === 'primary' ? 4 : 6);
    }
  });
});
