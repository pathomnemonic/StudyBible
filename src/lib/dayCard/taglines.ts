/** The line at the foot of every daily card. One default now; alternates go in the list below and are rotated by date or chosen by number. */
export const DEFAULT_TAGLINE = 'Download Cathology. The Most Comprehensive Free Catholic Study Bible';
export const TAGLINES: string[] = [DEFAULT_TAGLINE];

/** A chosen line (its number in TAGLINES, or the text itself), or the one for this date when none is chosen: the list is dealt out in order, a day at a time. */
export function pickTagline(date: string, choice?: number | string | null, list: string[] = TAGLINES): string {
  if (typeof choice === 'string' && choice.trim()) return choice.trim();
  if (typeof choice === 'number' && list[choice]) return list[choice];
  const day = Math.floor(Date.parse(date + 'T00:00:00Z') / 864e5);
  return list[((day % list.length) + list.length) % list.length] ?? DEFAULT_TAGLINE;
}
