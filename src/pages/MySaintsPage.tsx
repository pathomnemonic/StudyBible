import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { butlerDay, type ButlerEntry } from '../study/butler';

const KEY = 'sb:me:dates';
interface Dates { birthday: string; baptism: string }
const load = (): Dates => { try { return { birthday: '', baptism: '', ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Dates>) }; } catch { return { birthday: '', baptism: '' }; } };
const save = (d: Dates) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* private mode */ } };
const md = (iso: string) => iso.slice(5, 10);
const label = (m: string) => new Date(Date.UTC(2024, +m.slice(0, 2) - 1, +m.slice(3))).toLocaleDateString(undefined, { month: 'long', day: 'numeric', timeZone: 'UTC' });
const title = (e: ButlerEntry) => e.name.replace(/[.,]\s*$/, '').replace(/,.*$/, '');

/** Days until the next time a month and day comes round, counting today as 0. */
export function daysUntil(m: string, from = new Date()): number {
  const today = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  let t = Date.UTC(from.getFullYear(), +m.slice(0, 2) - 1, +m.slice(3));
  if (t < today) t = Date.UTC(from.getFullYear() + 1, +m.slice(0, 2) - 1, +m.slice(3));
  return Math.round((t - today) / 864e5);
}
const ics = (summary: string, m: string) => {
  const y = new Date().getFullYear() + (daysUntil(m) > 0 && new Date(Date.UTC(new Date().getFullYear(), +m.slice(0, 2) - 1, +m.slice(3))) < new Date() ? 1 : 0);
  const d = `${y}${m.slice(0, 2)}${m.slice(3, 5)}`;
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Cathology//EN\r\nBEGIN:VEVENT\r\nUID:${d}-${summary.length}@cathology\r\nDTSTAMP:${d}T090000Z\r\nDTSTART;VALUE=DATE:${d}\r\nRRULE:FREQ=YEARLY\r\nSUMMARY:${summary}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
};
const download = (name: string, text: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };

function Day({ iso, heading }: { iso: string; heading: string }) {
  const m = md(iso);
  const [list, setList] = useState<ButlerEntry[] | null>(null);
  useEffect(() => { let live = true; butlerDay(m).then((l) => live && setList(l)); return () => { live = false; }; }, [m]);
  return (
    <section className="card" style={{ margin: '10px 0' }}>
      <h2 style={{ margin: 0 }}>{heading}</h2>
      <p className="muted small" style={{ margin: '2px 0 6px' }}>{label(m)}. {daysUntil(m) === 0 ? 'That is today.' : `Next one in ${daysUntil(m)} days.`}</p>
      {list === null ? <p className="muted small">Loading…</p> : list.length === 0 ? <p className="muted small">No life of a saint is listed for this day.</p> : (
        <ul className="list">{list.slice(0, 6).map((e, i) => <li key={i}><Link to={`/study/saints/${m}?name=${encodeURIComponent(title(e).toLowerCase())}`}>{title(e)}</Link></li>)}</ul>
      )}
      <button className="btn small" onClick={() => download(`${heading.replace(/\W+/g, '-').toLowerCase()}.ics`, ics(heading, m))}>Add a yearly reminder to my calendar</button>
    </section>
  );
}

/** Your own days: the saints who share your birthday and the day of your baptism, with a yearly reminder you can add to any calendar. It stays on this device. */
export default function MySaintsPage() {
  const [d, setD] = useState<Dates>(load);
  const set = (k: keyof Dates, v: string) => { const n = { ...d, [k]: v }; setD(n); save(n); };
  const has = useMemo(() => ({ b: /^\d{4}-\d{2}-\d{2}$/.test(d.birthday), p: /^\d{4}-\d{2}-\d{2}$/.test(d.baptism) }), [d]);
  return (
    <div className="page">
      <h1>My saints and days</h1>
      <p className="lede">Add your birthday and the day you were baptized. The dates never leave this phone.</p>
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <label className="field"><span>My birthday</span><input type="date" value={d.birthday} onChange={(e) => set('birthday', e.target.value)} /></label>
        <label className="field"><span>My baptism</span><input type="date" value={d.baptism} onChange={(e) => set('baptism', e.target.value)} /></label>
      </div>
      {has.b && <Day iso={d.birthday} heading="Saints of my birthday" />}
      {has.p && <Day iso={d.baptism} heading="My baptism anniversary" />}
      <p className="small"><Link to="/study/saint-names">Find saints who share a name</Link></p>
    </div>
  );
}
