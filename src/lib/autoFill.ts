import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from './store';
import { autoOpen } from './foldAuto';

const ROOTS = new Set(['/learn', '/pray', '/listen', '/room', '/profile']);
const overflow = () => (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight > 1;

/**
 * Folded sections that the user has not touched open themselves, one by one, for as long as the page still fits the screen.
 * Each one is opened and measured in the same breath (reading the height forces layout, but nothing is painted in between),
 * and closed again at once if it does not fit, so a section that will not fit never flashes open.
 */
function fill() {
  const folds = [...document.querySelectorAll<HTMLDetailsElement>('.page details.fold:not([open])')];
  (window as unknown as { __sbAuto?: boolean }).__sbAuto = true;
  try {
    // a smaller screen than before: give back what no longer fits, last opened first
    for (const d of [...document.querySelectorAll<HTMLDetailsElement>('.page details.fold[open]')].reverse()) {
      if (!overflow()) break;
      const key = d.dataset.foldKey;
      if (key && autoOpen.has(key)) { d.open = false; autoOpen.delete(key); }
    }
    for (const d of folds) {
      const key = d.dataset.foldKey;
      if (!key || !d.isConnected) continue;
      try { if (sessionStorage.getItem(key) !== null) continue; } catch { /* private mode */ }
      d.open = true;
      if (overflow()) d.open = false; else autoOpen.add(key);
    }
  } finally {
    // the toggle events arrive after this task; keep the guard up until they have
    window.setTimeout(() => { (window as unknown as { __sbAuto?: boolean }).__sbAuto = false; }, 0);
  }
}

/** On the tab front pages in the compact layout, use the screen that is there. */
export function useAutoFill() {
  const { pathname } = useLocation();
  const [s] = useSettings();
  useEffect(() => {
    if (s.layout !== 'compact' || !ROOTS.has(pathname)) return;
    let t: number | undefined;
    const run = () => { window.clearTimeout(t); t = window.setTimeout(fill, 450); };
    run();
    window.addEventListener('resize', run);
    return () => { window.clearTimeout(t); window.removeEventListener('resize', run); };
  }, [pathname, s.layout]);
}
