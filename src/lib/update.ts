import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * App updates are never forced on someone mid-task. A new version waits until you tap "Update now", or until you leave the tab
 * and nothing is half-written (an unsaved note or journal entry is a text box with something in it).
 */
let ready = false;
let apply: ((reload?: boolean) => Promise<void>) | null = null;
const listeners = new Set<() => void>();
const set = (v: boolean) => { ready = v; listeners.forEach((l) => l()); };

const unsavedText = () => [...document.querySelectorAll('textarea')].some((t) => (t as HTMLTextAreaElement).value.trim().length > 0);

export function initUpdates() {
  apply = registerSW({ immediate: true, onNeedRefresh: () => set(true) });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && ready && !unsavedText()) void apply?.(true);
  });
  // check for a newer version when the app comes back to the front
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {});
  });
}
export const applyUpdate = () => apply?.(true);
export const dismissUpdate = () => set(false);
export const useUpdateReady = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => ready);
