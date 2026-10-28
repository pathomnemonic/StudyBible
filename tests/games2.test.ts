import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { LADDERS } from '../src/data/ladders';
import { CROSSWORDS } from '../src/data/crosswords';
import { shortest } from '../src/pages/play/ChainPage';
import { layout } from '../src/pages/play/CrosswordPage';

const words = new Set<string>((JSON.parse(readFileSync('public/data/play/words.json', 'utf8')).words as string[]).filter((w) => w.length >= 3 && w.length <= 5));

describe('Chain of Grace', () => {
  it('has plenty of puzzles', () => { expect(LADDERS.length).toBeGreaterThanOrEqual(60); });
  it('every ladder can be solved in three to seven steps', () => {
    for (const [a, b] of LADDERS) {
      expect(words.has(a) && words.has(b) && a.length === b.length, `${a} ${b}`).toBe(true);
      const p = shortest(a, b, words);
      expect(p, `${a} → ${b}`).not.toBeNull();
      expect(p!.length - 1).toBeGreaterThanOrEqual(3);
      expect(p!.length - 1).toBeLessThanOrEqual(7);
    }
  });
});

describe('crosswords', () => {
  it('have only the words they list: every run of two or more letters is a listed word', () => {
    expect(CROSSWORDS.length).toBeGreaterThanOrEqual(50);
    for (const [n, p] of CROSSWORDS.entries()) {
      const { cells } = layout(p);
      const listed = new Set(p.words.map((w) => `${w.d}:${w.r},${w.c}:${w.w}`));
      const runs: string[] = [];
      for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) {
        if (!cells.has(`${r},${c}`)) continue;
        if (!cells.has(`${r},${c - 1}`) && cells.has(`${r},${c + 1}`)) { let w = '', k = c; while (cells.has(`${r},${k}`)) w += cells.get(`${r},${k++}`); runs.push(`a:${r},${c}:${w}`); }
        if (!cells.has(`${r - 1},${c}`) && cells.has(`${r + 1},${c}`)) { let w = '', k = r; while (cells.has(`${k},${c}`)) w += cells.get(`${k++},${c}`); runs.push(`d:${r},${c}:${w}`); }
      }
      expect(new Set(runs), `puzzle ${n}`).toEqual(listed);
    }
  });
});

import { makeGrid } from '../src/pages/play/WordsearchPage';
import { WS_THEMES } from '../src/data/wordsearch';
describe('wordsearch', () => {
  it('places every word of every theme, reproducibly, with each word readable along its line', () => {
    for (const [i, t] of WS_THEMES.entries()) {
      expect(t.words.every((w) => /^[A-Z]+$/.test(w)), t.id).toBe(true);
      const a = makeGrid(t.words, 11, i * 97 + 13), b = makeGrid(t.words, 11, i * 97 + 13);
      expect(a.grid).toEqual(b.grid);
      expect(a.placed.length, `${t.id} places all`).toBe(t.words.filter((w) => w.length <= 11).length);
      for (const p of a.placed) expect(Array.from({ length: p.word.length }, (_, k) => a.grid[p.r + p.dr * k][p.c + p.dc * k]).join(''), `${t.id} ${p.word}`).toBe(p.word);
    }
  });
});

import { makeMaze, mazeLines, solvable } from '../src/lib/maze';
describe('mazes', () => {
  it('are reproducible and always solvable', () => {
    for (const seed of [1, 7, 11, 99]) {
      const a = makeMaze(14, 14, seed), b = makeMaze(14, 14, seed);
      expect(a).toEqual(b); expect(solvable(a)).toBe(true); expect(mazeLines(a).length).toBeGreaterThan(100);
    }
  });
});
