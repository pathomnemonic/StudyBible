import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from './store';

const ROOTS = new Set(['/learn', '/pray', '/listen', '/room', '/profile']);
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
const overflow = () => (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight > 1;

/** Folded sections that the user has not touched open themselves, one by one, for as long as the page still fits the screen. */
async function fill() {
  const folds = [...document.querySelectorAll<HTMLDetailsElement>('.page details.fold:not([open])')];
  (window as unknown as { __sbAuto?: boolean }).__sbAuto = true;
  try {
    for (const d of folds) {
      const key = d.dataset.foldKey;
      if (!key || !d.isConnected) continue;
      try { if (sessionStorage.getItem(key) !== null) continue; } catch { /* private mode */ }
      d.open = true;
      await frame();
      if (overflow()) { d.open = false; await frame(); }
    }
  } finally { (window as unknown as { __sbAuto?: boolean }).__sbAuto = false; }
}

/** On the tab front pages in the compact layout, use the screen that is there. */
export function useAutoFill() {
  const { pathname } = useLocation();
  const [s] = useSettings();
  useEffect(() => {
    if (s.layout !== 'compact' || !ROOTS.has(pathname)) return;
    let t: number | undefined;
    const run = () => { window.clearTimeout(t); t = window.setTimeout(() => void fill(), 450); };
    run();
    window.addEventListener('resize', run);
    return () => { window.clearTimeout(t); window.removeEventListener('resize', run); };
  }, [pathname, s.layout]);
}
