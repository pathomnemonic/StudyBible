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
