import { useState } from 'react';
import { copyText } from '../lib/clipboard';

/** The address of a page that opens straight to one thing (a saint, a feast, a word), for sending to someone. */
export const shareUrl = (path: string) => `${location.origin}${location.pathname}#${path}`;

/** A small button that shares a link: the phone's share sheet where there is one, otherwise it copies the link. */
export default function ShareLinkButton({ path, title, label = 'Share', className = 'btn small ghost' }: { path: string; title: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  const go = async () => {
    const url = shareUrl(path);
    try { if (navigator.share) { await navigator.share({ title, url }); return; } } catch (e) { if ((e as Error)?.name === 'AbortError') return; }
    if (await copyText(url)) { setDone(true); window.setTimeout(() => setDone(false), 2000); }
  };
  return <button className={className} onClick={() => void go()} aria-label={`Share a link to ${title}`}>{done ? 'Link copied' : label}</button>;
}
