import { Link } from 'react-router-dom';
import { dailyDone } from '../lib/dailyGame';

export const DAILY_GAMES = ['verbum', 'quartets', 'whosaid', 'whichbook', 'chain', 'pilgrim'];
export const dailiesLeft = () => DAILY_GAMES.filter((g) => !dailyDone(g)).length;

/** One line that leads to the Games page and says how many of today's puzzles are still to play. */
export default function GamesChip({ className = 'games-chip' }: { className?: string }) {
  const left = dailiesLeft();
  return (
    <Link className={className} to="/play">
      <span aria-hidden="true">🎲</span>
      <strong>Games</strong>
      <span className="muted small">{left === 0 ? 'Today’s puzzles are done' : `${left} daily puzzle${left === 1 ? '' : 's'} to play`}</span>
      <span className="games-chip-go" aria-hidden="true">›</span>
    </Link>
  );
}
