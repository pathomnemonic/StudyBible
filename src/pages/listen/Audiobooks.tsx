import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getLibraryIndex, type LibraryWorkMeta } from '../../data/content';
import { allRecordedWorks, type Recording } from '../../data/librivox';
import { fmtDuration } from '../../data/biay';
import FilterBar from '../../components/FilterBar';
import MyAudio from './MyAudio';
import { useShows } from '../../data/podcasts';
import { fold } from '../../search/engine';

/** Podcasts that read the Catholic classics, beside the volunteer recordings below. */
function ClassicsPodcasts() {
  const shows = useShows();
  const list = (shows ?? []).filter((s) => s.category === 'Catholic classics');
  if (!list.length) return null;
  return (
    <section className="classics" aria-label="Catholic classics on podcasts">
      <h2 className="eyebrow-h">Catholic classics on podcasts</h2>
      <div className="classics-row">
        {list.map((s) => (
          <Link key={s.id} className="classic-card" to={`/listen?tab=podcasts&show=${s.id}`}>
            <strong>{s.title}</strong>
            <span>{s.note}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Audiobooks: every library work volunteers have recorded, with how far through each you are. */
export default function Audiobooks() {
  const [works, setWorks] = useState<LibraryWorkMeta[]>([]);
  const [recs, setRecs] = useState<Record<string, Recording[]>>({});
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'going' | 'done'>('all');
  const progress = useLiveQuery(() => db.episodeProgress.toArray(), []) ?? [];
  useEffect(() => { Promise.all([getLibraryIndex(), allRecordedWorks()]).then(([l, r]) => { setRecs(r); setWorks((l?.works ?? []).filter((w) => r[w.id])); }); }, []);
  const done = useMemo(() => new Map(progress.map((p) => [p.episodeId, p])), [progress]);
  const stat = (w: LibraryWorkMeta) => {
    const r = recs[w.id]?.[0];
    if (!r) return { n: 0, total: 0, secs: 0, started: false, finished: false };
    let n = 0, started = false, last = 0;
    r.parts.forEach((_, i) => { const p = done.get(`lv:${r.id}:${i}`); if (p?.completed) n++; if (p && (p.completed || p.position > 0)) { started = true; last = Math.max(last, p.updatedAt); } });
    return { n, total: r.parts.length, secs: r.parts.reduce((a, p) => a + (p[2] || 0), 0), started, finished: n === r.parts.length, last };
  };
  const list = works.filter((w) => !q.trim() || fold(`${w.title} ${w.author}`).includes(fold(q.trim()))).map((w) => ({ w, s: stat(w) })).filter(({ s }) => filter === 'all' || (filter === 'done' ? s.finished : s.started && !s.finished)).sort((a, b) => ((b.s as any).last ?? 0) - ((a.s as any).last ?? 0) || a.w.title.localeCompare(b.w.title));
  return (
    <div>
      <MyAudio />
      <ClassicsPodcasts />
      <p className="muted small" style={{ marginTop: 0 }}>{works.length} works read aloud by volunteers for <a href="https://librivox.org" target="_blank" rel="noreferrer">LibriVox</a> (public domain). Open one to play it in the bar at the bottom; it remembers the part and the minute you stopped, and carries on to the next part.</p>
      <FilterBar active={filter !== 'all' ? 1 : 0}
        search={<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find an audiobook or an author…" aria-label="Find an audiobook" />}>
        <label>Show<select value={filter} onChange={(e) => setFilter(e.target.value as 'all')} aria-label="Show"><option value="all">All</option><option value="going">In progress</option><option value="done">Finished</option></select></label>
      </FilterBar>
      <ul className="list">
        {list.map(({ w, s }) => (
          <li key={w.id}>
            <div className="row between">
              <div style={{ minWidth: 0, flex: 1 }}>
                <Link to={`/room/work/${w.id}/0`} className="t" style={{ fontWeight: 600 }}>{w.title}</Link>
                <div className="muted small">{w.author} · {s.total} part{s.total === 1 ? '' : 's'}{s.secs ? ` · ${fmtDuration(s.secs)}` : ''}{s.finished ? ' · ✓ finished' : s.started ? ` · ${s.n} of ${s.total} parts heard` : ''}</div>
                {s.started && !s.finished && <span className="bar"><i style={{ width: `${Math.round((100 * s.n) / s.total)}%` }} /></span>}
              </div>
              <Link className="btn small" to={`/room/work/${w.id}/0`}>{s.started && !s.finished ? 'Continue' : 'Open'}</Link>
            </div>
          </li>
        ))}
        {!list.length && <li className="empty">Nothing here.</li>}
      </ul>
    </div>
  );
}
