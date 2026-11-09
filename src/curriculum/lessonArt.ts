import { getJson } from '../data/loader';

export interface LessonPicture { id: string; file: string; title: string; artist: string; date?: string; credit?: string }
interface W { id: string | number; file: string; title: string; artist: string; date?: string; credit?: string }
type C = { by: Record<string, string[]>; works: Map<string, W> };
let cache: Promise<C> | null = null;
const load = () => (cache ??= Promise.all([
  getJson<Record<string, string[]>>('curriculum/lesson-art.json', true),
  getJson<{ works: W[] }>('art.json', true),
  getJson<{ works: W[] }>('art-more.json', true),
]).then(([by, a, b]) => ({ by: by ?? {}, works: new Map<string, W>([...(a?.works ?? []), ...(b?.works ?? [])].map((w) => [String(w.id), w] as [string, W])) } as C)).catch((): C => ({ by: {}, works: new Map<string, W>() })));

/** The pictures picked for a lesson ahead of time (the passage's own scenes first, then its subject). */
export async function lessonPictures(lessonId: string): Promise<LessonPicture[]> {
  const { by, works } = await load();
  return (by[lessonId] ?? []).map((i) => works.get(i)).filter(Boolean).map((w) => ({ id: String(w!.id), file: w!.file, title: w!.title, artist: w!.artist, date: w!.date, credit: w!.credit }));
}
