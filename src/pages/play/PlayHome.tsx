import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { currentStreak, dailyDone, dayIndex, loadPlays, seeded } from '../../lib/dailyGame';

interface Game { to: string; title: string; blurb: string; icon: string; color: string; time: string; who: string; daily?: string; isNew?: boolean }
interface Group { id: string; title: string; sub: string; games: Game[] }
const G = (to: string, title: string, blurb: string, icon: string, color: string, time: string, who: string, extra: Partial<Game> = {}): Game => ({ to, title, blurb, icon, color, time, who, ...extra });

const GROUPS: Group[] = [
  { id: 'quick', title: 'Quick hits', sub: 'Two minutes or less. A new one every day.', games: [
    G('/play/verbum', 'Verbum', 'Guess the five-letter word of the faith in six tries.', '🟨', '#d4a017', '3 min', 'Solo', { daily: 'verbum' }),
    G('/play/whichbook', 'Which Book?', 'Name the book of the Bible a verse comes from.', '📖', '#4a7bd0', '2 min', 'Solo', { daily: 'whichbook' }),
    G('/play/whosaid', 'Who Said It?', 'Five quotations from the saints: who said each?', '💬', '#c0507a', '2 min', 'Solo', { daily: 'whosaid' }),
    G('/play/saintguess', 'Saint Guess', 'Name the saint from clues that get easier.', '🕊️', '#2f8f6b', '2 min', 'Solo', { daily: 'saintguess' }),
  ] },
  { id: 'brain', title: 'Brain teasers', sub: 'Slow down, think, and feel clever.', games: [
    G('/play/quartets', 'Quartets', 'Sixteen tiles, four hidden sets.', '🔶', '#e8812b', '5 min', 'Solo', { daily: 'quartets' }),
    G('/play/chain', 'Chain of Grace', 'Change one letter at a time to turn one word into another.', '🔗', '#5a8f9a', '4 min', 'Solo', { daily: 'chain' }),
    G('/play/crossword', 'Crossword', 'A small crossword of the faith, new each week.', '✏️', '#8a5ac2', '10 min', 'Solo'),
    G('/play/wordsearch', 'Wordsearch', 'A weekly theme. Find the hidden words.', '🔍', '#4a9b8e', '6 min', 'Solo'),
    G('/play/cloister', 'Cloister', 'Link letters into words. Words of the faith score extra.', '🔤', '#b9772e', '5 min', 'Solo'),
    G('/play/whoami', 'Who Am I?', 'A person from the Bible, from five clues.', '🧔', '#6b7fd7', '3 min', 'Solo', { daily: 'whoami' }),
  ] },
  { id: 'explore', title: 'Explore and discover', sub: 'Maps, art and the stories behind them.', games: [
    G('/play/pilgrim', 'Pin the Place', 'Tap the map to place a city or mountain from Scripture.', '📍', '#c05050', '3 min', 'Solo', { daily: 'pilgrim' }),
    G('/play/artdetective', 'Art Detective', 'Name the Bible scene from an engraving.', '🖼️', '#a0522d', '3 min', 'Solo', { daily: 'artdetective' }),
    G('/play/prophet', 'The Prophet', 'Guess the year, the number or the count. Closer scores more.', '🔮', '#7a5ac2', '4 min', 'Solo'),
    G('/play/doctrineladder', 'Doctrine ladder', 'Three levels of questions on what the Church teaches.', '🪜', '#4a7bd0', '6 min', 'Solo'),
  ] },
  { id: 'together', title: 'Play together', sub: 'One phone, a family, a classroom, a crowd.', games: [
    G('/play/trivia', 'Crown Quest', 'Spin the wheel, win six crowns. Play a friend, the Bot, or alone.', '👑', '#8a5ac2', '10 min', '1 to 4', { isNew: true }),
    G('/play/online', 'Play online with a code', 'Open a room, share six digits, and friends join from their own phones. No account.', '🌐', '#2f8f6b', '15 min', '2 to 50', { isNew: true }),
    G('/play/quiznight', 'Quiz night', 'Pass the phone around the family, or host a room.', '🎉', '#e8812b', '15 min', '2 or more'),
    G('/play/leaderboard', 'Weekly leaderboard', 'A Monday to Sunday board for your group, by code. Opt in, nickname only.', '🏅', '#b58a1f', '1 min', 'A group')
    G('/play/coop', 'Verbum together', 'Solve today’s word with family or friends, one shared board.', '🤝', '#2f8a5b', '5 min', '2 or more')
    G('/play/charades', 'Charades', 'Phone on your forehead: guess saints, stories and more.', '🎭', '#c0507a', '5 min', '2 or more'),
  ] },
];
const ALL = GROUPS.flatMap((g) => g.games);

/** A lively front door for the games: a "play this next" banner, a Surprise me button, and colorful tiles grouped by mood. */
export default function PlayHome() {
  const nav = useNavigate();
  const dailies = ALL.filter((g) => g.daily);
  const todo = dailies.filter((g) => !dailyDone(g.daily!));
  const streak = currentStreak();
  const plays = loadPlays();
  const featured = useMemo(() => (todo.length ? todo[Math.floor(seeded(dayIndex() + 3)() * todo.length)] : ALL.find((g) => g.isNew)!), [todo.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const surprise = () => { const pool = todo.length ? todo : ALL; nav(pool[Math.floor(Math.random() * pool.length)].to); };
  const played = Object.keys(plays.games ?? {}).length;
  return (
    <div className="page play-home play-fun">
      <header className="pf-top">
        <h1>Games</h1>
        <Link className="streak-chip" to="/play/trophies">🔥 {streak} day streak · trophies</Link>
      </header>
      <section className="pf-hero" style={{ ['--c' as string]: featured.color }} aria-label="Play this next">
        <span className="pf-hero-ico" aria-hidden="true">{featured.icon}</span>
        <div className="pf-hero-text">
          <p className="pf-kicker">{todo.length ? `${todo.length} daily puzzle${todo.length === 1 ? '' : 's'} waiting` : 'All of today’s puzzles are done'}</p>
          <h2>{todo.length ? `Play ${featured.title}` : `Try ${featured.title}`}</h2>
          <p>{featured.blurb}</p>
          <p className="pf-hero-actions"><Link className="btn primary big" to={featured.to}>Let’s go</Link> <button className="btn big" onClick={surprise}>🎲 Surprise me</button></p>
        </div>
      </section>
      {GROUPS.map((grp) => (
        <section key={grp.id} className="pf-group" aria-labelledby={`pf-${grp.id}`}>
          <h2 id={`pf-${grp.id}`}>{grp.title}</h2>
          <p className="muted small pf-sub">{grp.sub}</p>
          <ul className="pf-grid">
            {grp.games.map((g, i) => {
              const r = g.daily ? dailyDone(g.daily) : null;
              return (
                <li key={g.to} style={{ ['--i' as string]: i }}>
                  <Link className="pf-tile" to={g.to} style={{ ['--c' as string]: g.color }}>
                    <span className="pf-ico" aria-hidden="true">{g.icon}</span>
                    {g.isNew && <span className="pf-badge">NEW</span>}
                    {r && <span className="pf-badge done">✓ {r}</span>}
                    <strong className="pf-title">{g.title}</strong>
                    <span className="pf-blurb">{g.blurb}</span>
                    <span className="pf-meta"><span>⏱ {g.time}</span><span>👤 {g.who}</span><span className="pf-play">Play ▶</span></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="muted small">{played ? `You have tried ${played} of ${ALL.length} games.` : `${ALL.length} games, no account needed.`}</p>
    </div>
  );
}
