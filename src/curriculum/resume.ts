/** Where a person was in a lesson, kept on this device so Learn and Today can say "continue where you left off". */
export interface LessonResume { grade: string; lesson: string; title: string; step: number; steps: number; at: number }
const KEY = 'sb:cur:resume:v1';
const read = (): LessonResume[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as LessonResume[]; } catch { return []; } };
export function saveLessonProgress(r: Omit<LessonResume, 'at'>) {
  try { const rest = read().filter((x) => !(x.grade === r.grade && x.lesson === r.lesson)); localStorage.setItem(KEY, JSON.stringify([{ ...r, at: Date.now() }, ...rest].slice(0, 20))); } catch { /* private mode */ }
}
export function clearLessonProgress(grade: string, lesson: string) { try { localStorage.setItem(KEY, JSON.stringify(read().filter((x) => !(x.grade === grade && x.lesson === lesson)))); } catch { /* private mode */ } }
/** Lessons begun but not finished, newest first. */
export const unfinishedLessons = (): LessonResume[] => read().filter((x) => x.step < x.steps - 1);
export const lastLesson = (): LessonResume | null => unfinishedLessons()[0] ?? null;
/** The step (0-based) a person had reached in a lesson, or 0 if nothing is saved. The lesson page can use this to reopen where they left off. */
export function getSavedStep(grade: string, lesson: string): number {
  const r = read().find((x) => x.grade === grade && x.lesson === lesson);
  return r ? Math.max(0, r.step) : 0;
}
/** Unfinished lessons of one grade, newest first. */
export const unfinishedIn = (grade: string): LessonResume[] => unfinishedLessons().filter((x) => x.grade === grade);
/** Puts the saved step where the lesson page looks for it today (session storage), so a link to the lesson reopens there. */
export function primeSavedStep(grade: string, lesson: string) { try { sessionStorage.setItem(`sb:cur:step:${lesson}`, String(getSavedStep(grade, lesson))); } catch { /* private mode */ } }
