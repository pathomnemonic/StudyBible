import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../../db/db';
import { rememberEpisode, usePlayer } from '../../data/PlayerContext';
import { decodeQueue, resolveAny } from '../../data/playlist';
import type { BiayEpisode } from '../../data/content';
import { fmtDuration } from '../../data/biay';

/** A playlist someone shared: see what is in it, then add it to your queue or play it. */
export default function QueueImportPage() {
  const [sp] = useSearchParams();
  const ids = decodeQueue(sp.get('q') ?? '');
  const [eps, setEps] = useState<BiayEpisode[] | null>(null);
  const [added, setAdded] = useState(false);
  const player = usePlayer();
  useEffect(() => {
    let live = true;
    Promise.all(ids.map(resolveAny)).then((l) => live && setEps(l.filter((e): e is BiayEpisode => !!e)));
    return () => { live = false; };
  }, [sp.get('q')]); // eslint-disable-line react-hooks/exhaustive-deps
  const addAll = async () => {
    if (!eps) return;
    const base = Date.now();
    for (const [i, e] of eps.entries()) { await rememberEpisode(e); if (!(await db.queue.where('episodeId').equals(e.id).count())) await db.queue.add({ episodeId: e.id, order: base + i }); }
    setAdded(true);
  };
  return (
    <div className="page queue-import">
      <h1>A shared playlist</h1>
      {!ids.length && <p className="muted">This link has no playlist in it.</p>}
      {ids.length > 0 && eps === null && <div className="center-note">Finding the episodes…</div>}
      {eps && eps.length === 0 && ids.length > 0 && <p className="muted">None of these episodes could be found.</p>}
      {eps && eps.length > 0 && (
        <>
          <p className="muted">{eps.length} episode{eps.length === 1 ? '' : 's'}{eps.length < ids.length ? ` (${ids.length - eps.length} could not be found)` : ''}. They play from their publishers; nothing is copied.</p>
          <ul className="list">{eps.map((e) => <li key={e.id}><strong>{e.kind === 'day' && e.day ? `Day ${e.day}: ${e.short}` : e.title}</strong> <span className="muted small">{e.artist ? `· ${e.artist} ` : ''}· {fmtDuration(e.duration)}</span></li>)}</ul>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={added} onClick={() => void addAll()}>{added ? 'Added to your queue' : 'Add to my queue'}</button>
            <button className="btn" onClick={() => { void addAll().then(() => player.play(eps[0])); }}>Play it now</button>
            {added && <Link className="btn ghost" to="/listen">Open Media</Link>}
          </div>
        </>
      )}
    </div>
  );
}
