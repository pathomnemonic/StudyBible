import { Link } from 'react-router-dom';
import Fold from './Fold';
import { dailyDone } from '../lib/dailyGame';
import { dailiesLeft } from './GamesChip';

const LIST: { to: string; title: string; daily?: string }[] = [
  { to: '/play/verbum', title: 'Verbum', daily: 'verbum' },
  { to: '/play/quartets', title: 'Quartets', daily: 'quartets' },
  { to: '/play/saintguess', title: 'Saint Guess', daily: 'saintguess' },
  { to: '/play/whoami', title: 'Who Am I?', daily: 'whoami' },
  { to: '/play/whosaid', title: 'Who Said It?', daily: 'whosaid' },
  { to: '/play/whichbook', title: 'Which Book?', daily: 'whichbook' },
  { to: '/play/chain', title: 'Chain of Grace', daily: 'chain' },
  { to: '/play/pilgrim', title: 'Pin the Place', daily: 'pilgrim' },
  { to: '/play/wordsearch', title: 'Wordsearch' },
  { to: '/play/crossword', title: 'Crossword' },
  { to: '/play/cloister', title: 'Cloister' },
  { to: '/play/prophet', title: 'The Prophet' },
  { to: '/play/charades', title: 'Charades' },
];

/** A slim bar of its own on Learn, folded until opened, that lists every game and marks the daily ones already played. */
export default function GamesBar() {
  const left = dailiesLeft();
  return (
    <div className="games-bar">
      <Fold rare dot={false} id="learn:games" title={<>🎲 Games{left > 0 && <b className="games-menu-n" aria-label={`${left} daily puzzles to play`}>{left}</b>}</>}>
        <div className="games-bar-list">
          {LIST.map((g) => <Link key={g.to} className="chip" to={g.to}>{g.title}{g.daily && dailyDone(g.daily) ? ' ✓' : ''}</Link>)}
          <Link className="chip" to="/play"><b>All games</b></Link>
        </div>
      </Fold>
    </div>
  );
}
