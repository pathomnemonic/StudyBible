import type { CountsEdition } from '../lib/refCheck';
import type { Known } from './goFurther';

/**
 * What "Go further" knows about the app, assembled from the data files by one set of rules. The app fills it from
 * the network and the report script from disk, but both hand their raw parts to `assembleKnown`, so a link is offered
 * (or reported broken) for the same reasons in both places. Loading is reported as complete, partial or failed and a
 * failed part is never mistaken for an empty one.
 */
export type SourceName = 'apologetics' | 'library' | 'catechism' | 'tracks' | 'chains' | 'editions';
export const ALL_SOURCES: SourceName[] = ['apologetics', 'library', 'catechism', 'tracks', 'chains', 'editions'];

export interface TrackLike { id: string; title: string; levels: { steps: { kind: string; type?: string; id?: string; source?: { type: string; id: string } }[] }[] }
export interface RawKnown {
  apologetics?: { topics: { id: string; title: string }[] };
  library?: { works: { id: string; title: string }[] };
  catechism?: { paragraphs: number };
  tracks?: TrackLike[];
  /** chain type ("chain", "claim", …) → its entries. */
  chains?: Record<string, { id: string; title: string; to: string }[]>;
  editions?: CountsEdition[];
}

/** A library work is offered only when its data file can actually be read (`readable(id)` is true). */
export function assembleKnown(raw: RawKnown, failed: ReadonlySet<SourceName>, readable?: (workId: string) => boolean): Known {
  const tracks = raw.tracks ?? [];
  const tracksOfLesson = new Map<string, string[]>();
  for (const t of tracks) for (const l of t.levels) for (const s of l.steps) {
    const lid = s.kind === 'inapp' && s.type === 'lesson' ? s.id : s.kind === 'drill' && s.source?.type === 'lesson' ? s.source.id : undefined;
    if (!lid) continue;
    const a = tracksOfLesson.get(lid) ?? [];
    if (!a.includes(t.id)) a.push(t.id);
    tracksOfLesson.set(lid, a);
  }
  const chains = new Map<string, { title: string; to: string }>();
  for (const [type, list] of Object.entries(raw.chains ?? {})) for (const c of list) { const k = `${type}:${c.id}`; if (!chains.has(k)) chains.set(k, { title: c.title, to: c.to }); }
  return {
    edition: 'webc',
    editions: raw.editions,
    cccMax: raw.catechism?.paragraphs ?? 0,
    apolTopics: new Map((raw.apologetics?.topics ?? []).map((t) => [t.id, t.title])),
    works: new Map((raw.library?.works ?? []).filter((w) => !readable || readable(w.id)).map((w) => [w.id, w.title])),
    tracks: new Map(tracks.map((t) => [t.id, t.title])),
    tracksOfLesson,
    chains,
    failed: new Set(failed),
  };
}

export type LoadStatus = 'complete' | 'partial' | 'failed';
export interface KnownLoad { status: LoadStatus; known: Known; failed: SourceName[] }
/** One loader per source; it resolves with the data, or rejects (or resolves null) when the data could not be read. */
export type Loaders = Record<SourceName, () => Promise<unknown>>;

function validSource(name: SourceName, value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (name === 'tracks') return Array.isArray(value) && value.length > 0 && value.every((t) => !!t && typeof t.id === 'string' && Array.isArray(t.levels));
  if (name === 'editions') return Array.isArray(value) &&
    value.some((e) => e?.id === 'vulgate' && e.scheme === 'vulgate' && e.chapters && e.verseCounts) &&
    value.some((e) => e?.scheme === 'english' && e.chapters && e.verseCounts);
  if (name === 'chains') return !Array.isArray(value) && Object.keys(value).length > 0 && Object.values(value).every((rows) => Array.isArray(rows) && rows.every((r: any) => r && typeof r.id === 'string' && typeof r.title === 'string' && typeof r.to === 'string'));
  if (name === 'apologetics') return Array.isArray((value as any).topics) && (value as any).topics.every((r: any) => r && typeof r.id === 'string' && typeof r.title === 'string');
  if (name === 'library') return Array.isArray((value as any).works) && (value as any).works.every((r: any) => r && typeof r.id === 'string' && typeof r.title === 'string');
  return Number.isInteger((value as any).paragraphs) && (value as any).paragraphs > 0;
}

export async function loadKnownFrom(loaders: Loaders): Promise<KnownLoad> {
  const names = ALL_SOURCES;
  const settled = await Promise.allSettled(names.map((n) => loaders[n]()));
  const raw: Record<string, unknown> = {};
  const failed: SourceName[] = [];
  settled.forEach((r, i) => {
    const name = names[i];
    if (r.status === 'fulfilled' && validSource(name, r.value)) raw[name] = r.value;
    else failed.push(name);
  });
  const known = assembleKnown(raw as RawKnown, new Set(failed));
  return { status: failed.length === 0 ? 'complete' : failed.length === names.length ? 'failed' : 'partial', known, failed };
}

/** Keep a loaded result for the session only when it is complete, so a transient failure is retried, not remembered. */
export function memoizeComplete(load: () => Promise<KnownLoad>): () => Promise<KnownLoad> {
  let done: KnownLoad | null = null;
  let inflight: Promise<KnownLoad> | null = null;
  return () => {
    if (done) return Promise.resolve(done);
    inflight ??= load().then((r) => { if (r.status === 'complete') done = r; return r; }).finally(() => { inflight = null; });
    return inflight;
  };
}

/**
 * Check the library works a lesson names against their data files. `fetchWork` resolves true when the file is
 * readable, false when it is definitely absent, and rejects on a transient failure. Absent works are removed (so they
 * are reported as broken); a transient failure marks `library` failed so the caller can offer a retry.
 */
export async function verifyWorks(known: Known, ids: string[], fetchWork: (id: string) => Promise<boolean>): Promise<Known> {
  const works = new Map(known.works);
  const failed = new Set(known.failed ?? []);
  await Promise.all(ids.filter((id) => works.has(id)).map(async (id) => {
    try { if (!(await fetchWork(id))) works.delete(id); } catch { failed.add('library'); works.delete(id); }
  }));
  return { ...known, works, failed };
}
