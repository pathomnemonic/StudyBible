import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { stamp } from '../lib/passport';
import { GAMES, councilDraft, councilFromText, stampsFor } from '../lib/passportMap';
import { loadPlays } from '../lib/dailyGame';

/**
 * Stamps the Pilgrim's Passport from the address alone, so no page needs to know about it. Renders nothing.
 * Two small extras: a game you have finished counts even if you reached it another way, and tapping a council on the Councils page
 * (which opens it in place, without changing the address) stamps that council.
 */
export default function PassportWatcher() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    try {
      for (const d of stampsFor(pathname, search)) stamp(d.kind, d.id, d.label);
      for (const [g, n] of Object.entries(loadPlays().games ?? {})) if (n > 0 && GAMES[g]) stamp('game', g, GAMES[g]);
    } catch { /* the passport must never break a page */ }
  }, [pathname, search]);

  useEffect(() => {
    if (pathname !== '/study/councils') return;
    const onClick = (e: MouseEvent) => {
      try {
        const b = (e.target as HTMLElement | null)?.closest?.('ol.councils li button[aria-expanded]');
        const n = b ? councilFromText(b.textContent ?? '') : null;
        if (n) { const name = (b!.textContent ?? '').replace(/^\s*\d+\.\s*/, '').trim(); stamp('council', String(n), councilDraft(n, name).label); }
      } catch { /* ignore */ }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [pathname]);
  return null;
}
