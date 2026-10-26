import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getGrades, gradeLabel, type GradeMeta } from '../../curriculum/model';
import { BANDS, DELIVERY, PRINCIPLES } from '../../curriculum/pedagogy';

/** A kindergarten-through-twelfth-grade catechism program built from the Catechism, Scripture and the rest of the app’s library. */
export default function CurriculumHome() {
  const [grades, setGrades] = useState<GradeMeta[]>([]);
  useEffect(() => { getGrades().then(setGrades); }, []);
  const progress = useLiveQuery(() => db.planProgress.filter((p) => p.planId.startsWith('cur:')).toArray(), []) ?? [];
  const doneOf = (id: string) => progress.find((p) => p.planId === `cur:${id}`)?.done.length ?? 0;
  const total = grades.reduce((n, g) => n + g.lessons, 0);
  return (
    <div className="page">
      <h1>Catechism, Kindergarten to Grade 12</h1>
      <p className="lede">{total || 396} lessons across thirteen grades and a 36-session course for adults. Each one is built on the Catechism and Scripture, brings in the videos, art, prayers and readings already in this app, and can be taught in a classroom, at home, on your own, by listening, or on paper.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <Link className="btn primary" to="/study/curriculum/teachers">For teachers and parents: the handbook</Link>
        <Link className="btn" to="/teach">Teacher tools: classes and gradebook</Link>
        <Link className="btn" to="/join">Join a class with a code</Link>
        <a className="btn" href="#delivery">Ways to use it</a>
        <a className="btn" href="#why">Why it is built this way</a>
      </div>

      {BANDS.map((b) => (
        <section key={b.id} className="sect">
          <h2 className="eyebrow-h">{b.label} · {b.grades} · about {b.minutes} minutes a lesson</h2>
          <div className="shelf">
            {grades.filter((g) => g.band === b.id).map((g) => {
              const d = doneOf(g.id);
              return (
                <Link key={g.id} className="shelf-card" to={`/study/curriculum/${g.id}`}>
                  <span className="t">{gradeLabel(g.id)}</span>
                  <span className="d">{g.theme}</span>
                  <span className="d">Ages {g.age} · {g.lessons} lessons{d ? ` · ${d} done` : ''}</span>
                  {d > 0 && <span className="bar"><i style={{ width: `${Math.round((d / g.lessons) * 100)}%` }} /></span>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <section className="sect" id="delivery">
        <h2 className="eyebrow-h">Ways to use it</h2>
        <p className="muted small">The same lesson reaches people in several ways. Choose what fits your setting; you can switch at any time.</p>
        <dl className="cur-words">{DELIVERY.map((d) => <div key={d.id}><dt>{d.name}</dt><dd><span className="muted">{d.who}.</span> {d.how}</dd></div>)}</dl>
      </section>

      <section className="sect" id="why">
        <h2 className="eyebrow-h">What every lesson contains</h2>
        <ul>
          <li><strong>The big idea</strong> and an essential question, in language for the age.</li>
          <li><strong>Scripture</strong>, with a children’s retelling in the early grades, and <strong>the Catechism</strong> paragraphs it rests on.</li>
          <li><strong>Words to know</strong>, <strong>a question to talk about</strong>, <strong>an activity</strong>, <strong>a prayer</strong>, and <strong>a check</strong> with a review of earlier lessons.</li>
          <li><strong>Videos, paintings and readings</strong> from the library, matched to the Scripture.</li>
          <li>For teachers: a <strong>timed plan</strong>, background, ways to support and stretch, and a note for families.</li>
        </ul>
        <h3>The principles behind it</h3>
        <ul>{PRINCIPLES.map((p) => <li key={p.title}><strong>{p.title}.</strong> {p.why} <span className="muted">Here: {p.here}</span></li>)}</ul>
      </section>

      <div className="notice info">
        <strong>About this program.</strong> It follows the order and content of the Catechism of the Catholic Church, and cites the paragraphs so you can check every lesson. It was written for this app. It has not been reviewed or approved by a bishop and is not a replacement for a program your diocese requires. Most lessons are an outline with the app’s library attached; a teacher’s judgment and prayer make it a lesson.
      </div>
    </div>
  );
}
