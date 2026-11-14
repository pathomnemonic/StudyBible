/** Building a reading plan from a list of passages or a run of chapters at a chosen pace. Pure: the result is the same `days` shape every user plan already has. */
import { BOOK_BY_ID } from './canon';
import { formatRef, refId, type Ref } from './refs';

export type Pace = { perDay: number } | { days: number };
export const MAX_DAYS = 1100;

/** whole chapters from..to of one book in anchor (Vulgate) numbering; invalid input is rejected, never clamped */
export function chapterUnits(book: string, from: number, to: number): Ref[] {
  const b = BOOK_BY_ID[book];
  if (!b || !Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > b.chapters) return [];
  return Array.from({ length: to - from + 1 }, (_, i) => ({ book, c1: from + i, c2: from + i }));
}

/** Cuts the units into days in order. perDay: that many units a day (the last day may have fewer). days: spread over that many days, the earlier days taking the extra one. Never more days than units, never more than MAX_DAYS. */
export function spreadUnits<T>(units: T[], pace: Pace): T[][] {
  const n = units.length;
  if (!n) return [];
  const out: T[][] = [];
  if ('perDay' in pace) {
    const k = Math.max(1, Math.floor(pace.perDay) || 1);
    for (let i = 0; i < n; i += k) out.push(units.slice(i, i + k));
  } else {
    const d = Math.max(1, Math.min(Math.floor(pace.days) || 1, n));
    const base = Math.floor(n / d), extra = n % d;
    let at = 0;
    for (let i = 0; i < d; i++) { const take = base + (i < extra ? 1 : 0); out.push(units.slice(at, at + take)); at += take; }
  }
  return out.slice(0, MAX_DAYS);
}

/** neighbouring whole chapters of one book read as one range ("John 1-3"); everything else is left as it is */
export function mergeContiguous(refs: Ref[]): Ref[] {
  const out: Ref[] = [];
  for (const r of refs) {
    const last = out[out.length - 1];
    const whole = (x: Ref) => x.v1 === undefined && x.v2 === undefined;
    if (last && whole(last) && whole(r) && last.book === r.book && r.c1 === last.c2 + 1) out[out.length - 1] = { ...last, c2: r.c2 };
    else out.push({ ...r });
  }
  return out;
}

/** the plan's days in the stored form: each day a list of passage ids */
export function buildDays(units: Ref[], pace: Pace): { refs: string[] }[] {
  return spreadUnits(units, pace).map((g) => ({ refs: mergeContiguous(g).map(refId) }));
}

/** what the preview shows for one day, in words */
export const dayLabel = (refs: string[], parse: (id: string) => Ref | null): string => refs.map((id) => { const r = parse(id); return r ? formatRef(r) : id; }).join('; ');
