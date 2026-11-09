import { Link } from 'react-router-dom';
import { dailiesLeft } from './GamesChip';


/** One tile on Learn that goes straight to the games page, with a count of the daily puzzles still to play. */
export default function GamesBar() {
  const left = dailiesLeft();
  return (
    <div className="games-bar">
      <Link to="/play" className="games-bar-link">
        <span className="gb-ico" aria-hidden="true">🎲</span>
        <span className="gb-text"><strong>Games</strong><small>{left > 0 ? `${left} daily puzzle${left === 1 ? '' : 's'} waiting` : 'Puzzles, quizzes and things to play together'}</small></span>
        {left > 0 && <b className="games-menu-n" aria-label={`${left} daily puzzles to play`}>{left}</b>}
        <span className="gb-go" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
