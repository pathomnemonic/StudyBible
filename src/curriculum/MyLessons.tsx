import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gradeLabel } from './model';
import { isMarked, lessonMarks, primeSavedStep, resumeOf, toggleMark, unfinishedLessons, type LessonMark } from './resume';

/** A bookmark button for one lesson. */
export function BookmarkButton({ grade, lesson, title }: { grade: string; lesson: string; title: string }) {
  const [on, setOn] = useState(() => isMarked(grade, lesson));
  useEffect(() => { const h = () => setOn(isMarked(grade, lesson)); window.addEventListener('sb:cur:marks', h); return () => window.removeEventListener('sb:cur:marks', h); }, [grade, lesson]);
  return <button type="button" className="btn small" aria-pressed={on} onClick={() => setOn(toggleMark(grade, lesson, title))}>{on ? '★ In My lessons' : '☆ Add to My lessons'}</button>;
}

/** My lessons: lessons the learner bookmarked, and those begun and not finished, each with a Resume link. Kept on this device. */
export default function MyLessons() {
  const [marks, setMarks] = useState<LessonMark[]>(() => lessonMarks());
  useEffect(() => { const h = () => setMarks(lessonMarks()); window.addEventListener('sb:cur:marks', h); return () => window.removeEventListener('sb:cur:marks', h); }, []);
  const begun = unfinishedLessons();
  const marked = new Set(marks.map((m) => `${m.grade}/${m.lesson}`));
  const rows = [...marks.map((m) => ({ grade: m.grade, lesson: m.lesson, title: m.title })), ...begun.filter((b) => !marked.has(`${b.grade}/${b.lesson}`)).map((b) => ({ grade: b.grade, lesson: b.lesson, title: b.title }))];
  return (
    <section className="card my-lessons" aria-labelledby="my-lessons-h">
      <h2 id="my-lessons-h" className="eyebrow-h">My lessons</h2>
      {rows.length === 0 ? <p className="muted small">Nothing yet. Use “Add to My lessons” on any lesson to keep it here. Lessons you start wait here for you to resume.</p> : (
        <ul className="list">
          {rows.map((r) => {
            const rs = resumeOf(r.grade, r.lesson);
            return (
              <li key={`${r.grade}/${r.lesson}`}>
                <Link to={`/study/curriculum/${r.grade}/${r.lesson}`} onClick={() => primeSavedStep(r.grade, r.lesson)}>{r.title}</Link>
                <span className="muted small"> · {gradeLabel(r.grade)}{rs ? ` · Resume at step ${rs.step + 1} of ${rs.steps}` : ''}</span>
                {marked.has(`${r.grade}/${r.lesson}`) && <> <button type="button" className="linklike small" aria-label={`Remove ${r.title} from My lessons`} onClick={() => toggleMark(r.grade, r.lesson, r.title)}>Remove</button></>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
