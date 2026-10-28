import { seeded } from './dailyGame';

/** A maze on a grid of cells, made by walking and backing up; the same seed always makes the same maze. Each cell lists which of its walls (top, right, bottom, left) are open. */
export function makeMaze(cols: number, rows: number, seed: number): boolean[][][] {
  const rnd = seeded(seed);
  const open: boolean[][][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => [false, false, false, false]));
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const D: [number, number, number, number][] = [[0, -1, 0, 2], [1, 0, 1, 3], [0, 1, 2, 0], [-1, 0, 3, 1]];
  const stack: [number, number][] = [[0, 0]]; seen[0][0] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const next = D.filter(([dx, dy]) => x + dx >= 0 && y + dy >= 0 && x + dx < cols && y + dy < rows && !seen[y + dy][x + dx]);
    if (!next.length) { stack.pop(); continue; }
    const [dx, dy, a, b] = next[Math.floor(rnd() * next.length)];
    open[y][x][a] = true; open[y + dy][x + dx][b] = true; seen[y + dy][x + dx] = true; stack.push([x + dx, y + dy]);
  }
  return open;
}

/** Walls of a maze as line segments in cell units, with an entrance at the top-left and an exit at the bottom-right. */
export function mazeLines(open: boolean[][][]): [number, number, number, number][] {
  const rows = open.length, cols = open[0].length;
  const out: [number, number, number, number][] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (!open[y][x][0] && !(x === 0 && y === 0)) out.push([x, y, x + 1, y]);
    if (!open[y][x][3]) out.push([x, y, x, y + 1]);
    if (y === rows - 1 && !(x === cols - 1)) out.push([x, y + 1, x + 1, y + 1]);
    if (x === cols - 1) out.push([x + 1, y, x + 1, y + 1]);
  }
  return out;
}

/** Whether the exit can be reached from the entrance (it always can, for a maze made by makeMaze). */
export function solvable(open: boolean[][][]): boolean {
  const rows = open.length, cols = open[0].length;
  const seen = new Set<string>(['0,0']); const q: [number, number][] = [[0, 0]];
  const D: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  while (q.length) { const [x, y] = q.shift()!; D.forEach(([dx, dy], i) => { const k = `${x + dx},${y + dy}`; if (open[y][x][i] && !seen.has(k)) { seen.add(k); q.push([x + dx, y + dy]); } }); }
  return seen.has(`${cols - 1},${rows - 1}`);
}
