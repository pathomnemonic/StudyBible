import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { flatLessons, getGlossary, getGrade, gradeLabel, parseQuiz, vocabQuiz, type GradeData, type Glossary } from './model';
import { worksheetBody } from './worksheet';

/** The print route for a lesson worksheet: /print/worksheet/<grade>~<lesson>. Student copy by default; ?key=1 is the teacher copy with the answers. */
export default function WorksheetSheet({ id = '' }: { id?: string }) {
  const [grade, lessonId] = id.split('~');
  const [sp] = useSearchParams();
  const key = sp.get('key') === '1';
  const [g, setG] = useState<GradeData | null | undefined>(undefined);
  const [gl, setGl] = useState<Glossary>({});
  useEffect(() => { if (grade) { void getGrade(grade).then((x) => setG(x ?? null)); void getGlossary().then(setGl); } else setG(null); }, [grade]);
  const flat = useMemo(() => (g ? flatLessons(g) : []), [g]);
  const lesson = flat.find((l) => l.id === lessonId);
  const html = useMemo(() => {
    if (!g || !lesson) return '';
    const pool = [...new Set(flat.flatMap((l) => l.vocab))];
    const quiz = lesson.quiz?.length ? lesson.quiz.map(parseQuiz) : vocabQuiz(lesson, gl, pool, 3);
    return worksheetBody(lesson, { grade: gradeLabel(g.id), quiz, key });
  }, [g, lesson, flat, gl, key]);
  if (g === undefined) return <div className="page"><p className="muted" role="status">Loading the worksheet…</p></div>;
  if (!g || !lesson) return <div className="page" data-state="not-found"><p>That worksheet could not be found. <Link to="/study/curriculum">Back to the curriculum</Link></p></div>;
  const other = `/print/worksheet/${id}${key ? '' : '?key=1'}`;
  return (
    <div className="page print-page">
      <div className="no-print row" style={{ gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn primary" onClick={() => window.print()}>Print or save as PDF</button>
        <Link className="btn" to={other}>{key ? 'Show the student copy' : 'Show the teacher copy with answers'}</Link>
        <Link className="btn ghost" to={`/study/curriculum/${g.id}/${lesson.id}`}>Back to the lesson</Link>
      </div>
      <p className="no-print muted small" role="status">{key ? 'Teacher copy: the right answers are marked.' : 'Student copy: no answers on the page.'}</p>
      <article className="print-sheet wk" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
