import { Link } from 'react-router-dom';
import { currentStreak, dailyDone } from '../../lib/dailyGame';

interface Game { to: string; title: string; blurb: string; icon: string; daily?: string }
const GAMES: Game[] = [
  { to: '/play/verbum', title: 'Verbum', blurb: 'The word of the day: five letters from the faith, six tries.', icon: '🟨', daily: 'verbum' },
  { to: '/play/quartets', title: 'Quartets', blurb: 'Sixteen tiles, four hidden sets. A new puzzle every day.', icon: '🔶', daily: 'quartets' },
  { to: '/play/saintguess', title: 'Saint Guess', blurb: 'Name the saint from clues that get easier.', icon: '🕊️', daily: 'saintguess' },
  { to: '/play/whoami', title: 'Who Am I?', blurb: 'A person from the Bible, from five clues.', icon: '🧔', daily: 'whoami' },
  { to: '/play/artdetective', title: 'Art Detective', blurb: 'Name the Bible scene from an engraving.', icon: '🖼️', daily: 'artdetective' },
  { to: '/play/whosaid', title: 'Who Said It?', blurb: 'Five quotations from the saints: who said each?', icon: '💬', daily: 'whosaid' },
  { to: '/play/whichbook', title: 'Which Book?', blurb: 'Name the book of the Bible a verse comes from.', icon: '📖', daily: 'whichbook' },
  { to: '/play/chain', title: 'Chain of Grace', blurb: 'Change one letter at a time to turn one word into another.', icon: '🔗', daily: 'chain' },
  { to: '/play/pilgrim', title: 'Pin the Place', blurb: 'Tap the map to place a city or mountain from Scripture.', icon: '📍', daily: 'pilgrim' },
  { to: '/play/wordsearch', title: 'Wordsearch', blurb: 'A weekly theme: find the hidden words.', icon: '🔍' },
  { to: '/play/doctrineladder', title: 'Doctrine ladder', blurb: 'Three levels of questions on what the Church teaches.', icon: '🪜' },
  { to: '/play/crossword', title: 'Crossword', blurb: 'A small crossword of the faith, new each week.', icon: '✏️' },
  { to: '/play/cloister', title: 'Cloister', blurb: 'Link letters into words. Words of the faith score extra.', icon: '🔤' },
  { to: '/play/prophet', title: 'The Prophet', blurb: 'Guess the year, the number or the count. Closer scores more.', icon: '🔮' },
  { to: '/play/charades', title: 'Charades', blurb: 'Phone on your forehead: guess saints, stories and more.', icon: '🎭' },
];

/** Games for one person or a roomful, all played on the phone with no account. A daily game shows what you scored once you have played today. */
export default function PlayHome() {
  const dailies = GAMES.filter((g) => g.daily);
  const left = dailies.filter((g) => !dailyDone(g.daily!)).length;
  return (
    <div className="page play-home">
      <h1>Games</h1>
      <p className="muted small" style={{ margin: 0 }}><Link className="streak-chip" to="/play/trophies">🔥 {currentStreak()} day streak · trophies</Link></p>
      {dailies.length > 0 && <p className="muted small">{left === 0 ? 'All of today’s puzzles are done. Come back tomorrow.' : `${left} of today’s ${dailies.length} daily puzzles still to play.`}</p>}
      <ul className="play-list">
        {GAMES.map((g) => {
          const r = g.daily ? dailyDone(g.daily) : null;
          return (
            <li key={g.to}><Link className="play-card" to={g.to}><span className="play-ico" aria-hidden="true">{g.icon}</span><span><strong>{g.title}{r && <span className="play-done"> ✓ {r}</span>}</strong><em>{g.blurb}</em></span></Link></li>
          );
        })}
      </ul>
    </div>
  );
}
