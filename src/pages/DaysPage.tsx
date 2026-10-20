import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import WeekCard from '../components/WeekCard';

/** Days you starred on Home, and a way back to any earlier day's reading and reflection. */
export default function DaysPage() {
  const favs = useLiveQuery(() => db.cache.filter((r) => r.key.startsWith('daily-fav:')).toArray(), []) ?? [];
  const list = favs.map((r) => ({ date: r.key.slice(10), label: String(r.value ?? '') })).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="page">
      <h1>Favourite days</h1>
      <p className="lede">Star a day on the Today screen to keep it here. Pick any date to open that day’s verse and reflection.</p>
      <WeekCard />
      <label className="row" style={{ gap: 8, margin: '10px 0' }}>Open a day: <input type="date" aria-label="Open a day" onChange={(e) => e.target.value && (location.hash = `#/?d=${e.target.value}`)} /></label>
      {list.length === 0 ? <p className="muted">No favourite days yet. On the Today screen, tap “☆ Favourite day” under the reflection.</p> : (
        <ul className="list">
          {list.map((d) => <li key={d.date}><Link to={`/?d=${d.date}`}><strong>{new Date(d.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong></Link>{d.label ? <span className="muted"> · {d.label}</span> : null}</li>)}
        </ul>
      )}
    </div>
  );
}
