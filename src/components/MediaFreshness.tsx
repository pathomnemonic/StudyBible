import { useEffect, useState } from 'react';
import { getShows } from '../data/podcasts';
import { getBiay } from '../data/content';

/** One quiet line at the foot of Media: episode lists are refreshed from the shows' own feeds every day, and new ones appear the next time the app is online. */
export default function MediaFreshness() {
  const [when, setWhen] = useState('');
  useEffect(() => {
    Promise.all([getShows().catch(() => null), getBiay().catch(() => null)]).then(([s, b]) => {
      const d = [s?.generated, (b as { meta?: { retrieved?: string } } | null)?.meta?.retrieved].filter(Boolean).sort().pop();
      if (d) setWhen(new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }));
    });
  }, []);
  return <p className="muted small" style={{ textAlign: 'center', margin: '18px 0 4px' }}>Episode lists are refreshed every day from each show’s own feed{when ? `. Last refresh: ${when}` : ''}. New episodes appear the next time you open the app online.</p>;
}
