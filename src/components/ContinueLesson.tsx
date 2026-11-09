import { Link } from 'react-router-dom';
import { gradeLabel } from '../curriculum/model';
import { lastLesson, unfinishedIn, primeSavedStep } from '../curriculum/resume';

/** "Continue your lesson": the lesson begun and not finished, with the step reached. On a grade page, only that grade's lessons. */
export default function ContinueLesson({ grade }: { grade?: string }) {
  const r = grade ? unfinishedIn(grade)[0] : lastLesson();
  if (!r) return null;
  return (
    <section className="card continue-lesson" aria-label="Continue your lesson">
      <div className="continue-lesson-text">
        <span className="eyebrow">Continue your lesson</span>
        <strong className="continue-lesson-title">{r.title}</strong>
        <span className="muted small">{gradeLabel(r.grade)} · Step {r.step + 1} of {r.steps}</span>
      </div>
      <Link className="btn primary" to={`/study/curriculum/${r.grade}/${r.lesson}`} onClick={() => primeSavedStep(r.grade, r.lesson)}>Continue</Link>
    </section>
  );
}
