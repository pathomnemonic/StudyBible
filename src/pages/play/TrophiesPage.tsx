import { Link } from 'react-router-dom';
import { TROPHY_LIST, currentStreak, loadPlays, loadTrophies } from '../../lib/dailyGame';

/** What you have earned across the games, and the streak of days you have played. It is all kept on this device. */
export default function TrophiesPage() {
  const have = loadTrophies();
  const p = loadPlays();
  const streak = currentStreak();
  const total = Object.values(p.games).reduce((a, b) => a + b, 0);
  return (
    <div className="page">
      <h1>Trophy shelf</h1>
      <p className="lede">🔥 {streak} day{streak === 1 ? '' : 's'} in a row · {total} game{total === 1 ? '' : 's'} finished · {Object.keys(have).length} of {TROPHY_LIST.length} trophies</p>
      <ul className="trophy-grid">
        {TROPHY_LIST.map((t) => (
          <li key={t.id} className={have[t.id] ? 'got' : 'locked'}>
            <span className="trophy-ico" aria-hidden="true">{have[t.id] ? t.icon : '🔒'}</span>
            <strong>{t.title}</strong>
            <em>{t.how}</em>
          </li>
        ))}
      </ul>
      <p><Link className="btn ghost" to="/play">Back to the games</Link></p>
    </div>
  );
}
