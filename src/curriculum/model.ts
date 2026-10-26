import { getJson } from '../data/loader';
import { db } from '../db/db';

export type BandId = 'primary' | 'elementary' | 'middle' | 'high' | 'adult';
export interface LessonSpec {
  id: string; title: string; idea: string; ccc: string; scripture: string; vocab: string[]; question: string; activity: string; prayer: string | null;
  /** teacher talking points */ teach?: string[];
  /** discussion questions */ talk?: string[];
  /** authored questions: "question|a|b|c|d|index of the right answer|why" */ quiz?: string[];
  /** a concrete challenge for the week */ life?: string;
  /** a saint who lived the lesson, "Name: how" */ saint?: string;
  /** common misunderstandings to listen for */ misc?: string[];
  /** more: apol:<topic id> or room:<work id> */ deeper?: string[];
  /** a verse or prayer to learn by heart */ mem?: string;
  /** a story, object or question that opens the lesson */ hook?: string;
  /** how the teacher can tell the class understood */ assess?: string;
  /** what to say and do, in the teacher's own voice, so the lesson can be taught from this alone */
  script?: { open: string; teach: string[]; ask: string[]; practice: string[]; close: string };
  /** the activity as the students hear it (short lines addressed to them), for the slide */
  tryit?: string[];
  /** the saint's story in a few sentences: who they were, what they did, why it matters here */
  saintStory?: string;
}
export interface UnitSpec { n: number; title: string; pillar: string; eq: string; lessons: LessonSpec[] }
export interface GradeData { id: string; name: string; band: BandId; age: string; theme: string; units: UnitSpec[] }
export interface GradeMeta { id: string; name: string; band: BandId; age: string; theme: string; units: number; lessons: number }
export type Glossary = Record<string, { w: string; d: string }>;

const cache = new Map<string, Promise<unknown>>();
const once = <T,>(k: string, f: () => Promise<T>) => (cache.get(k) as Promise<T>) ?? (cache.set(k, f()), cache.get(k) as Promise<T>);

export const getGrades = () => once('index', () => getJson<GradeMeta[]>('curriculum/index.json', true).then((x) => x ?? []));
export const getGrade = (id: string) => once(`g${id}`, () => getJson<GradeData>(`curriculum/grade-${id}.json`, true));
export const getGlossary = () => once('glossary', () => getJson<Glossary>('curriculum/glossary.json', true).then((x) => x ?? {}));

export const gradeLabel = (id: string) => (id === 'K' ? 'Kindergarten' : id === 'YA' ? 'Adults' : `Grade ${id}`);
export const flatLessons = (g: GradeData) => g.units.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u })));

/** "27-30,355" → [27,28,29,30,355] */
export function cccList(spec: string): number[] {
  const out: number[] = [];
  for (const part of spec.split(',')) {
    const [a, b] = part.trim().split('-').map(Number);
    if (!Number.isFinite(a)) continue;
    if (b && b >= a) for (let n = a; n <= b; n++) out.push(n); else out.push(a);
  }
  return out;
}

/** progress: the lesson positions (0-based, across the grade) that are checked off, kept in the synced plan-progress table */
export const progressId = (grade: string) => `cur:${grade}`;
export async function toggleDone(grade: string, index: number, on: boolean) {
  const id = progressId(grade);
  const cur = await db.planProgress.get(id);
  const done = new Set(cur?.done ?? []);
  if (on) done.add(index); else done.delete(index);
  await db.planProgress.put({ ...(cur ?? { planId: id, startedAt: Date.now(), status: 'active' as const, offsetDays: 0 }), planId: id, done: [...done].sort((a, b) => a - b) });
}

// ---- checking for understanding, made from the lesson’s own words
export interface Question { q: string; options: string[]; answer: number; why?: string }
/** "question|a|b|c|d|3|why" → a question */
export function parseQuiz(s: string): Question {
  const p = s.split('|');
  return { q: p[0], options: p.slice(1, 5), answer: +p[5], why: p[6] };
}
const shuffle = <T,>(a: T[], seed: number) => { const r = [...a]; let s = seed || 1; for (let i = r.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Multiple-choice questions on the lesson’s vocabulary. Wrong answers come from other terms of the same grade. */
export function vocabQuiz(lesson: LessonSpec, gl: Glossary, pool: string[], n = 3): Question[] {
  const out: Question[] = [];
  const own = lesson.vocab.filter((v) => gl[v]);
  for (const v of own.slice(0, n)) {
    const wrong = shuffle(pool.filter((p) => p !== v && gl[p] && gl[p].w !== gl[v].w), hash(lesson.id + v)).slice(0, 3);
    if (wrong.length < 3) continue;
    const opts = shuffle([v, ...wrong], hash(v + lesson.id));
    out.push({ q: `Which word fits this meaning? “${gl[v].d}”`, options: opts.map((o) => gl[o].w), answer: opts.indexOf(v) });
  }
  return out;
}

/** Spaced review: a few terms from earlier lessons in this grade, then from earlier grades if there are none. */
export function reviewTerms(g: GradeData, upTo: number, want = 4): string[] {
  const seen = flatLessons(g).slice(0, upTo).flatMap((l) => l.vocab);
  const uniq = [...new Set(seen)];
  return shuffle(uniq, hash(g.id + upTo)).slice(0, want);
}
