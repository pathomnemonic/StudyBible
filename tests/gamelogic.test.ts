import { describe, expect, it } from 'vitest';
import { adjacent, distanceKm, judgeQuartet, lineBetween, makeBoard, makeGrid, matchPlaced, pinPoints, prophetPoints, seededShuffle, solveBoard, totalScore, wordScore } from '../src/lib/gameLogic';
import { PROPHET } from '../src/data/prophet';
import { QUARTETS } from '../src/data/quartets';
import { WS_THEMES } from '../src/data/wordsearch';
import { THEMED } from '../src/data/cloister';

describe('seeded boards are the same every time', () => {
  it('wordsearch: same seed, same grid and placements; different seed differs', () => {
    const t = WS_THEMES[0];
    const a = makeGrid(t.words, 11, 42), b = makeGrid(t.words, 11, 42), c = makeGrid(t.words, 11, 43);
    expect(a).toEqual(b);
    expect(a.grid).not.toEqual(c.grid);
  });
  it('cloister: board from a seed is fixed, 25 letters, and its best words score the same each run', () => {
    expect(makeBoard(20000)).toEqual(makeBoard(20000));
    expect(makeBoard(20000)).toHaveLength(25);
    const board = makeBoard(20000);
    const words = new Set(['saint', 'altar', 'amen', 'the', 'and', 'tin', 'ant']);
    const prefixes = new Set<string>(); for (const w of words) for (let i = 1; i <= w.length; i++) prefixes.add(w.slice(0, i));
    const one = [...solveBoard(board, words, prefixes)].sort(), two = [...solveBoard(board, words, prefixes)].sort();
    expect(one).toEqual(two);
    expect(totalScore(one, THEMED)).toBe(totalScore(two, THEMED));
  });
  it('quartets: the daily shuffle is a stable permutation', () => {
    const tiles = QUARTETS[0].groups.flatMap((g) => g.words) as string[];
    const a = seededShuffle(tiles, 20400), b = seededShuffle(tiles, 20400);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([...tiles].sort());
    expect(seededShuffle(tiles, 20401)).not.toEqual(a);
  });
});

describe('scoring rules', () => {
  it('cloister word points by length, with a bonus for words of the faith', () => {
    expect(['cat', 'cats', 'catty', 'cattle', 'catteries'].map((w) => wordScore(w, new Set()))).toEqual([1, 2, 4, 6, 10]);
    expect(wordScore('saint', THEMED)).toBe(4 + 5 + 4);
    expect(wordScore('amen', THEMED)).toBe(2 + 5 + 2);
  });
  it('cloister adjacency: neighbours only, never itself, no wrap across rows', () => {
    expect(adjacent(0, 1)).toBe(true); expect(adjacent(0, 6)).toBe(true); expect(adjacent(0, 0)).toBe(false);
    expect(adjacent(4, 5)).toBe(false); expect(adjacent(0, 2)).toBe(false);
  });
  it('pin the place: bullseye is 100, halves every 120 km, far is near 0', () => {
    expect(pinPoints(0)).toBe(100); expect(pinPoints(120)).toBe(50); expect(pinPoints(240)).toBe(25); expect(pinPoints(3000)).toBe(0);
  });
  it('distance between Jerusalem and Bethlehem is about 9 km, and is symmetric', () => {
    const j: [number, number] = [31.7683, 35.2137], b: [number, number] = [31.7054, 35.2024];
    expect(distanceKm(j, b)).toBeGreaterThan(6); expect(distanceKm(j, b)).toBeLessThan(10);
    expect(distanceKm(j, b)).toBeCloseTo(distanceKm(b, j), 9);
    expect(pinPoints(distanceKm(j, j))).toBe(100);
  });
  it('prophet: exact is 100, one scale away is 50, and every question has a positive scale', () => {
    expect(prophetPoints(1000, 1000, 50)).toBe(100); expect(prophetPoints(1050, 1000, 50)).toBe(50); expect(prophetPoints(950, 1000, 50)).toBe(50);
    for (const q of PROPHET) { expect(q.scale, q.q).toBeGreaterThan(0); expect(prophetPoints(q.answer, q.answer, q.scale)).toBe(100); }
  });
  it('quartets: a whole set, one away, and a miss; solved sets are not offered again', () => {
    const g = QUARTETS[0].groups;
    const set0 = [...g[0].words] as string[];
    expect(judgeQuartet(g, [], set0).kind).toBe('hit');
    expect(judgeQuartet(g, [g[0]], set0).kind).not.toBe('hit');
    expect(judgeQuartet(g, [], [...set0.slice(0, 3), g[1].words[0] as string]).kind).toBe('near');
    expect(judgeQuartet(g, [], [g[0].words[0], g[1].words[0], g[2].words[0], g[3].words[0]] as string[]).kind).toBe('miss');
  });
});

describe('wordsearch selection', () => {
  it('a line runs straight; a crooked pick collapses to its start', () => {
    expect(lineBetween([0, 0], [0, 3])).toEqual([[0, 0], [0, 1], [0, 2], [0, 3]]);
    expect(lineBetween([2, 2], [0, 0])).toEqual([[2, 2], [1, 1], [0, 0]]);
    expect(lineBetween([0, 0], [1, 3])).toEqual([[0, 0]]);
  });
  it('matches a placed word forwards or backwards', () => {
    const { placed } = makeGrid(['ANGEL', 'SAINT'], 11, 5);
    expect(matchPlaced('ANGEL', placed)?.word).toBe('ANGEL');
    expect(matchPlaced('LEGNA', placed)?.word).toBe('ANGEL');
    expect(matchPlaced('XYZ', placed)).toBeNull();
  });
});
