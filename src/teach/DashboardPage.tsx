import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getGrade, gradeLabel } from '../curriculum/model';
import { useClasses } from './store';
import { today, type ClassDoc } from './model';
import { averages, lessonsTaught, missedQuestions, notJoinedRecently, reteachList, type LessonTag, type Session } from './dashboard';
import { loadSavedResults, type SavedResults } from './results';

const tagOf = (code: string): LessonTag | undefined => { try { const t = localStorage.getItem(`sb:teach:lesson:${code}`); return t ? (JSON.parse(t) as LessonTag) : undefined; } catch { return undefined; } };
const tone = (p: number) => (p < 50 ? 'low' : p < 75 ? 'mid' : 'ok');
const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Bars for the average score of each session, oldest first. An SVG with a text alternative; the numbers are also printed on the bars. */
function AvgChart({ pts }: { pts: ReturnType<typeof averages> }) {
  if (!pts.length) return <p className="muted small">No scored sessions yet. A quiz game or exam adds a bar here when it ends.</p>;
  const shown = pts.slice(-12);
  const W = 100, H = 120, bw = W / shown.length;
  const label = `Average score per session, ${shown.map((p) => `${p.title} on ${fmt(p.date)}: ${p.avg} percent`).join('; ')}.`;
  return (
    <figure className="td-chart">
      <svg viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={label} preserveAspectRatio="none" className="td-svg">
        {[0, 50, 100].map((g) => <line key={g} x1="0" x2={W} y1={H - g * 1.0} y2={H - g * 1.0} className="td-grid" />)}
        {shown.map((p, i) => <g key={p.id}><title>{`${p.title}, ${fmt(p.date)}: ${p.avg}%`}</title><rect x={i * bw + bw * 0.15} width={bw * 0.7} y={H - p.avg} height={Math.max(1, p.avg)} className={`td-bar ${tone(p.avg)}`} /></g>)}
      </svg>
      <ol className="td-axis" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${shown.length}, 1fr)` }}>{shown.map((p) => <li key={p.id}><b>{p.avg}%</b><span>{fmt(p.date)}</span></li>)}</ol>
    </figure>
  );
}

function ClassBoard({ cls, sessions, titles }: { cls: ClassDoc; sessions: Session[]; titles: Record<string, string> }) {
  const taught = useMemo(() => lessonsTaught(sessions), [sessions]);
  const avgs = useMemo(() => averages(sessions), [sessions]);
  const missed = useMemo(() => missedQuestions(sessions, (s) => tagOf(s.code), 8), [sessions]);
  const away = useMemo(() => notJoinedRecently(cls, sessions, today(), 14), [cls, sessions]);
  const reteach = useMemo(() => reteachList(missedQuestions(sessions, (s) => tagOf(s.code), 200)), [sessions]);
  const overall = avgs.length ? Math.round(avgs.reduce((a, p) => a + p.avg, 0) / avgs.length) : null;
  return (
    <div className="td-board">
      <div className="td-tiles">
        <div><strong>{sessions.length}</strong><span>live sessions</span></div>
        <div><strong>{overall === null ? '—' : `${overall}%`}</strong><span>average score</span></div>
        <div><strong>{cls.students.length - away.length}</strong><span>joined in the last 2 weeks</span></div>
      </div>

      <h3 className="h-sm">Lessons taught</h3>
      {taught.length ? <ul className="list td-taught">{taught.map((d) => <li key={d.date}><span className="muted small">{fmt(d.date)}</span> <strong>{d.titles.join(', ')}</strong> <span className="muted small">· {d.joined} joined</span></li>)}</ul> : <p className="muted small">Nothing taught live yet. Host a lesson with this class and it will appear here.</p>}

      <h3 className="h-sm">Average score per session</h3>
      <AvgChart pts={avgs} />

      <h3 className="h-sm">Questions missed most</h3>
      {missed.length ? <ol className="item-analysis td-missed">{missed.map((m) => <li key={m.q}><span className="q">{m.q}{m.asked > 1 ? <small className="muted"> · asked {m.asked} times</small> : null}</span><span className="bar" aria-hidden="true"><i className={tone(m.correctPct) === 'ok' ? '' : tone(m.correctPct)} style={{ width: `${m.correctPct}%` }} /></span><span>{m.correctPct}% right</span></li>)}</ol> : <p className="muted small">No question results yet. They are kept when a session ends.</p>}

      <h3 className="h-sm">Reteach these</h3>
      {reteach.length ? <ul className="list td-reteach">{reteach.map((r) => <li key={`${r.grade}/${r.lessonId}`}><Link to={`/study/curriculum/${r.grade}/${r.lessonId}`}>{titles[`${r.grade}/${r.lessonId}`] ?? r.lessonId}</Link> <span className="muted small">· {r.missed} {r.missed === 1 ? 'question' : 'questions'} under 60% right (about {r.avgCorrect}% on average)</span></li>)}</ul> : <p className="muted small">Nothing to reteach yet. Lessons appear here when their questions are answered right less than 60% of the time. Sessions opened before this feature do not say which lesson a question came from.</p>}

      <h3 className="h-sm">Not joined lately</h3>
      {!cls.students.length ? <p className="muted small">Add students under <Link to={`/teach/${cls.id}`}>the class list</Link> to see who is missing.</p>
        : away.length ? <ul className="list td-away">{away.map((a) => <li key={a.id}><strong>{a.name}</strong> <span className="muted small">· {a.lastSeen ? `last joined ${fmt(a.lastSeen)} (${a.daysAgo} days ago)` : 'has not joined a session yet'}</span></li>)}</ul>
        : <p className="muted small">Everyone on the list joined within the last two weeks.</p>}
      <p className="small"><Link to={`/teach/${cls.id}`}>Open the class</Link></p>
    </div>
  );
}

export default function DashboardPage() {
  const classes = (useClasses() ?? []).filter((c) => !c.archived);
  const all = useLiveQuery(() => db.classwork.where('kind').equals('session').toArray(), []) as Session[] | undefined;
  const [quick, setQuick] = useState<SavedResults[]>([]);
  const [sel, setSel] = useState('');
  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => { loadSavedResults().then(setQuick).catch(() => setQuick([])); }, [all?.length]);
  const classOf = (id: string) => all?.filter((s) => s.classId === id) ?? [];
  const cur = classes.find((c) => c.id === sel) ?? classes.find((c) => classOf(c.id).length) ?? classes[0];
  const sessions = cur ? classOf(cur.id) : [];
  // the names of lessons to reteach
  useEffect(() => {
    const gs = new Set<string>();
    for (const s of sessions) { const t = tagOf(s.code); if (t) gs.add(t.g); }
    let live = true;
    Promise.all([...gs].map(async (g) => { const d = await getGrade(g); return (d?.units.flatMap((u) => u.lessons) ?? []).map((l) => [`${g}/${l.id}`, `${gradeLabel(g)}: ${l.title}`] as const); })).then((rows) => live && setTitles(Object.fromEntries(rows.flat())));
    return () => { live = false; };
  }, [sessions.length, cur?.id]);
  const known = new Set((all ?? []).map((s) => s.code));
  const loose = quick.filter((q) => !known.has(q.code));
  return (
    <div className="page td-page">
      <Link to="/teach" className="small no-print">← Teacher tools</Link>
      <h1>Teacher dashboard</h1>
      <p className="lede">What you taught, how each session went, which questions the class missed and which lessons to teach again. It is built from the sessions saved on this device.</p>
      {classes.length === 0 && <div className="empty">No classes yet. <Link to="/teach">Make a class</Link>, then host a lesson with it.</div>}
      {classes.length > 1 && <div className="tabbar" role="tablist" aria-label="Class">{classes.map((c) => <button key={c.id} role="tab" aria-selected={cur?.id === c.id} onClick={() => setSel(c.id)}>{c.name}</button>)}</div>}
      {cur && <section aria-label={cur.name}><h2 className="eyebrow-h" style={{ marginTop: 12 }}>{cur.name}</h2><ClassBoard key={cur.id} cls={cur} sessions={sessions} titles={titles} /></section>}
      {loose.length > 0 && <section style={{ marginTop: 22 }}>
        <h2 className="eyebrow-h">Quick quizzes with no class</h2>
        <ul className="list">{loose.slice(0, 8).map((q) => <li key={q.code}><strong>{q.title}</strong> <span className="muted small">· {fmt(q.date)} · {q.players} played{q.avg === null ? '' : ` · average ${q.avg}%`}</span></li>)}</ul>
      </section>}
    </div>
  );
}
