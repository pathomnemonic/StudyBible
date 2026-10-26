import type { LiveQuestion } from './types';
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
/** Whether an answer is right: the same rule the live server uses. */
export function isCorrect(q: LiveQuestion, v: (number | string)[]): boolean {
  if (q.type === 'text') { const a = fold(String(v[0] ?? '')); return !!a && (q.correct as string[]).some((c) => fold(c) === a); }
  if (q.type === 'order') return v.length === q.correct.length && v.every((x, i) => Number(x) === Number(q.correct[i]));
  const a = [...v].map(Number).sort((x, y) => x - y), b = [...q.correct].map(Number).sort((x, y) => x - y);
  return a.length === b.length && a.every((x, i) => x === b[i]);
}
