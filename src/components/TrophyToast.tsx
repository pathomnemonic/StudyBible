import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Trophy } from '../lib/dailyGame';

/** A small note at the top of the screen when a game earns a trophy. */
export default function TrophyToast() {
  const [t, setT] = useState<Trophy[] | null>(null);
  useEffect(() => {
    let timer = 0;
    const h = (e: Event) => { setT((e as CustomEvent<Trophy[]>).detail); window.clearTimeout(timer); timer = window.setTimeout(() => setT(null), 6000); };
    window.addEventListener('studybible:trophy', h);
    return () => { window.removeEventListener('studybible:trophy', h); window.clearTimeout(timer); };
  }, []);
  if (!t?.length) return null;
  return (
    <div className="trophy-toast" role="status">
      <span aria-hidden="true">{t[0].icon}</span>
      <span><strong>{t.length > 1 ? `${t.length} new trophies` : t[0].title}</strong> <Link to="/play/trophies" onClick={() => setT(null)}>See the shelf</Link></span>
    </div>
  );
}
