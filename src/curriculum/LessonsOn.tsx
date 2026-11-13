import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lessonsOn } from './extras';
import { getGrade, flatLessons } from './model';

/** "Taught in these lessons": the way back from an argument, claim or heresy to the lessons that use it. Renders nothing when none do. */
export default function LessonsOn({ type, id }: { type: string; id: string }) {
  const [rows, setRows] = useState<{ id: string; title: string; grade: string }[]>([]);
  useEffect(() => {
    let live = true;
    (async () => {
      const ids = (await lessonsOn(type, id)).slice(0, 4);
      const out: { id: string; title: string; grade: string }[] = [];
      for (const lid of ids) {
        const grade = lid.startsWith('YA-') ? 'YA' : lid.split('-')[0];
        const g = await getGrade(grade);
        const l = g && flatLessons(g).find((x) => x.id === lid);
        if (l) out.push({ id: lid, title: l.title, grade });
      }
      if (live) setRows(out);
    })().catch(() => undefined);
    return () => { live = false; };
  }, [type, id]);
  if (!rows.length) return null;
  return (
    <p className="apt-intracks no-print" aria-label="Lessons that teach this">
      <span className="muted small">Taught in these lessons:</span>{' '}
      {rows.map((r) => <Link key={r.id} className="chip" to={`/study/curriculum/${r.grade}/${r.id}`}>{r.title}</Link>)}
    </p>
  );
}
