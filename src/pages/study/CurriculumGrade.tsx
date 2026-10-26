import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getGrade, gradeLabel, progressId, type GradeData } from '../../curriculum/model';
import { starsOf, xpId } from '../../curriculum/LessonPlay';
import { bandOf } from '../../curriculum/pedagogy';
import { isKeyLesson, keyLessonsOf } from '../../curriculum/keyLessons';

export default function CurriculumGrade() {
  const { grade = '' } = useParams();
  const [g, setG] = useState<GradeData | null | undefined>(undefined);
  const [keyOnly, setKeyOnly] = useState(false);
  useEffect(() => { getGrade(grade).then((x) => setG(x ?? null)); }, [grade]);
  const prog = useLiveQuery(() => db.planProgress.get(progressId(grade)), [grade]);
  const stars = starsOf(useLiveQuery(() => db.planProgress.get(xpId(grade)), [grade])?.done);
  if (g === undefined) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!g) return <div className="page"><Link to="/study/curriculum">← Curriculum</Link><p>That grade was not found.</p></div>;
  const band = bandOf(g.band);
  const done = new Set(prog?.done ?? []);
  let k = -1;
  const total = g.units.reduce((n, u) => n + u.lessons.length, 0);
  const firstOpen = (() => { let i = 0; for (const u of g.units) for (const l of u.lessons) { if (!done.has(i)) return l.id; i++; } return g.units[0].lessons[0].id; })();
  const weeks = Math.ceil(total * 1.25);
  const keys = keyLessonsOf(g.id);
  const keyList = g.units.flatMap((u) => u.lessons).filter((l) => keys.includes(l.id));
  return (
    <div className="page">
      <Link to="/study/curriculum" className="small no-print">← All grades</Link>
      <h1>{gradeLabel(g.id)}: {g.theme}</h1>
      <p className="lede">Ages {g.age}. {total} lessons in {g.units.length} units, about {band.minutes} minutes each. One lesson a week with review and feast-day weeks fits a school year of about {weeks} weeks.</p>
      <div className="row no-print" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Link className="btn primary" to={`/study/curriculum/${g.id}/${firstOpen}`}>{done.size ? 'Continue' : 'Start the first lesson'}</Link>
        <Link className="btn" to={`/study/curriculum/${g.id}/packet`}>Print the whole grade</Link>
        <span className="muted small" style={{ alignSelf: 'center' }}>{done.size} of {total} done · ★ {[...stars.values()].reduce((a, b) => a + b, 0)} stars earned</span>
      </div>
      {keyList.length > 0 && (
        <section className="card key-lessons no-print" aria-label="Key lessons">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>★ Short on time? Start with the {keyList.length} key lessons</h2>
          <p className="muted small">The lessons that carry this grade’s core. Each is a complete lesson on its own.</p>
          <ol className="list">{keyList.map((l) => <li key={l.id}><Link className="t" to={`/study/curriculum/${g.id}/${l.id}`}>{l.title}</Link></li>)}</ol>
          <label className="row small"><input type="checkbox" checked={keyOnly} onChange={(e) => setKeyOnly(e.target.checked)} /> <span>Show only the key lessons in the list below</span></label>
        </section>
      )}
      {g.units.map((u) => (
        <section key={u.n} className="sect" hidden={keyOnly && !u.lessons.some((l) => isKeyLesson(g.id, l.id))}>
          <h2 className="eyebrow-h">Unit {u.n}: {u.title} <span className="muted">· {u.pillar}</span></h2>
          <p className="muted small">{u.eq}</p>
          <ol className="list" start={1}>
            {u.lessons.map((l) => { k++; return (
              <li key={l.id} hidden={keyOnly && !isKeyLesson(g.id, l.id)} style={{ display: keyOnly && !isKeyLesson(g.id, l.id) ? 'none' : 'flex', gap: 8, alignItems: 'baseline' }}>
                <span aria-hidden="true">{done.has(k) ? '✓' : '○'}</span>
                <span><Link className="t" to={`/study/curriculum/${g.id}/${l.id}`}>{l.title}</Link>{isKeyLesson(g.id, l.id) && <span className="key-badge" title="A key lesson"> ★ Key</span>}<span className="muted small"> · {l.scripture.split(';')[0]} · CCC {l.ccc.split(',')[0]}</span>{stars.get(k) ? <span className="lesson-stars" aria-label={`${stars.get(k)} stars`}> {'★'.repeat(stars.get(k)!)}{'☆'.repeat(3 - stars.get(k)!)}</span> : null}</span>
              </li>
            ); })}
          </ol>
        </section>
      ))}
      <p className="muted small">The pillars follow the Catechism: the Creed (what we believe), the sacraments and liturgy (how we celebrate), the moral life (how we live) and prayer (how we pray). Each grade returns to all four with more depth.</p>
    </div>
  );
}
