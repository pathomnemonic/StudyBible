// The picture behind each card: chosen from the app's own art library by relevance, never repeating inside a window, and recorded so a re-run gives the same card.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseRefs } from '../../src/lib/refs';
import { pickArt, type ArtHints, type ArtWork } from '../../src/lib/dayCard/art';

const DATA = new URL('../../public/', import.meta.url).pathname;
const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;

export const library = (): ArtWork[] => {
  const a = readJson<{ works: ArtWork[] }>(DATA + 'data/art.json').works;
  const m = readJson<{ works: ArtWork[] }>(DATA + 'data/art-more.json').works.map((w) => ({ ...w, theme: w.theme || 'More paintings and engravings' }));
  return [...a, ...m];
};
const bookCache = new Map<string, string | null>();
export const bookOf = (name: string) => {
  if (!bookCache.has(name)) { const p = parseRefs(`${name} 1`); bookCache.set(name, p.ok ? p.refs[0].ref.book : null); }
  return bookCache.get(name)!;
};

export interface Pick { id: string | number; file: string; why: string[]; source: 'auto' | 'manual'; title: string; artist: string; credit: string; page?: string }
export type Picks = Record<string, Pick>;

export class ArtPicker {
  works = library();
  picks: Picks;
  constructor(private file: string) { this.picks = existsSync(file) ? readJson<Picks>(file) : {}; }
  /** the picture for a card (the same one on every re-run); `override` is a library id or the path of an image you chose by hand */
  choose(key: string, hints: ArtHints, override?: string | null, window = 150): Pick | null {
    if (override) {
      const w = this.works.find((x) => String(x.id) === override);
      if (w) return this.picks[key] = { id: w.id, file: w.file, why: ['chosen by hand'], source: 'manual', title: w.title, artist: w.artist, credit: w.credit, page: w.page ?? w.source };
      if (existsSync(override)) return this.picks[key] = { id: override, file: override, why: ['chosen by hand'], source: 'manual', title: override, artist: '', credit: 'Rights not checked by the exporter: confirm the picture may be used before posting' };
      throw new Error(`No library picture with id "${override}" and no file at that path.`);
    }
    const kept = this.picks[key];
    if (kept) return kept;
    const used = Object.values(this.picks).map((p) => p.id);
    const r = pickArt(this.works, hints, used, bookOf, window);
    if (!r) return null;
    const w = r.work;
    return this.picks[key] = { id: w.id, file: w.file, why: r.why, source: 'auto', title: w.title, artist: w.artist, credit: w.credit, page: w.page ?? w.source };
  }
  save() { writeFileSync(this.file, JSON.stringify(this.picks, null, 2) + '\n'); }
}
