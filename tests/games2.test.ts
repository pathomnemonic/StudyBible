import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { LADDERS } from '../src/data/ladders';
import { CROSSWORDS } from '../src/data/crosswords';
import { shortest } from '../src/pages/play/ChainPage';
import { layout } from '../src/pages/play/CrosswordPage';

const words = new Set<string>((JSON.parse(readFileSync('public/data/play/words.json', 'utf8')).words as string[]).filter((w) => w.length === 4));

describe('Chain of Grace', () => {
  it('every ladder can be solved in three to six steps', () => {
    for (const [a, b] of LADDERS) {
      expect(words.has(a) && words.has(b), `${a} ${b}`).toBe(true);
      const p = shortest(a, b, words);
      expect(p, `${a} → ${b}`).not.toBeNull();
      expect(p!.length - 1).toBeGreaterThanOrEqual(3);
      expect(p!.length - 1).toBeLessThanOrEqual(6);
    }
  });
});

describe('crosswords', () => {
  it('have only the words they list: every run of two or more letters is a listed word', () => {
    expect(CROSSWORDS.length).toBeGreaterThanOrEqual(12);
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
