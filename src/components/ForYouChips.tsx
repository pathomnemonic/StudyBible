import { Link } from 'react-router-dom';
import { useSettings } from '../lib/store';
import { FEATURES } from '../lib/features';
import { NewDot } from './Hints';

/** A short row on Today shaped by what the reader said they came for. Nothing is hidden for anyone: this only chooses what to put in front. */
export default function ForYouChips() {
  const [s] = useSettings();
  if (!s.interests.length) return null;
  const score = (f: (typeof FEATURES)[number]) => (f.interest ?? []).filter((i) => s.interests.includes(i)).length;
  const picks = FEATURES.filter((f) => f.hot && f.hub !== 'today' && score(f) > 0).sort((a, b) => score(b) - score(a)).slice(0, 3);
  if (!picks.length) return null;
  return (
    <nav className="foryou-chips" aria-label="For you">
      <span className="muted small">For you</span>
      {picks.map((f) => <Link key={f.id} to={f.to} data-seen={f.id} className="chip">{f.title}<NewDot id={f.id} inline /></Link>)}
    </nav>
  );
}
