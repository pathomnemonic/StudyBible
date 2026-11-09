import { buildSlides } from './LessonSlides';
import { estimateTime } from './duration';
import { bandOf } from './pedagogy';
import { flatLessons, parseQuiz, vocabQuiz, type Glossary, type GradeData, type LessonSpec } from './model';
import type { Passage } from './useLessonSources';
import type { CccPara } from '../data/ccc';

/** How much a lesson teaches, judged from its own data: the number of slides that carry content (ideas, points, Scripture, Church, story, saint). */
export type Depth = 'Rich' | 'Solid' | 'Light';
export interface LessonStats { classMinutes: number; selfMinutes: number; teaching: number; depth: Depth }

const WORDS_PER_VERSE = 25;
const MAX_VERSES = 20;
const verseText = (n: number) => Array.from({ length: n }, () => `${'word '.repeat(WORDS_PER_VERSE - 1)}word.`);

/** How many verses a reference such as "John 3:16-21; Psalm 23" names: ranges are counted, a whole chapter counts as 15, each passage is capped at 20. */
export function verseCount(ref: string): number {
  const colon = ref.indexOf(':');
  if (colon < 0) return 15;
  const tail = ref.slice(colon + 1);
  const cross = /^\s*(\d+)\s*[-–—]\s*(\d+):(\d+)/.exec(tail);
  if (cross) return MAX_VERSES;
  let n = 0;
  for (const part of tail.split(',')) {
    const m = /^\s*(\d+)\s*(?:[-–—]\s*(\d+))?/.exec(part);
    if (!m) continue;
    n += m[2] && +m[2] >= +m[1] ? +m[2] - +m[1] + 1 : 1;
  }
  return Math.max(1, Math.min(MAX_VERSES, n || 8));
}

const passagesFor = (scripture: string): Passage[] =>
  scripture.split(';').map((x) => x.trim()).filter(Boolean).map((label) => ({
    label, ref: undefined as never, path: '',
    verses: verseText(verseCount(label)).map((text, i) => ({ v: i + 1, c: 1, text })),
  }));
/** Catechism paragraphs are not loaded for a list; each of the first few is given a typical length (about 60 words). */
const cccFor = (spec: string): CccPara[] => {
  const nums: number[] = [];
  for (const part of spec.split(',')) { const [a, b] = part.trim().split('-').map(Number); if (Number.isFinite(a)) for (let n = a; n <= (b && b >= a ? Math.min(b, a + 3) : a) && nums.length < 4; n++) nums.push(n); }
  return nums.map((n) => ({ n, t: `${'word '.repeat(59)}word.`, fn: [] }));
};

const depthOf = (n: number): Depth => (n >= 10 ? 'Rich' : n >= 6 ? 'Solid' : 'Light');

function statsFor(g: GradeData, l: LessonSpec & { unit: GradeData['units'][number] }, gl: Glossary, pool: string[]): LessonStats {
  const band = bandOf(g.band);
  const quiz = l.quiz?.length ? l.quiz.map(parseQuiz) : vocabQuiz(l, gl, pool, 3);
  const slides = buildSlides({ lesson: l, grade: g, gl, band, passages: passagesFor(l.scripture), ccc: g.band === 'primary' ? cccFor(l.ccc).slice(0, 1) : cccFor(l.ccc), videos: [], art: [], story: '', prayer: null, quiz, base: '' });
  const t = estimateTime(slides, g.band, l.activity);
  return { classMinutes: t.classMinutes, selfMinutes: t.selfMinutes, teaching: t.contentSlides, depth: depthOf(t.contentSlides) };
}

const cache = new Map<string, { gl: Glossary; map: Map<string, LessonStats> }>();
/** Stats for every lesson of a grade, computed once per grade (and again only if the glossary changes). */
export function gradeStats(g: GradeData, gl: Glossary): Map<string, LessonStats> {
  const hit = cache.get(g.id);
  if (hit && hit.gl === gl) return hit.map;
  const flat = flatLessons(g);
  const pool = [...new Set(flat.flatMap((x) => x.vocab))];
  const map = new Map<string, LessonStats>();
  for (const l of flat) map.set(l.id, statsFor(g, l, gl, pool));
  cache.set(g.id, { gl, map });
  return map;
}

export const depthLabel = (s: LessonStats) => `${s.depth}: ${s.teaching} teaching slides`;
/** "45 min with a group · 25 min on your own" */
export const timeLabel = (s: LessonStats) => `${s.classMinutes} min group · ${s.selfMinutes} min alone`;
/** "about 6 hours", "about 1½ hours", "about 40 minutes" */
export function hoursLabel(minutes: number): string {
  if (minutes < 60) return `about ${Math.max(5, Math.round(minutes / 5) * 5)} minutes`;
  const h = Math.round((minutes / 60) * 2) / 2;
  const whole = Math.floor(h);
  const txt = h === whole ? String(whole) : `${whole ? whole : ''}½`;
  return `about ${txt} ${h <= 1 ? 'hour' : 'hours'}`;
}
