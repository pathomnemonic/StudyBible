import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGrade, flatLessons } from '../curriculum/model';
import { dayOfYear } from '../study/verseOfDay';

/** One adult lesson a day, chosen by the date so everyone sees the same one and it cycles through the whole course. */
export default function LessonOfDay() {
  const [pick, setPick] = useState<{ id: string; title: string; unit: string; idea: string } | null>(null);
  useEffect(() => {
    getGrade('YA').then((g) => {
      if (!g) return;
      const all = flatLessons(g);
      if (!all.length) return;
      const l = all[(new Date().getFullYear() * 366 + dayOfYear()) % all.length];
      setPick({ id: l.id, title: l.title, unit: l.unit.title, idea: l.idea });
    });
  }, []);
  if (!pick) return null;
  return (
    <section className="hub-hero tone-learn" aria-label="Lesson of the day">
      <p className="hub-eyebrow">Lesson of the day · {pick.unit}</p>
      <h2>{pick.title}</h2>
      <p>{pick.idea.length > 200 ? pick.idea.slice(0, 197).replace(/\s+\S*$/, '') + '…' : pick.idea}</p>
      <div className="hub-hero-acts"><Link className="btn primary" to={`/study/curriculum/YA/${pick.id}`}>Read today’s lesson</Link></div>
    </section>
  );
}
