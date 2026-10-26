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
    for (const k of ['wonder', 'meet', 'idea', 'vocab', 'scripture', 'timer', 'do', 'saint', 'quiz', 'life', 'exit', 'prayer', 'end']) expect(kinds).toContain(k);
    expect(kinds.filter((k) => k === 'timer').length).toBe(2); // each discussion question becomes a timed think-pair-share
    expect(kinds.indexOf('meet')).toBeLessThan(kinds.indexOf('idea')); // a story comes before the idea
  });
  it('adds a poll, myth-or-truth cards and a debate when the lesson names common mistakes', () => {
    const lesson = { id: 'X-2-1', title: 'T', idea: 'God made everything good. It is a gift.', ccc: '1', scripture: 'Genesis 1:1', vocab: [], question: 'Why?', activity: 'Do it.', prayer: null, misc: ['“Science and faith must fight.”', '“Matter is evil.”'], unit: { n: 1, title: 'U', pillar: 'Creed', eq: 'EQ?', lessons: [] } };
    const grade = { id: '9', name: 'Grade 9', band: 'high' as const, age: '14', theme: 't', units: [] };
    const slides = buildSlides({ lesson, grade, gl: {}, band: BANDS[3], passages: [], ccc: [], videos: [], art: [], story: '', prayer: null, quiz: [], base: '/' });
    const kinds = slides.map((s) => s.kind);
    expect(kinds).toContain('poll');
    expect(kinds.filter((k) => k === 'myth').length).toBeGreaterThanOrEqual(2);
    expect(kinds).toContain('debate');
    expect(slides.find((s) => s.kind === 'myth' && s.reveal?.startsWith('MYTH'))!.reveal).toContain('God made everything good');
    // younger children get the games but not the debate
    const young = buildSlides({ lesson, grade: { ...grade, id: '2', band: 'primary' as const }, gl: {}, band: BANDS[0], passages: [], ccc: [], videos: [], art: [], story: '', prayer: null, quiz: [], base: '/' });
    expect(young.map((s) => s.kind)).not.toContain('debate');
  });
});
