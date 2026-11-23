// The pure part of the daily lookup (no data loading), so scripts can use it too.
import { addDays, adventStart, easter, parseIso, type LiturgicalDay } from '../liturgy/compute';
import { parseRefs, parseRefId, type Ref } from '../lib/refs';
import { convertRef } from '../lib/versification';
import type { DailyEntry, DailyFile } from './dailyTypes';

const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);

/** Keys to try (most specific first) for a day: season-specific, then the calendar date. */
export function dailyKeys(ld: LiturgicalDay): string[] {
  const d = parseIso(ld.date);
  const m = d.getUTCMonth(), day = d.getUTCDate(), y = d.getUTCFullYear();
  const keys: string[] = [];
  if (ld.season === 'advent') {
    if (m === 11 && day >= 17) keys.push(`dec-${day}`);
    keys.push(`advent-${dayDiff(d, adventStart(y)) + 1}`);
  } else if (ld.season === 'christmas') {
    keys.push(`${MON[m]}-${String(day).padStart(2, '0')}`);
  } else if (ld.season === 'lent' || ld.season === 'triduum') {
    keys.push(`lent-${dayDiff(d, addDays(easter(y), -46)) + 1}`);
  } else if (ld.season === 'easter') {
    keys.push(`easter-${dayDiff(d, easter(y)) + 1}`);
  }
  return keys;
}

export function pickDaily(f: DailyFile, ld: LiturgicalDay): DailyEntry | null {
  for (const k of dailyKeys(ld)) if (f.seasonal[k]) return f.seasonal[k];
  return f.generic[ld.date.slice(5)] ?? null;
}

export function dailyRef(e: DailyEntry): Ref | null {
  if (/^[A-Z0-9]{3}\.\d+/.test(e.ref)) return parseRefId(e.ref);
  const p = parseRefs(e.ref);
  if (!p.ok) return null;
  const mapped = convertRef('kjv', 'vulgate', p.refs[0].ref);
  return mapped.exact ? mapped.ref : null;
}
