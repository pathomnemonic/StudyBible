import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeatured } from '../curriculum/extras';
import { dayOfYear } from '../study/verseOfDay';

/** One featured adult lesson a day, chosen by the date so everyone sees the same one. The featured list favours what people really ask and debate (data/curated/featured-lessons.json). */
export default function LessonOfDay() {
  const [pick, setPick] = useState<{ id: string; q: string } | null>(null);
  useEffect(() => {
    getFeatured().then((all) => {
      const pool = all.filter((f) => f.band === 'adult');
      if (!pool.length) return;
      const f = pool[(new Date().getFullYear() * 366 + dayOfYear()) % pool.length];
      setPick({ id: f.id, q: f.q });
    });
  }, []);
  if (!pick) return null;
  return (
    <Link className="lod" to={`/study/curriculum/YA/${pick.id}`}>
      <span className="lod-k">Lesson of the day</span>
      <strong>{pick.q}</strong>
      <span className="lod-go" aria-hidden="true">›</span>
    </Link>
  );
}
