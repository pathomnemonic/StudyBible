import { describe, expect, it } from 'vitest';
import { buildSlides, chunk } from '../src/curriculum/LessonSlides';
import { BANDS } from '../src/curriculum/pedagogy';
import { parseQuiz } from '../src/curriculum/model';

describe('lesson slides', () => {
  it('splits text on sentence boundaries', () => {
    const t = 'One sentence here. Another sentence follows. A third one ends it.';
    const c = chunk(t, 30);
    expect(c.length).toBeGreaterThan(1);
    expect(c.join(' ')).toBe(t);
  });
  it('builds a real deck: title, question, idea, words, scripture, activity, check, prayer, close', () => {
    const lesson = { id: 'X-1-1', title: 'T', idea: 'An idea. More.', ccc: '1', scripture: 'John 1:1', vocab: ['grace'], question: 'Why?', activity: 'Do it.', prayer: null, talk: ['Q1', 'Q2'], life: 'Live it', saint: 'Name: line.', unit: { n: 1, title: 'U', pillar: 'Creed', eq: 'EQ?', lessons: [] } };
    const grade = { id: '5', name: 'Grade 5', band: 'elementary' as const, age: '10', theme: 't', units: [] };
    const q = [parseQuiz('Q?|a|b|c|d|2|because')];
    const slides = buildSlides({ lesson, grade, gl: { grace: { w: 'grace', d: 'a gift' } }, band: BANDS[1], passages: [{ label: 'John 1:1', ref: {} as never, path: '', verses: [{ v: 1, c: 1, text: 'In the beginning was the Word.' }] }], ccc: [], videos: [], art: [], story: '', prayer: { id: 'p', title: 'Our Father', text: 'Our Father.', tags: [] }, quiz: q, base: '/' });
    const kinds = slides.map((s) => s.kind);
    expect(kinds[0]).toBe('title');
    for (const k of ['wonder', 'idea', 'vocab', 'scripture', 'talk', 'do', 'saint', 'quiz', 'life', 'prayer', 'end']) expect(kinds).toContain(k);
    expect(kinds.filter((k) => k === 'talk').length).toBe(2);
  });
});
