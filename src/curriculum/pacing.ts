/** Spreads a grade's lessons over a school year: which lesson falls on which day, skipping breaks. */
export interface PacingInput {
  /** lessons in teaching order */ lessons: { id: string; title: string; unit: number }[];
  /** first day, YYYY-MM-DD */ start: string;
  /** days of the week lessons are taught, 0 = Sunday */ days: number[];
  /** days to skip, YYYY-MM-DD */ skip?: string[];
  /** inclusive ranges to skip (a holiday week), YYYY-MM-DD */ breaks?: [string, string][];
  /** lessons taught on one day */ perDay?: number;
}
export interface PacingRow { date: string; lessonId: string; title: string; unit: number }

const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function pacingSchedule(p: PacingInput): { rows: PacingRow[]; endsOn: string | null } {
  const rows: PacingRow[] = [];
  if (!p.days.length || !p.lessons.length) return { rows, endsOn: null };
  const skip = new Set(p.skip ?? []);
  const inBreak = (d: string) => (p.breaks ?? []).some(([a, b]) => d >= a && d <= b);
  const per = Math.max(1, p.perDay ?? 1);
  let i = 0;
  const d = toDate(p.start);
  // a safety cap of ten years of days keeps a bad input from looping for ever
  for (let guard = 0; i < p.lessons.length && guard < 3660; guard++, d.setUTCDate(d.getUTCDate() + 1)) {
    const day = iso(d);
    if (!p.days.includes(d.getUTCDay()) || skip.has(day) || inBreak(day)) continue;
    for (let k = 0; k < per && i < p.lessons.length; k++, i++) rows.push({ date: day, lessonId: p.lessons[i].id, title: p.lessons[i].title, unit: p.lessons[i].unit });
  }
  return { rows, endsOn: rows.length ? rows[rows.length - 1].date : null };
}

/** the first and last teaching day of each unit, for a planning overview */
export function unitSpans(rows: PacingRow[]): { unit: number; from: string; to: string; lessons: number }[] {
  const out = new Map<number, { unit: number; from: string; to: string; lessons: number }>();
  for (const r of rows) {
    const u = out.get(r.unit);
    if (!u) out.set(r.unit, { unit: r.unit, from: r.date, to: r.date, lessons: 1 });
    else { u.to = r.date; u.lessons++; }
  }
  return [...out.values()];
}
