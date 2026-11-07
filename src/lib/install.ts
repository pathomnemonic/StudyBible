import { useSyncExternalStore } from 'react';

/**
 * "Add to Home Screen" support.  Chrome/Edge/Android fire `beforeinstallprompt`, which we keep and replay when the
 * person taps Install.  iPhone/iPad Safari never fire it, so there we show the two-step Share → Add to Home Screen hint.
 */
interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
let deferred: BIPEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);
export const isIos = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent || '') || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);

export type InstallState = 'installed' | 'prompt' | 'ios' | 'unavailable';
export const installState = (): InstallState => (installed || isStandalone() ? 'installed' : deferred ? 'prompt' : isIos() ? 'ios' : 'unavailable');

export function initInstall() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIPEvent; emit(); });
  window.addEventListener('appinstalled', () => { installed = true; deferred = null; emit(); });
}
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null; emit();
  return outcome === 'accepted';
}
export const useInstallState = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, installState, () => 'unavailable' as InstallState);
