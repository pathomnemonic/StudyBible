import { liturgicalDay } from '../liturgy/compute';

export type SeasonTheme = 'advent' | 'christmas' | 'lent' | 'easter' | 'ordinary';

/** The season's look: Advent and Lent are their own, the Triduum keeps Lent's quiet, and Easter carries on through Pentecost. */
export function seasonName(d: Date): SeasonTheme {
  const s = liturgicalDay(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), 'universal').season;
  return s === 'advent' ? 'advent' : s === 'christmas' ? 'christmas' : s === 'lent' || s === 'triduum' ? 'lent' : s === 'easter' ? 'easter' : 'ordinary';
}
