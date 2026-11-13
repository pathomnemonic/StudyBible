import { getJson } from '../data/loader';

export interface Featured { id: string; band: 'adult' | 'teen' | 'middle'; q: string }
export interface Media { title: string; creator: string; kind: string; url: string; minutes?: number; why: string; track: string }
export interface Extras { tracks: { id: string; title: string }[]; watch: Media[]; read: Media[]; debate: { type: string; id: string }[] }

let fCache: Promise<Featured[]> | null = null;
let eCache: Promise<Record<string, Extras>> | null = null;
/** The big questions: lessons that answer what people really ask, chosen like the apologetics tracks, in the order to show them. */
export const getFeatured = () => (fCache ??= getJson<Featured[]>('curriculum/featured.json', true).then((x) => x ?? []).catch(() => []));
/** Curated videos, talks, readings and debate material for a lesson, from the apologetics tracks. */
export const getExtras = async (lessonId: string): Promise<Extras | null> => {
  const all: Record<string, Extras> = await (eCache ??= getJson<Record<string, Extras>>('curriculum/lesson-extras.json', true).then((x) => x ?? {}).catch(() => ({} as Record<string, Extras>)));
  return all[lessonId] ?? null;
};

/** Which featured pool suits a reader: adults and parents, teens, or the middle grades. */
export const poolFor = (audience: string): Featured['band'] => (audience === 'youth' ? 'teen' : 'adult');
