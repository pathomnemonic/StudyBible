/**
 * Catechism paragraph lists such as "27-30,355". Kept free of app imports so scripts can use it.
 * Strict: a segment that is not a paragraph number or an ascending range is reported, never skipped.
 */
export interface CccParse { numbers: number[]; errors: string[] }

export function cccParse(spec: string): CccParse {
  const numbers: number[] = [];
  const errors: string[] = [];
  const text = (spec ?? '').trim();
  if (!text) return { numbers, errors: ['empty list'] };
  for (const raw of text.split(',')) {
    const part = raw.trim().replace(/[\u2013\u2014]/g, '-');
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!m) { errors.push(`"${raw.trim()}" is not a paragraph number or range`); continue; }
    const a = Number(m[1]);
    const b = m[2] === undefined ? a : Number(m[2]);
    if (a < 1) { errors.push(`"${part}": paragraph numbers start at 1`); continue; }
    if (b < a) { errors.push(`"${part}": range runs backwards`); continue; }
    if (b - a > 200) { errors.push(`"${part}": range is implausibly long`); continue; }
    for (let n = a; n <= b; n++) numbers.push(n);
  }
  return { numbers, errors };
}

/** "27-30,355" → [27,28,29,30,355]. Throws on a malformed list; use `cccParse` to report the problems instead. */
export function cccList(spec: string): number[] {
  const r = cccParse(spec);
  if (r.errors.length) throw new Error(`Malformed Catechism list "${spec}": ${r.errors.join('; ')}`);
  return r.numbers;
}

/**
 * For display only: the valid paragraph numbers of a list, or none if it cannot be read, so a page never crashes on a
 * bad record. It does not make a bad record acceptable: tests/curriculumData.test.ts fails on any lesson whose list `cccParse` rejects.
 */
export function cccListSafe(spec: string): number[] {
  return cccParse(spec).numbers;
}
