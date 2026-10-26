import { getJson } from '../data/loader';
import { parseQuiz, type GradeData, type LessonSpec } from '../curriculum/model';
import type { LiveContent, LiveQuestion, LiveSettings, LiveSlide } from './types';

export interface BankQuestion extends LiveQuestion { level: number; kind: string }
const cache = new Map<string, Promise<Record<string, BankQuestion[]> | null>>();
export const getBank = (grade: string) => { if (!cache.has(grade)) cache.set(grade, getJson<Record<string, BankQuestion[]>>(`curriculum/questions/${grade}.json`, true)); return cache.get(grade)!; };

export type Scope = 'lesson' | 'unit' | 'grade';
export type Difficulty = 'easy' | 'mixed' | 'hard';

/** Every question for a set of lessons: the generated bank plus the questions written by hand for each lesson. */
export async function questionsFor(g: GradeData, lessons: LessonSpec[]): Promise<BankQuestion[]> {
  const bank = (await getBank(g.id)) ?? {};
  const out: BankQuestion[] = [];
  for (const l of lessons) {
    for (const q of bank[l.id] ?? []) out.push(q);
    for (const s of l.quiz ?? []) { const p = parseQuiz(s); if (p.options.length === 4 && p.options.every(Boolean)) out.push({ type: 'mc', q: p.q.replace(/…$/, ' …'), options: p.options, correct: [p.answer], time: 20, points: 1, why: p.why, level: 1, kind: 'lesson' }); }
  }
  return out;
}

/** Choose `count` questions at the wanted difficulty, spread over the lessons and over the kinds of question. */
export function pick(all: BankQuestion[], count: number, difficulty: Difficulty, seed = Date.now()): BankQuestion[] {
  let rnd = seed % 2147483647 || 1;
  const rand = () => (rnd = (rnd * 48271) % 2147483647) / 2147483647;
  const shuffle = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const fits = (q: BankQuestion) => (difficulty === 'easy' ? q.level <= 1 : difficulty === 'hard' ? q.level >= 2 || q.kind === 'cloze' || q.kind === 'multi' : true);
  let pool = shuffle(all.filter(fits));
  if (pool.length < count) pool = shuffle(all);
  // take questions in turn from each kind so a quiz is not all vocabulary
  const byKind = new Map<string, BankQuestion[]>();
  for (const q of pool) byKind.set(q.kind, [...(byKind.get(q.kind) ?? []), q]);
  const kinds = shuffle([...byKind.keys()]);
  const out: BankQuestion[] = [];
  while (out.length < count && kinds.some((k) => byKind.get(k)!.length)) for (const k of kinds) { const q = byKind.get(k)!.shift(); if (q && out.length < count) out.push(q); }
  return out;
}

export const toContent = (title: string, questions: BankQuestion[], slides: LiveSlide[], timeScale = 1): LiveContent => ({
  title,
  slides,
  questions: questions.map(({ level: _l, kind: _k, ...q }) => ({ ...q, time: Math.round(Math.min(120, Math.max(5, q.time * timeScale))) })),
});

export const DEFAULT_SETTINGS: LiveSettings = { teams: 0, shuffleQuestions: true, shuffleOptions: true, lateJoin: true, showNames: true };
