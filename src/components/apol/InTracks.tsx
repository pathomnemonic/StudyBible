import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tracksFor, trackPath, type Track } from '../../lib/apolTracks';

/** A small row of chips, "Part of these tracks: …", for a chain, claim, heresy, lesson and so on. Renders nothing when no track uses the item. */
export default function InTracks({ type, id }: { type: string; id: string }) {
  const [ts, setTs] = useState<Track[]>([]);
  useEffect(() => {
    let live = true;
    setTs([]);
    tracksFor(type, id).then((x) => live && setTs(x)).catch(() => undefined);
    return () => { live = false; };
  }, [type, id]);
  if (!ts.length) return null;
  return (
    <p className="apt-intracks no-print" aria-label="Apologetics tracks that include this">
      <span className="muted small">Part of these tracks:</span>{' '}
      {ts.map((t) => <Link key={t.id} className="chip" to={trackPath(t.id)}>{t.title}</Link>)}
    </p>
  );
}
