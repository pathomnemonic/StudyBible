import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getGrade, getGlossary, gradeLabel, progressId, type Glossary, type GradeData } from '../../curriculum/model';
import { starsOf, xpId } from '../../curriculum/LessonPlay';
import { bandOf } from '../../curriculum/pedagogy';
import { gradeStats, depthLabel, timeLabel, hoursLabel } from '../../curriculum/lessonStats';
import ContinueLesson from '../../components/ContinueLesson';
import { isKeyLesson, isLifeLesson, keyLessonsOf } from '../../curriculum/keyLessons';

export default function CurriculumGrade() {
  const { grade = '' } = useParams();
  const [g, setG] = useState<GradeData | null | undefined>(undefined);
  const [keyOnly, setKeyOnly] = useState(false);
  const [gl, setGl] = useState<Glossary | null>(null);
  useEffect(() => { getGrade(grade).then((x) => setG(x ?? null)); getGlossary().then(setGl); }, [grade]);
  const stats = useMemo(() => (g && gl ? gradeStats(g, gl) : null), [g, gl]);
  const prog = useLiveQuery(() => db.planProgress.get(progressId(grade)), [grade]);
  const stars = starsOf(useLiveQuery(() => db.planProgress.get(xpId(grade)), [grade])?.done);
  if (g === undefined) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!g) return <div className="page" data-state="not-found"><Link to="/study/curriculum">← Curriculum</Link><p>That grade was not found.</p></div>;
  const band = bandOf(g.band);
  const done = new Set(prog?.done ?? []);
  let k = -1;
  const total = g.units.reduce((n, u) => n + u.lessons.length, 0);
  const firstOpen = (() => { let i = 0; for (const u of g.units) for (const l of u.lessons) { if (!done.has(i)) return l.id; i++; } return g.units[0].lessons[0].id; })();
  const weeks = Math.ceil(total * 1.25);
  const keys = keyLessonsOf(g.id);
  const keyList = g.units.flatMap((u) => u.lessons).filter((l) => keys.includes(l.id));
  const lifeList = g.units.flatMap((u) => u.lessons).filter((l) => isLifeLesson(l.id));
  const nextLesson = g.units.flatMap((u) => u.lessons).find((l) => l.id === firstOpen);
  const nextUnit = g.units.find((u) => u.lessons.some((l) => l.id === firstOpen)) ?? g.units[0];
  const pct = total ? Math.round((done.size / total) * 100) : 0;
  const starTotal = [...stars.values()].reduce((a, b) => a + b, 0);
  // lessons are numbered through the grade; remember where each unit starts so progress per unit is simple
  const unitStart = new Map<number, number>();
  { let i = 0; for (const u of g.units) { unitStart.set(u.n, i); i += u.lessons.length; } }
  return (
    <div className="page cg">
      <Link to="/study/curriculum" className="small no-print">← All grades</Link>
      <header className="cg-head">
        <h1>{gradeLabel(g.id)}</h1>
        <p className="cg-theme">{g.theme}</p>
        <p className="muted small">Ages {g.age} · {total} lessons in {g.units.length} units · about {band.minutes} minutes each</p>
      </header>

      <section className="cg-next card no-print" aria-label="Where you are">
        <div className="cg-ring" role="img" aria-label={`${pct} percent done`} style={{ ['--p' as any]: `${pct}%` }}><span>{pct}%</span></div>
        <div className="cg-next-body">
          <div className="eyebrow">{done.size ? 'Next lesson' : 'Start here'}</div>
          <div className="cg-next-title">{nextLesson?.title}</div>
          <div className="muted small">{done.size} of {total} done{starTotal ? ` · ★ ${starTotal}` : ''}</div>
          <Link className="btn primary" to={`/study/curriculum/${g.id}/${firstOpen}`}>{done.size ? 'Continue' : 'Start the first lesson'}</Link>
        </div>
      </section>
      <ContinueLesson grade={g.id} />

      {(lifeList.length > 0 || keyList.length > 0) && (
        <details className="cg-short no-print">
          <summary>Short on time? Start with the core lessons</summary>
          {lifeList.length > 0 && (<>
            <p className="rows-sub">★ Life lessons <span className="muted">· each stands alone</span></p>
            <ol className="cg-list">{lifeList.map((l) => <li key={l.id}><Link to={`/study/curriculum/${g.id}/${l.id}`}>{l.title}</Link></li>)}</ol>
          </>)}
          {keyList.length > 0 && (<>
            <p className="rows-sub">The {keyList.length} lessons no student should miss</p>
            <ol className="cg-list">{keyList.map((l) => <li key={l.id}><Link to={`/study/curriculum/${g.id}/${l.id}`}>{l.title}</Link></li>)}</ol>
            <label className="row small"><input type="checkbox" checked={keyOnly} onChange={(e) => setKeyOnly(e.target.checked)} /> <span>Show only these in the units below</span></label>
          </>)}
        </details>
      )}

      <h2 className="cg-units-h">Units</h2>
      {g.units.map((u) => {
        const start = unitStart.get(u.n) ?? 0;
        const doneHere = u.lessons.filter((_, i) => done.has(start + i)).length;
        const mins = stats ? u.lessons.reduce((n, l) => n + (stats.get(l.id)?.classMinutes ?? 0), 0) : 0;
        const hide = keyOnly && !u.lessons.some((l) => isKeyLesson(g.id, l.id));
        return (
          <details key={u.n} className={`cg-unit${doneHere === u.lessons.length ? ' complete' : ''}`} open={u.n === nextUnit.n} hidden={hide}>
            <summary>
              <span className="cg-unit-n" aria-hidden="true">{doneHere === u.lessons.length ? '✓' : u.n}</span>
              <span className="cg-unit-main">
                <span className="cg-unit-t">{u.title}</span>
                <span className="muted small">{u.pillar} · {doneHere} of {u.lessons.length} done{stats && mins ? ` · ${hoursLabel(mins)}` : ''}</span>
              </span>
            </summary>
            <p className="cg-eq muted small">{u.eq}</p>
            <ol className="cg-lessons">
              {u.lessons.map((l, i) => {
                const idx = start + i;
                const st = stats?.get(l.id);
                if (keyOnly && !isKeyLesson(g.id, l.id)) return null;
                return (
                  <li key={l.id} className={done.has(idx) ? 'done' : l.id === firstOpen ? 'next' : ''}>
                    <Link to={`/study/curriculum/${g.id}/${l.id}`}>
                      <span className="cg-dot" aria-hidden="true">{done.has(idx) ? '✓' : ''}</span>
                      <span className="cg-lt">
                        <span className="cg-lt-t">{l.title}{isLifeLesson(l.id) && <span className="key-badge"> ★ Life</span>}{isKeyLesson(g.id, l.id) && <span className="key-badge"> ★ Core</span>}</span>
                        <span className="muted small">{l.scripture.split(';')[0]}{st ? ` · ${timeLabel(st)}` : ''}{stars.get(idx) ? ` · ${'★'.repeat(stars.get(idx)!)}${'☆'.repeat(3 - stars.get(idx)!)}` : ''}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </details>
        );
      })}
      <div className="row no-print" style={{ gap: 8, flexWrap: 'wrap', margin: '16px 0 4px' }}>
        <Link className="btn" to={`/study/curriculum/${g.id}/packet`}>Print the whole grade</Link>
        <Link className="btn" to={`/study/curriculum/${g.id}/pacing`}>Pace it over the year</Link>
      </div>
      <details className="cg-about small muted"><summary>About the four pillars</summary>
        <p>The pillars follow the Catechism: the Creed (what we believe), the sacraments and liturgy (how we celebrate), the moral life (how we live) and prayer (how we pray). Each grade returns to all four with more depth.</p>
        <p>One lesson a week with review and feast-day weeks fits a school year of about {weeks} weeks.</p>
      </details>
    </div>
  );
}
