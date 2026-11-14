import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { initDirtyTracking, isDirty } from './dirty';

/**
 * App updates are never forced on someone mid-task. A new version waits until you tap "Update now", or until you leave the tab
 * and nothing is half-written (an unsaved note or journal entry is a text box with something in it).
 */
let ready = false;
let apply: ((reload?: boolean) => Promise<void>) | null = null;
const listeners = new Set<() => void>();
const set = (v: boolean) => { ready = v; listeners.forEach((l) => l()); };

/** true while something typed has not reached storage (see dirty.ts): a saved note sitting in a text box is not unsaved work */
export const hasUnsavedWork = () => isDirty();

export function initUpdates() {
  initDirtyTracking();
  apply = registerSW({ immediate: true, onNeedRefresh: () => set(true) });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && ready && !hasUnsavedWork()) void apply?.(true);
  });
  // check for a newer version when the app comes back to the front
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {});
  });
}
/** "Update now": if something typed is not saved yet, ask first (updating reloads the page) */
export const applyUpdate = () => {
  if (hasUnsavedWork() && !window.confirm('Something you typed has not been saved yet. Updating reloads the page and would lose it. Update anyway?')) return undefined;
  return apply?.(true);
};
export const dismissUpdate = () => set(false);
export const useUpdateReady = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => ready);
