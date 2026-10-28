import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { getLibraryIndex, type LibraryWorkMeta } from '../data/content';
import { recordedWorkIds, recordingsForWork, type Recording } from '../data/librivox';
import { usePlayer } from '../data/PlayerContext';
import { registerEpisodes } from '../data/podcasts';
import { db } from '../db/db';
import type { BiayEpisode } from '../data/content';

export const epOf = (workId: string, workTitle: string, rec: Recording, i: number): BiayEpisode => ({
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
  const prog = useLiveQuery(() => db.episodeProgress.filter((p) => p.episodeId.startsWith('lv:')).toArray(), []) ?? [];
  const pmap = useMemo(() => new Map(prog.map((p) => [p.episodeId, p])), [prog]);
  // open on the recording and part you were last listening to, if any
  useEffect(() => {
    recordingsForWork(workId).then(async (r) => {
      setRecs(r); setOn(false);
      const all = await db.episodeProgress.filter((p) => p.episodeId.startsWith('lv:')).toArray();
      const pick: { best: { ri: number; pi: number; at: number } | null } = { best: null };
      r.forEach((rec, a) => rec.parts.forEach((_, b) => { const p = all.find((x) => x.episodeId === `lv:${rec.id}:${b}`); if (p && (p.completed || p.position > 0) && (!pick.best || p.updatedAt > pick.best.at)) pick.best = { ri: a, pi: p.completed ? Math.min(b + 1, rec.parts.length - 1) : b, at: p.updatedAt }; }));
      setRi(pick.best?.ri ?? 0); setPi(pick.best?.pi ?? 0);
    });
  }, [workId]);
  if (!recs.length) return null;
  const rec = recs[Math.min(ri, recs.length - 1)];
  const heard = rec.parts.filter((_, i) => pmap.get(`lv:${rec.id}:${i}`)?.completed).length;
  const here = pmap.get(`lv:${rec.id}:${Math.min(pi, rec.parts.length - 1)}`);
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
      <summary><strong>Listen</strong> <span className="muted small">recorded by volunteers for LibriVox ({rec.total}){heard ? ` · ${heard} of ${rec.parts.length} parts heard` : ''}</span></summary>
      {on && (
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {recs.length > 1 && (
            <label className="small">Recording <select value={ri} onChange={(e) => { setRi(+e.target.value); setPi(0); }} style={{ maxWidth: '100%' }}>{recs.map((r, i) => <option key={r.id} value={i}>{r.title}</option>)}</select></label>
          )}
          <label className="small">Part <select value={pi} onChange={(e) => setPi(+e.target.value)} style={{ maxWidth: '100%' }}>{rec.parts.map((p, i) => <option key={i} value={i}>{pmap.get(`lv:${rec.id}:${i}`)?.completed ? '✓ ' : ''}{p[0]}</option>)}</select></label>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={() => playFrom(pi)}>▶ {here && !here.completed && here.position > 20 ? `Continue “${part[0]}” at ${Math.floor(here.position / 60)}:${String(Math.floor(here.position % 60)).padStart(2, '0')}` : `Play “${part[0]}”`}</button>
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
