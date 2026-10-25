import { useEffect } from 'react';

const k = (path: string) => `sb:scroll:${path}`;
export const savedScroll = (path: string): number | null => { try { const v = sessionStorage.getItem(k(path)); return v === null ? null : +v; } catch { return null; } };
export const forgetScroll = (path: string) => { try { sessionStorage.removeItem(k(path)); } catch { /* private mode */ } };
const save = (path: string) => { try { sessionStorage.setItem(k(path), String(Math.round(window.scrollY))); } catch { /* private mode */ } };

/** Remembers where you were on a page and puts you back when you return, for example after visiting another tab. `ready` is true once the content is on screen. */
export function useScrollMemory(path: string, ready: boolean, key = path) {
  useEffect(() => {
    if (!ready) return;
    const y = savedScroll(key);
    if (y) requestAnimationFrame(() => window.scrollTo(0, y));
    // saved as you scroll (not when leaving, because by then the new page may already have reset the scroll)
    let raf = 0;
    const here = () => location.hash.slice(1).split('?')[0];
    const on = () => { if (raf || here() !== path) return; raf = requestAnimationFrame(() => { raf = 0; if (here() === path) save(key); }); };
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); if (raf) cancelAnimationFrame(raf); };
  }, [path, ready, key]);
}
