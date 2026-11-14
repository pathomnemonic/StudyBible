import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../../db/db';
import { useClasses } from '../../teach/store';
import { uid } from '../../teach/model';
import { flatLessons, getGrade, gradeLabel, type GradeData } from '../../curriculum/model';
import { pacingSchedule, unitSpans } from '../../curriculum/pacing';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const defaultStart = () => { const n = new Date(); const y = n.getMonth() >= 7 ? n.getFullYear() : n.getFullYear() - (n.getMonth() < 5 ? 1 : 0); return `${y}-09-01`; };

/** A letter to families about one unit, written from the unit's own lessons: what we are learning, the verses to learn, and what to do at home. */
function parentLetter(g: GradeData, unitN: number, from: string, to: string) {
  const u = g.units.find((x) => x.n === unitN);
  if (!u) return;
  const w = window.open('', '_blank');
  if (!w) return;
  const lessons = u.lessons;
  const verses = lessons.map((l) => l.mem).filter(Boolean) as string[];
  const home = lessons.map((l) => l.life).filter(Boolean) as string[];
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(u.title)}: letter to families</title><style>body{font:16px/1.5 Georgia,serif;max-width:660px;margin:24px auto;padding:0 16px}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:18px 0 4px}ul{margin:4px 0 0;padding-left:20px}li{margin:3px 0}.m{color:#555;font-size:13px}@media print{.n{display:none}}</style>
<button class="n" onclick="window.print()">Print</button>
<h1>${esc(gradeLabel(g.id))}: ${esc(u.title)}</h1>
<p class="m">${esc(fmt(from))} to ${esc(fmt(to))} · ${lessons.length} lessons</p>
<p>Dear families,</p>
<p>In the coming weeks we are learning about <strong>${esc(u.title)}</strong>. The question behind the unit is: <em>${esc(u.eq)}</em></p>
<h2>What we will cover</h2><ul>${lessons.map((l) => `<li><strong>${esc(l.title)}.</strong> ${esc(l.idea)}</li>`).join('')}</ul>
${verses.length ? `<h2>Verses and prayers to learn by heart</h2><ul>${verses.map((v) => `<li>${esc(v)}</li>`).join('')}</ul>` : ''}
${home.length ? `<h2>Things to try at home</h2><ul>${home.map((v) => `<li>${esc(v)}</li>`).join('')}</ul>` : ''}
<p>Thank you for being your child's first teachers in the faith. Please talk with me if you have any questions.</p>
<p>______________________</p></body>`);
  w.document.close();
}

/** Spread a grade over the school year, print the calendar and a letter for each unit, and add the lessons to a class planner. */
export default function CurriculumPacing() {
  const { grade = '' } = useParams();
  const [g, setG] = useState<GradeData | null | undefined>(undefined);
  const [start, setStart] = useState(defaultStart);
  const [days, setDays] = useState<number[]>([2]);
  const [perDay, setPerDay] = useState(1);
  const [breaks, setBreaks] = useState<[string, string][]>([['', '']]);
  const [msg, setMsg] = useState('');
  const classes = (useClasses() ?? []).filter((c) => !c.archived);
  const [clsId, setClsId] = useState('');
  useEffect(() => { getGrade(grade).then((x) => setG(x ?? null)); }, [grade]);
  const lessons = useMemo(() => (g ? flatLessons(g).map((l) => ({ id: l.id, title: l.title, unit: l.unit.n })) : []), [g]);
  const sched = useMemo(() => pacingSchedule({ lessons, start, days, perDay, breaks: breaks.filter(([a, b]) => a && b && a <= b) }), [lessons, start, days, perDay, breaks]);
  const spans = useMemo(() => unitSpans(sched.rows), [sched]);
  const toggleDay = (d: number) => setDays((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d].sort()));

  if (g === undefined) return <div className="page"><p className="muted" role="status">Loading…</p></div>;
  if (!g) return <div className="page" data-state="not-found"><p>That grade was not found.</p></div>;
  const cls = classes.find((c) => c.id === clsId) ?? classes[0];
  const addToClass = async () => {
    if (!cls) return;
    for (const r of sched.rows) await db.classwork.put({ id: uid(), classId: cls.id, kind: 'plan', date: r.date, gradeId: g.id, lessonId: r.lessonId, title: r.title } as never);
    setMsg(`Added ${sched.rows.length} lessons to ${cls.name}. Open the class to see them in the planner.`);
  };
  return (
    <div className="page cur-pacing">
      <p className="small no-print"><Link to={`/study/curriculum/${g.id}`}>← {gradeLabel(g.id)}</Link></p>
      <h1>Pace {gradeLabel(g.id)} over the year</h1>
      <p className="lede no-print">Choose the first day, the days you teach and any breaks. The lessons fall on the days in order, so you can print the calendar, send each unit's letter home and put the whole plan in a class.</p>

      <section className="card no-print" aria-label="Settings">
        <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <label>First day<input type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} /></label>
          <label>Lessons on a day<select value={perDay} onChange={(e) => setPerDay(+e.target.value)}>{[1, 2, 3].map((n) => <option key={n}>{n}</option>)}</select></label>
        </div>
        <fieldset className="chips" style={{ border: 0, padding: 0, margin: '10px 0 0' }}><legend className="small muted">Days you teach</legend>
          {DAYS.map((d, i) => <label key={d} className="chip"><input type="checkbox" checked={days.includes(i)} onChange={() => toggleDay(i)} /> {d}</label>)}
        </fieldset>
        <div style={{ marginTop: 10 }}><span className="small muted">Breaks (first and last day; leave empty if none)</span>
          {breaks.map(([a, b], i) => (
            <div key={i} className="row" style={{ gap: 8, margin: '4px 0' }}>
              <input type="date" aria-label={`Break ${i + 1} starts`} value={a} onChange={(e) => setBreaks(breaks.map((x, k) => (k === i ? [e.target.value, x[1]] : x)))} />
              <input type="date" aria-label={`Break ${i + 1} ends`} value={b} onChange={(e) => setBreaks(breaks.map((x, k) => (k === i ? [x[0], e.target.value] : x)))} />
            </div>
          ))}
          <button className="btn small ghost" onClick={() => setBreaks([...breaks, ['', '']])}>Add a break</button>
        </div>
      </section>

      {sched.rows.length === 0 ? <p className="muted">Choose at least one teaching day.</p> : (
        <>
          <p role="status"><strong>{sched.rows.length}</strong> lessons from {fmt(sched.rows[0].date)} to <strong>{fmt(sched.endsOn!)}</strong>.</p>
          <div className="row no-print" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => window.print()}>Print the calendar</button>
            {cls
              ? <>{classes.length > 1 && <select aria-label="Class" value={cls.id} onChange={(e) => setClsId(e.target.value)}>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}<button className="btn primary" onClick={() => void addToClass()}>Put these lessons in {cls.name}</button></>
              : <span className="muted small">Make a class under <Link to="/teach">Teacher tools</Link> to put the plan in its planner.</span>}
          </div>
          {msg && <p className="notice" role="status">{msg}</p>}
          <h2 className="eyebrow-h">By unit</h2>
          <ul className="list">
            {spans.map((s) => { const u = g.units.find((x) => x.n === s.unit)!; return (
              <li key={s.unit} className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
                <span><strong>Unit {s.unit}: {u.title}</strong> <span className="muted small">{fmt(s.from)} to {fmt(s.to)} · {s.lessons} lessons</span></span>
                <button className="btn small no-print" onClick={() => parentLetter(g, s.unit, s.from, s.to)}>Letter to families</button>
              </li>
            ); })}
          </ul>
          <h2 className="eyebrow-h">Day by day</h2>
          <div className="tw" style={{ overflowX: 'auto' }}>
            <table className="cur-table"><thead><tr><th>Date</th><th>Unit</th><th>Lesson</th></tr></thead>
              <tbody>{sched.rows.map((r) => <tr key={`${r.date}${r.lessonId}`}><td>{fmt(r.date)}</td><td>{r.unit}</td><td><Link to={`/study/curriculum/${g.id}/${r.lessonId}`}>{r.title}</Link></td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
