import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { featuresOf } from '../lib/features';
import { getGrades, gradeLabel, type GradeMeta } from '../curriculum/model';
import { NewDot, StartHere, Tip } from '../components/Hints';
import { useSettings } from '../lib/store';

const GROUPS: { title: string; blurb: string; ids: string[] }[] = [
  { title: 'Courses', blurb: 'Guided lessons, in order.', ids: ['study.curriculum', 'study.prepare', 'study.ya', 'study.kids', 'study.course'] },
  { title: 'The Catechism and doctrine', blurb: 'What the Church teaches, and where it says so.', ids: ['read.catechism', 'study.doctrine', 'study.visual', 'learn.mass'] },
  { title: 'Questions and journeys', blurb: 'Answers to hard questions and themes followed through Scripture.', ids: ['study.apologetics', 'study.paths', 'study.story'] },
];

/** Learn: everything that teaches the faith. The Catechism program for every age comes first, then the Catechism itself and the questions people ask. */
export default function LearnPage() {
  const all = featuresOf('learn');
  const [st] = useSettings();
  const teach = st.interests.includes('teach'), family = st.interests.includes('family');
  const [grades, setGrades] = useState<GradeMeta[]>([]);
  useEffect(() => { getGrades().then(setGrades); }, []);
  const prog = useLiveQuery(() => db.planProgress.where('planId').startsWith('cur:').toArray(), []) ?? [];
  const mine = prog.filter((p) => p.done.length > 0).map((p) => ({ id: p.planId.slice(4), n: p.done.length, meta: grades.find((g) => g.id === p.planId.slice(4)) })).filter((x) => x.meta);
  return (
    <div className="page learn">
      <h1>Learn</h1>
      <Tip id="learn" title="Learn the faith, step by step">Pick your level to start the Catechism program, or look up any teaching in the Catechism itself. Your place is remembered.</Tip>
      <p className="lede">The Catholic faith, taught: lessons for every age, the Catechism, and clear answers to the questions people ask.</p>
      {mine.length > 0 && (
        <section className="sect"><h2 className="eyebrow-h">Continue</h2>
          <div className="chips">{mine.map((m) => <Link key={m.id} className="chip" to={`/study/curriculum/${m.id}`}>{gradeLabel(m.id)} · {m.n} of {m.meta!.lessons} lessons</Link>)}</div></section>
      )}
      {(teach || family) && (
        <section className="card" aria-label="For you">
          <h2 className="eyebrow-h" style={{ marginTop: 0 }}>{teach ? 'For teaching' : 'For your family'}</h2>
          <div className="chips">
            {teach && <><Link className="chip" to="/teach">Teacher tools</Link><Link className="chip" to="/study/curriculum/teachers">Teacher handbook</Link><Link className="chip" to="/study/curriculum">Key lessons for every grade</Link></>}
            {family && <><Link className="chip" to="/study/kids">Children’s Bible</Link><Link className="chip" to="/study/curriculum/K">Kindergarten</Link><Link className="chip" to="/study/curriculum/1">Grade 1</Link><Link className="chip" to="/pray/devotions/rosary">Family rosary</Link></>}
          </div>
        </section>
      )}
      <section className="sect">
        <h2 className="eyebrow-h">Choose your level</h2>
        <div className="chips">{grades.map((g) => <Link key={g.id} className="chip" to={`/study/curriculum/${g.id}`} title={`${g.name}: ${g.lessons} lessons`}>{gradeLabel(g.id)}</Link>)}</div>
        <p className="muted small">Kindergarten to Grade 12, plus a course for adults. For classrooms, families and self-study.</p>
      </section>
      <StartHere hub="learn" />
      {GROUPS.map((g) => (
        <section key={g.title} className="tool-group">
          <h2>{g.title}</h2><p className="muted small">{g.blurb}</p>
          <ul>{g.ids.map((id) => all.find((f) => f.id === id)).filter((f): f is NonNullable<typeof f> => !!f).map((f) => (
            <li key={f.id}><Link to={f.to} data-seen={f.id}><span className="t">{f.title} <NewDot id={f.id} inline /></span><span className="d">{f.blurb}</span><span className="go" aria-hidden="true">→</span></Link></li>
          ))}</ul>
        </section>
      ))}
      <p className="small">Teaching a class? <Link to="/teach">Teacher tools</Link> · <Link to="/study/curriculum/teachers">Teacher handbook</Link> · <Link to="/join">Join a class</Link></p>
    </div>
  );
}
