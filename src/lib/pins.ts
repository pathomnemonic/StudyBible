/** Pinned collections and plans, and a short list of what was opened lately. Kept in this browser only (and carried by a backup file). Notes keep their own pin on the note. */
import { useEffect, useState } from 'react';

export type PinKind = 'collection' | 'plan' | 'note';
export interface Entry { kind: PinKind; id: string; title: string; to: string }
const PINS = 'sb:pins';
const RECENT = 'sb:recentItems';
export const RECENT_KEEP = 8;
const EVT = 'sb:pins-changed';

function read(key: string): Entry[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(v) ? v.filter((e) => e && typeof e.id === 'string' && typeof e.title === 'string' && typeof e.to === 'string' && ['collection', 'plan', 'note'].includes(e.kind)) : [];
  } catch { return []; }
}
function write(key: string, list: Entry[]) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* storage unavailable */ }
  try { window.dispatchEvent(new Event(EVT)); } catch { /* no window */ }
}
const same = (a: Entry, b: Pick<Entry, 'kind' | 'id'>) => a.kind === b.kind && a.id === b.id;

export const getPins = () => read(PINS);
export const getRecent = () => read(RECENT);
export const isPinned = (kind: PinKind, id: string) => read(PINS).some((e) => same(e, { kind, id }));
/** pins or unpins; returns whether it is now pinned */
export function togglePin(e: Entry): boolean {
  const list = read(PINS);
  const had = list.some((x) => same(x, e));
  write(PINS, had ? list.filter((x) => !same(x, e)) : [e, ...list]);
  return !had;
}
/** remember that this was opened: newest first, each thing once, the last few kept; a pin's title is refreshed too */
export function recordOpened(e: Entry) {
  write(RECENT, [e, ...read(RECENT).filter((x) => !same(x, e))].slice(0, RECENT_KEEP));
  const pins = read(PINS);
  if (pins.some((x) => same(x, e) && (x.title !== e.title || x.to !== e.to))) write(PINS, pins.map((x) => (same(x, e) ? e : x)));
}
export function forgetRecent() { write(RECENT, []); }

/** re-reads when a pin or recent entry changes (here or in another tab) */
export function usePins() {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((n) => n + 1); window.addEventListener(EVT, f); window.addEventListener('storage', f); return () => { window.removeEventListener(EVT, f); window.removeEventListener('storage', f); }; }, []);
  return { pins: getPins(), recent: getRecent() };
}
