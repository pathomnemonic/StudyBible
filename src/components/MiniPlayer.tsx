import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../data/PlayerContext';
import Icon from './Icon';
import NowPlaying, { SPEEDS } from './NowPlaying';

export default function MiniPlayer() {
  const p = usePlayer();
  const [open, setOpen] = useState(false);
  if (!p.current) return null;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <div className="player" role="region" aria-label="Audio player">
      <div className="row between">
        <Link to={p.current.link ?? `/listen/episode/${p.current.id}`} className="small" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.current.title}
        </Link>
        <button className="icon-btn" onClick={() => p.skip(-p.back)} aria-label={`Back ${p.back} seconds`}>−{p.back}</button>
        <button className="icon-btn" onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'}><Icon name={p.playing ? 'pause' : 'play'} /></button>
        <button className="icon-btn" onClick={() => p.skip(p.fwd)} aria-label={`Forward ${p.fwd} seconds`}>+{p.fwd}</button>
        <select value={p.rate} onChange={(e) => p.setRate(+e.target.value)} aria-label="Playback speed">
          {SPEEDS.map((r) => <option key={r} value={r}>{r}×</option>)}
        </select>
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open the full player" title="Full player: sleep timer, queue, show notes">⌃</button>
        <button className="icon-btn" onClick={p.stop} aria-label="Close player"><Icon name="close" size={18} /></button>
      </div>
      {open && <NowPlaying onClose={() => setOpen(false)} />}
      <div className="row small muted">
        <span>{fmt(p.position)}</span>
        <input type="range" min={0} max={p.duration || 1} value={p.position} step={1} onChange={(e) => p.seek(+e.target.value)} style={{ flex: 1 }} aria-label="Seek" />
        <span>{fmt(p.duration)}</span>
      </div>
    </div>
  );
}
