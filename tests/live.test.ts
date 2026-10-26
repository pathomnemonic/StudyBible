import { describe, expect, it } from 'vitest';
import { LiveHub, LiveRoom, isRight, sanitizeContent, sanitizeSettings } from '../src/live/engine';

const content = sanitizeContent({
  title: 'Test',
  slides: [{ label: 'Intro', title: 'Hello', body: 'Body', img: { src: 'javascript:alert(1)', alt: 'x' } }, { label: 'Two', items: ['a', 'b'] }],
  questions: [
    { type: 'mc', q: 'Pick B', options: ['A', 'B', 'C', 'D'], correct: [1], time: 20 },
    { type: 'multi', q: 'Pick the primes', options: ['2', '3', '4', '5'], correct: [0, 1, 3], time: 20 },
    { type: 'text', q: 'Name the first pope', correct: ['Peter', 'Simon Peter'], time: 20 },
    { type: 'order', q: 'Order', options: ['one', 'two', 'three'], correct: [0, 1, 2], time: 20 },
    { type: 'tf', q: 'Moses led them out', correct: [0], time: 10, points: 2 },
  ],
});
const settings = sanitizeSettings({ shuffleOptions: false });
const clock = () => { let t = 1_000_000; return { now: () => t, set: (n: number) => { t = n; } }; };

describe('sanitizing what a host sends', () => {
  it('drops unsafe image sources and bad questions', () => {
    expect(content.slides[0].img).toBeUndefined();
    const c = sanitizeContent({ questions: [{ type: 'mc', q: 'x', options: ['a'], correct: [0] }, { type: 'mc', q: 'ok', options: ['a', 'b'], correct: [5] }, { type: 'mc', q: 'ok', options: ['a', 'b'], correct: [1] }] });
    expect(c.questions).toHaveLength(1);
  });
  it('limits sizes', () => {
    const c = sanitizeContent({ questions: Array.from({ length: 500 }, () => ({ type: 'mc', q: 'q'.repeat(5000), options: ['a', 'b'], correct: [0] })) });
    expect(c.questions.length).toBeLessThanOrEqual(120);
    expect(c.questions[0].q.length).toBeLessThanOrEqual(400);
  });
});

describe('a live room', () => {
  it('runs slides, then questions, scoring faster answers higher and keeping streaks', () => {
    const k = clock();
    const r = new LiveRoom('123456', content, settings, k.now);
    const a = r.join('Ann'), b = r.join('Ann'), c = r.join('Cy');
    expect(r.view('host').players.map((p) => p.name)).toEqual(['Ann', 'Ann 2', 'Cy']);
    r.host('start');
    expect(r.phase).toBe('slides');
    r.host('slide', 1);
    expect(r.slideIndex).toBe(1);
    r.host('quiz');
    expect(r.phase).toBe('question');
    // players never see the answer while the question is open
    expect(r.view('player', a.token).reveal).toBeUndefined();
    k.set(k.now() + 2000);
    expect(r.answer(a.token, 1)).toBe(true);
    k.set(k.now() + 10000);
    expect(r.answer(b.token, 1)).toBe(true);
    expect(r.answer(a.token, 0)).toBe(false); // one answer each
    r.answer(c.token, 0);
    expect(r.phase).toBe('results'); // everyone answered
    const v = r.view('host');
    const sa = v.players.find((p) => p.id === a.id)!.score, sb = v.players.find((p) => p.id === b.id)!.score;
    expect(sa).toBeGreaterThan(sb);
    expect(sb).toBeGreaterThan(500);
    expect(v.reveal!.counts).toEqual([1, 2, 0, 0]);
    expect(r.view('player', c.token).me!.last).toMatchObject({ correct: false, points: 0 });
    r.host('next');
    expect(r.phase).toBe('board');
    r.host('next');
    expect(r.qIndex).toBe(1);
    // multi-select must be exactly right
    r.answer(a.token, [0, 1, 3]); r.answer(b.token, [0, 1]); r.answer(c.token, [0, 1, 2, 3]);
    expect(r.phase).toBe('results');
    expect(r.view('host').players.find((p) => p.id === a.id)!.score).toBeGreaterThan(sa + 500);
    expect(r.view('player', a.token).me!.last!.bonus).toBe(100); // a streak of one earns a bonus
    expect(r.view('player', b.token).me!.last!.correct).toBe(false);
  });
  it('ends a question when time is up, and the host can skip', () => {
    const k = clock();
    const r = new LiveRoom('222222', content, settings, k.now);
    const a = r.join('A'); r.join('B');
    r.host('quiz');
    r.answer(a.token, 1);
    expect(r.phase).toBe('question');
    k.set(k.now() + 21_000);
    expect(r.tick()).toBe(true);
    expect(r.phase).toBe('results');
  });
  it('accepts type-in answers ignoring case and accents, and checks order', () => {
    const q = content.questions;
    expect(isRight(q[2], ['  PETER '])).toBe(true);
    expect(isRight(q[2], ['Paul'])).toBe(false);
    expect(isRight(q[3], [0, 1, 2])).toBe(true);
    expect(isRight(q[3], [1, 0, 2])).toBe(false);
  });
  it('shuffles choices without losing the right answer', () => {
    const r = new LiveRoom('333333', content, sanitizeSettings({ shuffleOptions: true, shuffleQuestions: true }), clock().now);
    for (const q of r.content.questions) {
      if (q.type === 'mc') expect(q.options![q.correct[0] as number]).toBe('B');
      if (q.type === 'multi') expect((q.correct as number[]).map((i) => q.options![i]).sort()).toEqual(['2', '3', '5']);
      if (q.type === 'order') expect((q.correct as number[]).map((i) => q.options![i])).toEqual(['one', 'two', 'three']);
    }
  });
  it('assigns teams evenly, locks, kicks and exports safely', () => {
    const r = new LiveRoom('444444', content, sanitizeSettings({ teams: 2 }), clock().now);
    const ids = ['a', 'b', 'c', 'd'].map((n) => r.join(n));
    expect(r.view('host').players.map((p) => p.team)).toEqual([0, 1, 0, 1]);
    r.host('lock', true);
    expect(() => r.join('late')).toThrow(/locked/);
    r.host('kick', ids[0].id);
    expect(r.playerCount).toBe(3);
    r.join('=cmd()', ids[1].token); // reconnect, not a new player
    expect(r.playerCount).toBe(3);
    r.host('unknown'); // ignored
    expect(r.csv()).toMatch(/^"Rank"/);
    const x = new LiveRoom('555555', content, settings, clock().now); x.join('=HYPERLINK("x")');
    expect(x.csv()).toContain("\"'=HYPERLINK");
  });
  it('rooms get unique six-digit codes and expire', () => {
    const k = clock();
    const hub = new LiveHub(k.now, 3);
    const rooms = [1, 2, 3].map(() => hub.create(content, settings));
    expect(new Set(rooms.map((r) => r.code)).size).toBe(3);
    expect(() => hub.create(content, settings)).toThrow(/busy/);
    k.set(k.now() + 3 * 3600_000);
    hub.sweep();
    expect(hub.rooms.size).toBe(0);
  });
});

describe('class lists and exams', () => {
  it('lets students join only as a name on the class list, once each', () => {
    const r = new LiveRoom('600001', content, sanitizeSettings({}), clock().now, ['Ann Lee', 'Ben Cruz']);
    expect(() => r.join('Zed')).toThrow(/class list/);
    const a = r.join('ann lee');
    expect(r.view('host').players[0].name).toBe('Ann Lee');
    expect(r.rosterFree()).toEqual(['Ben Cruz']);
    expect(() => r.join('Ann Lee')).toThrow(/already in use/);
    expect(r.join('x', a.token).id).toBe(a.id); // coming back with the same device is fine
    const g = new LiveRoom('600002', content, sanitizeSettings({ rosterOnly: false }), clock().now, ['Ann Lee']);
    expect(g.join('Visitor').id).toBeTruthy();
  });
  it('runs an exam on one clock and scores each student alone', () => {
    const k = clock();
    const r = new LiveRoom('600003', content, sanitizeSettings({ mode: 'exam', examMinutes: 10, shuffleOptions: false }), k.now, ['Ann', 'Ben']);
    const a = r.join('Ann'), b = r.join('Ben');
    r.host('start');
    expect(r.phase).toBe('exam');
    expect(r.view('player', a.token).exam!.questions).toHaveLength(5);
    expect(JSON.stringify(r.view('player', a.token))).not.toContain('"correct"');
    expect(r.examAnswer(a.token, 0, 1)).toBe(true);
    expect(r.examAnswer(a.token, 1, [0, 1, 3])).toBe(true);
    expect(r.examAnswer(a.token, 2, ['peter'])).toBe(true);
    expect(r.examAnswer(a.token, 0, 9)).toBe(false);
    r.examAnswer(b.token, 0, 0);
    r.submit(a.token);
    expect(r.examAnswer(a.token, 3, [0, 1, 2])).toBe(false); // handed in
    const view = r.view('player', a.token);
    expect(view.exam!.submitted).toBe(true);
    expect(view.exam!.result!.correct).toBe(3);
    expect(view.exam!.result!.review).toBeUndefined(); // answers are hidden unless the teacher allows them
    k.set(k.now() + 11 * 60_000);
    r.tick();
    expect(r.phase).toBe('ended');
    const res = r.results();
    expect(res.players.find((p) => p.name === 'Ann')!.score).toBeGreaterThan(res.players.find((p) => p.name === 'Ben')!.score);
    expect(res.players.every((p) => p.submitted)).toBe(true);
    expect(res.questions[0].correctPct).toBe(50);
  });
  it('reports each player and each question to the teacher after a game', () => {
    const k = clock();
    const r = new LiveRoom('600004', content, settings, k.now);
    const a = r.join('Ann'), b = r.join('Ben');
    r.host('quiz');
    r.answer(a.token, 1);
    k.set(k.now() + 30_000); r.tick();
    const res = r.results();
    expect(res.players.find((p) => p.name === 'Ann')).toMatchObject({ correct: 1, answered: 1 });
    expect(res.players.find((p) => p.name === 'Ben')).toMatchObject({ correct: 0, answered: 0 });
    expect(res.questions[0]).toMatchObject({ correctPct: 50, answeredPct: 50 });
    void b;
  });
});

describe('other games', () => {
  it('last one standing: a wrong answer is out, and the game ends when one is left', () => {
    const k = clock();
    const r = new LiveRoom('700001', content, sanitizeSettings({ elimination: true, shuffleOptions: false }), k.now);
    const a = r.join('A'), b = r.join('B'), c = r.join('C');
    r.host('quiz');
    r.answer(a.token, 1); r.answer(b.token, 1); r.answer(c.token, 0);
    expect(r.view('player', c.token).me!.out).toBe(true);
    expect(r.answer(c.token, 1)).toBe(false);
    r.host('next'); r.host('next'); // leaderboard, then question two
    r.answer(a.token, [0, 1, 3]); r.answer(b.token, [0]);
    expect(r.phase).toBe('results'); // c is out, so only a and b needed to answer
    r.host('next');
    expect(r.phase).toBe('board');
    r.host('next');
    expect(r.phase).toBe('ended'); // a is the last one standing
  });
  it('nobody is out when everyone misses', () => {
    const r = new LiveRoom('700002', content, sanitizeSettings({ elimination: true, shuffleOptions: false }), clock().now);
    const a = r.join('A'), b = r.join('B');
    r.host('quiz'); r.answer(a.token, 0); r.answer(b.token, 3);
    expect(r.view('player', a.token).me!.out).toBe(false);
  });
  it('race: each student answers their own questions, and the first to the goal finishes', () => {
    const k = clock();
    const r = new LiveRoom('700003', content, sanitizeSettings({ mode: 'race', goal: 3, runMinutes: 5, shuffleOptions: false }), k.now);
    const a = r.join('A'), b = r.join('B');
    r.host('start');
    expect(r.phase).toBe('run');
    const right = (tok: string) => { const q = r.view('player', tok).run!.mine!.question!; const real = r.content.questions.find((x) => x.q === q.q)!; return real.type === 'text' ? [String(real.correct[0])] : real.correct; };
    for (let i = 0; i < 3; i++) expect(r.runAnswer(a.token, right(a.token))).toBe(true);
    expect(JSON.stringify(r.view('player', b.token))).not.toContain('"correct"');
    const v = r.view('host');
    expect(v.run!.track[0]).toMatchObject({ name: 'A', steps: 3, finished: true });
    expect(r.runAnswer(a.token, 0)).toBe(false); // finished
    r.runAnswer(b.token, right(b.token));
    expect(r.view('host').run!.track.find((t) => t.name === 'B')!.answered).toBe(1);
    k.set(k.now() + 6 * 60_000); r.tick();
    expect(r.phase).toBe('ended');
    expect(r.results().players.find((p) => p.name === 'A')).toMatchObject({ correct: 3, answered: 3 });
  });
  it('build the cathedral: everyone adds to one total and the class wins together', () => {
    const r = new LiveRoom('700004', content, sanitizeSettings({ mode: 'build', goal: 3, shuffleOptions: false }), clock().now);
    const a = r.join('A'), b = r.join('B');
    r.host('start');
    const right = (tok: string) => { const q = r.view('player', tok).run!.mine!.question!; const real = r.content.questions.find((x) => x.q === q.q)!; return real.type === 'text' ? [String(real.correct[0])] : real.correct; };
    r.runAnswer(a.token, right(a.token));
    expect(r.phase).toBe('run');
    r.runAnswer(b.token, right(b.token));
    expect(r.phase).toBe('run');
    r.runAnswer(a.token, right(a.token));
    expect(r.phase).toBe('ended');
    expect(r.view('host').run!.classSteps).toBe(3);
  });
});
