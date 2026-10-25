import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../data/PlayerContext';
import Icon from './Icon';

export default function MiniPlayer() {
  const p = usePlayer();
  // sleep timer: pause after a chosen number of minutes, counted from when it is set
  const [sleep, setSleep] = useState(0);
  const [left, setLeft] = useState(0);
  const live = useRef(p);
  live.current = p;
  useEffect(() => {
    if (!sleep) return setLeft(0);
    const end = Date.now() + sleep * 60000;
    setLeft(sleep * 60);
    const id = window.setInterval(() => {
      const r = Math.round((end - Date.now()) / 1000);
      setLeft(Math.max(0, r));
      if (r <= 0) { window.clearInterval(id); if (live.current.playing) live.current.toggle(); setSleep(0); }
    }, 1000);
    return () => window.clearInterval(id);
  }, [sleep]);
  if (!p.current) return null;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <div className="player" role="region" aria-label="Audio player">
      <div className="row between">
        <Link to={p.current.link ?? `/listen/episode/${p.current.id}`} className="small" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.current.title}
        </Link>
        <button className="icon-btn" onClick={() => p.skip(-15)} aria-label="Back 15 seconds">−15</button>
        <button className="icon-btn" onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'}><Icon name={p.playing ? 'pause' : 'play'} /></button>
        <button className="icon-btn" onClick={() => p.skip(30)} aria-label="Forward 30 seconds">+30</button>
        <select value={p.rate} onChange={(e) => p.setRate(+e.target.value)} aria-label="Playback speed">
          {[0.8, 1, 1.15, 1.25, 1.5, 2].map((r) => <option key={r} value={r}>{r}×</option>)}
        </select>
        <select value={sleep} onChange={(e) => setSleep(+e.target.value)} aria-label="Sleep timer" title={left ? `Pauses in ${Math.ceil(left / 60)} min` : 'Sleep timer'}>
          <option value={0}>{left ? `😴 ${Math.ceil(left / 60)} min` : '😴 Off'}</option>
          {[10, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
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
