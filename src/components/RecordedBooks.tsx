import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLibraryIndex, type LibraryWorkMeta } from '../data/content';
import { recordedWorkIds, recordingsForWork, type Recording } from '../data/librivox';
import { usePlayer } from '../data/PlayerContext';
import { registerEpisodes } from '../data/podcasts';
import { db } from '../db/db';
import type { BiayEpisode } from '../data/content';

const epOf = (workId: string, workTitle: string, rec: Recording, i: number): BiayEpisode => ({
  id: `lv:${rec.id}:${i}`, day: null, year: null, kind: 'bonus', title: `${workTitle}: ${rec.parts[i][0]}`, short: rec.parts[i][0], date: '', duration: rec.parts[i][2] || null,
  audio: rec.parts[i][1], page: rec.page, description: `Read by ${rec.reader || 'volunteers'} for LibriVox.`, passages: [], passageSource: 'librivox',
  link: `/room/work/${workId}/0`, artist: `${rec.reader || 'LibriVox volunteers'} · LibriVox`, album: workTitle,
});

/** LibriVox recordings of a library work: pick a recording and a part and play it here. Each part plays from its own start. */
export function RecordedWork({ workId, title = 'Recorded book' }: { workId: string; title?: string }) {
  const player = usePlayer();
  const [recs, setRecs] = useState<Recording[]>([]);
  const [ri, setRi] = useState(0);
  const [pi, setPi] = useState(0);
  const [on, setOn] = useState(false);
  useEffect(() => { recordingsForWork(workId).then((r) => { setRecs(r); setRi(0); setPi(0); setOn(false); }); }, [workId]);
  if (!recs.length) return null;
  const rec = recs[Math.min(ri, recs.length - 1)];
  const part = rec.parts[Math.min(pi, rec.parts.length - 1)];
  const playFrom = async (i: number) => {
    const eps = rec.parts.map((_, k) => epOf(workId, title, rec, k));
    registerEpisodes(eps);
    // the parts after this one go to the front of the queue, so they play next
    const old = await db.queue.filter((x) => x.episodeId.startsWith('lv:')).primaryKeys();
    await db.queue.bulkDelete(old);
    const base = Date.now() - 1e13;
    await db.queue.bulkAdd(eps.slice(i + 1).map((e, k) => ({ episodeId: e.id, order: base + k })));
    await player.play(eps[i]);
  };
  return (
    <details className="card" style={{ maxWidth: 760, margin: '8px auto' }} onToggle={(e) => setOn((e.target as HTMLDetailsElement).open)}>
      <summary><strong>Listen</strong> <span className="muted small">recorded by volunteers for LibriVox ({rec.total})</span></summary>
      {on && (
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {recs.length > 1 && (
            <label className="small">Recording <select value={ri} onChange={(e) => { setRi(+e.target.value); setPi(0); }} style={{ maxWidth: '100%' }}>{recs.map((r, i) => <option key={r.id} value={i}>{r.title}</option>)}</select></label>
          )}
          <label className="small">Part <select value={pi} onChange={(e) => setPi(+e.target.value)} style={{ maxWidth: '100%' }}>{rec.parts.map((p, i) => <option key={i} value={i}>{p[0]}</option>)}</select></label>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={() => playFrom(pi)}>▶ Play “{part[0]}”</button>
            <span className="muted small">It plays in the bar at the bottom, so you can keep reading and moving around. The next parts follow on their own.</span>
          </div>
          <div className="row between">
            <button className="btn small" disabled={pi === 0} onClick={() => setPi(pi - 1)}>← Previous part</button>
            <button className="btn small" disabled={pi >= rec.parts.length - 1} onClick={() => setPi(pi + 1)}>Next part →</button>
          </div>
          <p className="muted small" style={{ margin: 0 }}>Read by {rec.reader || 'volunteers'} for <a href={rec.page} target="_blank" rel="noreferrer">LibriVox</a> (public domain). The recording follows its own translation and may differ from the text shown here, and does not follow along with it.</p>
        </div>
      )}
    </details>
  );
}

/** Every work in the library that has a recording. */
export function RecordedList() {
  const [works, setWorks] = useState<LibraryWorkMeta[]>([]);
  useEffect(() => {
    Promise.all([getLibraryIndex(), recordedWorkIds()]).then(([l, ids]) => setWorks((l?.works ?? []).filter((w) => ids.has(w.id))));
  }, []);
  if (!works.length) return null;
  return (
    <section id="recorded" style={{ marginTop: 20 }}>
      <h2>Recorded books</h2>
      <p className="muted small">Works in the library that volunteers have recorded for LibriVox (public domain). Open one and use Listen at the top.</p>
      <ul className="plain" style={{ columns: '2 280px', margin: 0, padding: 0, listStyle: 'none' }}>
        {works.map((w) => <li key={w.id} style={{ breakInside: 'avoid', padding: '4px 0' }}><Link to={`/study/works/${w.id}/0`}>{w.title}</Link> <span className="muted small">{w.author}</span></li>)}
      </ul>
    </section>
  );
}
