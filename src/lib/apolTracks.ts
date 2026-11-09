import { getJson } from '../data/loader';
import { GLOSSARY } from '../data/glossary';
import { loadChains } from '../chains/load';
import { MODES, type Chain, type ChainMode } from '../chains/types';
import { getGrade, flatLessons } from '../curriculum/model';
import { stamp } from './passport';

/* ------------------------------------------------------------------ types */
export type GroupId = 'faith-and-reason' | 'christians' | 'world-religions' | 'morals-and-life' | 'church-and-scripture';
export type ResourceKind = 'video' | 'podcast' | 'article' | 'book' | 'course' | 'debate' | 'talk' | 'tract' | 'site' | 'series';
export type InappType = 'chain' | 'claim' | 'heresy' | 'development' | 'words' | 'lesson' | 'library' | 'term' | 'apologetics' | 'ask';

export interface Resource {
  id: string; title: string; creator: string; kind: ResourceKind; url: string; free: boolean; minutes?: number;
  level: number; audience: 'any' | 'adult' | 'teen' | 'advanced'; why: string; verified: string; note?: string;
}
export type Step =
  | { kind: 'resource'; id: string; why: string }
  | { kind: 'inapp'; type: InappType; id: string; section?: string; why: string }
  | { kind: 'drill'; source: { type: 'chain' | 'claim'; id: string } }
  | { kind: 'reflect'; prompt: string };
export interface Level { n: number; title: string; goal: string; minutes: number; steps: Step[] }
export interface Track {
  id: string; title: string; tagline: string; group: GroupId; audience: string[]; whyItMatters: string;
  mindset: { tip: string; resource?: string }[]; ccc: number[]; levels: Level[]; resources: Resource[];
}

export const GROUPS: { id: GroupId; title: string; blurb: string; icon: string }[] = [
  { id: 'faith-and-reason', title: 'Faith and reason', blurb: 'God, truth, suffering, science and the questions behind belief.', icon: '💡' },
  { id: 'christians', title: 'Talking with other Christians', blurb: 'Protestant, Orthodox and other friends who share much of our faith.', icon: '🤝' },
  { id: 'world-religions', title: 'Other religions and worldviews', blurb: 'Listening well to people of other faiths, and sharing ours with respect.', icon: '🌍' },
  { id: 'morals-and-life', title: 'Morals and life', blurb: 'Why the Church teaches what she does about life, love and conscience.', icon: '🕊️' },
  { id: 'church-and-scripture', title: 'The Church and Scripture', blurb: 'Authority, the Bible, the sacraments, Mary and the saints.', icon: '📖' },
];
export const groupOf = (id: string) => GROUPS.find((g) => g.id === id);

export const RESOURCE_KINDS: Record<ResourceKind, { label: string; icon: string }> = {
  video: { label: 'Video', icon: '🎬' }, podcast: { label: 'Podcast', icon: '🎧' }, article: { label: 'Article', icon: '📰' }, book: { label: 'Book', icon: '📘' },
  course: { label: 'Course', icon: '🎓' }, debate: { label: 'Debate', icon: '🗣️' }, talk: { label: 'Talk', icon: '🎤' }, tract: { label: 'Tract', icon: '📄' },
  site: { label: 'Website', icon: '🌐' }, series: { label: 'Series', icon: '📺' },
};
export const INAPP_LABEL: Record<InappType, { label: string; icon: string }> = {
  chain: { label: 'Argument Map', icon: '⚖️' }, claim: { label: 'Is that true?', icon: '❓' }, heresy: { label: 'Heresy Lab', icon: '🔥' }, development: { label: 'How it developed', icon: '🌱' },
  words: { label: 'Key words', icon: '🔤' }, lesson: { label: 'Catechism lesson', icon: '🎓' }, library: { label: 'Library reading', icon: '📜' }, term: { label: 'Key term', icon: '🔍' },
  apologetics: { label: 'Question answered', icon: '💬' }, ask: { label: 'Ask the Fathers', icon: '🕯️' },
};

/* ----------------------------------------------------------------- loading */
const files = import.meta.glob('../data/apologetics/tracks/*.json', { import: 'default' }) as Record<string, () => Promise<Track>>;
let cache: Promise<Track[]> | null = null;
/** All tracks (files starting with "_" are samples and are skipped), in a stable order: group, then title. */
export function loadTracks(): Promise<Track[]> {
  const entries = Object.entries(files);
  const real = entries.filter(([p]) => !(p.split('/').pop() ?? '').startsWith('_'));
  // While developing with no real tracks yet, the sample file lets the pages be seen.
  const use = real.length || !import.meta.env.DEV ? real : entries;
  cache ??= Promise.all(use.map(([, f]) => f().catch(() => null)))
    .then((all) => (all.filter((t): t is Track => !!t && typeof t.id === 'string' && Array.isArray(t.levels)) as Track[])
      .sort((a, b) => GROUPS.findIndex((g) => g.id === a.group) - GROUPS.findIndex((g) => g.id === b.group) || a.title.localeCompare(b.title)));
  return cache;
}

/* -------------------------------------------------------------- validation */
const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Problems with a track's shape (used by tests and by the page to ignore broken data safely). */
export function validateTrack(t: Track): string[] {
  const bad: string[] = [];
  const p = (m: string) => bad.push(`${t.id}: ${m}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id ?? '')) p('id must be kebab-case');
  if (!t.title || !t.tagline || !t.whyItMatters) p('missing title/tagline/whyItMatters');
  if (!groupOf(t.group)) p(`unknown group ${t.group}`);
  if (!Array.isArray(t.levels) || t.levels.length !== 4) { p('needs exactly 4 levels'); return bad; }
  const rid = new Set<string>();
  for (const r of t.resources ?? []) {
    if (rid.has(r.id)) p(`duplicate resource id ${r.id}`);
    rid.add(r.id);
    if (!/^https:\/\/\S+$/.test(r.url ?? '')) p(`${r.id}: url must be https`);
    if (!ISO.test(r.verified ?? '')) p(`${r.id}: verified must be YYYY-MM-DD`);
    if (!r.why || r.why.length < 10 || r.why.length > 200) p(`${r.id}: why must be 10-200 characters`);
    if (!r.title || !r.creator) p(`${r.id}: missing title/creator`);
  }
  const used = new Set<string>();
  t.levels.forEach((l, i) => {
    if (l.n !== i + 1) p(`level ${i + 1} has n=${l.n}`);
    if ((l.steps?.length ?? 0) < 3) p(`level ${l.n} needs at least 3 steps`);
    for (const s of l.steps ?? []) {
      if (s.kind === 'resource') { used.add(s.id); if (!rid.has(s.id)) p(`level ${l.n}: unknown resource ${s.id}`); }
    }
  });
  for (const m of t.mindset ?? []) if (m.resource) { used.add(m.resource); if (!rid.has(m.resource)) p(`mindset: unknown resource ${m.resource}`); }
  for (const id of rid) if (!used.has(id)) p(`resource ${id} is never used`);
  return bad;
}

export const stepId = (level: number, index: number) => `${level}.${index}`;
export const resourceOf = (t: Track, id: string) => t.resources.find((r) => r.id === id);
export const trackMinutes = (t: Track) => t.levels.reduce((a, l) => a + (l.minutes || 0), 0);
/** Steps that count towards progress: everything except optional reflect prompts is required; reflections count too so a level can truly be finished. */
export const levelStepIds = (t: Track, n: number) => (t.levels.find((l) => l.n === n)?.steps ?? []).map((_, i) => stepId(n, i));

/* ------------------------------------------------------------ in-app lookups */
export interface Resolved { title: string; typeLabel: string; icon: string; to: string; found: boolean }
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MODE_OF: Record<string, ChainMode[]> = { chain: ['arguments', 'development'], claim: ['claims'], heresy: ['heresies'], development: ['development'], words: ['words'] };
const ROUTE_MODE: Record<string, ChainMode> = { chain: 'arguments', claim: 'claims', heresy: 'heresies', development: 'development', words: 'words' };

export async function findChain(type: string, id: string): Promise<{ chain: Chain; mode: ChainMode } | null> {
  for (const m of MODE_OF[type] ?? []) {
    const c = (await loadChains(m)).find((x) => x.id === id);
    if (c) return { chain: c, mode: m };
  }
  return null;
}

interface ApoLite { topics: { id: string; title: string; objection: string }[] }
interface LibLite { works: { id: string; title: string; author: string; sections?: { id: string; title: string }[] }[] }

/** Where an in-app step leads, and what to call it. Never throws; `found` is false when the id is unknown. */
export async function resolveInapp(s: Extract<Step, { kind: 'inapp' }>): Promise<Resolved> {
  const meta = INAPP_LABEL[s.type] ?? { label: 'In the app', icon: '📌' };
  const base = { typeLabel: meta.label, icon: meta.icon };
  const miss: Resolved = { ...base, title: s.id, to: '/study/apologetics', found: false };
  try {
    switch (s.type) {
      case 'chain': case 'claim': case 'heresy': case 'development': case 'words': {
        const f = await findChain(s.type, s.id);
        if (!f) return miss;
        return { ...base, title: f.chain.title, to: `${MODES[f.mode].path}/${f.chain.id}`, found: true };
      }
      case 'lesson': {
        const grade = s.id.split('-')[0];
        const g = await getGrade(grade);
        const l = g ? flatLessons(g).find((x) => x.id === s.id) : undefined;
        return l ? { ...base, title: l.title, to: `/study/curriculum/${grade}/${l.id}`, found: true } : miss;
      }
      case 'library': {
        const lib = await getJson<LibLite>('library/index.json', true);
        const w = lib?.works.find((x) => x.id === s.id);
        if (!w) return miss;
        const sec = s.section ? w.sections?.find((x) => x.id === s.section) : undefined;
        return { ...base, title: sec ? `${w.title}: ${sec.title}` : w.title, to: `/study/works/${w.id}${s.section ? `/${s.section}` : ''}`, found: true };
      }
      case 'term': {
        const g = GLOSSARY.find((x) => x.term.toLowerCase() === s.id.toLowerCase() || slug(x.term) === s.id);
        return g ? { ...base, title: g.term, to: `/study/zoom/${slug(g.term)}`, found: true } : miss;
      }
      case 'apologetics': {
        const a = await getJson<ApoLite>('apologetics.json', true);
        const t = a?.topics.find((x) => x.id === s.id);
        return t ? { ...base, title: t.title, to: `/study/apologetics/${t.id}`, found: true } : miss;
      }
      case 'ask': return { ...base, title: s.id, to: `/study/ask-fathers?q=${encodeURIComponent(s.id)}`, found: true };
    }
  } catch { /* fall through */ }
  return miss;
}
export const chainRoute = (type: string, id: string) => ROUTE_MODE[type] ? `${MODES[ROUTE_MODE[type]].path}/${id}` : '';

/* ------------------------------------------------------------- reverse index */
/** InTracks: which tracks mention a chain, claim, heresy, lesson … . Keys look like "chain:real-presence". */
const TYPE_ALIAS: Record<string, string> = { arguments: 'chain', claims: 'claim', heresies: 'heresy' };
const reverseKey = (type: string, id: string) => `${TYPE_ALIAS[type] ?? type}:${id}`;
let revCache: Promise<Map<string, Track[]>> | null = null;
export function tracksFor(type: string, id: string): Promise<Track[]> {
  revCache ??= loadTracks().then((ts) => {
    const m = new Map<string, Track[]>();
    const add = (k: string, t: Track) => { const a = m.get(k) ?? []; if (!a.includes(t)) a.push(t); m.set(k, a); };
    for (const t of ts) for (const l of t.levels) for (const s of l.steps) {
      if (s.kind === 'inapp') add(reverseKey(s.type, s.id), t);
      if (s.kind === 'drill') add(reverseKey(s.source.type, s.source.id), t);
    }
    return m;
  });
  return revCache.then((m) => m.get(reverseKey(type, id)) ?? []);
}

/* ------------------------------------------------------------------ progress */
export const PROGRESS_KEY = 'sb:apol:v1';
export const NOTES_KEY = 'sb:apol:notes:v1';
export const DRILL_KEY = 'sb:apol:drills:v1';
export interface TrackProgress { done: string[]; started: string; last?: string }
export type ProgressMap = Record<string, TrackProgress>;
const EVT = 'studybible:apol';

const readJson = <T,>(key: string, fallback: T): T => { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v && typeof v === 'object' ? (v as T) : fallback; } catch { return fallback; } };
const writeJson = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* private mode: progress is just not kept */ } try { window.dispatchEvent(new Event(EVT)); } catch { /* not a browser */ } };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function readProgress(): ProgressMap {
  const raw = readJson<Record<string, Partial<TrackProgress>>>(PROGRESS_KEY, {});
  const out: ProgressMap = {};
  for (const [k, v] of Object.entries(raw)) if (v && Array.isArray(v.done)) out[k] = { done: v.done.filter((x) => typeof x === 'string'), started: typeof v.started === 'string' ? v.started : today(), last: typeof v.last === 'string' ? v.last : undefined };
  return out;
}
export const isDone = (p: ProgressMap, trackId: string, sid: string) => !!p[trackId]?.done.includes(sid);

/** Mark a step done (or undo). Stamps the Pilgrim's Passport when this finishes a level or the whole track. Returns what was just completed. */
export function setStepDone(t: Track, sid: string, on: boolean): { level?: number; track?: boolean } {
  const all = readProgress();
  const cur = all[t.id] ?? { done: [], started: today() };
  const before = new Set(cur.done);
  const set = new Set(cur.done);
  if (on) set.add(sid); else set.delete(sid);
  all[t.id] = { done: [...set], started: cur.started, last: sid };
  writeJson(PROGRESS_KEY, all);
  const res: { level?: number; track?: boolean } = {};
  if (on && !before.has(sid)) {
    const n = +sid.split('.')[0];
    if (levelComplete(t, set, n)) { res.level = n; stampSafe(`${t.id}:L${n}`, `${t.title}, level ${n}`); }
    if (trackComplete(t, set)) { res.track = true; stampSafe(t.id, `${t.title} (finished)`); }
  }
  return res;
}
function stampSafe(id: string, label: string) {
  try { stamp('apologetics' as Parameters<typeof stamp>[0], id, label); } catch { /* the passport is optional */ }
}
export const levelComplete = (t: Track, done: Set<string> | string[], n: number) => { const d = new Set(done); const ids = levelStepIds(t, n); return ids.length > 0 && ids.every((i) => d.has(i)); };
export const trackComplete = (t: Track, done: Set<string> | string[]) => t.levels.every((l) => levelComplete(t, done, l.n));
export function trackPercent(t: Track, p: ProgressMap): number {
  const total = t.levels.reduce((a, l) => a + l.steps.length, 0);
  if (!total) return 0;
  const d = new Set(p[t.id]?.done ?? []);
  return Math.round((t.levels.reduce((a, l) => a + levelStepIds(t, l.n).filter((i) => d.has(i)).length, 0) / total) * 100);
}
export function levelPercent(t: Track, p: ProgressMap, n: number): number {
  const ids = levelStepIds(t, n);
  const d = new Set(p[t.id]?.done ?? []);
  return ids.length ? Math.round((ids.filter((i) => d.has(i)).length / ids.length) * 100) : 0;
}
/** The first step not yet done, in level order. */
export function nextStep(t: Track, p: ProgressMap): { level: number; index: number; id: string } | null {
  const d = new Set(p[t.id]?.done ?? []);
  for (const l of t.levels) for (let i = 0; i < l.steps.length; i++) if (!d.has(stepId(l.n, i))) return { level: l.n, index: i, id: stepId(l.n, i) };
  return null;
}
export const stepMinutes = (t: Track, s: Step): number => (s.kind === 'resource' ? resourceOf(t, s.id)?.minutes ?? 10 : s.kind === 'drill' ? 8 : s.kind === 'reflect' ? 5 : 10);

/* ----------------------------------------------------------- notes + drills */
export const readNotes = (): Record<string, string> => readJson<Record<string, string>>(NOTES_KEY, {});
export function saveNote(trackId: string, sid: string, text: string) {
  const n = readNotes();
  const k = `${trackId}:${sid}`;
  if (text.trim()) n[k] = text.slice(0, 4000); else delete n[k];
  writeJson(NOTES_KEY, n);
}
export type Rating = 'got' | 'partly' | 'not';
/** drill results: key "trackId:stepId" -> { objectionIndex: rating } */
export const readDrills = (): Record<string, Record<string, Rating>> => readJson<Record<string, Record<string, Rating>>>(DRILL_KEY, {});
export function saveDrill(trackId: string, sid: string, idx: number, r: Rating) {
  const d = readDrills();
  const k = `${trackId}:${sid}`;
  d[k] = { ...(d[k] ?? {}), [String(idx)]: r };
  writeJson(DRILL_KEY, d);
}
export const APOL_EVENT = EVT;

export const TRACKS_BASE = '/study/apologetics-tracks';
export const trackPath = (id: string) => `${TRACKS_BASE}/${id}`;
