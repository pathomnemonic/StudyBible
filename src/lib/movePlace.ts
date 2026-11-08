import { db, type PlanProgress, type MemoryCard } from '../db/db';
import { getSettings, updateSettings, type Settings } from './store';
import { mergeBooks, rawBook, saveMerged } from './passport';

/**
 * "Move my place": a small file (or a pasteable code) with just the things that make the app feel like yours on a new phone:
 * reading plan position, memorized verses, Slow Bible progress, the Pilgrim's Passport, game streaks and trophies, stickers,
 * favorite days and a few setup choices. It holds no notes or highlights (the full backup file carries those).
 * Importing never overwrites blindly: the file is checked, shown to the reader, and only merged after they say yes.
 */
export const FORMAT = 'studybible-place';
const SLOW = 'sb:slowBible', PLAYS = 'sb:plays:v1', TROPHIES = 'sb:trophies:v1', STICKERS = 'sb:stickers:v1';
export const SETUP_KEYS = ['theme', 'language', 'spelling', 'fontSize', 'lineHeight', 'margin', 'fontFamily', 'letterSpacing', 'wordSpacing', 'plainAlign', 'motion', 'haptics', 'layout',
  'defaultEdition', 'parallelEdition', 'enabledEditions', 'showVerseNumbers', 'kidsAge', 'tradition', 'activePlan', 'weeklyGoal', 'refNumbering', 'showStreaks'] as const;

type Plan = Pick<PlanProgress, 'planId' | 'startedAt' | 'status' | 'done' | 'offsetDays'>;
type Card = Pick<MemoryCard, 'ref' | 'set' | 'ease' | 'interval' | 'reps' | 'lapses' | 'due' | 'lastReviewed' | 'createdAt'>;
export interface Place {
  f: typeof FORMAT; v: 1; at: number;
  plans?: Plan[]; memory?: Card[]; slow?: { start: string; done: number[] }; passport?: unknown;
  plays?: Record<string, unknown>; trophies?: Record<string, number>; stickers?: string[];
  favs?: { date: string; label: string }[]; setup?: Record<string, unknown>;
}
export type Section = 'plans' | 'memory' | 'slow' | 'passport' | 'games' | 'stickers' | 'favs' | 'setup';
export const SECTION_NAMES: Record<Section, string> = {
  plans: 'Reading plan position', memory: 'Memorized verses', slow: 'Slow Bible progress', passport: 'Pilgrim’s Passport stamps',
  games: 'Game streaks and trophies', stickers: 'Stickers', favs: 'Favorite days', setup: 'Setup choices (theme, language, translation, text size)',
};

const ls = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
const json = <T>(k: string, d: T): T => { try { const v = JSON.parse(ls(k) ?? 'null'); return v ?? d; } catch { return d; } };
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);
const ints = (v: unknown, max = 5000) => (Array.isArray(v) ? [...new Set(v.filter((x): x is number => Number.isInteger(x) && x >= 0 && x < 100000))].slice(0, max) : []);

/** Read what this device has. */
export async function collectPlace(): Promise<Place> {
  const p: Place = { f: FORMAT, v: 1, at: Date.now() };
  p.plans = (await db.planProgress.toArray()).map((r) => ({ planId: r.planId, startedAt: r.startedAt, status: r.status, done: r.done, offsetDays: r.offsetDays }));
  p.memory = (await db.memory.toArray()).map((r) => ({ ref: r.ref, set: r.set, ease: r.ease, interval: r.interval, reps: r.reps, lapses: r.lapses, due: r.due, lastReviewed: r.lastReviewed, createdAt: r.createdAt }));
  const slow = json<{ start?: string; done?: number[] } | null>(SLOW, null);
  if (slow && typeof slow.start === 'string') p.slow = { start: slow.start, done: ints(slow.done) };
  const pass = rawBook(); if (pass) p.passport = pass;
  const plays = json<Record<string, unknown> | null>(PLAYS, null); if (isObj(plays)) p.plays = plays;
  const tro = json<Record<string, number> | null>(TROPHIES, null); if (isObj(tro)) p.trophies = tro as Record<string, number>;
  const st = json<string[] | null>(STICKERS, null); if (Array.isArray(st)) p.stickers = st.filter((x) => typeof x === 'string');
  p.favs = (await db.cache.filter((r) => r.key.startsWith('daily-fav:')).toArray()).map((r) => ({ date: r.key.slice(10), label: String(r.value ?? '') }));
  const s = getSettings() as unknown as Record<string, unknown>;
  p.setup = Object.fromEntries(SETUP_KEYS.filter((k) => k in s).map((k) => [k, s[k]]));
  return p;
}

/** Check a file or code's contents and keep only well-formed parts. Throws a plain message when it is not a place file. */
export function parsePlace(text: string): Place {
  if (text.length > 6_000_000) throw new Error('That is too large to be a place file.');
  let d: unknown;
  try { d = JSON.parse(text); } catch { throw new Error('That is not a place file. It should be the file saved by “Move my place”, or its code.'); }
  if (!isObj(d) || d.f !== FORMAT) throw new Error('That is not a “Move my place” file.');
  if (typeof d.v === 'number' && d.v > 1) throw new Error('This file was made by a newer version of the app. Update the app, then try again.');
  const p: Place = { f: FORMAT, v: 1, at: num(d.at) };
  if (Array.isArray(d.plans)) p.plans = d.plans.filter(isObj).filter((r) => typeof r.planId === 'string' && r.planId.length < 80).slice(0, 200).map((r) => ({
    planId: r.planId as string, startedAt: num(r.startedAt, Date.now()), status: (['active', 'paused', 'finished'].includes(r.status as string) ? r.status : 'active') as Plan['status'], done: ints(r.done), offsetDays: num(r.offsetDays) }));
  if (Array.isArray(d.memory)) p.memory = d.memory.filter(isObj).filter((r) => typeof r.ref === 'string' && r.ref.length < 80).slice(0, 5000).map((r) => ({
    ref: r.ref as string, set: typeof r.set === 'string' ? r.set : undefined, ease: num(r.ease, 2.5), interval: num(r.interval), reps: num(r.reps), lapses: num(r.lapses), due: num(r.due, Date.now()),
    lastReviewed: typeof r.lastReviewed === 'number' ? r.lastReviewed : undefined, createdAt: num(r.createdAt, Date.now()) }));
  if (isObj(d.slow) && typeof d.slow.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.slow.start)) p.slow = { start: d.slow.start, done: ints(d.slow.done) };
  if (isObj(d.passport)) p.passport = d.passport;
  if (isObj(d.plays)) p.plays = d.plays;
  if (isObj(d.trophies)) p.trophies = Object.fromEntries(Object.entries(d.trophies).filter(([, v]) => typeof v === 'number')) as Record<string, number>;
  if (Array.isArray(d.stickers)) p.stickers = d.stickers.filter((x): x is string => typeof x === 'string').slice(0, 500);
  if (Array.isArray(d.favs)) p.favs = d.favs.filter(isObj).filter((r) => typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date)).slice(0, 3000).map((r) => ({ date: r.date as string, label: String(r.label ?? '').slice(0, 200) }));
  if (isObj(d.setup)) p.setup = Object.fromEntries(Object.entries(d.setup).filter(([k]) => (SETUP_KEYS as readonly string[]).includes(k)));
  return p;
}

/** What is in a place, for the question put to the reader before anything is merged. */
export function describePlace(p: Place): { section: Section; text: string }[] {
  const out: { section: Section; text: string }[] = [];
  if (p.plans?.length) out.push({ section: 'plans', text: `${p.plans.length} plan${p.plans.length > 1 ? 's' : ''}, ${p.plans.reduce((n, r) => n + r.done.length, 0)} days checked off` });
  if (p.memory?.length) out.push({ section: 'memory', text: `${p.memory.length} verse${p.memory.length > 1 ? 's' : ''}` });
  if (p.slow) out.push({ section: 'slow', text: `${p.slow.done.length} days done, began ${p.slow.start}` });
  const stamps = isObj(p.passport) && isObj(p.passport.s) ? Object.keys(p.passport.s).length : 0;
  if (stamps) out.push({ section: 'passport', text: `${stamps} stamp${stamps > 1 ? 's' : ''}` });
  if (p.plays || p.trophies) out.push({ section: 'games', text: `${Object.keys(p.trophies ?? {}).length} trophies, ${Array.isArray(p.plays?.days) ? (p.plays!.days as unknown[]).length : 0} days played` });
  if (p.stickers?.length) out.push({ section: 'stickers', text: `${p.stickers.length} sticker${p.stickers.length > 1 ? 's' : ''}` });
  if (p.favs?.length) out.push({ section: 'favs', text: `${p.favs.length} favorite day${p.favs.length > 1 ? 's' : ''}` });
  if (p.setup && Object.keys(p.setup).length) out.push({ section: 'setup', text: 'replaces your current choices on this device' });
  return out;
}

/* ---- merging: each rule keeps what this device already has and adds what is missing ---- */
export function mergePlans(local: Plan[], incoming: Plan[]): Plan[] {
  const by = new Map(local.map((r) => [r.planId, r]));
  for (const r of incoming) {
    const mine = by.get(r.planId);
    if (!mine) { by.set(r.planId, r); continue; }
    by.set(r.planId, { ...mine, done: [...new Set([...mine.done, ...r.done])].sort((a, b) => a - b), status: r.status === 'finished' ? 'finished' : mine.status });
  }
  return [...by.values()];
}
export function mergeMemory(local: Card[], incoming: Card[]): Card[] {
  const k = (c: Card) => `${c.ref}|${c.set ?? ''}`;
  const by = new Map(local.map((c) => [k(c), c]));
  for (const c of incoming) { const mine = by.get(k(c)); if (!mine || c.reps > mine.reps) by.set(k(c), c); }
  return [...by.values()];
}
export function mergeSlow(local: { start: string; done: number[] } | null, incoming: { start: string; done: number[] }): { start: string; done: number[] } {
  if (!local) return incoming;
  if (local.start === incoming.start) return { start: local.start, done: [...new Set([...local.done, ...incoming.done])].sort((a, b) => a - b) };
  // different starting days make the day numbers mean different things: keep whichever has more done
  return incoming.done.length > local.done.length ? incoming : local;
}
export function mergePlays(local: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, unknown> {
  const maxMap = (a: unknown, b: unknown) => { const o: Record<string, number> = isObj(a) ? { ...(a as Record<string, number>) } : {}; if (isObj(b)) for (const [k, v] of Object.entries(b)) if (typeof v === 'number') o[k] = Math.max(o[k] ?? 0, v); return o; };
  const days = [...new Set([...(Array.isArray(local.days) ? local.days : []), ...(Array.isArray(incoming.days) ? incoming.days : [])].filter((x) => typeof x === 'number'))].sort((a, b) => a - b);
  return { ...incoming, ...local, days, games: maxMap(local.games, incoming.games), perfect: maxMap(local.perfect, incoming.perfect), dailyByDay: { ...(isObj(incoming.dailyByDay) ? incoming.dailyByDay : {}), ...(isObj(local.dailyByDay) ? local.dailyByDay : {}) } };
}
export const mergeTrophies = (local: Record<string, number>, incoming: Record<string, number>) => { const o = { ...local }; for (const [k, v] of Object.entries(incoming)) o[k] = k in o ? Math.min(o[k], v) : v; return o; };

/** Merge a checked place into this device, for the sections the reader ticked. Returns a line for each thing done. */
export async function applyPlace(p: Place, sections: Section[]): Promise<string[]> {
  const on = new Set(sections), done: string[] = [];
  if (on.has('plans') && p.plans?.length) {
    const local = (await db.planProgress.toArray()).map((r) => ({ planId: r.planId, startedAt: r.startedAt, status: r.status, done: r.done, offsetDays: r.offsetDays }));
    const merged = mergePlans(local, p.plans);
    for (const r of merged) { const ex = await db.planProgress.get(r.planId); await db.planProgress.put({ ...(ex ?? {}), ...r } as PlanProgress); }
    done.push(`Reading plans: ${merged.length}`);
  }
  if (on.has('memory') && p.memory?.length) {
    const existing = await db.memory.toArray();
    const k = (c: { ref: string; set?: string }) => `${c.ref}|${c.set ?? ''}`;
    const have = new Map(existing.map((c) => [k(c), c]));
    let added = 0;
    for (const c of p.memory) {
      const mine = have.get(k(c));
      if (!mine) { await db.memory.add({ ...c } as MemoryCard); added++; }
      else if (c.reps > mine.reps) { await db.memory.update(mine.id!, { ease: c.ease, interval: c.interval, reps: c.reps, lapses: c.lapses, due: c.due, lastReviewed: c.lastReviewed }); }
    }
    done.push(`Memorized verses added: ${added}`);
  }
  if (on.has('slow') && p.slow) { lsSet(SLOW, JSON.stringify(mergeSlow(json(SLOW, null), p.slow))); done.push('Slow Bible progress'); }
  if (on.has('passport') && p.passport) { saveMerged(mergeBooks(rawBook(), p.passport)); done.push('Passport stamps'); }
  if (on.has('games')) {
    if (p.plays) lsSet(PLAYS, JSON.stringify(mergePlays(json<Record<string, unknown>>(PLAYS, {}), p.plays)));
    if (p.trophies) lsSet(TROPHIES, JSON.stringify(mergeTrophies(json<Record<string, number>>(TROPHIES, {}), p.trophies)));
    done.push('Game streaks and trophies');
  }
  if (on.has('stickers') && p.stickers) { lsSet(STICKERS, JSON.stringify([...new Set([...json<string[]>(STICKERS, []), ...p.stickers])])); done.push('Stickers'); }
  if (on.has('favs') && p.favs?.length) {
    for (const f of p.favs) if (!(await db.cache.get(`daily-fav:${f.date}`))) await db.cache.put({ key: `daily-fav:${f.date}`, value: f.label, ts: Date.now() });
    done.push('Favorite days');
  }
  if (on.has('setup') && p.setup && Object.keys(p.setup).length) { updateSettings(p.setup as Partial<Settings>); done.push('Setup choices'); }
  return done;
}

/* ---- the pasteable code: the same JSON, squeezed and written in letters and digits ---- */
const PREFIX = 'SBP1.';
const toB64 = (u: Uint8Array) => { let s = ''; for (const b of u) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const fromB64 = (t: string) => { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, (c) => c.charCodeAt(0)); };
async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const w = stream.writable.getWriter(); void w.write(data as unknown as BufferSource); void w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
export async function placeToCode(p: Place): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(p));
  if (typeof CompressionStream === 'undefined') return `SBP0.${toB64(raw)}`;
  return PREFIX + toB64(await pipe(raw, new CompressionStream('deflate-raw')));
}
export async function codeToText(code: string): Promise<string> {
  const t = code.replace(/\s+/g, '');
  try {
    if (t.startsWith('SBP0.')) return new TextDecoder().decode(fromB64(t.slice(5)));
    if (t.startsWith(PREFIX)) return new TextDecoder().decode(await pipe(fromB64(t.slice(PREFIX.length)), new DecompressionStream('deflate-raw')));
  } catch { /* fall through */ }
  throw new Error('That code does not look right. Check that all of it was copied.');
}
/** A file's text or a pasted code: either one gives a checked place. */
export async function readPlace(input: string): Promise<Place> {
  const t = input.trim();
  return parsePlace(t.startsWith('{') ? t : await codeToText(t));
}
