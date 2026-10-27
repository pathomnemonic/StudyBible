import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { fmtDuration } from '../../data/biay';
import { rememberEpisode, usePlayer } from '../../data/PlayerContext';
import { formatRef, parseRefId } from '../../lib/refs';
import RefLink from '../../components/RefLink';
import Icon from '../../components/Icon';
import type { BiayEpisode } from '../../data/content';

/** One episode in a year-long program: the title is the main target, with play, queue and done beside it. */
export default function EpisodeRow({ e, progress, inQueue, page }: { e: BiayEpisode; progress?: { completed: boolean; position: number; duration?: number }; inQueue: boolean; page?: boolean }) {
  const player = usePlayer();
  const pct = progress && progress.duration ? Math.round((100 * progress.position) / progress.duration) : 0;
  const toggleQueue = async () => {
    if (inQueue) await db.queue.where('episodeId').equals(e.id).delete();
    else { void rememberEpisode(e); await db.queue.add({ episodeId: e.id, order: Date.now() }); }
  };
  const toggleDone = () => { void rememberEpisode(e); return db.episodeProgress.put({ episodeId: e.id, position: 0, completed: !progress?.completed, updatedAt: Date.now(), duration: progress?.duration }); };
  const title = (e.kind === 'day' ? `Day ${e.day}: ${e.short}` : e.title).replace(/\s*\(\d{4}\)$/, '');
  return (
    <li className="ep">
      <div className="ep-main">
        {page
          ? <Link to={`/listen/episode/${e.id}`} className="ep-title">{title}</Link>
          : <button className="ep-title" onClick={() => player.play(e)}>{title}</button>}
        <div className="ep-meta">{fmtDuration(e.duration)}{progress?.completed ? ' · done' : pct > 0 ? ` · ${pct}%` : ''}</div>
        <div className="ep-chips">
          {e.passages.slice(0, 6).map((p) => { const r = parseRefId(p); return r ? <RefLink key={p} refv={r}><span className="chip">{formatRef(r, { abbr: true })}</span></RefLink> : null; })}
          {e.ccc?.slice(0, 3).map(([a, b]) => <Link key={`${a}-${b}`} className="chip" to={`/study/catechism/${a}`}>CCC {a}{b !== a ? `–${b}` : ''}</Link>)}
        </div>
      </div>
      <div className="ep-acts">
        <button className="icon-btn" onClick={() => player.play(e)} aria-label={`Play ${e.title}`}><Icon name="play" /></button>
        <button className="icon-btn" aria-pressed={inQueue} onClick={toggleQueue} aria-label={inQueue ? 'Remove from queue' : 'Add to queue'}><Icon name="queue" /></button>
        <button className="icon-btn" aria-pressed={!!progress?.completed} onClick={toggleDone} aria-label={progress?.completed ? 'Mark not completed' : 'Mark completed'}><Icon name="check" /></button>
      </div>
    </li>
  );
}
