import { Art } from '../../arcade/art';
import { Link } from 'react-router-dom';
import { TROPHY_LIST, currentStreak, isStreakTrophy, loadPlays, loadTrophies } from '../../lib/dailyGame';
import { useSettings } from '../../lib/store';

/** What you have earned across the games, and the streak of days you have played. It is all kept on this device. */
const TROPHY_ART: Record<string, string> = { first: 'seedling', streak3: 'fire', streak7: 'candle', streak30: 'church', allDailies: 'glowing-star', ace: 'bullseye', aces5: 'trophy', games10: 'open-book', games50: 'scroll', sampler: 'game-die', allTried: 'key', crossword: 'memo' };

export default function TrophiesPage() {
  const [cfg] = useSettings();
  const list = cfg.hideStreaks ? TROPHY_LIST.filter((t) => !isStreakTrophy(t)) : TROPHY_LIST;
  const have = loadTrophies();
  const p = loadPlays();
  const streak = currentStreak();
  const total = Object.values(p.games).reduce((a, b) => a + b, 0);
  return (
    <div className="page">
      <h1>Trophy shelf</h1>
      <p className="lede">{cfg.hideStreaks ? '' : `🔥 ${streak} day${streak === 1 ? '' : 's'} in a row · `}{total} game{total === 1 ? '' : 's'} finished · {list.filter((t) => have[t.id]).length} of {list.length} trophies</p>
      <ul className="trophy-grid">
        {list.map((t) => (
          <li key={t.id} className={have[t.id] ? 'got' : 'locked'}>
            <span className="trophy-ico" aria-hidden="true">{TROPHY_ART[t.id] ? <Art n={have[t.id] ? TROPHY_ART[t.id] : 'locked'} size={64} /> : (have[t.id] ? t.icon : '🔒')}</span>
            <strong>{t.title}</strong>
            <em>{t.how}</em>
          </li>
        ))}
      </ul>
      <p><Link className="btn ghost" to="/play">Back to the games</Link></p>
    </div>
  );
}
