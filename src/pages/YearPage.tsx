import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A year of what you did here, counted from what is already kept on this device. Nothing leaves it, and there is no streak to lose. */
export default function YearPage() {
  const now = new Date().getFullYear();
  const [year, setYear] = useState(now);
  const from = new Date(year, 0, 1).getTime(), to = new Date(year + 1, 0, 1).getTime();
  const data = useLiveQuery(async () => {
    const [history, episodes, notes, highlights, journal, memory] = await Promise.all([
      db.history.where('ts').between(from, to).toArray(),
      db.episodeProgress.where('updatedAt').between(from, to).toArray(),
      db.notes.where('updatedAt').between(from, to).count(),
      db.highlights.filter((h) => h.createdAt >= from && h.createdAt < to).count(),
      db.journal.filter((j) => j.createdAt >= from && j.createdAt < to).count(),
      db.memory.count(),
    ]);
    return { history, episodes, notes, highlights, journal, memory };
  }, [from, to]);
  const s = useMemo(() => {
    if (!data) return null;
    const reads = data.history.filter((h) => h.type === 'read');
    const chapters = new Set(reads.map((r) => r.ref));
    const books = new Set(reads.map((r) => r.ref.split('.')[0]));
    const days = new Set(data.history.map((h) => new Date(h.ts).toDateString()));
    const secs = data.episodes.reduce((a, e) => a + (e.completed ? (e.duration ?? e.position) : e.position), 0);
    const finished = data.episodes.filter((e) => e.completed).length;
    const perMonth = Array.from({ length: 12 }, (_, m) => new Set(data.history.filter((h) => new Date(h.ts).getMonth() === m).map((h) => new Date(h.ts).toDateString())).size);
    return { chapters: chapters.size, books: books.size, days: days.size, hours: Math.round(secs / 360) / 10, finished, perMonth, lessons: data.history.filter((h) => h.type === 'work' || h.type === 'catechism').length };
  }, [data]);
  const max = Math.max(1, ...(s?.perMonth ?? [1]));
  const cards: [string, string | number, string][] = s && data ? [
    ['Chapters read', s.chapters, `across ${s.books} book${s.books === 1 ? '' : 's'}`],
    ['Days you opened the app', s.days, `of ${year === now ? Math.max(1, Math.ceil((Date.now() - from) / 864e5)) : 365} so far`],
    ['Hours listened', s.hours, `${s.finished} episode${s.finished === 1 ? '' : 's'} finished`],
    ['Notes written or edited', data.notes, `${data.highlights} highlights`],
    ['Journal and prayer entries', data.journal, 'saved in your journal'],
    ['Library sections and Catechism pages opened', s.lessons, 'works and paragraphs'],
  ] : [];
  return (
    <div className="page year-page">
      <h1>Your {year}</h1>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn small ghost" onClick={() => setYear(year - 1)} aria-label="Previous year">← {year - 1}</button>
        <button className="btn small ghost" disabled={year >= now} onClick={() => setYear(year + 1)} aria-label="Next year">{year + 1} →</button>
      </div>
      {!s && <div className="center-note">Counting…</div>}
      {s && (
        <>
          <div className="stat-grid">
            {cards.map(([k, v, d]) => <div className="card stat" key={k}><strong>{v}</strong><span>{k}</span><em>{d}</em></div>)}
          </div>
          <section className="card" aria-label="Days active each month">
            <h2 className="eyebrow-h">Days you were here, by month</h2>
            <div className="bars" role="img" aria-label={MONTHS.map((m, i) => `${m} ${s.perMonth[i]}`).join(', ')}>
              {s.perMonth.map((n, i) => <div key={i} className="bar"><i style={{ height: `${Math.max(3, (100 * n) / max)}%` }} /><span>{MONTHS[i][0]}</span></div>)}
            </div>
          </section>
          <p className="muted small">Counted on this device from what you opened and saved. <Link to="/history">See your history</Link>.</p>
        </>
      )}
    </div>
  );
}
