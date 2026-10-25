import { useEffect } from 'react';

/** Keeps the screen from sleeping while `on` is true and the page is visible (Screen Wake Lock API; quietly does nothing where it is missing). */
export function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let lock: { release: () => Promise<void> } | null = null;
    let dead = false;
    const take = async () => {
      try { if (!dead && document.visibilityState === 'visible') lock = await (navigator as any).wakeLock.request('screen'); } catch { /* denied, e.g. low battery */ }
    };
    void take();
    const vis = () => { if (document.visibilityState === 'visible') void take(); };
    document.addEventListener('visibilitychange', vis);
    return () => { dead = true; document.removeEventListener('visibilitychange', vis); void lock?.release().catch(() => {}); };
  }, [on]);
}
