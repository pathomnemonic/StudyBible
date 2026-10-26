import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGrade, flatLessons } from '../curriculum/model';
import { dayOfYear } from '../study/verseOfDay';

/** One adult lesson a day, chosen by the date so everyone sees the same one and it cycles through the whole course. */
export default function LessonOfDay() {
  const [pick, setPick] = useState<{ id: string; title: string } | null>(null);
  useEffect(() => {
    getGrade('YA').then((g) => {
      if (!g) return;
      const all = flatLessons(g);
      if (!all.length) return;
      const l = all[(new Date().getFullYear() * 366 + dayOfYear()) % all.length];
      setPick({ id: l.id, title: l.title });
    });
  }, []);
  if (!pick) return null;
  return (
    <Link className="lod" to={`/study/curriculum/YA/${pick.id}`}>
      <span className="lod-k">Lesson of the day</span>
      <strong>{pick.title}</strong>
      <span className="lod-go" aria-hidden="true">›</span>
    </Link>
  );
}
