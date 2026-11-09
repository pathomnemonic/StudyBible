import type { LessonSpec } from './model';

/**
 * A lesson's `teach` list mixes two things: points of content a learner should meet, and guidance addressed to the teacher
 * ("Aim: the child learns…", "Watch for…", "Show a candle and ask…", "Say: …"). Only the first kind belongs in front of a learner,
 * and only the first kind is an idea to build a teaching option around.
 */
const GUIDANCE = /^(aim|pitfall|watch|check|remember to|remember that|invite|let (?:the|each|children|students)|ask|say|show|note that|use|tell|have|give|point out|listen|teach|explain|read|explore|keep|make sure|be careful|avoid|encourage|help|model|plan|consider)\b/i;
export const isGuidance = (t: string) => GUIDANCE.test(t.trim());

/** Content points only, in order. */
export function contentPoints(l: Pick<LessonSpec, 'teach'>): string[] {
  return (l.teach ?? []).map((t) => t.trim()).filter((t) => t.length > 20 && !isGuidance(t));
}
/** The guidance lines, for the teacher's own notes. */
export function guidanceNotes(l: Pick<LessonSpec, 'teach'>): string[] {
  return (l.teach ?? []).map((t) => t.trim()).filter((t) => t.length > 0 && isGuidance(t));
}
