import type { Band } from './pedagogy';

/** Words whose meaning a reader of that age already knows, so a lesson does not stop to define them. */
const COMMON = new Set(['god', 'creator', 'church', 'prayer', 'mass', 'scripture', 'sin', 'mercy', 'forgiveness', 'hope', 'creation', 'baptism', 'salvation', 'praise', 'thanksgiving', 'justice', 'charity', 'mission', 'marriage', 'matrimony', 'family', 'love', 'faith', 'saint', 'heaven', 'angel', 'jesus', 'christ', 'bible', 'worship', 'trust', 'peace', 'joy', 'kindness', 'sacrifice', 'holy-spirit', 'conscience', 'laity', 'doctrine', 'dignity', 'free-will', 'vocation', 'stewardship', 'almsgiving', 'petition']);

/** The words worth stopping for: for older readers only the unfamiliar ones, and never more than a few. */
export function worthDefining<T extends string>(ids: T[], band: Band | string): T[] {
  const b = typeof band === 'string' ? band : band.id;
  if (b === 'primary' || b === 'elementary') return ids.slice(0, 4);
  const hard = ids.filter((v) => !COMMON.has(v));
  return hard.slice(0, b === 'middle' ? 4 : 3);
}
