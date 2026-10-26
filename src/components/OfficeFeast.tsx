import { useEffect, useState } from 'react';
import { getJson } from '../data/loader';

interface Day { name: string; collect?: string; invit?: string; lessons?: [number, string][] }

const iso = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The saint or feast fixed to a calendar date, with its collect and the lessons of Matins (the Office of Readings). */
export default function OfficeFeast() {
  const [date, setDate] = useState(() => new Date());
  const [day, setDay] = useState<Day | null | undefined>(undefined);
  useEffect(() => {
    setDay(undefined);
    const [mo, dd] = iso(date).split('-');
    getJson<Record<string, Day>>(`office/sancti-${mo}.json`).then((m) => setDay(m?.[dd] ?? null)).catch(() => setDay(null));
  }, [date]);
  const shift = (n: number) => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
  return (
    <section className="card" style={{ marginBottom: 14 }} aria-label="Feast of the day and Office of Readings">
      <div className="row between" style={{ flexWrap: 'wrap', gap: 6 }}>
        <h2 className="card-title" style={{ margin: 0 }}>Feast of the day · {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</h2>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn small" onClick={() => shift(-1)} aria-label="Previous day">‹</button>
          <button className="btn small" onClick={() => setDate(new Date())}>Today</button>
          <button className="btn small" onClick={() => shift(1)} aria-label="Next day">›</button>
        </div>
      </div>
      {day === undefined && <p className="muted small">Loading…</p>}
      {day === null && <p className="muted small">No saint or feast is fixed to this date in the traditional calendar, so the day follows the season and the psalter.</p>}
      {day && (
        <>
          <p style={{ fontWeight: 600, margin: '8px 0 4px' }}>{day.name}</p>
          {day.invit && <p className="small"><strong>Invitatory.</strong> {day.invit}</p>}
          {day.collect && <p className="small"><strong>Collect.</strong> {day.collect}</p>}
          {day.lessons && day.lessons.length > 0 && (
            <details>
              <summary>Office of Readings (Matins lessons)</summary>
              {day.lessons.map(([n, t]) => (
                <div key={n}>
                  <h3 className="h-sm" style={{ margin: '10px 0 2px' }}>{n <= 3 ? `Lesson ${n}` : n <= 6 ? `Lesson ${n} (the saint)` : `Lesson ${n} (Gospel and homily)`}</h3>
                  {t.split(/\n+/).map((p, i) => p.startsWith('!') ? <p key={i} className="muted small">{p.slice(1)}</p> : <p key={i}>{p}</p>)}
                </div>
              ))}
            </details>
          )}
        </>
      )}
      <p className="muted small" style={{ marginBottom: 0 }}>The traditional Roman Breviary (before 1970), from the Divinum Officium project, by calendar date. It does not apply the rules for which celebration wins when two fall together, nor feasts that move, and the modern calendar has changed some saints’ days. Check the date against your own calendar.</p>
    </section>
  );
}
