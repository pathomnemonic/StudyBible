import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import { getGrade, getGrades, gradeLabel, flatLessons, type GradeData, type GradeMeta } from '../curriculum/model';
import { pick, questionsFor, type BankQuestion, type Difficulty } from '../live/bank';
import { today, uid, type ClassDoc, type ClassWork, type Student } from './model';
import Fold from '../components/Fold';

type Work = ClassWork[];
const shuffled = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

/** Pick a student at random without repeats until everyone has had a turn. */
export function Picker({ cls }: { cls: ClassDoc }) {
  const [left, setLeft] = useState<string[]>([]);
  const [now, setNow] = useState<Student | null>(null);
  const [spin, setSpin] = useState(false);
  const draw = () => {
    const pool = left.length ? left : cls.students.map((s) => s.id);
    if (!pool.length) return;
    setSpin(true);
    let n = 0;
    const id = setInterval(() => {
      setNow(cls.students.find((s) => s.id === pool[Math.floor(Math.random() * pool.length)]) ?? null);
      if (++n > 12) { clearInterval(id); const pickId = pool[Math.floor(Math.random() * pool.length)]; setNow(cls.students.find((s) => s.id === pickId) ?? null); setLeft(pool.filter((x) => x !== pickId)); setSpin(false); }
    }, 70);
  };
  return (
    <div className="tool-card">
      <h3>Pick a student</h3>
      <div className={`picker${spin ? ' spin' : ''}`} aria-live="polite">{now ? now.name : '?'}</div>
      <div className="row" style={{ gap: 8 }}><button className="btn primary" onClick={draw} disabled={!cls.students.length || spin}>Pick</button><button className="btn" onClick={() => { setLeft([]); setNow(null); }}>Start over</button><span className="muted small">{left.length ? `${left.length} left this round` : ''}</span></div>
    </div>
  );
}

/** Split the class into groups, by number or by size. */
export function Groups({ cls }: { cls: ClassDoc }) {
  const [mode, setMode] = useState<'count' | 'size'>('size');
  const [n, setN] = useState(4);
  const [groups, setGroups] = useState<Student[][]>([]);
  const make = () => {
    const s = shuffled(cls.students);
    const count = mode === 'count' ? Math.max(1, n) : Math.max(1, Math.ceil(s.length / Math.max(1, n)));
    const out: Student[][] = Array.from({ length: count }, () => []);
    s.forEach((x, i) => out[i % count].push(x));
    setGroups(out.filter((g) => g.length));
  };
  return (
    <div className="tool-card">
      <h3>Make groups</h3>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <select value={mode} onChange={(e) => setMode(e.target.value as 'size')} aria-label="Group by"><option value="size">Students per group</option><option value="count">Number of groups</option></select>
        <input type="number" min={1} max={20} value={n} onChange={(e) => setN(+e.target.value)} style={{ width: 70 }} aria-label="How many" />
        <button className="btn primary" onClick={make} disabled={!cls.students.length}>Shuffle</button>
      </div>
      <div className="groups">{groups.map((g, i) => <div key={i} className="group"><strong>Group {i + 1}</strong><ul>{g.map((s) => <li key={s.id}>{s.name}</li>)}</ul></div>)}</div>
    </div>
  );
}

/** A big countdown with presets, a stopwatch mode and a chime. */
export function Timer() {
  const [secs, setSecs] = useState(300);
  const [left, setLeft] = useState(300);
  const [on, setOn] = useState(false);
  const [up, setUp] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const chime = () => { try { ctx.current ??= new AudioContext(); const o = ctx.current.createOscillator(), g = ctx.current.createGain(); o.frequency.value = 660; g.gain.setValueAtTime(.3, ctx.current.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.current.currentTime + 1.2); o.connect(g).connect(ctx.current.destination); o.start(); o.stop(ctx.current.currentTime + 1.2); } catch { /* no audio */ } };
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setLeft((x) => { if (up) return x + 1; if (x <= 1) { setOn(false); chime(); return 0; } return x - 1; }), 1000);
    return () => clearInterval(id);
  }, [on, up]);
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <div className="tool-card">
      <h3>Timer</h3>
      <div className="big-clock" role="timer">{mm}</div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {[1, 2, 5, 10, 15, 20].map((m) => <button key={m} className="btn small" onClick={() => { setUp(false); setSecs(m * 60); setLeft(m * 60); setOn(false); }}>{m} min</button>)}
        <button className="btn small" aria-pressed={up} onClick={() => { setUp(!up); setLeft(0); setOn(false); }}>Stopwatch</button>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 8 }}><button className="btn primary" onClick={() => setOn(!on)}>{on ? 'Pause' : 'Start'}</button><button className="btn" onClick={() => { setLeft(up ? 0 : secs); setOn(false); }}>Reset</button></div>
    </div>
  );
}

/** Make a printable test with an answer key from the question bank. */
export function TestMaker() {
  const [grades, setGrades] = useState<GradeMeta[]>([]);
  const [gid, setGid] = useState('5');
  const [g, setG] = useState<GradeData | null>(null);
  const [units, setUnits] = useState<number[]>([]);
  const [count, setCount] = useState(15);
  const [diff, setDiff] = useState<Difficulty>('mixed');
  const [types, setTypes] = useState<string[]>(['mc', 'tf', 'multi', 'text']);
  const [test, setTest] = useState<BankQuestion[] | null>(null);
  const [title, setTitle] = useState('Quiz');
  useEffect(() => { void getGrades().then(setGrades); }, []);
  useEffect(() => { void getGrade(gid).then((x) => { setG(x ?? null); setUnits([]); }); }, [gid]);
  const make = async () => {
    if (!g) return;
    const lessons = g.units.filter((u) => !units.length || units.includes(u.n)).flatMap((u) => u.lessons);
    const all = (await questionsFor(g, lessons)).filter((q) => types.includes(q.type));
    setTest(pick(all, count, diff));
    setTitle(units.length ? `${gradeLabel(gid)}: ${g.units.filter((u) => units.includes(u.n)).map((u) => u.title).join(', ')}` : `${gradeLabel(gid)} review`);
  };
  const LETTERS = 'ABCDEF';
  return (
    <div className="tool-card">
      <h3>Make a printable test</h3>
      <div className="row no-print" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
        <label>Grade<select value={gid} onChange={(e) => setGid(e.target.value)}>{grades.map((x) => <option key={x.id} value={x.id}>{gradeLabel(x.id)}</option>)}</select></label>
        <label>Questions<select value={count} onChange={(e) => setCount(+e.target.value)}>{[10, 15, 20, 25, 30, 40].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Difficulty<select value={diff} onChange={(e) => setDiff(e.target.value as Difficulty)}><option value="easy">Easier</option><option value="mixed">Mixed</option><option value="hard">Harder</option></select></label>
        <button className="btn primary" onClick={make} disabled={!g}>Make the test</button>
      </div>
      {g && <Fold id="testmaker:units" title={`Units to cover (${units.length || 'all'})`}><div className="chips">{g.units.map((u) => <label key={u.n} className="chip"><input type="checkbox" checked={units.includes(u.n)} onChange={() => setUnits(units.includes(u.n) ? units.filter((x) => x !== u.n) : [...units, u.n])} /> {u.n}. {u.title}</label>)}</div>
        <div className="chips" style={{ marginTop: 8 }}>{[['mc', 'Multiple choice'], ['tf', 'True or false'], ['multi', 'Select all'], ['text', 'Fill in the blank']].map(([k, l]) => <label key={k} className="chip"><input type="checkbox" checked={types.includes(k)} onChange={() => setTypes(types.includes(k) ? types.filter((x) => x !== k) : [...types, k])} /> {l}</label>)}</div></Fold>}
      {test && (
        <div className="test-sheet">
          <div className="row no-print" style={{ gap: 8 }}><button className="btn primary" onClick={() => window.print()}>Print the test and answer key</button><button className="btn" onClick={make}>Different questions</button></div>
          <section className="test-page">
            <h2>{title}</h2><p>Name: ______________________ Date: __________ Score: ______ / {test.length}</p>
            <ol>{test.map((q, i) => <li key={i}><p>{q.q}</p>{q.type === 'text' ? <p>Answer: ______________________</p> : <ol type="A" className="test-opts">{q.options!.map((o, k) => <li key={k}>{o}</li>)}</ol>}{q.type === 'multi' && <p className="small">(Choose all that apply.)</p>}</li>)}</ol>
          </section>
          <section className="test-page key"><h2>Answer key: {title}</h2><ol>{test.map((q, i) => <li key={i}><strong>{q.type === 'text' ? (q.correct as string[]).join(' or ') : (q.correct as number[]).map((c) => LETTERS[c]).join(', ')}</strong> {q.why ? <span className="muted small"> {q.why}</span> : null}</li>)}</ol></section>
        </div>
      )}
    </div>
  );
}

/** What was taught when: pick a lesson for a day, see the week, tick it off. */
export function Planner({ cls, work }: { cls: ClassDoc; work: Work }) {
  const plans = work.filter((w): w is Extract<ClassWork, { kind: 'plan' }> => w.kind === 'plan').sort((a, b) => a.date.localeCompare(b.date));
  const [grades, setGrades] = useState<GradeMeta[]>([]);
  const [gid, setGid] = useState(cls.grade?.match(/\d+|K|YA/i)?.[0]?.toUpperCase() ?? '5');
  const [g, setG] = useState<GradeData | null>(null);
  const [lid, setLid] = useState('');
  const [date, setDate] = useState(today());
  useEffect(() => { void getGrades().then(setGrades); }, []);
  useEffect(() => { void getGrade(gid).then((x) => { setG(x ?? null); setLid(x ? flatLessons(x)[0]?.id ?? '' : ''); }); }, [gid]);
  const flat = useMemo(() => (g ? flatLessons(g) : []), [g]);
  // the next lesson not yet planned, as a suggestion
  const planned = new Set(plans.filter((p) => p.gradeId === gid).map((p) => p.lessonId));
  const next = flat.find((l) => !planned.has(l.id));
  const add = async () => { const l = flat.find((x) => x.id === lid); if (!l) return; await db.classwork.put({ id: uid(), classId: cls.id, kind: 'plan', date, gradeId: gid, lessonId: lid, title: l.title }); };
  const upcoming = plans.filter((p) => p.date >= today() && !p.done), past = plans.filter((p) => p.date < today() || p.done).reverse();
  return (
    <div className="tool-card">
      <h3>Lesson plans</h3>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
        <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label>Grade<select value={gid} onChange={(e) => setGid(e.target.value)}>{grades.map((x) => <option key={x.id} value={x.id}>{gradeLabel(x.id)}</option>)}</select></label>
        <label>Lesson<select value={lid} onChange={(e) => setLid(e.target.value)} style={{ maxWidth: 260 }}>{flat.map((l) => <option key={l.id} value={l.id}>{l.unit.n}. {l.title}</option>)}</select></label>
        <button className="btn primary" onClick={add}>Add to the calendar</button>
        {next && next.id !== lid && <button className="btn small" onClick={() => setLid(next.id)}>Next unplanned: {next.title}</button>}
      </div>
      <h4>Coming up</h4>
      {upcoming.length === 0 && <p className="muted small">Nothing planned yet.</p>}
      <ul className="list">{upcoming.map((p) => <li key={p.id} className="row between"><span><strong>{new Date(p.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong> · <Link to={`/study/curriculum/${p.gradeId}/${p.lessonId}`}>{p.title}</Link></span><span><button className="btn small" onClick={() => db.classwork.put({ ...p, done: true })}>Taught ✓</button> <button className="btn small ghost" onClick={() => db.classwork.delete(p.id)}>Remove</button></span></li>)}</ul>
      {past.length > 0 && <Fold id="planner:past" title={`Taught or past (${past.length})`}><ul className="list">{past.map((p) => <li key={p.id} className="row between"><span>{p.date} · <Link to={`/study/curriculum/${p.gradeId}/${p.lessonId}`}>{p.title}</Link>{p.done ? ' ✓' : ''}</span><button className="btn small ghost" onClick={() => db.classwork.delete(p.id)}>Remove</button></li>)}</ul></Fold>}
    </div>
  );
}

/** A private log for each student: notes, praise, concerns, accommodations, contacts with families. */
export function StudentLog({ cls, work }: { cls: ClassDoc; work: Work }) {
  const logs = work.filter((w): w is Extract<ClassWork, { kind: 'log' }> => w.kind === 'log');
  const [who, setWho] = useState(cls.students[0]?.id ?? '');
  const [type, setType] = useState<'note' | 'praise' | 'concern' | 'accommodation' | 'contact'>('note');
  const [text, setText] = useState('');
  const mine = logs.filter((l) => l.studentId === who).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="tool-card">
      <h3>Student notes</h3>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Student">{cls.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value as 'note')} aria-label="Kind of note"><option value="note">Note</option><option value="praise">Praise</option><option value="concern">Concern</option><option value="accommodation">Accommodation</option><option value="contact">Contact with family</option></select>
      </div>
      <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened?" aria-label="Note" style={{ width: '100%', margin: '6px 0' }} />
      <button className="btn primary small" disabled={!text.trim() || !who} onClick={async () => { await db.classwork.put({ id: uid(), classId: cls.id, kind: 'log', date: today(), studentId: who, type, text: text.trim() }); setText(''); }}>Save the note</button>
      <ul className="list">{mine.map((l) => <li key={l.id} className="row between"><span><span className="chip">{l.type}</span> <span className="muted small">{l.date}</span> {l.text}</span><button className="btn small ghost" onClick={() => db.classwork.delete(l.id)}>Delete</button></li>)}</ul>
      <p className="muted small">Notes stay in your class record. Do not put anything here you would not want a parent to read.</p>
    </div>
  );
}

/** Score a piece of work against a rubric, criterion by criterion; the total goes into the gradebook. */
export function Rubrics({ cls, work }: { cls: ClassDoc; work: Work }) {
  const rubrics = work.filter((w): w is Extract<ClassWork, { kind: 'rubric' }> => w.kind === 'rubric');
  const asm = work.filter((w): w is Extract<ClassWork, { kind: 'assessment' }> => w.kind === 'assessment' && w.type === 'manual');
  const [rid, setRid] = useState('');
  const [aid, setAid] = useState('');
  const [picks, setPicks] = useState<Record<string, Record<number, number>>>({});
  const r = rubrics.find((x) => x.id === rid);
  const a = asm.find((x) => x.id === aid);
  const addDefault = async () => { await db.classwork.put({ id: uid(), classId: cls.id, kind: 'rubric', date: today(), title: 'Project rubric', criteria: ['Understanding of the teaching', 'Use of Scripture and the Catechism', 'Clarity and organization', 'Effort and creativity'].map((name) => ({ name, levels: [{ label: 'Excellent', points: 4 }, { label: 'Good', points: 3 }, { label: 'Developing', points: 2 }, { label: 'Beginning', points: 1 }] })) }); };
  const total = (sid: string) => Object.values(picks[sid] ?? {}).reduce((x, y) => x + y, 0);
  const max = r ? r.criteria.reduce((x, c) => x + Math.max(...c.levels.map((l) => l.points)), 0) : 0;
  return (
    <div className="tool-card">
      <h3>Rubrics</h3>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <select value={rid} onChange={(e) => setRid(e.target.value)} aria-label="Rubric"><option value="">Choose a rubric…</option>{rubrics.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
        <button className="btn small" onClick={addDefault}>+ New rubric</button>
        <select value={aid} onChange={(e) => setAid(e.target.value)} aria-label="Assignment"><option value="">Score for which assignment…</option>{asm.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
      </div>
      {r && (
        <>
          <input value={r.title} aria-label="Rubric title" onChange={(e) => db.classwork.put({ ...r, title: e.target.value })} style={{ margin: '8px 0', width: '100%' }} />
          <div className="grid-scroll"><table className="grid-table"><thead><tr><th>Criteria</th>{r.criteria[0].levels.map((l) => <th key={l.label}>{l.label} ({l.points})</th>)}</tr></thead><tbody>{r.criteria.map((c, i) => <tr key={i}><th scope="row"><input value={c.name} aria-label={`Criterion ${i + 1}`} onChange={(e) => db.classwork.put({ ...r, criteria: r.criteria.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} /></th>{c.levels.map((l) => <td key={l.label} className="muted small">{l.points} pts</td>)}</tr>)}</tbody></table></div>
          {a ? (
            <>
              <h4>Score {a.title} <span className="muted small">out of {max}, saved as {a.points} points</span></h4>
              {cls.students.map((s) => (
                <div key={s.id} className="rubric-row"><strong>{s.name}</strong>{r.criteria.map((c, i) => <select key={i} aria-label={`${s.name}: ${c.name}`} value={picks[s.id]?.[i] ?? ''} onChange={(e) => setPicks({ ...picks, [s.id]: { ...(picks[s.id] ?? {}), [i]: +e.target.value } })}><option value="">{c.name.slice(0, 18)}</option>{c.levels.map((l) => <option key={l.label} value={l.points}>{l.label}</option>)}</select>)}<span>{total(s.id)}/{max}</span><button className="btn small" onClick={() => db.classwork.put({ ...a, scores: { ...a.scores, [s.id]: Math.round((total(s.id) / max) * a.points * 10) / 10 }, edited: [...new Set([...(a.edited ?? []), s.id])] })}>Save</button></div>
              ))}
            </>
          ) : <p className="muted small">Pick an assignment (add one in the Gradebook) to score students with this rubric.</p>}
        </>
      )}
    </div>
  );
}

export function Toolkit({ cls, work }: { cls: ClassDoc; work: Work }) {
  return (
    <div className="toolkit">
      <div className="tool-grid"><Picker cls={cls} /><Groups cls={cls} /><Timer /></div>
      <Planner cls={cls} work={work} />
      <TestMaker />
      <Rubrics cls={cls} work={work} />
      <StudentLog cls={cls} work={work} />
    </div>
  );
}
