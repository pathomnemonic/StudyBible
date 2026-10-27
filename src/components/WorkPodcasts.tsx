import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLibraryIndex, type LibraryWorkMeta } from '../data/content';
import { useShows, type Show } from '../data/podcasts';

/** On a library work: podcasts that read or discuss it, to listen to alongside (or instead of) the volunteer recording. */
export function WorkPodcasts({ workId }: { workId: string }) {
  const shows = useShows();
  const list = (shows ?? []).filter((s) => s.works?.includes(workId));
  if (!list.length) return null;
  return (
    <section className="card work-pods" style={{ maxWidth: 760, margin: '8px auto' }} aria-label="Podcasts on this work">
      <strong>Also on podcasts</strong>
      <div className="chips" style={{ marginTop: 6 }}>
        {list.map((s) => <Link key={s.id} className="chip" to={`/listen?tab=podcasts&show=${s.id}`}>{s.title} · {s.host}</Link>)}
      </div>
    </section>
  );
}

/** On a podcast that reads classics: the same works in the library, to read along. */
export function ShowWorks({ show }: { show: Show }) {
  const [works, setWorks] = useState<LibraryWorkMeta[]>([]);
  useEffect(() => { if (show.works?.length) getLibraryIndex().then((l) => setWorks((l?.works ?? []).filter((w) => show.works!.includes(w.id)))); else setWorks([]); }, [show.id]);
  if (!works.length) return null;
  return (
    <div className="show-works">
      <span className="eyebrow">Read along in the library</span>
      <div className="chips">{works.map((w) => <Link key={w.id} className="chip" to={`/room/work/${w.id}/0`}>{w.title}</Link>)}</div>
    </div>
  );
}
