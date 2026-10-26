import { Link } from 'react-router-dom';
import { useSettings } from '../lib/store';
import { lifeStats } from '../lib/memento';

/** The opt-in progress bar on Today. Renders nothing unless the person turned Memento mori on and gave a birthday. */
export default function MementoCard() {
  const [s] = useSettings();
  const m = s.memento;
  if (!m.on || !m.onHome) return null;
  const st = lifeStats(m.birthday, m.expectancy);
  if (!st.valid) return <Link className="memento-card" to="/memento"><span>Memento mori</span><strong>Add your birthday to see it</strong></Link>;
  return (
    <Link className="memento-card" to="/memento" aria-label={st.beyond ? 'Memento mori: past your own estimate. Every day is a gift.' : `Memento mori: ${st.pct}% of your estimated life has passed`}>
      <span>Memento mori</span>
      <div className="memento-bar" role="progressbar" aria-valuenow={st.pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${st.pct}%` }} /></div>
      <strong>{st.beyond ? 'Past your estimate: every day is a gift' : `${st.pct}% of your life has passed · about ${st.weeksLeft.toLocaleString()} weeks remain`}</strong>
    </Link>
  );
}
