import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { fmtDuration } from '../../data/biay';
import { resolveEpisode, rememberEpisode, usePlayer } from '../../data/PlayerContext';
import { loadShow, useShows } from '../../data/podcasts';
import type { BiayEpisode } from '../../data/content';
import { useFollows } from '../../lib/follow';
import Icon from '../../components/Icon';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export const showOf = (e: BiayEpisode) => e.album ?? (e.id.startsWith('lv:') ? 'Audiobook' : e.id.startsWith('pod-') ? 'Podcast' : 'The Bible in a Year');

/** What to listen to next across everything: where you stopped, your queue, and new episodes of shows you follow. */
export default function ListenNow() {
  const player = usePlayer();
  const progress = useLiveQuery(() => db.episodeProgress.toArray(), []) ?? [];
  const queue = useLiveQuery(() => db.queue.orderBy('order').toArray(), []) ?? [];
  const follows = useFollows();
  const shows = useShows();
  const [eps, setEps] = useState<Map<string, BiayEpisode>>(new Map());
  const [fresh, setFresh] = useState<{ show: string; title: string; ep: BiayEpisode }[]>([]);
  const ids = [...new Set([...progress.map((p) => p.episodeId), ...queue.map((q) => q.episodeId)])].join(',');
  useEffect(() => {
    let live = true;
    Promise.all(ids.split(',').filter(Boolean).map(async (id) => [id, await resolveEpisode(id)] as const)).then((r) => {
      if (live) setEps(new Map(r.filter((x): x is [string, BiayEpisode] => !!x[1])));
    });
    return () => { live = false; };
  }, [ids]);
  const followed = [...follows].join(',');
  useEffect(() => {
    let live = true;
    if (!followed || !shows) { setFresh([]); return; }
    Promise.all(followed.split(',').map(async (id) => {
      const s = shows.find((x) => x.id === id);
      const d = s ? await loadShow(id) : null;
      if (!s || !d) return null;
      const seen = new Set((await db.episodeProgress.toArray()).map((p) => p.episodeId));
      const ep = d.episodes.find((e) => !seen.has(e.id));
      return ep ? { show: id, title: s.title, ep } : null;
    })).then((r) => live && setFresh(r.filter((x): x is { show: string; title: string; ep: BiayEpisode } => !!x)));
    return () => { live = false; };
  }, [followed, shows]);

  const going = progress.filter((p) => !p.completed && p.position > 20 && eps.has(p.episodeId)).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8);
  const recent = progress.filter((p) => p.completed && eps.has(p.episodeId)).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const q = queue.map((x) => ({ item: x, ep: eps.get(x.episodeId) })).filter((x) => x.ep);
  const empty = !going.length && !q.length && !fresh.length && !recent.length;
  return (
    <div>
      {empty && (
        <div className="card">
          <strong>Nothing in progress yet.</strong>
          <p className="muted small" style={{ margin: '4px 0 0' }}>Start a podcast, an audiobook or a year-long program and it will wait for you here, at the place you stopped. Follow a show to see its newest episode here.</p>
        </div>
      )}
      {going.length > 0 && (
        <section className="sect">
          <h2 className="eyebrow-h">Pick up where you stopped</h2>
          <ul className="list">
            {going.map((p) => { const e = eps.get(p.episodeId)!; const pct = p.duration ? Math.round((100 * p.position) / p.duration) : 0; return (
              <li key={p.episodeId}>
                <div className="row between">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Link to={e.link ?? `/listen/episode/${e.id}`} className="t" style={{ fontWeight: 600 }}>{e.title}</Link>
                    <div className="muted small">{showOf(e)} · stopped at {mmss(p.position)}{p.duration ? ` of ${mmss(p.duration)}` : ''}{pct ? ` · ${pct}%` : ''}</div>
                    {pct > 0 && <span className="bar"><i style={{ width: `${pct}%` }} /></span>}
                  </div>
                  <button className="btn small primary" onClick={() => player.play(e)}><Icon name="play" size={14} /> Resume</button>
                  <button className="icon-btn" aria-label="Mark played" title="Mark played" onClick={() => db.episodeProgress.put({ ...p, position: 0, completed: true, updatedAt: Date.now() })}><Icon name="check" /></button>
                </div>
              </li>); })}
          </ul>
        </section>
      )}
      {q.length > 0 && (
        <section className="sect">
          <div className="row between"><h2 className="eyebrow-h">Up next ({q.length})</h2><button className="linklike small" onClick={() => db.queue.clear()}>Clear queue</button></div>
          <ul className="list">
            {q.map(({ item, ep }, i) => (
              <li key={item.id}>
                <div className="row between">
                  <div style={{ minWidth: 0, flex: 1 }}><span className="t">{ep!.title}</span><div className="muted small">{showOf(ep!)}{ep!.duration ? ` · ${fmtDuration(ep!.duration)}` : ''}</div></div>
                  <button className="icon-btn" aria-label="Play now" onClick={() => player.play(ep!)}><Icon name="play" /></button>
                  <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={async () => { const prev = q[i - 1].item; await db.queue.update(item.id!, { order: prev.order }); await db.queue.update(prev.id!, { order: item.order }); }}>↑</button>
                  <button className="icon-btn" aria-label="Remove from queue" onClick={() => db.queue.delete(item.id!)}><Icon name="close" size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {fresh.length > 0 && (
        <section className="sect">
          <h2 className="eyebrow-h">New from the shows you follow</h2>
          <ul className="list">
            {fresh.map((f) => (
              <li key={f.show}>
                <div className="row between">
                  <div style={{ minWidth: 0, flex: 1 }}><span className="t">{f.ep.title}</span><div className="muted small">{f.title} · {f.ep.date}{f.ep.duration ? ` · ${fmtDuration(f.ep.duration)}` : ''}</div></div>
                  <button className="icon-btn" aria-label={`Play ${f.ep.title}`} onClick={() => player.play(f.ep)}><Icon name="play" /></button>
                  <button className="icon-btn" aria-label="Add to queue" onClick={async () => { await rememberEpisode(f.ep); await db.queue.add({ episodeId: f.ep.id, order: Date.now() }); }}><Icon name="queue" /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {recent.length > 0 && (
        <section className="sect">
          <h2 className="eyebrow-h">Recently finished</h2>
          <ul className="list">{recent.map((p) => { const e = eps.get(p.episodeId)!; return <li key={p.episodeId}><span className="t">{e.title}</span> <span className="muted small">{showOf(e)}</span> <button className="linklike small" onClick={() => db.episodeProgress.put({ ...p, completed: false, position: 0, updatedAt: Date.now() })}>Mark unplayed</button></li>; })}</ul>
        </section>
      )}
    </div>
  );
}
