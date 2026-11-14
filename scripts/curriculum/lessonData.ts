import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODES, type ChainMode } from '../../src/chains/types';
import type { ExtrasLike, Known, LessonLike } from '../../src/curriculum/goFurther';

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
  const apolTopics = new Map(json<{ topics: { id: string; title: string }[] }>(join(PUB, 'apologetics.json')).topics.map((t) => [t.id, t.title]));
  const works = new Map(json<{ works: { id: string; title: string }[] }>(join(PUB, 'library', 'index.json')).works.filter((w) => existsSync(join(PUB, 'library', 'works', `${w.id}.json`))).map((w) => [w.id, w.title]));

  const tracks = new Map<string, string>();
  const tracksOfLesson = new Map<string, string[]>();
  const tdir = join(ROOT, 'src', 'data', 'apologetics', 'tracks');
  for (const f of readdirSync(tdir).filter((x) => x.endsWith('.json') && !x.startsWith('_')).sort()) {
    const t = json<{ id: string; title: string; levels: { steps: ({ kind: string; type?: string; id?: string; source?: { type: string; id: string } })[] }[] }>(join(tdir, f));
    tracks.set(t.id, t.title);
    for (const l of t.levels) for (const s of l.steps) {
      const lid = s.kind === 'inapp' && s.type === 'lesson' ? s.id : s.kind === 'drill' && s.source?.type === 'lesson' ? s.source.id : undefined;
      if (!lid) continue;
      const a = tracksOfLesson.get(lid) ?? [];
      if (!a.includes(t.id)) a.push(t.id);
      tracksOfLesson.set(lid, a);
    }
  }

  const chains = new Map<string, { title: string; to: string }>();
  const cdir = join(ROOT, 'src', 'data', 'chains');
  for (const [type, modes] of Object.entries(CHAIN_MODES)) for (const mode of modes) {
    for (const f of readdirSync(cdir).filter((x) => x === `${mode}.json` || (x.startsWith(`${mode}.`) && x.endsWith('.json'))).sort()) {
      for (const c of json<{ id: string; title: string }[]>(join(cdir, f))) {
        const k = `${type}:${c.id}`;
        if (!chains.has(k)) chains.set(k, { title: c.title, to: `${MODES[mode].path}/${c.id}` });
      }
    }
  }
  const cccMax = json<{ paragraphs: number }>(join(PUB, 'ccc', 'index.json')).paragraphs;
  return { edition: 'webc', cccMax, apolTopics, works, tracks, tracksOfLesson, chains };
}
