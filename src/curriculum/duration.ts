import type { Slide } from './LessonSlides';
import type { BandId } from './model';

const words = (t?: string) => (t ? t.split(/\s+/).filter(Boolean).length : 0);
const text = (s: Slide) => words([s.title, s.body, ...(s.items ?? []), ...(s.cards ?? []).map((c) => c.v), s.q?.q, ...(s.words ?? []).map((w) => w.d), s.word?.d].filter(Boolean).join(' '));
const ACTIVITY: Record<BandId, number> = { primary: 8, elementary: 10, middle: 12, high: 12, adult: 15 };

/** Minutes the activity takes, from the "(25 min)" its description usually names. */
export const activityMinutes = (activity: string, band: BandId) => { const m = /\((\d{1,3})\s*min/i.exec(activity); return m ? +m[1] : ACTIVITY[band]; };

/** Seconds a slide takes when a group works through it together (reading, answering, discussing). */
function classSeconds(s: Slide, band: BandId, activity: string): number {
  const w = text(s);
  switch (s.kind) {
    case 'title': return 20;
    case 'section': return 5;
    case 'poll': return 90;
    case 'wonder': return 150;
    case 'goals': return 40 + (s.cards?.length ?? 0) * 8;
    case 'meet': return 90 + w * 0.5;
    case 'idea': return 60 + w * 0.8;
    case 'vocab': return 40 * (s.words?.length ?? 1);
    case 'story': return 30 + w * 0.6;
    case 'scripture': return 40 + w / 1.1;
    case 'image': return 60;
    case 'church': return 50 + w * 0.8;
    case 'video': return 240;
    case 'point': return 70 + w * 0.8;
    case 'timer': return 180;
    case 'myth': return 40;
    case 'debate': return 240;
    case 'do': return activityMinutes(activity, band) * 60;
    case 'quiz': return 60;
    case 'saint': return 60 + w * 0.5;
    case 'life': return 40;
    case 'prayer': return 30 + w * 0.5;
    case 'exit': return 120;
    case 'end': return 15;
    default: return 30;
  }
}
/** Seconds a person working alone needs: reading at about 200 words a minute, a pause to think, no class games or timers. */
function selfSeconds(s: Slide, band: BandId, activity: string): number {
  const w = text(s);
  switch (s.kind) {
    case 'title': case 'section': case 'end': case 'poll': case 'timer': case 'debate': case 'myth': case 'video': case 'image': case 'exit': return 0;
    case 'do': return Math.min(10, activityMinutes(activity, band)) * 60;
    case 'quiz': return 40;
    case 'scripture': return w * 0.3 + 30;
    case 'wonder': return 60;
    default: return w * 0.3 + 15;
  }
}
const round5 = (sec: number) => Math.max(5, Math.round(sec / 60 / 5) * 5);

export interface LessonTime { classMinutes: number; selfMinutes: number; contentSlides: number; slides: number }
/** How long a lesson takes: with a group (as the slides run) and on your own. Rounded to five minutes. */
export function estimateTime(slides: Slide[], band: BandId, activity: string): LessonTime {
  const cls = slides.reduce((n, s) => n + classSeconds(s, band, activity), 0);
  const self = slides.reduce((n, s) => n + selfSeconds(s, band, activity), 0);
  return { classMinutes: round5(cls), selfMinutes: round5(self), contentSlides: slides.filter((s) => ['idea', 'point', 'church', 'story', 'scripture', 'meet', 'saint'].includes(s.kind)).length, slides: slides.length };
}

/** Class seconds for the whole deck, unrounded. */
export const deckSeconds = (slides: Slide[], band: BandId, activity: string) => slides.reduce((n, s) => n + classSeconds(s, band, activity), 0);

export type DeckMode = 'full' | 'short' | 'fit';
export const SHORT_MINUTES = 15;
export const DECK_MINUTES = [15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90];

const baseRef = (r?: string) => (r ?? '').replace(/\s*\(\d+\/\d+\)$/, '');

/**
 * A deck trimmed to a class length. Drops the lowest-value slides first and never the core
 * (title, wonder, goals and recap, the first idea, first key point, scripture, one church slide, the activity, exit ticket, prayer, end).
 * Order of slides is kept; section numbers, point numbers and "1 of 3" labels are renumbered.
 */
export function fitSlides(slides: Slide[], minutes: number, band: BandId, activity: string): Slide[] {
  const target = Math.max(1, minutes) * 60;
  const first = (k: Slide['kind']) => slides.findIndex((s) => s.kind === k);
  const core = new Set<number>();
  slides.forEach((s, i) => { if (['title', 'wonder', 'goals', 'do', 'exit', 'end'].includes(s.kind) || (s.kind === 'prayer' && s.label !== 'Learn by heart')) core.add(i); });
  for (const k of ['idea', 'point', 'scripture', 'church'] as const) { const i = first(k); if (i >= 0) core.add(i); }
  const idx = (f: (s: Slide, i: number) => boolean) => slides.map((s, i) => (f(s, i) && !core.has(i) ? i : -1)).filter((i) => i >= 0);
  const nth = (k: Slide['kind'], from: number) => idx((s) => s.kind === k).slice(from);
  const quizAll = slides.map((s, i) => (s.kind === 'quiz' ? i : -1)).filter((i) => i >= 0);
  const stages: number[][] = [
    nth('timer', 1).reverse(),
    nth('myth', 1).reverse(),
    nth('debate', 0),
    nth('poll', 1).reverse(),
    idx((s) => s.kind === 'point' && /\(continued\)$/.test(s.title ?? '')).reverse(),
    idx((s) => s.kind === 'church' && /\(continued\)$/.test(s.title ?? '')).reverse(),
    idx((s) => s.kind === 'scripture').slice(1).reverse(),
    quizAll.slice(3).reverse(),
    nth('video', 0),
    nth('image', 0).reverse(),
    nth('church', 0).reverse(),
    nth('poll', 0),
    nth('myth', 0),
    nth('timer', 0),
    idx((s) => s.kind === 'vocab').slice(1).reverse(),
    idx((s) => s.kind === 'story').slice(1).reverse(),
    idx((s) => s.kind === 'saint').reverse(),
    nth('meet', 0),
    idx((s) => s.kind === 'point').reverse(),
    idx((s) => s.kind === 'vocab'),
    nth('life', 0),
    idx((s) => s.kind === 'prayer' && s.label === 'Learn by heart'),
    idx((s) => s.kind === 'section'),
  ];
  const dropped = new Set<number>();
  let total = deckSeconds(slides, band, activity);
  for (const stage of stages) {
    for (const i of stage) {
      if (total <= target || dropped.has(i)) continue;
      const c = classSeconds(slides[i], band, activity);
      if (Math.abs(total - c - target) < Math.abs(total - target) || c === 0) { dropped.add(i); total -= c; }
    }
  }
  const kept = slides.filter((_, i) => !dropped.has(i)).map((s) => ({ ...s }));
  // renumber what the drops left uneven
  let sec = 0;
  const ptNums = [...new Set(kept.filter((s) => s.kind === 'point' && s.of).map((s) => s.n))];
  const myths = kept.filter((s) => s.kind === 'myth').length;
  let mn = 0;
  const qs = kept.filter((s) => s.kind === 'quiz').length;
  let qn = 0;
  const refCount: Record<string, number> = {};
  kept.forEach((s) => { if (s.kind === 'scripture') refCount[baseRef(s.ref)] = (refCount[baseRef(s.ref)] ?? 0) + 1; });
  const refSeen: Record<string, number> = {};
  for (const s of kept) {
    if (s.kind === 'section') s.n = ++sec;
    if (s.kind === 'point' && s.of) { s.n = ptNums.indexOf(s.n) + 1; s.of = ptNums.length; }
    if (s.kind === 'myth') s.label = `Myth or truth? ${++mn} of ${myths}`;
    if (s.kind === 'quiz') s.label = `Check · ${++qn} of ${qs}`;
    if (s.kind === 'scripture') { const b = baseRef(s.ref); const n = refCount[b]; s.ref = n > 1 ? `${b} (${(refSeen[b] = (refSeen[b] ?? 0) + 1)}/${n})` : b; }
  }
  return kept;
}

/** The deck a class will see: all of it, the 15-minute version, or one fitted to the minutes chosen. */
export function trimmedSlides(slides: Slide[], mode: DeckMode, minutes: number, band: BandId, activity: string): Slide[] {
  if (mode === 'short') return fitSlides(slides, SHORT_MINUTES, band, activity);
  if (mode === 'fit') return fitSlides(slides, minutes, band, activity);
  return slides;
}
