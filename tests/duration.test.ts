import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildSlides } from '../src/curriculum/LessonSlides';
import { estimateTime, activityMinutes, fitSlides, trimmedSlides, deckSeconds } from '../src/curriculum/duration';
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

  it('fits a deck to a class length: never empty, keeps the core and order, lands near the target', () => {
    const art = [1, 2, 3, 4].map((n) => ({ file: `a${n}.jpg`, title: `Art ${n}`, artist: 'Someone' }));
    const bad: string[] = [];
    let checked = 0;
    for (const g of grades) for (const u of g.units) for (const l of u.lessons) {
      if ((checked++ % 7) !== 0) continue;
      const bnd = bandOf(g.band);
      const slides = buildSlides({ lesson: { ...l, unit: u }, grade: g, gl, band: bnd, passages: [], ccc: [], videos: [], art: checked % 2 ? art : [], story: '', prayer: null as never, quiz: (l.quiz ?? []).map(parseQuiz), base: '' });
      for (const mins of [15, bnd.minutes, 30, 45, 60, 75]) {
        const out = fitSlides(slides, mins, g.band, l.activity);
        const id = `${g.id} ${l.id} @${mins}`;
        expect(out.length, id).toBeGreaterThan(3);
        for (const k of ['title', 'wonder', 'goals', 'do', 'exit', 'end'] as const) expect(out.some((s) => s.kind === k), `${id} keeps ${k}`).toBe(true);
        expect(out[0].kind).toBe('title'); expect(out[out.length - 1].kind).toBe('end');
        expect(out.filter((s) => s.kind === 'quiz').length, id).toBeGreaterThanOrEqual(Math.min(3, slides.filter((s) => s.kind === 'quiz').length));
        // order is kept
        let at = -1; for (const s of out) { const j = slides.findIndex((x, n) => n > at && x.label !== undefined && x.kind === s.kind && x.title === s.title && x.body === s.body); expect(j, id).toBeGreaterThan(at); at = j; }
        // section numbers are 1..n
        expect(out.filter((s) => s.kind === 'section').map((s) => s.n), id).toEqual(out.filter((s) => s.kind === 'section').map((_, n) => n + 1));
        const t = deckSeconds(out, g.band, l.activity) / 60;
        const stage = deckSeconds(slides, g.band, l.activity) / 60;
        const coreOnly = out.every((s) => ['title', 'wonder', 'goals', 'do', 'exit', 'end', 'prayer', 'quiz', 'idea', 'point', 'scripture', 'church'].includes(s.kind)) && ['idea', 'point', 'scripture', 'church'].every((k) => out.filter((s) => s.kind === k).length <= 1) && out.filter((s) => s.kind === 'quiz').length <= 3;
        if (t > mins * 1.1 && !coreOnly) bad.push(`${id}: ${t.toFixed(0)} min over target (full ${stage.toFixed(0)}), ${out.length} slides`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
  it('trimmedSlides returns the full deck unchanged and a shorter one otherwise', () => {
    const g = grades[0], u = g.units[0], l = u.lessons[0];
    const slides = buildSlides({ lesson: { ...l, unit: u }, grade: g, gl, band: bandOf(g.band), passages: [], ccc: [], videos: [], art: [], story: '', prayer: null as never, quiz: (l.quiz ?? []).map(parseQuiz), base: '' });
    expect(trimmedSlides(slides, 'full', 45, g.band, l.activity)).toBe(slides);
    expect(trimmedSlides(slides, 'short', 45, g.band, l.activity).length).toBeLessThanOrEqual(slides.length);
    expect(slides[0].meta?.band).toBe(g.band);
  });
});
