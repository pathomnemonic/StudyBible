import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Sticker } from '../lib/stickers';

/** A note at the top of the screen when a sticker is earned. */
export default function StickerToast() {
  const [s, setS] = useState<Sticker | null>(null);
  useEffect(() => {
    let timer = 0;
    const h = (e: Event) => { setS((e as CustomEvent<Sticker>).detail); window.clearTimeout(timer); timer = window.setTimeout(() => setS(null), 6000); };
    window.addEventListener('studybible:sticker', h);
    return () => { window.removeEventListener('studybible:sticker', h); window.clearTimeout(timer); };
  }, []);
  if (!s) return null;
  return <div className="trophy-toast" role="status"><span aria-hidden="true" style={{ fontSize: '1.5rem' }}>{s.icon}</span><span><strong>New sticker: {s.name}!</strong> <Link to="/kids/stickers" onClick={() => setS(null)}>My book</Link></span></div>;
}
