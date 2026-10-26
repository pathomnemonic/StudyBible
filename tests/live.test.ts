import { describe, expect, it } from 'vitest';
import { LiveHub, LiveRoom, isRight, sanitizeContent, sanitizeSettings } from '../server/live';

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
