import { describe, expect, it } from 'vitest';
import { mergeGuesses, board, lost, finished, type Guess } from '../src/lib/coop/merge';
import { weekOf, weekStart, inWeek, pointsFor, cleanPosts, addPosts, standings } from '../src/lib/coop/board';
import { cleanName, cleanGroup, isClean, nameProblem, groupProblem } from '../src/lib/coop/names';
import { verbumAnswer } from '../src/lib/coop/words';
import { ANSWERS } from '../src/data/verbum';

const g = (i: number, w: string, by: string, ts: number): Guess => ({ i, w, by, name: by, ts });
const day = (iso: string) => Math.floor(Date.parse(iso + 'T00:00:00Z') / 864e5);

describe('mergeGuesses', () => {
  const a = [g(0, 'grace', 'a', 10), g(1, 'faith', 'a', 20)];
  const b = [g(1, 'cross', 'b', 20), g(2, 'saint', 'b', 30)];
  it('is order independent and idempotent', () => {
    expect(mergeGuesses(a, b)).toEqual(mergeGuesses(b, a));
    expect(mergeGuesses(mergeGuesses(a, b), b)).toEqual(mergeGuesses(a, b));
  });
  it('later write wins a row, ties broken by member id', () => {
    expect(mergeGuesses(a, b).find((x) => x.i === 1)!.w).toBe('cross');
    expect(mergeGuesses([g(1, 'faith', 'a', 21)], b).find((x) => x.i === 1)!.w).toBe('faith');
  });
  it('is associative and drops junk and rows past the cap', () => {
    const c = [g(1, 'mercy', 'c', 5), g(9, 'bible', 'c', 1), { ...g(3, 'bad', 'c', 1) }];
    expect(mergeGuesses(mergeGuesses(a, b), c)).toEqual(mergeGuesses(a, mergeGuesses(b, c)));
    expect(mergeGuesses(a, c).some((x) => x.i === 9 || x.w === 'bad')).toBe(false);
  });
  it('board is an unbroken run that stops at the answer', () => {
    const all = mergeGuesses([g(0, 'grace', 'a', 1), g(1, 'faith', 'a', 2), g(2, 'saint', 'a', 3), g(4, 'cross', 'a', 4)], []);
    expect(board(all, 'faith').map((x) => x.w)).toEqual(['grace', 'faith']);
    expect(board(all, 'zzzzz').map((x) => x.w)).toEqual(['grace', 'faith', 'saint']);
    expect(finished(board(all, 'faith'), 'faith')).toBe(true);
  });
  it('detects a guess that lost its row', () => {
    const mine = g(1, 'faith', 'a', 20);
    expect(lost(mine, mergeGuesses([mine], [g(1, 'cross', 'b', 20)]))).toBe(true);
    expect(lost(mine, [mine])).toBe(false);
  });
  it('uses the solo game formula for the word of the day', () => { expect(verbumAnswer(20000)).toBe(ANSWERS[(20000 * 7919) % ANSWERS.length]); });
});

describe('weeks', () => {
  it('runs Monday to Sunday', () => {
    const mon = day('2026-11-02'), sun = day('2026-11-08'), nextMon = day('2026-11-09');
    expect(new Date(weekStart(weekOf(mon)) * 864e5).getUTCDay()).toBe(1);
    expect(weekOf(sun)).toBe(weekOf(mon));
    expect(weekOf(nextMon)).toBe(weekOf(mon) + 1);
    expect(inWeek(day('2026-11-01'), weekOf(mon))).toBe(false);
  });
  it('scores and ranks', () => {
    const w = weekOf(day('2026-11-04'));
    const d = day('2026-11-03');
    expect(pointsFor('verbum', '2/6')).toBe(5);
    expect(pointsFor('verbum', 'missed')).toBe(1);
    expect(pointsFor('chain', '4 steps')).toBe(3);
    const rows = standings([
      { n: 'Ann', e: [{ d, g: 'verbum', r: '2/6' }, { d, g: 'verbum', r: '6/6' }, { d: day('2026-10-01'), g: 'chain', r: 'x' }] },
      { n: 'Ben', e: [{ d, g: 'verbum', r: '1/6' }, { d: d + 1, g: 'chain', r: 'ok' }] },
      { n: 'Zed', e: [] },
    ], w);
    expect(rows.map((r) => [r.n, r.points])).toEqual([['Ben', 9], ['Ann', 5]]);
  });
  it('one post per game per day, and keeps the existing one', () => {
    const w = weekOf(day('2026-11-04')), d = day('2026-11-04');
    expect(cleanPosts([{ d, g: 'verbum', r: '3/6' }, { d, g: 'verbum', r: '2/6' }], w)).toHaveLength(1);
    expect(addPosts([{ d, g: 'verbum', r: '3/6' }], [{ d, g: 'verbum', r: '1/6' }, { d, g: 'chain', r: 'ok' }], w).map((p) => p.r).sort()).toEqual(['3/6', 'ok']);
  });
});

describe('names', () => {
  it('trims and limits', () => {
    expect(cleanName('  Mary   Ann  <b>' + 'x'.repeat(30))).toHaveLength(20);
    expect(cleanGroup('st-marys 99!')).toBe('STMARYS99');
  });
  it('filters rude words, even disguised', () => {
    expect(isClean('Grace')).toBe(true);
    expect(isClean('sh1t')).toBe(false);
    expect(nameProblem('a')).not.toBeNull();
    expect(groupProblem('abc')).not.toBeNull();
    expect(groupProblem('STMARYS')).toBeNull();
  });
});
