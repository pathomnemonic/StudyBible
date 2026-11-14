import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODES, type ChainMode } from '../../src/chains/types';
import type { ExtrasLike, Known, LessonLike } from '../../src/curriculum/goFurther';
import { assembleKnown, type TrackLike } from '../../src/curriculum/knownLoad';
import { loadVersification, type VersificationData } from '../../src/lib/versification';
import type { CountsEdition } from '../../src/lib/refCheck';

/** Reads the curriculum and everything a lesson can link to straight from the data files (no browser, no network). Used by the report script and the tests. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUB = join(ROOT, 'public', 'data');
const json = <T,>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;

export type NodeLesson = LessonLike & { title: string; unit: number; vocab?: string[]; prayer?: string | null; visual?: unknown; quiz?: string[]; saint?: string; hook?: string };
export interface GradeFile { id: string; name: string; units: { n: number; lessons: NodeLesson[] }[] }

export function loadGrades(): GradeFile[] {
  const dir = join(PUB, 'curriculum');
  const index = json<{ id: string }[]>(join(dir, 'index.json'));
  return index.map((g) => {
    const d = json<GradeFile>(join(dir, `grade-${g.id}.json`));
    return { ...d, units: d.units.map((u) => ({ ...u, lessons: u.lessons.map((l) => ({ ...l, unit: u.n })) })) };
  });
}
export const loadExtras = () => json<Record<string, ExtrasLike>>(join(PUB, 'curriculum', 'lesson-extras.json'));

const CHAIN_MODES: Record<string, ChainMode[]> = { chain: ['arguments', 'development'], claim: ['claims'], heresy: ['heresies'], development: ['development'], words: ['words'] };

export function loadKnown(): Known {
  // verse mappings between numbering schemes come from the same file the app loads
  loadVersification(json<VersificationData>(join(PUB, 'versification.json')));
  // The same rules as the app: the raw parts are read here from disk, then `assembleKnown` builds the lookup.
  const tracks: TrackLike[] = [];
  const tdir = join(ROOT, 'src', 'data', 'apologetics', 'tracks');
  for (const f of readdirSync(tdir).filter((x) => x.endsWith('.json') && !x.startsWith('_')).sort()) tracks.push(json<TrackLike>(join(tdir, f)));

  const chains: Record<string, { id: string; title: string; to: string }[]> = {};
  const cdir = join(ROOT, 'src', 'data', 'chains');
  for (const [type, modes] of Object.entries(CHAIN_MODES)) for (const mode of modes) {
    for (const f of readdirSync(cdir).filter((x) => x === `${mode}.json` || (x.startsWith(`${mode}.`) && x.endsWith('.json'))).sort()) {
      for (const c of json<{ id: string; title: string }[]>(join(cdir, f))) (chains[type] ??= []).push({ id: c.id, title: c.title, to: `${MODES[mode].path}/${c.id}` });
    }
  }
  return assembleKnown({
    apologetics: json(join(PUB, 'apologetics.json')),
    library: json(join(PUB, 'library', 'index.json')),
    catechism: json(join(PUB, 'ccc', 'index.json')),
    tracks, chains,
    editions: json<{ editions: CountsEdition[] }>(join(PUB, 'editions.json')).editions,
  }, new Set(), (id) => existsSync(join(PUB, 'library', 'works', `${id}.json`)));
}
