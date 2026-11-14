/**
 * Reading helpers for profiles: search, related records in both directions, places on a map, and the trail back to where the reader came from.
 * Pure functions over data already in the app; nothing here adds a fact.
 */
import { RELATIONS, type Profile, type ProfileKind, type ProfileSource } from './profiles';

const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const profilePath = (p: Pick<Profile, 'kind' | 'id'>) => `/study/profile/${p.kind}/${p.id}`;

export interface ProfileHit { profile: Profile; /** the other name that matched, when the main name did not */ via?: string }

/**
 * Search profiles by name and alternate names (ignoring case and accents). Best matches first: exact, then starts-with, then contains.
 * An empty query returns everything of the kind (so a kind filter works on its own). `via` names the alias a hit was found by.
 */
export function searchProfiles(list: Profile[], query: string, kind?: ProfileKind): ProfileHit[] {
  const q = fold(query);
  const pool = list.filter((p) => !kind || p.kind === kind);
  if (!q) return pool.map((profile) => ({ profile }));
  const out: (ProfileHit & { rank: number })[] = [];
  for (const profile of pool) {
    let best = 9;
    let via: string | undefined;
    [profile.name, ...(profile.alternateNames ?? [])].forEach((x, i) => {
      const n = fold(x);
      const r = n === q ? 0 : n.startsWith(q) ? 1 : n.split(/[\s-]+/).some((w) => w.startsWith(q)) ? 2 : n.includes(q) ? 3 : 9;
      if (r < best) { best = r; via = i === 0 ? undefined : x; }
    });
    if (best < 9) out.push({ profile, via, rank: best });
  }
  return out.sort((a, b) => a.rank - b.rank || a.profile.name.localeCompare(b.profile.name)).map(({ profile, via }) => ({ profile, via }));
}

/** The one profile whose name or alternate name is exactly this name (ignoring case and accents), of the given kinds. */
export function profileByName(list: Profile[], name: string, kinds: ProfileKind[] = ['person', 'saint']): Profile | undefined {
  const n = fold(name.replace(/\s*\(.*\)$/, ''));
  if (!n) return undefined;
  const hits = list.filter((p) => kinds.includes(p.kind) && [p.name, ...(p.alternateNames ?? [])].some((x) => fold(x) === n));
  return hits.length === 1 ? hits[0] : undefined; // two profiles with one name: say nothing rather than guess
}

export interface RelatedEntry {
  relation: string;
  id: string;
  /** undefined when the record is not in the loaded data (removed, renamed or not yet shipped) */
  profile?: Profile;
  source: ProfileSource;
  /** "outgoing" = this profile says it; "incoming" = the other profile says it about this one */
  direction: 'outgoing' | 'incoming';
}

/** Everything linked to this profile by a written relation, in both directions; a missing target is kept (so the page can say so), not dropped. */
export function relatedEntries(p: Profile, all: Profile[]): RelatedEntry[] {
  const find = (id: string) => all.find((x) => x.id === id && x.kind === p.kind);
  const out: RelatedEntry[] = (p.related ?? []).map((r) => ({ relation: r.relation, id: r.id, profile: find(r.id), source: r.source, direction: 'outgoing' as const }));
  for (const o of all) {
    if (o.kind !== p.kind || o.id === p.id) continue;
    for (const r of o.related ?? []) {
      if (r.id !== p.id) continue;
      // a link this profile already says back is not listed twice
      if (out.some((e) => e.id === o.id && RELATIONS[r.relation]?.inverse.includes(e.relation))) continue;
      out.push({ relation: r.relation, id: o.id, profile: o, source: r.source, direction: 'incoming' });
    }
  }
  return out;
}

/** Other profiles that cite one of the same passages (exact reference match), with the shared passages. */
export function shareTheirPassages(p: Profile, all: Profile[]): { profile: Profile; passages: string[] }[] {
  const mine = new Set(p.passages ?? []);
  if (!mine.size) return [];
  const out: { profile: Profile; passages: string[] }[] = [];
  for (const o of all) {
    if (o.kind === p.kind && o.id === p.id) continue;
    const shared = (o.passages ?? []).filter((x) => mine.has(x));
    if (shared.length) out.push({ profile: o, passages: shared });
  }
  return out;
}

export interface MapPlace { n: string; lat: number; lon: number }
/**
 * Where a place profile is on the map, from the app's own places data: the name or an alternate name must equal a place name
 * that has a single location. A place that is not found, or is ambiguous, has no point (nothing is guessed).
 */
export function placePoint(p: Profile, places: (MapPlace | null)[]): { lat: number; lon: number; name: string } | null {
  if (p.kind !== 'place') return null;
  const names = [p.name, ...(p.alternateNames ?? [])];
  const wanted = new Set(names.map(fold));
  const spots = new Map<string, MapPlace>();
  const clash = new Set<string>();
  for (const x of places) {
    if (!x || typeof x.lat !== 'number' || typeof x.lon !== 'number') continue;
    const k = fold(x.n);
    if (!wanted.has(k)) continue;
    const old = spots.get(k);
    if (old && (old.lat !== x.lat || old.lon !== x.lon)) clash.add(k);
    else spots.set(k, x);
  }
  for (const nm of names) {
    const k = fold(nm);
    const x = spots.get(k);
    if (x && !clash.has(k)) return { lat: x.lat, lon: x.lon, name: x.n };
  }
  return null;
}

/** A trail of where the reader came from (the same shape the reader keeps in router state under `from`). */
export type Trail = { path: string; label: string; prev?: Trail };
const TRAIL_MAX = 8;
/** The trail to carry when opening a page from `here`: here becomes the newest step, older steps hang behind it (kept short, never mutated). */
export function extendTrail(prev: Trail | undefined, here: { path: string; label: string }): Trail {
  const steps: { path: string; label: string }[] = [here];
  for (let x = prev; x && steps.length < TRAIL_MAX; x = x.prev) steps.push({ path: x.path, label: x.label });
  let t: Trail | undefined;
  for (let i = steps.length - 1; i >= 0; i--) t = { ...steps[i], prev: t };
  return t!;
}
