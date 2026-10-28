import { useSyncExternalStore } from 'react';
import { getSettings } from './store';

const KEY = 'sb:seen';
const EVT = 'studybible:seen';
let mem: Record<string, 1> | null = null;

/** Things the reader has opened once. Existing readers (who finished the old tour) start with the original tabs counted as seen, so only genuinely new things get a dot. */
const read = (): Record<string, 1> => {
  if (mem) return mem;
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { /* private mode */ }
  if (raw) { try { mem = JSON.parse(raw) as Record<string, 1>; } catch { mem = {}; } return mem!; }
  mem = {};
  try {
    if (localStorage.getItem('sb:tour') === '1' && !localStorage.getItem('sb:welcomed')) for (const id of ['tab./room', 'tab./study', 'tab./read', 'tab./listen', 'tab./profile']) mem[id] = 1;
    localStorage.setItem(KEY, JSON.stringify(mem));
  } catch { /* private mode */ }
  return mem!;
};
const emit = () => { try { window.dispatchEvent(new Event(EVT)); } catch { /* server render */ } };

/** Dots on tabs and folds are made up as the app goes (`m.*`, `fold.*`), so "clear every dot" stores one flag for them all. */
const dynamic = (id: string) => id.startsWith('m.') || id.startsWith('fold.');
export const isSeen = (id: string) => !!read()[id] || (dynamic(id) && !!read()['*dyn']);
export function markSeen(...ids: string[]) {
  const m = read();
  let changed = false;
  for (const id of ids) if (!m[id]) { m[id] = 1; changed = true; }
  if (!changed) return;
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* private mode */ }
  emit();
}
export function resetSeen() { mem = {}; try { localStorage.removeItem(KEY); } catch { /* none */ } emit(); }
const subscribe = (cb: () => void) => { window.addEventListener(EVT, cb); return () => window.removeEventListener(EVT, cb); };
/** true once the reader has opened the thing with this id */
export const useSeen = (id: string) => useSyncExternalStore(subscribe, () => isSeen(id), () => true);
export const hintsOn = () => getSettings().hints !== false;
/** Clear every dot and tip at once: marks every feature and tip in the registry as opened. */
export function markAllSeen() {
  import('./features').then(({ FEATURES, HUBS }) => markSeen('*dyn', ...FEATURES.map((f) => f.id), ...HUBS.map((h) => `tab.${h.to}`), 'tab./pray', 'tab./room', 'tab./study', 'tab./read', 'tab./listen',
    ...['pray', 'read', 'listen', 'study', 'memorize'].map((t) => `tip.${t}`)));
}
