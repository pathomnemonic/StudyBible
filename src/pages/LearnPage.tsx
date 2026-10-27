import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getGrades, gradeLabel, type GradeMeta } from '../curriculum/model';
import Fold from '../components/Fold';
import { Group, HubHeader, Tiles } from '../components/Hub';
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
        <Group title="Who is this for?" hint="Shows the right lessons first. You can change it in Settings.">
          <div className="level-chips" role="group" aria-label="Audience">
            {([['adult', 'Me, an adult'], ['youth', 'A student'], ['parent', 'My children'], ['teacher', 'My class']] as const).map(([id, t]) => <button key={id} className="chip" onClick={() => updateSettings({ audience: id })}>{t}</button>)}
          </div>
        </Group>
      )}

      <section className="feat" aria-label="Catechism course">
        <div className="feat-t">{adult ? 'Adult catechism course' : 'Catechism course'}</div>
        <p className="feat-d">{adult ? `Forty-eight sessions in sixteen units${adultDone ? ` · ${adultDone} done` : ''}, for one person or a small group.` : '408 lessons from Kindergarten to Grade 12, and adults.'}</p>
        <div className="feat-acts">
          {adult
            ? <Link className="btn primary" to="/study/curriculum/YA">{adultDone ? 'Continue the course' : 'Start the course'}</Link>
            : mineGrade
              ? <Link className="btn primary" to={`/study/curriculum/${mineGrade.id}`}>Continue {gradeLabel(mineGrade.id)} · {mine!.done.length} of {mineGrade.lessons}</Link>
              : <Link className="btn primary" to="/study/curriculum">Open the course</Link>}
        </div>
        {!adult && levels}
      </section>

      <section className="feat" aria-label="The Catechism of the Catholic Church">
        <div className="feat-t">Catechism of the Catholic Church</div>
        <p className="feat-d">The full text, and doctrine by topic.</p>
        <form className="ccc-jump" onSubmit={(e) => { e.preventDefault(); const n = parseInt(num, 10); if (n >= 1 && n <= 2865) nav(`/study/catechism/${n}`); }}>
          <Link className="btn primary" to="/study/catechism">Read the Catechism</Link>
          <Link className="btn" to="/study/doctrine">Doctrine by topic</Link>
          <label className="ccc-num"><span className="sr-only">Catechism paragraph number</span>
            <input type="number" inputMode="numeric" min={1} max={2865} placeholder="Go to § (1–2865)" value={num} onChange={(e) => setNum(e.target.value)} />
          </label>
        </form>
      </section>

      {adult && (
        <Link className="feat feat-link" to="/study/apologetics">
          <span className="feat-t">Apologetics hub</span>
          <span className="feat-go" aria-hidden="true">›</span>
        </Link>
      )}

      {(teach || family) && (
        <Group title={teach ? 'For teaching' : 'For your family'}>
          <Tiles ids={teach ? ['teach.classes', 'teach.run', 'teach.handbook', 'teach.join'] : ['study.kids', 'pray.rosary', 'study.prepare']} />
        </Group>
      )}

      {adult && (
        <Fold id="learn:grades" title="Lessons by grade" hint="Kindergarten to Grade 12">
          {!mineGrade && <Link className="btn" to="/study/curriculum">Open the program</Link>}
          {mineGrade && <Link className="btn" to={`/study/curriculum/${mineGrade.id}`}>Continue {gradeLabel(mineGrade.id)} · {mine!.done.length} of {mineGrade.lessons}</Link>}
          {levels}
        </Fold>
      )}
      <Fold id="learn:more" title="More ways to learn">
        <Tiles ids={[...(adult ? [] : ['study.apologetics']), 'study.visual', 'learn.mass', 'study.ya', 'study.prepare', 'study.kids', 'study.course', 'study.paths', 'study.story']} />
      </Fold>
      {!teach && (
        <Fold id="learn:teachers" title="For teachers and classes" hint="Teacher tools, the handbook, and joining a class">
          <Tiles ids={['teach.classes', 'teach.handbook', 'teach.run', 'teach.join']} />
        </Fold>
      )}
    </div>
  );
}
