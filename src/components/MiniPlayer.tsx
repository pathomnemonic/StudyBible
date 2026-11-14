import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getState, subscribe } from '../lib/mediaHost';
import { Link } from 'react-router-dom';
import { usePlayer } from '../data/PlayerContext';
import Icon from './Icon';
import NowPlaying, { SPEEDS } from './NowPlaying';

export default function MiniPlayer() {
  const p = usePlayer();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const has = !!p.current;
  // other fixed bars (toasts, the rosary bar, read-aloud, the update banner) sit above the player by this much, so it never covers them
  useEffect(() => {
    const root = document.documentElement;
    const el = box.current;
    if (!has || !el) { root.style.removeProperty('--player-h'); return; }
    const set = () => root.style.setProperty('--player-h', `${Math.round(el.getBoundingClientRect().height)}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => { ro.disconnect(); root.style.removeProperty('--player-h'); };
  }, [has]);
  // spoken status for screen readers: playing, paused, closed, and why the sound stopped
  const host = useSyncExternalStore(subscribe, getState).item;
  const [said, setSaid] = useState('');
  const had = useRef(false);
  const hadHost = useRef(false);
  useEffect(() => {
    if (p.current) { had.current = true; setSaid(p.error === 'offline' ? 'You are offline. The episode could not load.' : p.error ? 'The episode could not load.' : `${p.playing ? 'Playing' : 'Paused'}: ${p.current.title}`); }
    else if (had.current) { had.current = false; setSaid('Player closed. Playback stopped.'); }
  }, [p.current?.id, p.playing, p.error]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (host) hadHost.current = true; else if (hadHost.current) { hadHost.current = false; setSaid('Player closed. Playback stopped.'); } }, [host?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = <div className="sr-only" role="status" aria-live="polite">{said}</div>;
  const onKey = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('input, select, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'k') { e.preventDefault(); p.toggle(); }
    else if (e.key === 'j') { e.preventDefault(); p.skip(-p.back); }
    else if (e.key === 'l') { e.preventDefault(); p.skip(p.fwd); }
  };
  if (!p.current) return live;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <>{live}<div className="player" ref={box} role="region" aria-label="Audio player" title="Keys while the player has focus: K play or pause, J back, L forward" onKeyDown={onKey}>
      <div className="row between">
        <Link to={p.current.link ?? `/listen/episode/${p.current.id}`} className="small" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.current.title}
        </Link>
        <button className="icon-btn" onClick={() => p.skip(-p.back)} aria-label={`Back ${p.back} seconds`}>−{p.back}</button>
        <button className="icon-btn" onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'} title={p.playing ? 'Pause (keeps your place; the player stays)' : 'Play'}><Icon name={p.playing ? 'pause' : 'play'} /></button>
        <button className="icon-btn" onClick={() => p.skip(p.fwd)} aria-label={`Forward ${p.fwd} seconds`}>+{p.fwd}</button>
        <select value={p.rate} onChange={(e) => p.setRate(+e.target.value)} aria-label="Playback speed">
          {SPEEDS.map((r) => <option key={r} value={r}>{r}×</option>)}
        </select>
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open the full player" title="Full player: sleep timer, queue, show notes">⌃</button>
        <button className="icon-btn" onClick={p.stop} aria-label="Stop and close the player" title="Stop and close the player (pause keeps it open)"><Icon name="close" size={18} /></button>
      </div>
      {p.error && (
        <div className="player-msg" role="alert">
          <span>{p.error === 'offline' ? 'You are offline, so this episode cannot load. Episodes you downloaded still play.' : 'This episode could not be played. The stream may be down.'}</span>
          <button className="btn small" onClick={p.retry}>Try again</button>
        </div>
      )}
      {open && <NowPlaying onClose={() => setOpen(false)} />}
      <div className="row small muted">
        <span>{fmt(p.position)}</span>
        <input type="range" min={0} max={p.duration || 1} value={p.position} step={1} onChange={(e) => p.seek(+e.target.value)} style={{ flex: 1 }} aria-label="Seek" />
        <span>{fmt(p.duration)}</span>
      </div>
    </div></>
  );
}
