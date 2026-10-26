import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getGrades, gradeLabel, type GradeMeta } from '../curriculum/model';
import Fold from '../components/Fold';
import { Group, HubHeader, Tiles } from '../components/Hub';
import { useSettings, updateSettings } from '../lib/store';
import LessonOfDay from '../components/LessonOfDay';

/** Learn: everything that teaches the faith. The Catechism program comes first, then the Catechism itself and the questions people ask. */
export default function LearnPage() {
  const [grades, setGrades] = useState<GradeMeta[]>([]);
  const [st] = useSettings();
  useEffect(() => { getGrades().then(setGrades); }, []);
  const prog = useLiveQuery(() => db.planProgress.where('planId').startsWith('cur:').toArray(), []) ?? [];
  const mine = prog.filter((p) => p.done.length > 0 && grades.some((g) => g.id === p.planId.slice(4))).sort((a, b) => b.done.length - a.done.length)[0];
  const mineGrade = mine ? grades.find((g) => g.id === mine.planId.slice(4)) : undefined;
  const teach = st.interests.includes('teach'), family = st.interests.includes('family');
  const adult = st.audience === 'adult' || (!st.audience && !teach && !family);
  const adultDone = prog.find((p) => p.planId === 'cur:YA')?.done.length ?? 0;
  return (
    <div className="page hub">
      <HubHeader title="Learn" sub="The Catholic faith, taught step by step." />
      {adult && <LessonOfDay />}
      {!st.audience && (
        <Group title="Who is this for?" hint="Shows the right lessons first. You can change it in Settings.">
          <div className="level-chips" role="group" aria-label="Audience">
            {([['adult', 'Me, an adult'], ['youth', 'A student'], ['parent', 'My children'], ['teacher', 'My class']] as const).map(([id, t]) => <button key={id} className="chip" onClick={() => updateSettings({ audience: id })}>{t}</button>)}
          </div>
        </Group>
      )}
      {adult && (
        <Group title="Adult course" hint="Thirty-six sessions in twelve units, for one person or a small group">
          <Link className="btn primary" to="/study/curriculum/YA">{adultDone ? `Continue · ${adultDone} done` : 'Start the adult course'}</Link>
        </Group>
      )}
      {adult ? (
        <Fold id="learn:grades" title="Lessons by grade" hint="Kindergarten to Grade 12, for students, families and teachers">
        <>
        {!mineGrade && <Link className="btn primary" to="/study/curriculum">Open the program</Link>}
        {mineGrade && <Link className="btn" to={`/study/curriculum/${mineGrade.id}`}>Continue {gradeLabel(mineGrade.id)} · {mine!.done.length} of {mineGrade.lessons}</Link>}
        <div className="level-chips" role="group" aria-label="Levels">{grades.map((g) => <Link key={g.id} className="chip" to={`/study/curriculum/${g.id}`} title={`${g.name}: ${g.lessons} lessons`}>{g.id === 'K' ? 'K' : g.id === 'YA' ? 'Adults' : g.id}</Link>)}</div>
      </>
        </Fold>
      ) : (
      <Group title="Catechism program" hint="396 lessons: Kindergarten to Grade 12, and adults">
        {!mineGrade && <Link className="btn primary" to="/study/curriculum">Open the program</Link>}
        {mineGrade && <Link className="btn" to={`/study/curriculum/${mineGrade.id}`}>Continue {gradeLabel(mineGrade.id)} · {mine!.done.length} of {mineGrade.lessons}</Link>}
        <div className="level-chips" role="group" aria-label="Levels">{grades.map((g) => <Link key={g.id} className="chip" to={`/study/curriculum/${g.id}`} title={`${g.name}: ${g.lessons} lessons`}>{g.id === 'K' ? 'K' : g.id === 'YA' ? 'Adults' : g.id}</Link>)}</div>
      </Group>
      )}
      {(teach || family) && (
        <Group title={teach ? 'For teaching' : 'For your family'}>
          <Tiles ids={teach ? ['teach.classes', 'teach.run', 'teach.handbook', 'teach.join'] : ['study.kids', 'pray.rosary', 'study.prepare']} />
        </Group>
      )}
      <Fold id="learn:more-courses" title="More courses" hint="Guided lessons, in order">
        <Tiles ids={['study.ya', 'study.prepare', 'study.kids', 'study.course']} />
      </Fold>
      <Fold id="learn:catechism" title="The Catechism and doctrine" hint="What the Church teaches, and where it says so">
        <Tiles ids={['read.catechism', 'study.doctrine', 'study.visual', 'learn.mass']} />
      </Fold>
      <Fold id="learn:questions" title="Questions and journeys">
        <Tiles ids={['study.apologetics', 'study.paths', 'study.story']} />
      </Fold>
      {!(teach) && <p className="hub-hint">Teaching a class? <Link to="/teach">Teacher tools</Link> · <Link to="/study/curriculum/teachers">Teacher handbook</Link> · <Link to="/join">Join a class</Link></p>}
    </div>
  );
}
