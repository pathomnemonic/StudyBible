import { cccList, type LessonSpec } from './model';
import type { BankQuestion } from '../live/bank';
import type { TQ } from '../lib/trivia';

/** Pull a few extra questions from the Crown Quest (trivia) bank that fit a lesson, by simple word overlap. Nothing is invented: every question is one already in the bank. */
const STOP = new Set('the and for with that this from what who how when where which does into your about their they them have been were also each must will shall made make jesus lord'.split(' '));
export const words = (s: string): string[] => [...new Set(s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/).filter((w) => w.length >= 4 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, '')))].filter((w) => w.length >= 3);

const CAT_HINTS: [RegExp, string][] = [
  [/saint|blessed|martyr|st\.|doctor of/i, 'saints'],
  [/mass|eucharist|sacrament|baptis|confirm|penance|reconcil|marriage|orders|anoint|liturg/i, 'liturgy'],
  [/prayer|pray|rosary|hail|our father|psalm|devotion/i, 'prayer'],
  [/bible|scripture|gospel|covenant|prophet|moses|abraham|david|exodus|genesis|apostle|parable/i, 'scripture'],
  [/church|council|pope|history|reform|early|apostolic/i, 'history'],
  [/creed|trinity|doctrine|commandment|grace|sin|virtue|heaven|incarnation|redemption|revelation/i, 'doctrine'],
];

export interface BonusTopic { title: string; ccc: string; saint?: string; unit?: string }
export const topicOf = (l: Pick<LessonSpec, 'title' | 'ccc' | 'saint'> & { unit?: { title: string } }): BonusTopic => ({ title: l.title, ccc: l.ccc, saint: l.saint, unit: l.unit?.title });

/** How well a trivia question fits a lesson: a catechism number in the lesson's range counts most, then shared words, then the category. */
export function fit(q: TQ, cat: string, topic: BonusTopic, nums: Set<number>, tw: Set<string>, cats: Set<string>): number {
  let s = 0;
  if (q.src?.ccc && nums.has(q.src.ccc)) s += 4;
  const qw = words(`${q.q} ${q.o[q.a] ?? ''} ${q.why ?? ''}`);
  const hit = qw.filter((w) => tw.has(w)).length;
  s += hit;
  if (hit && cats.has(cat)) s += 1;
  return s;
}

/** Up to `n` questions from the bank, best fit first. Only questions with a real match (a catechism number or two shared words) are used. */
export function bonusFor(bank: Record<string, TQ[]>, topic: BonusTopic, n: number): { q: TQ; cat: string }[] {
  const nums = new Set(cccList(topic.ccc));
  const saintName = topic.saint?.split(':')[0] ?? '';
  const tw = new Set([...words(topic.title), ...words(saintName)]);
  const hay = `${topic.title} ${saintName} ${topic.unit ?? ''}`;
  const cats = new Set(CAT_HINTS.filter(([re]) => re.test(hay)).map(([, c]) => c));
  const scored: { q: TQ; cat: string; s: number }[] = [];
  for (const [cat, list] of Object.entries(bank)) for (const q of list) {
    if (!q.o || q.o.length !== 4) continue;
    const s = fit(q, cat, topic, nums, tw, cats);
    const ccc = !!(q.src?.ccc && nums.has(q.src.ccc));
    if (ccc || s >= 2) scored.push({ q, cat, s });
  }
  scored.sort((a, b) => b.s - a.s || a.q.d - b.q.d || a.q.id.localeCompare(b.q.id));
  return scored.slice(0, Math.max(0, n)).map(({ q, cat }) => ({ q, cat }));
}

/** A trivia question as a live multiple-choice question. */
export const toBank = (q: TQ): BankQuestion => ({ type: 'mc', q: q.q, options: q.o, correct: [q.a], time: q.d === 3 ? 30 : 20, points: 1, why: q.why || undefined, level: q.d, kind: 'trivia' });
