import { describe, expect, it } from 'vitest';
import { buildSlides, chunk, headline, slideLines, splitCcc } from '../src/curriculum/LessonSlides';
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
    for (const k of ['wonder', 'meet', 'idea', 'vocab', 'scripture', 'timer', 'do', 'saint', 'quiz', 'life', 'exit', 'prayer', 'end', 'section', 'goals']) expect(kinds).toContain(k);
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

describe('slide helpers', () => {
  it('makes a short headline and keeps the rest', () => {
    const h = headline('God is almighty, and his power is shown most in mercy and in forgiveness of sinners. He loves us.', 60);
    expect(h.head.length).toBeLessThanOrEqual(62);
    expect(`${h.head} ${h.rest}`).toContain('He loves us');
  });
  it('lifts Catechism citations out of a sentence', () => {
    const r = splitCcc('Baptism frees us from sin (CCC 1213, 1250). It makes us God’s children.');
    expect(r.chips).toEqual(['CCC 1213, 1250']);
    expect(r.text).toBe('Baptism frees us from sin. It makes us God’s children.');
  });
  it('turns a quiz slide into handout lines with the answer', () => {
    const q = parseQuiz('Who made us?|Nobody|God|Chance|Fate|1|God made us.');
    const lines = slideLines({ kind: 'quiz', label: 'Check', q } as never);
    expect(lines.join('\n')).toContain('Answer: B.');
    expect(lines.join('\n')).toContain('B. God');
  });
});

describe('students see only what is for students', () => {
  it('keeps the hook, the activity instructions, the assessment and the misconceptions to the teacher notes', () => {
    const lesson = {
      id: 'X-3-1', title: 'T', idea: 'God made us. He loves us.', ccc: '1', scripture: 'Genesis 1:1', vocab: [], question: 'Why?',
      activity: '“Four scenes” (25 min). TEACHER-INSTRUCTION hand out the paper and have children draw.', prayer: null,
      hook: 'HOOK-FOR-TEACHER spill ink on a white cloth and ask what happens.', assess: 'ASSESS-FOR-TEACHER ask what the first sin broke.',
      misc: ['“MISCONCEPTION God is angry with us.”'], teach: ['TEACH-POINT for the teacher.'],
      script: { open: 'SCRIPT-OPEN', teach: ['SCRIPT-TEACH'], ask: ['a'], practice: ['SCRIPT-PRACTICE'], close: 'SCRIPT-CLOSE' },
      tryit: ['Draw the first scene.'], saint: 'Name: a line', saintStory: 'Who she was.\nWhat she did.\nWhy it matters.',
      unit: { n: 1, title: 'U', pillar: 'p', eq: 'e', lessons: [] },
    };
    const grade = { id: '4', name: 'Grade 4', band: 'elementary' as const, age: '9', theme: 't', units: [] };
    const slides = buildSlides({ lesson: lesson as never, grade, gl: {}, band: BANDS[1], passages: [], ccc: [], videos: [], art: [], story: '', prayer: null, quiz: [], base: '/' });
    // what the class sees is everything except the speaker notes
    const seen = slides.map((s) => slideLines({ ...s, notes: undefined }).join(' ')).join(' ');
    for (const secret of ['HOOK-FOR-TEACHER', 'ASSESS-FOR-TEACHER', 'TEACHER-INSTRUCTION', 'TEACH-POINT', 'SCRIPT-', 'for the teacher']) expect(seen, secret).not.toContain(secret);
    // while the teacher still has them
    const notes = slides.flatMap((s) => s.notes ?? []).join(' ');
    expect(notes).toContain('SCRIPT-OPEN');
    expect(notes).toContain('SCRIPT-PRACTICE');
    // the students get the activity's name and their own steps
    expect(seen).toContain('Four scenes');
    expect(seen).toContain('Draw the first scene.');
    // the saint's story is told in parts
    expect(slides.filter((s) => s.kind === 'saint').map((s) => s.body)).toEqual(['What she did.', 'Why it matters.']);
  });
});
