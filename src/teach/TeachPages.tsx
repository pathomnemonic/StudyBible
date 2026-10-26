import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db } from '../db/db';
import { addStudents, addAssessment, assessmentsOf, attendanceOf, createClass, deleteClass, mapPlayer, saveClass, sessionsOf, setMark, setScore, useClass, useClasses, useWork } from './store';
import { Toolkit } from './TeachTools';
import { attendanceSummary, gradebook, letter, MARK_LABEL, toCsv, today, type ClassDoc, type Mark } from './model';

const download = (name: string, text: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
const pct = (n: number | null | undefined) => (n === null || n === undefined ? '' : `${Math.round(n)}%`);
const MARKS: Mark[] = ['P', 'L', 'E', 'A'];

export function TeachHome() {
  const classes = useClasses();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  return (
    <div className="page">
      <h1>Teacher tools</h1>
      <p className="lede">Your classes in one place: the student list, attendance, participation, quiz and exam scores, a gradebook and report cards. Joining a live session takes attendance for you.</p>
      <div className="notice info small">Class records are kept on this device. If you are signed in to a sync server, they sync to your own account only. Nothing is shared with students except the names on the list, which they see when they join a session.</div>
      <h2 className="eyebrow-h" style={{ marginTop: 18 }}>Your classes</h2>
      {classes && classes.length === 0 && <div className="empty">No classes yet. Make your first one to begin.</div>}
      <div className="shelf">{(classes ?? []).filter((c) => !c.archived).map((c) => <Link key={c.id} className="shelf-card" to={`/teach/${c.id}`}><span className="t">{c.name}</span><span className="d">{c.grade ? `${c.grade} · ` : ''}{c.students.length} students · {c.year}</span></Link>)}</div>
      <form className="live-form" style={{ marginTop: 16 }} onSubmit={async (e) => { e.preventDefault(); const id = await createClass(name, grade || undefined); nav(`/teach/${id}`); }}>
        <label>Class name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Grade 5 Religion, Period 3" required /></label>
        <label>Grade (optional)<input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Grade 5" /></label>
        <button className="btn primary">Create the class</button>
      </form>
      <p className="muted small" style={{ marginTop: 18 }}>To run a session, open any lesson under <Link to="/study/curriculum">Study → Catechism, Kindergarten to Grade 12</Link> and choose “Host live with a class code”. Pick the class there.</p>
    </div>
  );
}

type Tab = 'roster' | 'attendance' | 'sessions' | 'grades' | 'reports' | 'tools';
export function ClassPage() {
  const { classId = '' } = useParams();
  const cls = useClass(classId);
  const work = useWork(classId);
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as Tab) || 'roster';
  if (cls === undefined) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!cls) return <div className="page"><Link to="/teach">← Teacher tools</Link><p>That class was not found.</p></div>;
  const TABS: [Tab, string][] = [['roster', 'Students'], ['attendance', 'Attendance'], ['sessions', 'Sessions'], ['grades', 'Gradebook'], ['reports', 'Reports'], ['tools', 'Toolkit']];
  return (
    <div className="page">
      <Link to="/teach" className="small no-print">← Teacher tools</Link>
      <h1 style={{ marginBottom: 2 }}>{cls.name}</h1>
      <p className="muted small" style={{ marginTop: 0 }}>{cls.grade ? `${cls.grade} · ` : ''}{cls.students.length} students · {cls.year}</p>
      <div className="tabbar no-print" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setSp({ tab: k }, { replace: true })}>{l}</button>)}</div>
      {tab === 'roster' && <Roster cls={cls} />}
      {tab === 'attendance' && <Attendance cls={cls} work={work} />}
      {tab === 'sessions' && <Sessions cls={cls} work={work} />}
      {tab === 'grades' && <Grades cls={cls} work={work} />}
      {tab === 'reports' && <Reports cls={cls} work={work} />}
      {tab === 'tools' && <Toolkit cls={cls} work={work} />}
    </div>
  );
}

function Roster({ cls }: { cls: ClassDoc }) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const nav = useNavigate();
  return (
    <div>
      <p className="muted small">Type or paste student names, one per line. Students pick their name from this list when they join a live session, which is how attendance is taken.</p>
      <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Maria Lopez\nJames Carter\nAnh Nguyen'} aria-label="Student names" style={{ width: '100%' }} />
      <div className="row" style={{ gap: 8, margin: '6px 0 12px', flexWrap: 'wrap' }}><label className="btn">Import a list from a file<input type="file" accept=".csv,.txt" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const t = (await f.text()).split(/\r?\n/).map((l) => l.split(',').slice(0, 2).reverse().map((x) => x.trim().replace(/^"|"$/g, '')).filter(Boolean).join(' ')).join('\n'); setText(t); } }} /></label><button className="btn primary" disabled={!text.trim()} onClick={async () => { const n = await addStudents(cls, text); setMsg(`${n} added.`); setText(''); }}>Add students</button><span className="muted small" aria-live="polite">{msg}</span></div>
      <ul className="list">
        {cls.students.map((s) => (
          <li key={s.id} className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
            <input value={s.name} aria-label="Name" onChange={(e) => saveClass({ ...cls, students: cls.students.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)) })} style={{ flex: '1 1 160px' }} />
            <input value={s.note ?? ''} aria-label={`Note for ${s.name}`} placeholder="Note (accommodations, contact…)" onChange={(e) => saveClass({ ...cls, students: cls.students.map((x) => (x.id === s.id ? { ...x, note: e.target.value } : x)) })} style={{ flex: '2 1 200px' }} />
            <button className="btn small ghost" onClick={() => confirm(`Remove ${s.name}? Their past scores stay in the class record.`) && saveClass({ ...cls, students: cls.students.filter((x) => x.id !== s.id) })}>Remove</button>
          </li>
        ))}
      </ul>
      <h3 className="h-sm" style={{ marginTop: 20 }}>This class</h3>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <label className="row" style={{ gap: 6 }}>Name <input value={cls.name} onChange={(e) => saveClass({ ...cls, name: e.target.value })} /></label>
        <label className="row" style={{ gap: 6 }}>School year <input value={cls.year} onChange={(e) => saveClass({ ...cls, year: e.target.value })} style={{ width: 120 }} /></label>
        <button className="btn small" onClick={() => saveClass({ ...cls, archived: !cls.archived })}>{cls.archived ? 'Unarchive' : 'Archive the class'}</button>
        <button className="btn small ghost" onClick={async () => { if (confirm(`Delete ${cls.name} and all of its attendance and scores? This cannot be undone.`)) { await deleteClass(cls.id); nav('/teach'); } }}>Delete the class</button>
      </div>
    </div>
  );
}

type Work = ReturnType<typeof useWork>;
function Attendance({ cls, work }: { cls: ClassDoc; work: Work }) {
  const [date, setDate] = useState(today());
  const days = attendanceOf(work);
  const day = days.find((d) => d.date === date);
  return (
    <div>
      <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="row" style={{ gap: 6 }}>Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <button className="btn small" onClick={async () => { for (const s of cls.students) await setMark(cls.id, date, s.id, day?.marks[s.id] ?? 'P'); }}>Mark everyone not yet marked as present</button>
      </div>
      <p className="muted small">Students who join a live session are marked present (late if they come more than three minutes after the start) and everyone else absent when it ends. Change any mark here.</p>
      <table className="grid-table"><thead><tr><th>Student</th>{MARKS.map((m) => <th key={m}>{MARK_LABEL[m]}</th>)}</tr></thead><tbody>
        {cls.students.map((s) => <tr key={s.id}><th scope="row">{s.name}</th>{MARKS.map((m) => <td key={m}><input type="radio" name={`m-${s.id}`} checked={day?.marks[s.id] === m} onChange={() => setMark(cls.id, date, s.id, m)} aria-label={`${s.name}: ${MARK_LABEL[m]}`} /></td>)}</tr>)}
      </tbody></table>
      <h3 className="h-sm" style={{ marginTop: 20 }}>Over time</h3>
      <table className="grid-table"><thead><tr><th>Student</th><th>Days</th><th>Present</th><th>Late</th><th>Absent</th><th>Excused</th><th>Rate</th></tr></thead><tbody>
        {cls.students.map((s) => { const a = attendanceSummary(s.id, days); return <tr key={s.id}><th scope="row">{s.name}</th><td>{a.days}</td><td>{a.present}</td><td>{a.late}</td><td>{a.absent}</td><td>{a.excused}</td><td className={a.rate !== null && a.rate < 85 ? 'bad' : ''}>{pct(a.rate)}</td></tr>; })}
      </tbody></table>
      <button className="btn small" style={{ marginTop: 8 }} onClick={() => download(`attendance-${cls.name}.csv`, toCsv([['Student', ...days.map((d) => d.date), 'Rate'], ...cls.students.map((s) => [s.name, ...days.map((d) => d.marks[s.id] ?? ''), pct(attendanceSummary(s.id, days).rate)])]))}>Download attendance (CSV)</button>
    </div>
  );
}

function Sessions({ cls, work }: { cls: ClassDoc; work: Work }) {
  const list = sessionsOf(work);
  const [open, setOpen] = useState<string>('');
  if (!list.length) return <div className="empty">No sessions yet. Open a lesson and choose “Host live with a class code”, then pick this class.</div>;
  return (
    <div>
      {list.map((s) => {
        const unmatched = s.results.filter((r) => !r.studentId);
        const isOpen = open === s.id;
        const avg = s.results.length ? s.results.reduce((a, r) => a + (s.mode === 'exam' ? r.score : r.total ? (r.correct / r.total) * 100 : 0), 0) / s.results.length : 0;
        return (
          <section key={s.id} className="card" style={{ marginBottom: 10 }}>
            <button className="linklike" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : s.id)} style={{ textAlign: 'left', width: '100%' }}>
              <strong>{s.title}</strong> <span className="muted small">· {s.date} · {s.mode === 'exam' ? 'exam' : s.mode === 'lesson' ? 'lesson' : 'quiz game'} · {s.results.length} joined{s.mode !== 'lesson' ? ` · average ${Math.round(avg)}%` : ''}{unmatched.length ? ` · ${unmatched.length} to match` : ''}</span>
            </button>
            {isOpen && (
              <div style={{ marginTop: 8 }}>
                {unmatched.length > 0 && <div className="notice warn small"><strong>Some names are not on the class list.</strong> Say who each one is so their attendance and scores are counted.
                  {unmatched.map((r) => <div key={r.name} className="row" style={{ gap: 8, marginTop: 4 }}><span>{r.name}</span><select aria-label={`Who is ${r.name}`} defaultValue="" onChange={(e) => e.target.value && mapPlayer(s.id, r.name, e.target.value)}><option value="">Choose a student…</option>{cls.students.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}</select></div>)}
                </div>}
                <table className="grid-table"><thead><tr><th>Student</th><th>{s.mode === 'exam' ? 'Score' : 'Correct'}</th><th>Answered</th><th>Joined</th></tr></thead><tbody>
                  {s.results.map((r) => <tr key={r.name}><th scope="row">{cls.students.find((x) => x.id === r.studentId)?.name ?? `${r.name} (unmatched)`}</th><td>{s.mode === 'exam' ? pct(r.score) : `${r.correct}/${r.total}`}</td><td>{r.answered}/{r.total}</td><td>{r.joinedAt ? new Date(r.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td></tr>)}
                </tbody></table>
                {s.questions.length > 0 && <>
                  <h3 className="h-sm" style={{ marginTop: 12 }}>Which questions were hard?</h3>
                  <ol className="item-analysis">{s.questions.map((q, k) => <li key={k}><span className="q">{q.q}</span><span className="bar"><i className={q.correctPct < 50 ? 'low' : q.correctPct < 75 ? 'mid' : ''} style={{ width: `${q.correctPct}%` }} /></span><span>{q.correctPct}% right</span></li>)}</ol>
                  <p className="muted small">Questions under 50% are worth teaching again.</p></>}
                <button className="btn small ghost" onClick={async () => { if (confirm('Delete this session and the scores and attendance it created?')) { await db.classwork.bulkDelete([s.id, `asm:${s.code}`, `part:${s.code}`]); } }}>Delete this session</button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Grades({ cls, work }: { cls: ClassDoc; work: Work }) {
  const asm = assessmentsOf(work);
  const rows = useMemo(() => gradebook(cls, asm), [cls, work]);
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState(cls.categories[0]?.id ?? 'homework');
  const [pts, setPts] = useState(100);
  const [due, setDue] = useState('');
  const total = cls.categories.reduce((a, c) => a + c.weight, 0);
  const avg = (f: (r: (typeof rows)[number]) => number | null) => { const v = rows.map(f).filter((x): x is number => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  return (
    <div>
      <div className="grid-scroll"><table className="grid-table grades"><thead><tr><th>Student</th>{asm.map((a) => <th key={a.id} title={`${a.title} (${a.points} points)`}><span className="asm-title">{a.title}</span><small>{cls.categories.find((c) => c.id === a.category)?.name} · /{a.points}{a.due ? ` · due ${a.due}` : ''}</small></th>)}<th>Overall</th><th>Grade</th></tr></thead><tbody>
        {rows.map((r) => <tr key={r.student.id}><th scope="row">{r.student.name}</th>{asm.map((a) => <td key={a.id}><input className="score-in" inputMode="decimal" aria-label={`${r.student.name}, ${a.title}`} defaultValue={a.scores[r.student.id] ?? ''} key={`${a.id}${a.scores[r.student.id] ?? ''}`} onBlur={(e) => { const t = e.target.value.trim(); const n = t === '' ? null : Number(t); if (n === null || Number.isFinite(n)) void setScore(a, r.student.id, n); }} /></td>)}<td><strong>{pct(r.total)}</strong></td><td><strong>{letter(r.total, cls.scale)}</strong></td></tr>)}
        <tr className="avg"><th scope="row">Class average</th>{asm.map((a) => <td key={a.id}>{pct(avg((r) => r.byAssessment[a.id] ?? null))}</td>)}<td>{pct(avg((r) => r.total))}</td><td /></tr>
      </tbody></table></div>
      {!asm.length && <div className="empty">No scores yet. Live games and exams add themselves when they end. Add homework or a project to record scores.</div>}
      <div className="row no-print" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn small" onClick={() => download(`gradebook-${cls.name}.csv`, toCsv([['Student', ...asm.map((a) => `${a.title} (/${a.points})`), 'Overall %', 'Grade'], ...rows.map((r) => [r.student.name, ...asm.map((a) => a.scores[r.student.id] ?? ''), r.total === null ? '' : Math.round(r.total * 10) / 10, letter(r.total, cls.scale)])]))}>Download gradebook (CSV)</button>
        <button className="btn small" onClick={() => window.print()}>Print</button>
      </div>
      <form className="row no-print" style={{ gap: 8, margin: '14px 0', flexWrap: 'wrap', alignItems: 'end' }} onSubmit={async (e) => { e.preventDefault(); await addAssessment(cls.id, title, cat, pts, due); setTitle(''); setDue(''); }}>
        <label>New assignment<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chapter 3 homework" required /></label>
        <label>Category<select value={cat} onChange={(e) => setCat(e.target.value)}>{cls.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Points<input type="number" min={1} value={pts} onChange={(e) => setPts(+e.target.value)} style={{ width: 80 }} /></label>
        <label>Due<input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></label>
        <button className="btn primary">Add</button>
      </form>
      <details className="no-print"><summary>Weights, letter grades and removing items</summary>
        <h3 className="h-sm">How the overall grade is worked out</h3>
        {cls.categories.map((c) => <div key={c.id} className="row" style={{ gap: 8, margin: '4px 0' }}><span style={{ width: 200 }}>{c.name}</span><input type="number" min={0} max={100} value={c.weight} aria-label={`${c.name} weight`} style={{ width: 70 }} onChange={(e) => saveClass({ ...cls, categories: cls.categories.map((x) => (x.id === c.id ? { ...x, weight: +e.target.value } : x)) })} /><span className="muted small">%</span></div>)}
        <p className="muted small">Weights add up to {total}%. Categories with no scores yet are left out, so the rest are scaled to fit.</p>
        <label>Letter grade cut-offs <input aria-label="Letter grade cut-offs" defaultValue={cls.scale.map(([l, m]) => `${l}:${m}`).join(', ')} onBlur={(e) => { const sc = e.target.value.split(',').map((p) => p.trim().split(':')).filter((p) => p[0] && Number.isFinite(+p[1])).map((p) => [p[0], +p[1]] as [string, number]); if (sc.length) void saveClass({ ...cls, scale: sc }); }} style={{ width: 260 }} /></label>
        <ul className="list" style={{ marginTop: 10 }}>{asm.map((a) => <li key={a.id} className="row between"><span>{a.title} <span className="muted small">{a.date}</span></span><button className="btn small ghost" onClick={() => confirm(`Remove “${a.title}” from the gradebook?`) && db.classwork.delete(a.id)}>Remove</button></li>)}</ul>
      </details>
    </div>
  );
}

function Reports({ cls, work }: { cls: ClassDoc; work: Work }) {
  const asm = assessmentsOf(work);
  const days = attendanceOf(work);
  const rows = useMemo(() => gradebook(cls, asm), [cls, work]);
  const [who, setWho] = useState('all');
  const [comments, setComments] = useState<Record<string, string>>({});
  useEffect(() => { db.cache.get(`rc-comments:${cls.id}`).then((r) => r && setComments(JSON.parse(String(r.value)))); }, [cls.id]);
  const shown = rows.filter((r) => who === 'all' || r.student.id === who);
  return (
    <div>
      <div className="row no-print" style={{ gap: 8, flexWrap: 'wrap' }}>
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Student"><option value="all">Every student</option>{cls.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <button className="btn primary" onClick={() => window.print()}>Print report cards</button>
      </div>
      {shown.map((r) => {
        const a = attendanceSummary(r.student.id, days);
        const part = r.byCategory.participation;
        return (
          <article key={r.student.id} className="report-card">
            <h2>{r.student.name}</h2>
            <p className="muted small">{cls.name} · {cls.year}</p>
            <div className="report-stats">
              <div><strong>{pct(r.total) || '—'}</strong><span>Overall {letter(r.total, cls.scale)}</span></div>
              <div><strong>{pct(a.rate) || '—'}</strong><span>Attendance ({a.present + a.late} of {a.days - a.excused} days{a.late ? `, ${a.late} late` : ''})</span></div>
              <div><strong>{pct(part) || '—'}</strong><span>Participation</span></div>
            </div>
            <table className="grid-table"><thead><tr><th>Assessment</th><th>Category</th><th>Score</th></tr></thead><tbody>{asm.filter((x) => x.scores[r.student.id] !== undefined && x.scores[r.student.id] !== null).map((x) => <tr key={x.id}><th scope="row">{x.title}</th><td>{cls.categories.find((c) => c.id === x.category)?.name}</td><td>{x.scores[r.student.id]}/{x.points} ({pct(r.byAssessment[x.id])})</td></tr>)}</tbody></table>
            <label className="no-print" style={{ display: 'grid', gap: 4, marginTop: 8 }}>Teacher’s comment<textarea rows={2} value={comments[r.student.id] ?? ''} onChange={(e) => { const n = { ...comments, [r.student.id]: e.target.value }; setComments(n); void db.cache.put({ key: `rc-comments:${cls.id}`, value: JSON.stringify(n), ts: Date.now() }); }} /></label>
            <details className="no-print"><summary>Message to the family</summary><textarea readOnly rows={5} style={{ width: '100%' }} value={`Dear family of ${r.student.name.split(' ')[0]},\n\nHere is a brief update from ${cls.name}. ${r.student.name.split(' ')[0]}'s overall grade is ${pct(r.total) || 'not yet available'}${letter(r.total, cls.scale) ? ` (${letter(r.total, cls.scale)})` : ''}, with attendance of ${pct(a.rate) || 'n/a'} and participation of ${pct(part) || 'n/a'}.${comments[r.student.id] ? `\n\n${comments[r.student.id]}` : ''}\n\nThank you for your partnership.`} onFocus={(e) => e.currentTarget.select()} /></details>
            {comments[r.student.id] && <p className="report-comment print-only"><strong>Comment:</strong> {comments[r.student.id]}</p>}
          </article>
        );
      })}
    </div>
  );
}
