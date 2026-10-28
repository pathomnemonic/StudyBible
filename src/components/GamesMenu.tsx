import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { dailyDone } from '../lib/dailyGame';
import { dailiesLeft } from './GamesChip';

const LIST: { to: string; title: string; daily?: string }[] = [
  { to: '/play/verbum', title: 'Verbum', daily: 'verbum' },
  { to: '/play/quartets', title: 'Quartets', daily: 'quartets' },
  { to: '/play/whosaid', title: 'Who Said It?', daily: 'whosaid' },
  { to: '/play/whichbook', title: 'Which Book?', daily: 'whichbook' },
  { to: '/play/chain', title: 'Chain of Grace', daily: 'chain' },
  { to: '/play/pilgrim', title: 'Pin the Place', daily: 'pilgrim' },
  { to: '/play/crossword', title: 'Crossword' },
  { to: '/play/cloister', title: 'Cloister' },
  { to: '/play/prophet', title: 'The Prophet' },
  { to: '/play/charades', title: 'Charades' },
];

/** A small Games button that stays in the corner of a page and drops a list of every game, with a mark on the daily ones already played. */
export default function GamesMenu() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const left = dailiesLeft();
  return (
    <div className="games-menu" ref={box}>
      <button className="games-menu-btn" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span aria-hidden="true">🎲</span> Games{left > 0 && <b className="games-menu-n" aria-label={`${left} daily puzzles to play`}>{left}</b>} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="games-menu-list" role="menu">
          {LIST.map((g) => (
            <li key={g.to} role="none"><Link role="menuitem" to={g.to} onClick={() => setOpen(false)}>{g.title}{g.daily && dailyDone(g.daily) ? ' ✓' : ''}</Link></li>
          ))}
          <li role="none"><Link role="menuitem" className="games-menu-all" to="/play" onClick={() => setOpen(false)}>All games</Link></li>
        </ul>
      )}
    </div>
  );
}
