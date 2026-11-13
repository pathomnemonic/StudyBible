import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../data/loader';

type Idx = Record<string, [string, string][]>;
let cache: Promise<Idx> | null = null;
const load = () => (cache ??= getJson<Idx>('curriculum/lesson-chapters.json', true).then((x) => x ?? {}).catch(() => ({} as Idx)));
const gradeOf = (id: string) => (id.startsWith('YA-') ? 'YA' : id.split('-')[0]);

/** Catechism lessons that use this chapter of Scripture, as links, so reading leads into learning. Renders nothing when none do. */
export default function ChapterLessons({ book, chapter }: { book: string; chapter: number }) {
  const [rows, setRows] = useState<[string, string][]>([]);
  useEffect(() => { let live = true; load().then((x) => live && setRows((x[`${book}.${chapter}`] ?? []).slice(0, 2))); return () => { live = false; }; }, [book, chapter]);
  return <>{rows.map(([id, title]) => <Link key={id} className="chip" to={`/study/curriculum/${gradeOf(id)}/${id}`}>Lesson: {title}</Link>)}</>;
}
