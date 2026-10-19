import { Link } from 'react-router-dom';
import { usePlayer } from '../data/PlayerContext';
import Icon from './Icon';

export default function MiniPlayer() {
  const p = usePlayer();
  if (!p.current) return null;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <div className="player" role="region" aria-label="Audio player">
      <div className="row between">
        <Link to={`/listen/episode/${p.current.id}`} className="small" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.current.title}
        </Link>
        <button className="icon-btn" onClick={() => p.skip(-15)} aria-label="Back 15 seconds">−15</button>
        <button className="icon-btn" onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'}><Icon name={p.playing ? 'pause' : 'play'} /></button>
        <button className="icon-btn" onClick={() => p.skip(30)} aria-label="Forward 30 seconds">+30</button>
        <select value={p.rate} onChange={(e) => p.setRate(+e.target.value)} aria-label="Playback speed">
          {[0.8, 1, 1.15, 1.25, 1.5, 2].map((r) => <option key={r} value={r}>{r}×</option>)}
        </select>
        <button className="icon-btn" onClick={p.stop} aria-label="Close player"><Icon name="close" size={18} /></button>
      </div>
      <div className="row small muted">
        <span>{fmt(p.position)}</span>
        <input type="range" min={0} max={p.duration || 1} value={p.position} step={1} onChange={(e) => p.seek(+e.target.value)} style={{ flex: 1 }} aria-label="Seek" />
        <span>{fmt(p.duration)}</span>
      </div>
    </div>
  );
}
