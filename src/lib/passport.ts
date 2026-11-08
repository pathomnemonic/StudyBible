import { useSyncExternalStore } from 'react';
import { CATEGORY_OF, type Category, type Kind } from './passportMap';

/**
 * The Pilgrim's Passport: private stamps for what you open or finish. Kept only in this browser (localStorage 'sb:passport'), never sent anywhere.
 * It records no reading history beyond "first time, month and year"; the History page keeps the detailed trail.
 */
export interface Stamp { k: Kind; i: string; l: string; t: number }
interface Book { v: 1; s: Record<string, Stamp> }
export const KEY = 'sb:passport';
export const MAX_STAMPS = 1500;
const EVT = 'studybible:passport';
const EVICT_FIRST: Kind[] = ['readings', 'feastcard', 'saint', 'work', 'catechism', 'lesson'];

const keyOf = (k: string, i: string) => `${k}:${i}`;
const KINDS = new Set<string>(Object.keys(CATEGORY_OF));
const clean = (raw: unknown): Book => {
  const out: Book = { v: 1, s: {} };
  const s = raw && typeof raw === 'object' ? (raw as { s?: unknown }).s : null;
  if (!s || typeof s !== 'object') return out;
  for (const v of Object.values(s as Record<string, unknown>)) {
    const x = v as Partial<Stamp> | null;
    if (!x || typeof x.k !== 'string' || !KINDS.has(x.k) || typeof x.i !== 'string' || typeof x.l !== 'string' || typeof x.t !== 'number' || !isFinite(x.t)) continue;
    out.s[keyOf(x.k, x.i)] = { k: x.k as Kind, i: x.i.slice(0, 120), l: x.l.slice(0, 90), t: x.t };
  }
  return out;
};
const read = (): Book => { try { return clean(JSON.parse(localStorage.getItem(KEY) ?? 'null')); } catch { return { v: 1, s: {} }; } };
const write = (b: Book) => {
  const all = Object.entries(b.s);
  if (all.length > MAX_STAMPS) {
    const order = (e: [string, Stamp]) => (EVICT_FIRST.includes(e[1].k) ? 0 : 1);
    all.sort((a, c) => order(a) - order(c) || a[1].t - c[1].t);
    for (const [k] of all.slice(0, all.length - MAX_STAMPS)) delete b.s[k];
  }
  try { localStorage.setItem(KEY, JSON.stringify(b)); } catch { /* private mode: the stamp just is not kept */ }
  cache = null;
  try { window.dispatchEvent(new Event(EVT)); } catch { /* not in a browser */ }
};

/** Put a stamp in the book. Returns true when it is new; a second visit changes nothing (the first date stays). */
export function stamp(kind: Kind, id: string, label: string, now = Date.now()): boolean {
  const b = read();
  const k = keyOf(kind, id);
  if (b.s[k]) return false;
  b.s[k] = { k: kind, i: id, l: label, t: now };
  write(b);
  return true;
}
export const allStamps = (): Stamp[] => Object.values(read().s).sort((a, b) => b.t - a.t);
export const hasStamp = (kind: Kind, id: string) => !!read().s[keyOf(kind, id)];
export function resetPassport() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } cache = null; try { window.dispatchEvent(new Event(EVT)); } catch { /* ignore */ } }
export const countIn = (stamps: Stamp[], cat: Category) => stamps.filter((s) => CATEGORY_OF[s.k] === cat).length;

/** Combine two passports (this device's and one brought from another): every stamp from both, the earlier date kept. */
export function mergeBooks(local: unknown, incoming: unknown): { s: Record<string, Stamp> } {
  const a = clean(local).s, b = clean(incoming).s;
  const out: Record<string, Stamp> = { ...a };
  for (const [k, v] of Object.entries(b)) if (!out[k] || v.t < out[k].t) out[k] = v;
  return { s: out };
}
/** Write a merged passport (used by "Move my place"). */
export function saveMerged(m: { s: Record<string, Stamp> }) { write({ v: 1, s: m.s }); }
export const rawBook = (): unknown => { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; } };

let cache: Stamp[] | null = null;
const snapshot = () => (cache ??= allStamps());
const subscribe = (cb: () => void) => { const f = () => { cache = null; cb(); }; window.addEventListener(EVT, f); window.addEventListener('storage', f); return () => { window.removeEventListener(EVT, f); window.removeEventListener('storage', f); }; };
/** The stamps, newest first, kept up to date as new ones are made. */
export function usePassport(): Stamp[] {
  return useSyncExternalStore(subscribe, () => { try { return snapshot(); } catch { return []; } }, () => []);
}
