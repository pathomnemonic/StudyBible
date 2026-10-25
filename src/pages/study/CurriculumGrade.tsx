import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getGrade, gradeLabel, progressId, type GradeData } from '../../curriculum/model';
import { bandOf } from '../../curriculum/pedagogy';

export default function CurriculumGrade() {
  const { grade = '' } = useParams();
  const [g, setG] = useState<GradeData | null | undefined>(undefined);
  useEffect(() => { getGrade(grade).then((x) => setG(x ?? null)); }, [grade]);
  const prog = useLiveQuery(() => db.planProgress.get(progressId(grade)), [grade]);
  if (g === undefined) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!g) return <div className="page"><Link to="/study/curriculum">← Curriculum</Link><p>That grade was not found.</p></div>;
  const band = bandOf(g.band);
  const done = new Set(prog?.done ?? []);
  let k = -1;
  const total = g.units.reduce((n, u) => n + u.lessons.length, 0);
  const firstOpen = (() => { let i = 0; for (const u of g.units) for (const l of u.lessons) { if (!done.has(i)) return l.id; i++; } return g.units[0].lessons[0].id; })();
  const weeks = Math.ceil(total * 1.25);
  return (
    <div className="page">
      <Link to="/study/curriculum" className="small no-print">← All grades</Link>
      <h1>{gradeLabel(g.id)}: {g.theme}</h1>
      <p className="lede">Ages {g.age}. {total} lessons in {g.units.length} units, about {band.minutes} minutes each. One lesson a week with review and feast-day weeks fits a school year of about {weeks} weeks.</p>
      <div className="row no-print" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Link className="btn primary" to={`/study/curriculum/${g.id}/${firstOpen}`}>{done.size ? 'Continue' : 'Start the first lesson'}</Link>
        <Link className="btn" to={`/study/curriculum/${g.id}/packet`}>Print the whole grade</Link>
        <span className="muted small" style={{ alignSelf: 'center' }}>{done.size} of {total} done</span>
      </div>
      {g.units.map((u) => (
        <section key={u.n} className="sect">
          <h2 className="eyebrow-h">Unit {u.n}: {u.title} <span className="muted">· {u.pillar}</span></h2>
          <p className="muted small">{u.eq}</p>
          <ol className="list" start={1}>
            {u.lessons.map((l) => { k++; return (
              <li key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span aria-hidden="true">{done.has(k) ? '✓' : '○'}</span>
                <span><Link className="t" to={`/study/curriculum/${g.id}/${l.id}`}>{l.title}</Link><span className="muted small"> · {l.scripture.split(';')[0]} · CCC {l.ccc.split(',')[0]}</span></span>
              </li>
            ); })}
          </ol>
        </section>
      ))}
      <p className="muted small">The pillars follow the Catechism: the Creed (what we believe), the sacraments and liturgy (how we celebrate), the moral life (how we live) and prayer (how we pray). Each grade returns to all four with more depth.</p>
    </div>
  );
}
