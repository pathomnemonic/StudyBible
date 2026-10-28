import { LADDER } from '../data/doctrineLadder';
import { WHO_AM_I } from '../data/whoami';
import { PROPHET } from '../data/prophet';
import { MORE_PROPHET } from '../data/prophet2';
import { getGrade, flatLessons, parseQuiz } from '../curriculum/model';
import { loadDaily } from '../study/daily';

export interface QuizItem { cat: Category; q: string; opts: string[]; answer: number; note?: string }
export type Category = 'doctrine' | 'people' | 'numbers' | 'lessons' | 'quotes';
export const CATEGORIES: { id: Category; title: string; blurb: string }[] = [
  { id: 'doctrine', title: 'What the Church teaches', blurb: 'Beginner to advanced, with the Catechism behind each answer.' },
  { id: 'people', title: 'Bible people', blurb: 'Who am I? Moses, Esther, Peter and more.' },
  { id: 'numbers', title: 'Dates and numbers', blurb: 'Years, counts and measures from Scripture and Church history.' },
  { id: 'quotes', title: 'Who said it?', blurb: 'Words of the saints and Fathers.' },
  { id: 'lessons', title: 'Catechism class', blurb: 'Questions from the grade-by-grade lessons.' },
];

const rnd = (seed: number) => { let s = seed || 1; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; };
export function shuffleWith<T>(a: T[], r: () => number): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
/** The right answer put among its wrong ones in random places; returns the options and where the right one went. */
export function place(right: string, wrong: string[], r: () => number): { opts: string[]; answer: number } {
  const opts = shuffleWith([right, ...wrong.slice(0, 3)], r);
  return { opts, answer: opts.indexOf(right) };
}

export function doctrineItems(r: () => number): QuizItem[] {
  return LADDER.flatMap((l) => l.questions.map((q) => { const { opts, answer } = place(q.a[0], q.a.slice(1), r); return { cat: 'doctrine' as const, q: q.q, opts, answer, note: `Catechism §${q.ccc}` }; }));
}
export function peopleItems(r: () => number): QuizItem[] {
  const names = WHO_AM_I.map((p) => p.name);
  return WHO_AM_I.map((p) => { const { opts, answer } = place(p.name, shuffleWith(names.filter((n) => n !== p.name), r), r); return { cat: 'people' as const, q: `Who am I? ${p.clues[1]} ${p.clues[3]}`, opts, answer }; });
}
export function numberItems(r: () => number): QuizItem[] {
  return [...PROPHET, ...MORE_PROPHET].filter((q) => !q.year ? q.answer >= 3 : true).map((q) => {
    const s = Math.max(1, Math.round(q.scale * 0.8));
    const cands = [...new Set([q.answer + s, q.answer - s, q.answer + 2 * s, q.answer - 2 * s, q.answer + 3 * s].filter((n) => n > 0 && n !== q.answer))];
    const { opts, answer } = place(String(q.answer), shuffleWith(cands, r).map(String), r);
    return { cat: 'numbers' as const, q: q.q.replace(/\?$/, '') + (q.year ? '?' : ` (${q.unit})?`), opts: opts.map((o) => (q.year ? `${o} AD` : o)), answer, note: q.note };
  });
}
export async function quoteItems(r: () => number): Promise<QuizItem[]> {
  const d = await loadDaily();
  const seen = new Set<string>();
  const list = [...Object.values(d?.generic ?? {}), ...Object.values(d?.seasonal ?? {})].map((e) => e.saint).filter((s) => s && s.verified !== false && !s.misattributed && !s.who.includes('(') && s.text.length <= 220 && !seen.has(s.text) && (seen.add(s.text), true));
  const names = [...new Set(list.map((s) => s.who))];
  return list.map((s) => { const { opts, answer } = place(s.who, shuffleWith(names.filter((n) => n !== s.who), r), r); return { cat: 'quotes' as const, q: `Who said: “${s.text}”`, opts, answer, note: s.work }; });
}
export async function lessonItems(grade: string, r: () => number): Promise<QuizItem[]> {
  const g = await getGrade(grade);
  if (!g) return [];
  return flatLessons(g).flatMap((l) => (l.quiz ?? []).slice(0, 2).map((raw) => parseQuiz(raw)).filter((q) => q.options.length === 4 && q.options[q.answer]).map((q) => { const right = q.options[q.answer]; const { opts, answer } = place(right, q.options.filter((_, i) => i !== q.answer), r); return { cat: 'lessons' as const, q: q.q, opts, answer, note: q.why }; }));
}

/** A shuffled set of questions drawn evenly from the chosen categories. */
export async function buildQuiz(cats: Category[], count: number, grade: string, seed = Date.now()): Promise<QuizItem[]> {
  const r = rnd(seed);
  const banks: QuizItem[][] = [];
  for (const c of cats) {
    const items = c === 'doctrine' ? doctrineItems(r) : c === 'people' ? peopleItems(r) : c === 'numbers' ? numberItems(r) : c === 'quotes' ? await quoteItems(r) : await lessonItems(grade, r);
    banks.push(shuffleWith(items, r));
  }
  const out: QuizItem[] = [];
  for (let i = 0; out.length < count && banks.some((b) => b.length > i); i++) for (const b of banks) if (b[i] && out.length < count) out.push(b[i]);
  return shuffleWith(out, r);
}
