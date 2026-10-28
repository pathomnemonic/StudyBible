import { Link } from 'react-router-dom';

const GAMES: { to: string; title: string; blurb: string; icon: string }[] = [
  { to: '/play/verbum', title: 'Verbum', blurb: 'The word of the day: five letters from the faith, six tries.', icon: '🟨' },
  { to: '/play/quartets', title: 'Quartets', blurb: 'Sixteen tiles, four hidden sets. A new puzzle every day.', icon: '🔶' },
  { to: '/play/cloister', title: 'Cloister', blurb: 'Link letters into words. Words of the faith score extra.', icon: '🔤' },
  { to: '/play/prophet', title: 'The Prophet', blurb: 'Guess the year, the number or the count. Closer scores more.', icon: '🔮' },
  { to: '/play/charades', title: 'Charades', blurb: 'Phone on your forehead: guess saints, stories and more.', icon: '🎭' },
];

/** Games for one person or a roomful, all played on the phone with no account. */
export default function PlayHome() {
  return (
    <div className="page play-home">
      <h1>Games</h1>
      <ul className="play-list">
        {GAMES.map((g) => (
          <li key={g.to}><Link className="play-card" to={g.to}><span className="play-ico" aria-hidden="true">{g.icon}</span><span><strong>{g.title}</strong><em>{g.blurb}</em></span></Link></li>
        ))}
      </ul>
    </div>
  );
}
