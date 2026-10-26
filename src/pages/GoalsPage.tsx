import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings, updateSettings } from '../lib/store';
import { db } from '../db/db';

const startOfWeek = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d.getTime(); };
const DAY = 86400000;

/** A gentle weekly reading goal, counted from the chapters you actually open in the reader. Private to this device. */
export default function GoalsPage() {
  const [s] = useSettings();
  const goal = s.weeklyGoal ?? 0;
  const [chapters, setChapters] = useState<string[]>([]);
  const [days, setDays] = useState<boolean[]>(Array(7).fill(false));
  useEffect(() => {
    const from = startOfWeek();
    db.history.where('ts').aboveOrEqual(from).toArray().then((rows) => {
      const reads = rows.filter((r) => r.type === 'read');
      setChapters([...new Set(reads.map((r) => r.ref))]);
      const d = Array(7).fill(false);
      for (const r of rows) d[Math.min(6, Math.floor((r.ts - from) / DAY))] = true;
      setDays(d);
    }).catch(() => {});
  }, []);
  const pct = goal ? Math.min(100, Math.round((chapters.length / goal) * 100)) : 0;
  const today = new Date().getDay();
  return (
    <div className="page">
      <h1>Reading goal</h1>
      <p className="lede">Pick a number of Bible chapters for the week. It counts the chapters you open in the reader. No streak to lose, just a nudge.</p>
      <div className="card">
        <label className="row between"><span>Chapters this week</span>
          <select value={goal} onChange={(e) => updateSettings({ weeklyGoal: +e.target.value })} aria-label="Weekly goal in chapters">
            <option value={0}>No goal</option>{[3, 5, 7, 10, 14, 21].map((n) => <option key={n} value={n}>{n} chapters</option>)}
          </select></label>
        {goal > 0 && <>
          <div className="goal-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress toward this week’s goal"><i style={{ width: `${pct}%` }} /></div>
          <p><strong>{chapters.length}</strong> of {goal} chapters {chapters.length >= goal ? '— goal reached. Well done.' : `· ${goal - chapters.length} to go`}</p>
        </>}
        <p className="muted small" style={{ marginBottom: 4 }}>Days you opened something this week</p>
        <div className="goal-days" aria-label="Days active">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => <span key={i} className={`${days[i] ? 'on' : ''}${i === today ? ' today' : ''}`}>{l}</span>)}</div>
      </div>
      <p><Link className="btn primary" to="/read">Open the Bible</Link> <Link className="btn" to="/pray/plans">Choose a reading plan</Link></p>
    </div>
  );
}
