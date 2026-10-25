import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReadingBlock from '../../components/ReadingBlock';
import { COURSE } from '../../data/course';
import { convertRef } from '../../lib/versification';
import { parseRefs, type Ref } from '../../lib/refs';

const KEY = 'sb:course';
type Prog = Record<string, number>;
const load = (): Prog => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; } };
const save = (p: Prog) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable */ } };
const toRefs = (s: string): Ref[] => {
  const p = parseRefs(s);
  return p.ok ? p.refs.map((x) => convertRef('kjv', 'vulgate', x.ref).ref) : [];
};

export default function CoursePage() {
  const { id } = useParams();
  const [prog, setProg] = useState(load);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const idx = COURSE.findIndex((l) => l.id === id);
  const lesson = COURSE[idx];
  const refs = useMemo(() => (lesson ? lesson.refs.split(';').flatMap((r) => toRefs(r)) : []), [lesson]);
  if (!lesson) {
    return (
      <div className="page">
        <p><Link to="/study">← Study</Link></p>
        <h1>Salvation history in twelve lessons</h1>
        <p className="lede">Follow the story of the Bible in order, from creation to the new creation. Each lesson has a short reading and three questions. Scores stay on this device.</p>
        <ol className="list">
          {COURSE.map((l, i) => (
            <li key={l.id}><Link to={`/study/course/${l.id}`}><strong>{i + 1}. {l.title}</strong></Link> <span className="muted small">— {l.era}</span>{prog[l.id] != null && <span className="chip" style={{ marginLeft: 6 }}>{prog[l.id]}/3</span>}</li>
          ))}
        </ol>
      </div>
    );
  }
  const score = lesson.quiz.reduce((n, q, i) => n + (picked[i] === q.answer ? 1 : 0), 0);
  const check = () => { setChecked(true); const next = { ...prog, [lesson.id]: Math.max(prog[lesson.id] ?? 0, score) }; setProg(next); save(next); };
  const next = COURSE[idx + 1];
  return (
    <div className="page">
      <p><Link to="/study/course">← Course</Link></p>
      <h1>{idx + 1}. {lesson.title}</h1>
      <p className="muted small">{lesson.era}</p>
      <p>{lesson.intro}</p>
      {lesson.refs.split(';').map((r, i) => <ReadingBlock key={r} refs={toRefs(r)} label={i === 0 ? 'Read' : 'Then'} text={r.trim()} max={14} />)}
      <h2>Check yourself</h2>
      {lesson.quiz.map((q, i) => (
        <fieldset key={i} className="card" style={{ border: 'none' }}>
          <legend><strong>{i + 1}. {q.q}</strong></legend>
          {q.options.map((o, j) => (
            <label key={j} style={{ display: 'block', margin: '4px 0' }}>
              <input type="radio" name={`q${i}`} checked={picked[i] === j} disabled={checked} onChange={() => setPicked({ ...picked, [i]: j })} /> {o}
              {checked && j === q.answer && <span aria-label="correct"> ✓</span>}
            </label>
          ))}
          {checked && <p className="muted small">{picked[i] === q.answer ? 'Right. ' : 'Not quite. '}{q.why}</p>}
        </fieldset>
      ))}
      {!checked
        ? <button className="btn primary" disabled={Object.keys(picked).length < lesson.quiz.length} onClick={check}>Check answers</button>
        : <p aria-live="polite"><strong>{score} of {lesson.quiz.length}.</strong> {next ? <Link className="btn primary" to={`/study/course/${next.id}`} onClick={() => { setPicked({}); setChecked(false); }}>Next lesson</Link> : 'You have reached the end of the story.'}</p>}
      <p className="muted small">Questions are written for this app; the answers are checked against the passages.</p>
    </div>
  );
}
