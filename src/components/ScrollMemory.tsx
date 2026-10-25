import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Going Back returns you to where you were on the page you left, not the top. Positions are kept for this tab only.
 * The reader keeps its own place (per chapter), so it is left alone.
 */
export default function ScrollMemory() {
  const loc = useLocation();
  const type = useNavigationType();
  const last = useRef({ key: loc.key, path: loc.pathname });
  useEffect(() => {
    const save = () => { try { sessionStorage.setItem(`sb:scroll:${last.current.key}`, String(window.scrollY)); } catch { /* storage unavailable */ } };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);
  useEffect(() => {
    last.current = { key: loc.key, path: loc.pathname };
    if (type !== 'POP' || loc.pathname.startsWith('/read/')) return;
    let y = 0;
    try { y = Number(sessionStorage.getItem(`sb:scroll:${loc.key}`) ?? 0); } catch { /* ignore */ }
    if (!y) return;
    // content often arrives after the page mounts, so try for a moment until the page is tall enough
    let tries = 0;
    const t = window.setInterval(() => {
      window.scrollTo(0, y);
      if (Math.abs(window.scrollY - y) < 4 || ++tries > 12) window.clearInterval(t);
    }, 80);
    return () => window.clearInterval(t);
  }, [loc.key]);
  return null;
}
