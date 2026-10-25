import { Link } from 'react-router-dom';
import { useBiay } from '../data/biay';
import { usePlayer } from '../data/PlayerContext';
import { parseRefId } from '../lib/refs';
import { rangesOverlap } from '../db/ops';

/** The Bible in a Year episodes that cover this chapter, one tap from playing, at the top of the page. */
export default function BiayBar({ book, chapters }: { book: string; chapters: number[] }) {
  const { biay } = useBiay();
  const player = usePlayer();
  if (!biay) return null;
  const eps = [...biay.dayEpisode.values()]
    .filter((e) => e.audio && e.passages.some((p) => { const r = parseRefId(p); return r && chapters.some((c) => rangesOverlap(r, { book, c1: c, c2: c })); }))
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
    .slice(0, 3);
  if (!eps.length) return null;
  return (
    <div className="biay-bar" role="region" aria-label="Bible in a Year episode for this chapter">
      {eps.map((e) => (
        <div key={e.id} className="biay-ep">
          <button className="btn" onClick={() => void player.play(e)} aria-label={`Listen: Bible in a Year day ${e.day}, ${e.short || e.title}`}>▶ Listen</button>
          <span><Link to={`/listen/episode/${e.id}`}><strong>Bible in a Year, day {e.day}</strong></Link>{e.duration ? ` · ${Math.round(e.duration / 60)} min` : ''}<span className="muted small"> with Fr. Mike Schmitz</span></span>
        </div>
      ))}
      <Link className="small" to="/listen">All episodes</Link>
    </div>
  );
}
