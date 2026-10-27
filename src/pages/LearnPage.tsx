import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getGrades, gradeLabel, type GradeMeta } from '../curriculum/model';
import Fold from '../components/Fold';
import { Group, HubHeader, RowLink, Tiles } from '../components/Hub';
import { useSettings, updateSettings } from '../lib/store';
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
  return (
    <div className="page hub">
      <HubHeader quiet title="Learn" />
      {adult && <LessonOfDay />}
      {!st.audience && (
        <div className="level-chips" role="group" aria-label="Who is this for?">
          {([['adult', 'Me, an adult'], ['youth', 'A student'], ['parent', 'My children'], ['teacher', 'My class']] as const).map(([id, t]) => <button key={id} className="chip" onClick={() => updateSettings({ audience: id })}>{t}</button>)}
        </div>
      )}
      <div className="rows">
        {adult
          ? <RowLink strong to="/study/curriculum/YA" title="Catechism course" meta={adultDone ? `${adultDone} of 48` : '48 sessions'} />
          : <RowLink strong to={mineGrade ? `/study/curriculum/${mineGrade.id}` : '/study/curriculum'} title="Catechism course" meta={mineGrade ? `${gradeLabel(mineGrade.id)} · ${mine!.done.length}/${mineGrade.lessons}` : 'K–12 and adults'} />}
        <RowLink to="/study/catechism" title="Catechism of the Catholic Church" />
        <RowLink to="/study/doctrine" title="Doctrine by topic" />
        <RowLink to="/study/apologetics" title="Apologetics" />
        <form className="rowform" onSubmit={(e) => { e.preventDefault(); const n = parseInt(num, 10); if (n >= 1 && n <= 2865) nav(`/study/catechism/${n}`); }}>
          <label className="sr-only" htmlFor="ccc-n">Catechism paragraph number</label>
          <input id="ccc-n" type="number" inputMode="numeric" min={1} max={2865} placeholder="Go to Catechism §" value={num} onChange={(e) => setNum(e.target.value)} />
          <button className="btn" type="submit" disabled={!(parseInt(num, 10) >= 1)}>Go</button>
        </form>
      </div>
      {(teach || family) && (
        <Group open title={teach ? 'Teaching' : 'Family'}>
          <Tiles ids={teach ? ['teach.classes', 'teach.run', 'teach.handbook', 'teach.join'] : ['study.kids', 'pray.rosary', 'study.prepare']} />
        </Group>
      )}
      <Fold id="learn:more" title="More">
        <Tiles ids={['study.visual', 'learn.mass', 'study.ya', 'study.prepare', 'study.kids', 'study.course', 'study.paths', 'study.story', ...(teach ? [] : ['teach.classes', 'teach.handbook', 'teach.join'])]} />
        <p className="rows-sub">Lessons by grade</p>
        {levels}
      </Fold>
    </div>
  );
}
