import { getJson } from './loader';

export interface Recording {
  url: string;
  /** seconds into the file where the chapter starts and ends (estimated from the text) */
  t0: number;
  t1: number;
  reader: string;
  page: string;
  title: string;
}
type Pack = Record<string, { title: string; reader: string; page: string; note: string; files: { url: string; secs: number; title: string }[]; map: Record<string, [number, number, number]> }>;
let pack: Promise<Pack | null> | null = null;
const load = () => (pack ??= getJson<Pack>('media/librivox.json', true).catch(() => null));

/** The LibriVox recording of a chapter in this edition (the Douay-Rheims and the World English Bible have one), if there is one. */
export async function recordingFor(edition: string, book: string, chapter: number): Promise<Recording | null> {
  const p = (await load())?.[edition];
  const m = p?.map[`${book}.${chapter}`];
  if (!p || !m) return null;
  return { url: p.files[m[0]].url, t0: m[1], t1: m[2], reader: p.reader, page: p.page, title: p.title };
}
