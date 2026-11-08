/** Parent mode: the children of a family and a plan for the week. Everything is kept on this device. */
export interface Kid { id: string; name: string; age?: number; grade: string; goals?: string }
export interface Family { kids: Kid[] }
export const FAMILY_KEY = 'sb:parent:family';
export const checksKey = (weekStart: string) => `sb:parent:checks:${weekStart}`;

export const GRADE_IDS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
/** The catechism program that fits an age: Kindergarten at 5 and 6, then a grade a year, and the adult course from 18. */
export function gradeForAge(age: number): string {
  if (age >= 18) return 'YA';
  if (age <= 6) return 'K';
  return GRADE_IDS[Math.min(12, age - 6)] ?? '12';
}

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const parse = (s: string) => new Date(`${s}T00:00:00Z`);
/** Monday of the week that contains this date. */
export function mondayOf(iso: string): string { const d = parse(iso); const back = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - back); return isoOf(d); }
export function addDaysIso(iso: string, n: number): string { const d = parse(iso); d.setUTCDate(d.getUTCDate() + n); return isoOf(d); }
export const weekDates = (monday: string): string[] => Array.from({ length: 7 }, (_, i) => addDaysIso(monday, i));
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
/** Whole weeks since a fixed Monday: used to rotate the shared prayer so each week differs. */
export const weekNumber = (monday: string): number => Math.floor(Date.parse(`${monday}T00:00:00Z`) / (7 * 86400000));

/** Index of the first lesson (in order) that is not yet done, or null when the whole grade is finished. */
export function nextLesson(total: number, done: number[]): number | null {
  const d = new Set(done);
  for (let i = 0; i < total; i++) if (!d.has(i)) return i;
  return null;
}

export interface PlanItem { id: string; kind: 'lesson' | 'talk' | 'try' | 'saint' | 'prayer' | 'gospel' | 'mass' | 'question'; text: string; kid?: string; to?: string; detail?: string; lessonIndex?: number; grade?: string }
export interface PlanDay { date: string; name: string; items: PlanItem[] }
export interface LessonLite { id: string; title: string; question: string; activity: string; life?: string }
export interface PlanInput {
  monday: string; kids: { kid: Kid; lesson: LessonLite | null; index: number | null; grade: string }[];
  saint?: { who: string; text: string } | null; prayer: { id: string; title: string; text: string }; kidsQuestionRoute?: boolean;
}

/** The week: lessons on Monday, talk about it on Wednesday, try it on Friday, one shared item on most other days, and Sunday Mass. */
export function buildPlan(inp: PlanInput): PlanDay[] {
  const dates = weekDates(inp.monday);
  const day = (i: number, items: PlanItem[]): PlanDay => ({ date: dates[i], name: DAY_NAMES[i], items });
  const per = (f: (k: PlanInput['kids'][number]) => PlanItem | null) => inp.kids.map(f).filter((x): x is PlanItem => !!x);
  return [
    day(0, per((k) => k.lesson ? { id: `lesson:${k.kid.id}`, kind: 'lesson', kid: k.kid.name, text: `${k.kid.name}: lesson “${k.lesson.title}”`, to: `/study/curriculum/${k.grade}/${k.lesson.id}`, lessonIndex: k.index ?? undefined, grade: k.grade } : { id: `lesson:${k.kid.id}`, kind: 'lesson', kid: k.kid.name, text: `${k.kid.name}: this grade’s program is finished. Review a favorite lesson.`, to: `/study/curriculum/${k.grade}` })),
    day(1, inp.saint ? [{ id: 'saint', kind: 'saint', text: `A saint’s word for the day: ${inp.saint.who}`, detail: `“${inp.saint.text}”` }] : []),
    day(2, [{ id: 'prayer', kind: 'prayer', text: `Pray together: ${inp.prayer.title}`, detail: inp.prayer.text, to: '/pray' }, ...per((k) => k.lesson ? { id: `talk:${k.kid.id}`, kind: 'talk', kid: k.kid.name, text: `${k.kid.name}: talk it over. ${k.lesson.question}` } : null)]),
    day(3, inp.kidsQuestionRoute ? [{ id: 'question', kind: 'question', text: 'Ask a kids’ question together', to: '/kids/questions' }] : []),
    day(4, per((k) => k.lesson ? { id: `try:${k.kid.id}`, kind: 'try', kid: k.kid.name, text: `${k.kid.name}: try it. ${k.lesson.life || k.lesson.activity}` } : null)),
    day(5, [{ id: 'gospel', kind: 'gospel', text: 'Read tomorrow’s Gospel sheet and its questions together', to: '/family-sheet' }]),
    day(6, [{ id: 'mass', kind: 'mass', text: 'Sunday Mass together' }]),
  ];
}

export function planText(days: PlanDay[], kids: Kid[], monday: string): string {
  const head = `Our week of ${monday}${kids.length ? ` (${kids.map((k) => k.name).join(', ')})` : ''}`;
  const lines = days.map((d) => `${d.name}${d.items.length ? '' : ': free day'}\n${d.items.map((i) => `  [ ] ${i.text}`).join('\n')}`.trimEnd());
  return `${head}\n\n${lines.join('\n\n')}\n`;
}

export function loadFamily(): Family {
  try { const f = JSON.parse(localStorage.getItem(FAMILY_KEY) ?? 'null') as Family | null; if (f && Array.isArray(f.kids)) return { kids: f.kids.filter((k) => k && k.id && k.name && k.grade) }; } catch { /* none yet */ }
  return { kids: [] };
}
export function saveFamily(f: Family): void { try { localStorage.setItem(FAMILY_KEY, JSON.stringify(f)); } catch { /* storage unavailable */ } }
