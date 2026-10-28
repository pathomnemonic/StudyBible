import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getGrades, gradeLabel, type GradeMeta } from '../curriculum/model';
import Fold from '../components/Fold';
import { HubHeader, RowLink, Tiles } from '../components/Hub';
import { useSettings } from '../lib/store';
import LessonOfDay from '../components/LessonOfDay';

/** Learn: the Catechism course first, then the Catechism itself, then everything else behind a fold. */
export default function LearnPage() {
  const [grades, setGrades] = useState<GradeMeta[]>([]);
  const nav = useNavigate();
  const [num, setNum] = useState('');
  const [st] = useSettings();
  useEffect(() => { getGrades().then(setGrades); }, []);
  const prog = useLiveQuery(() => db.planProgress.where('planId').startsWith('cur:').toArray(), []) ?? [];
  const mine = prog.filter((p) => p.done.length > 0 && grades.some((g) => g.id === p.planId.slice(4))).sort((a, b) => b.done.length - a.done.length)[0];
  const mineGrade = mine ? grades.find((g) => g.id === mine.planId.slice(4)) : undefined;
  const teach = st.interests.includes('teach'), family = st.interests.includes('family');
  const adult = st.audience === 'adult' || (!st.audience && !teach && !family);
  const adultDone = prog.find((p) => p.planId === 'cur:YA')?.done.length ?? 0;
  const levels = (
    <div className="level-chips" role="group" aria-label="Levels">{grades.map((g) => <Link key={g.id} className="chip" to={`/study/curriculum/${g.id}`} title={`${g.name}: ${g.lessons} lessons`}>{g.id === 'K' ? 'K' : g.id === 'YA' ? 'Adults' : g.id}</Link>)}</div>
  );
  const tall = typeof window !== 'undefined' && window.innerHeight >= 800;
  const studentTiles = <Tiles ids={['study.kids', 'study.course', 'study.paths', 'study.story', 'study.prepare', 'study.visual', 'learn.mass', 'learn.games']} />;
  const teacherTiles = <Tiles ids={['teach.classes', 'teach.run', 'teach.handbook', 'teach.join']} />;
  const studentCourse = (
    <RowLink strong to={mineGrade ? `/study/curriculum/${mineGrade.id}` : '/study/curriculum'} title="Student course" meta={mineGrade ? `${gradeLabel(mineGrade.id)} · ${mine!.done.length}/${mineGrade.lessons}` : 'K–12 · by grade'} />
  );
  return (
    <div className="page hub learn">
      <HubHeader quiet title="Learn" />
      <section className="card learn-card students" aria-labelledby="learn-stu">
        <h2 id="learn-stu" className="learn-h">Catechism for students<span>K–12 · lessons, teacher guides, slides and games</span></h2>
        <div className="rows">{studentCourse}</div>
        {levels}
        {tall ? (
          <>
            <Fold id="learn:students" title="For students and families" hint="Stories, paths and the Mass explained">{studentTiles}</Fold>
            <Fold rare id="learn:teachers" title="For teachers" hint="Classes, handbook and lessons in a tap">{teacherTiles}</Fold>
          </>
        ) : (
          <Fold rare id="learn:resources" title="Student and teacher resources" hint="Everything for the classroom and the home">
            <p className="rows-sub">For students and families</p>{studentTiles}
            <p className="rows-sub">For teachers</p>{teacherTiles}
          </Fold>
        )}
      </section>
      <section className="card learn-card adults" aria-labelledby="learn-adu">
        <h2 id="learn-adu" className="learn-h">Catechism for adults<span>The 48-session course and the Catechism itself</span></h2>
        {adult && <LessonOfDay />}
        <div className="rows">
          <RowLink strong to="/study/curriculum/YA" title="Adult course" meta={adultDone ? `${adultDone} of 48` : '48 sessions'} />
          <RowLink to="/study/catechism" title="Catechism of the Catholic Church" />
          <RowLink to="/study/doctrine" title="Doctrine by topic" />
          <RowLink to="/study/apologetics" title="Apologetics" />
          <form className="rowform" onSubmit={(e) => { e.preventDefault(); const t = num.trim(); if (/^§?\s*\d{1,4}$/.test(t)) { const n = parseInt(t.replace(/\D/g, ''), 10); if (n >= 1 && n <= 2865) nav(`/study/catechism/${n}`); } else if (t) nav(`/study/ask?q=${encodeURIComponent(t)}`); }}>
            <label className="sr-only" htmlFor="ccc-n">Ask a question, or go to a Catechism paragraph number</label>
            <input id="ccc-n" type="text" enterKeyHint="go" placeholder="Ask a question, or go to §" value={num} onChange={(e) => setNum(e.target.value)} />
            <button className="btn" type="submit" disabled={!num.trim()}>Go</button>
          </form>
        </div>
      </section>
    </div>
  );
}
