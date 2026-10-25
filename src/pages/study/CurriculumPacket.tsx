import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getGlossary, getGrade, gradeLabel, flatLessons, type Glossary, type GradeData } from '../../curriculum/model';

/** Every lesson of a grade on paper: the idea, words, Scripture reference, question, activity and a place to write. */
export default function CurriculumPacket() {
  const { grade = '' } = useParams();
  const [g, setG] = useState<GradeData | null | undefined>(undefined);
  const [gl, setGl] = useState<Glossary>({});
  useEffect(() => { getGrade(grade).then((x) => setG(x ?? null)); getGlossary().then(setGl); }, [grade]);
  if (g === undefined) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!g) return <div className="page"><p>That grade was not found.</p></div>;
  return (
    <div className="page cur-packet">
      <div className="no-print row" style={{ gap: 8, marginBottom: 10 }}>
        <Link to={`/study/curriculum/${g.id}`} className="small">← {gradeLabel(g.id)}</Link>
        <button className="btn primary" onClick={() => window.print()}>🖨 Print or save as PDF</button>
        <span className="muted small">Scripture and Catechism text are not printed here; open each lesson to print it with the text.</span>
      </div>
      <h1>{gradeLabel(g.id)}: {g.theme}</h1>
      {flatLessons(g).map((l, i) => (
        <article key={l.id} className="cur-sheet">
          <h2>{i + 1}. {l.title}</h2>
          <p className="muted small">{l.unit.title} · Scripture: {l.scripture.replace(/;/g, ', ')} · Catechism §{l.ccc}</p>
          <p><strong>Big idea.</strong> {l.idea}</p>
          {l.vocab.filter((v) => gl[v]).length > 0 && <p><strong>Words to know.</strong> {l.vocab.filter((v) => gl[v]).map((v) => `${gl[v].w} (${gl[v].d})`).join('; ')}</p>}
          <p><strong>Think and talk.</strong> {l.question}</p>
          <p><strong>Do.</strong> {l.activity}</p>
          <div className="cur-lines" aria-hidden="true" />
          <p className="muted small">Name: ____________________ &nbsp; Date: ____________</p>
        </article>
      ))}
    </div>
  );
}
