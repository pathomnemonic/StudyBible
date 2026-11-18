import { useState } from 'react';
import { copyText } from '../lib/clipboard';
import { shareSlugFor } from '../lib/shareGames';

/** The address of a game, to close a shared result with. */
export const gameUrl = (path: string) => {
  // in a built app a shared game has its own small page with a preview picture (see src/lib/shareGames.ts); it opens the same game
  const slug = shareSlugFor(path);
  const dir = location.pathname.replace(/[^/]*$/, '');
  return slug && import.meta.env.PROD ? `${location.origin}${dir}share/${slug}.html` : `${location.origin}${location.pathname}#${path}`;
};

/** Share a result the way the daily word games do: the phone's share sheet where there is one, otherwise copy it, and say so. */
export default function ShareButton({ text, path, label = 'Share my result', className = 'btn primary' }: { text: string; path: string; label?: string; className?: string }) {
  const [msg, setMsg] = useState('');
  const go = async () => {
    const full = `${text}\n\nPlay it yourself:\n${gameUrl(path)}`;
    try {
      if (navigator.share) { await navigator.share({ text: full }); return; }
    } catch (e) { if ((e as Error)?.name === 'AbortError') return; }
    setMsg((await copyText(full)) ? 'Copied: paste it to a friend' : 'Could not copy');
    window.setTimeout(() => setMsg(''), 2500);
  };
  return <span className="share-wrap"><button className={className} onClick={() => void go()}>{label}</button>{msg && <span className="muted small" role="status"> {msg}</span>}</span>;
}
