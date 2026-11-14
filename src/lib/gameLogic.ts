/**
 * The pure rules of the games: boards from a seed, and scores from moves. No React, no storage, no clock,
 * so a seeded run always gives the same board and the same score (tested in tests/gamelogic.test.ts).
 */

/* ---------- Wordsearch ---------- */
import { seeded } from './dailyGame';

const DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
export interface Placed { word: string; r: number; c: number; dr: number; dc: number }

/** Lay the words on a square grid in any of eight directions, then fill the gaps with letters. The same seed always makes the same puzzle. */
export function makeGrid(words: string[], size: number, seed: number): { grid: string[][]; placed: Placed[] } {
  const rnd = seeded(seed);
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placed: Placed[] = [];
  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    if (word.length > size) continue;
    for (let tries = 0; tries < 400; tries++) {
      const [dr, dc] = DIRS[Math.floor(rnd() * DIRS.length)];
      const r = Math.floor(rnd() * size), c = Math.floor(rnd() * size);
      const er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1);
      if (er < 0 || ec < 0 || er >= size || ec >= size) continue;
      let ok = true;
      for (let i = 0; i < word.length && ok; i++) { const ch = grid[r + dr * i][c + dc * i]; if (ch && ch !== word[i]) ok = false; }
      if (!ok) continue;
      for (let i = 0; i < word.length; i++) grid[r + dr * i][c + dc * i] = word[i];
      placed.push({ word, r, c, dr, dc });
      break;
    }
  }
  const letters = 'EEEEAAAIIOONNRRTTLSUDGBCMPFHVWYKJXQZ';
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!grid[r][c]) grid[r][c] = letters[Math.floor(rnd() * letters.length)];
  return { grid, placed };
}

/** The cells from a to b in a straight line (row, column), or just [a] when they do not make a line. */
export function lineBetween(a: [number, number], b: [number, number]): [number, number][] {
  const dr = Math.sign(b[0] - a[0]), dc = Math.sign(b[1] - a[1]);
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  if (n && Math.abs(b[0] - a[0]) !== 0 && Math.abs(b[1] - a[1]) !== 0 && Math.abs(b[0] - a[0]) !== Math.abs(b[1] - a[1])) return [a];
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + dr * i, a[1] + dc * i] as [number, number]);
}
/** The placed word that a run of letters spells, forwards or backwards, or null. */
export function matchPlaced(letters: string, placed: Placed[]): Placed | null {
  return placed.find((p) => p.word === letters || p.word === [...letters].reverse().join('')) ?? null;
}

/* ---------- Cloister ---------- */
export const CLOISTER_N = 5;
const DICE = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIOOOOOOOONNNNNRRRRRRTTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXZ';
const lcg = (seed: number) => { let s = seed * 2654435761 % 4294967296; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; };
export const makeBoard = (seed: number): string[] => { const r = lcg(seed + 1); return Array.from({ length: CLOISTER_N * CLOISTER_N }, () => DICE[Math.floor(r() * DICE.length)]); };
export const adjacent = (a: number, b: number) => a !== b && Math.abs((a % CLOISTER_N) - (b % CLOISTER_N)) <= 1 && Math.abs(Math.floor(a / CLOISTER_N) - Math.floor(b / CLOISTER_N)) <= 1;
export const wordPoints = (w: string) => (w.length <= 3 ? 1 : w.length === 4 ? 2 : w.length === 5 ? 4 : w.length === 6 ? 6 : 10);
/** Points for one word; words of the faith earn a bonus on top. */
export const wordScore = (w: string, themed: Set<string>) => wordPoints(w) + (themed.has(w) ? 5 + wordPoints(w) : 0);
export const totalScore = (found: string[], themed: Set<string>) => found.reduce((a, w) => a + wordScore(w, themed), 0);

/** All the words a board holds, found by walking neighbouring letters through the prefixes of the word list. */
export function solveBoard(board: string[], words: Set<string>, prefixes: Set<string>): Set<string> {
  const found = new Set<string>();
  const walk = (i: number, path: number[], s: string) => {
    s += board[i].toLowerCase();
    if (!prefixes.has(s)) return;
    if (s.length >= 3 && words.has(s)) found.add(s);
    if (s.length >= 10) return;
    for (let j = 0; j < CLOISTER_N * CLOISTER_N; j++) if (!path.includes(j) && adjacent(i, j)) walk(j, [...path, j], s);
  };
  for (let i = 0; i < CLOISTER_N * CLOISTER_N; i++) walk(i, [i], '');
  return found;
}

/* ---------- Pin the Place ---------- */
/** Great-circle distance in km between two [lat, lon] points (the same sphere radius Leaflet uses). */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))) / 1000;
}
/** 100 for a bullseye, halving every 120 km. */
export const pinPoints = (km: number) => Math.round(100 * Math.pow(0.5, km / 120));

/* ---------- The Prophet ---------- */
/** 100 for the exact answer, halving every `scale` away. */
export const prophetPoints = (guess: number, answer: number, scale: number) => Math.round(100 * Math.pow(0.5, Math.abs(guess - answer) / scale));

/* ---------- Quartets ---------- */
/** A stable shuffle for the daily puzzle, so everyone sees the same board. */
export function seededShuffle<T>(a: T[], seed: number): T[] {
  const b = [...a]; let s = seed * 9301 + 49297;
  for (let i = b.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
export interface QGroup { words: readonly string[]; level: number }
/** What four chosen tiles are: a whole set, one away from a set, or not a set. */
export function judgeQuartet(groups: QGroup[], solved: QGroup[], picked: string[]): { kind: 'hit'; group: QGroup } | { kind: 'near' | 'miss' } {
  const open = groups.filter((g) => !solved.includes(g));
  const hit = open.find((g) => picked.length === 4 && picked.every((t) => g.words.includes(t)));
  if (hit) return { kind: 'hit', group: hit };
  return { kind: open.some((g) => picked.filter((t) => g.words.includes(t)).length === 3) ? 'near' : 'miss' };
}
