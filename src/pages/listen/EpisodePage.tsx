import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { fmtDuration, useBiay } from '../../data/biay';
import { usePlayer } from '../../data/PlayerContext';
import { formatRef, parseRefId, type Ref } from '../../lib/refs';
import RefLink from '../../components/RefLink';
import NoteEditor from '../../components/NoteEditor';
import Icon from '../../components/Icon';
import { providers, type StudyItem } from '../../study/providers';

export default function EpisodePage() {
  const { id = '' } = useParams();
  const { biay, loaded } = useBiay();
  const player = usePlayer();
  const [embed, setEmbed] = useState(false);
  const [note, setNote] = useState(false);
  const [teach, setTeach] = useState<StudyItem[]>([]);
  const prog = useLiveQuery(() => db.episodeProgress.get(id), [id]);
  const ep = biay?.byId.get(id);
  useEffect(() => {
    if (!ep) return;
    db.history.add({ ts: Date.now(), type: 'episode', ref: ep.id, label: ep.title });
    const refs = ep.passages.map((p) => parseRefId(p)).filter(Boolean) as Ref[];
    if (refs.length) Promise.all([providers.catechism(refs.slice(0, 1)), providers.doctrine(refs.slice(0, 4))]).then(([a, b]) => setTeach([...a, ...b]));
  }, [ep?.id]);
  if (!loaded) return <div className="center-note">Loading…</div>;
  if (!ep || !biay) return <div className="page"><p>Episode not found. <Link to="/listen">Back</Link></p></div>;
  const others = ep.day ? (biay.releases.get(ep.day) ?? []).filter((e) => e.id !== ep.id) : [];
  const isCurrent = player.current?.id === ep.id;
  return (
    <div className="page">
      <Link to="/listen" className="small">← Listen</Link>
      <h1>{ep.title}</h1>
      <div className="muted">{ep.date} · {fmtDuration(ep.duration)} · Fr. Mike Schmitz / Ascension</div>
      <div className="row" style={{ margin: '12px 0' }}>
        <button className="btn primary" onClick={() => (isCurrent ? player.toggle() : player.play(ep))}>
          <Icon name={isCurrent && player.playing ? 'pause' : 'play'} size={16} /> {isCurrent && player.playing ? 'Pause' : prog && !prog.completed && prog.position > 30 ? `Resume (${Math.floor(prog.position / 60)} min)` : 'Play'}
        </button>
        <button className="btn" onClick={() => db.queue.add({ episodeId: ep.id, order: Date.now() })}><Icon name="queue" size={16} /> Add to queue</button>
        <button className="btn" onClick={() => db.episodeProgress.put({ episodeId: ep.id, position: 0, completed: !prog?.completed, updatedAt: Date.now() })}><Icon name="check" size={16} /> {prog?.completed ? 'Completed — undo' : 'Mark completed'}</button>
        <button className="btn" onClick={() => setNote(true)}><Icon name="note" size={16} /> Note</button>
      </div>

      <div className="card">
        <h3>Readings for this episode</h3>
        <p className="muted small">Taken from the show’s feed metadata ({ep.passageSource.replace(/-/g, ' ')}). Chapter-level; the show uses modern numbering and the app maps it to the Vulgate anchor.</p>
        {ep.passages.length === 0 && <div className="notice">No readings are listed in the feed for this episode, and none were invented. A reviewer can add them in <code>data/curated/biay-overrides.json</code>.</div>}
        <ul className="list">
          {ep.passages.map((p) => {
            const r = parseRefId(p);
            return r ? (
              <li key={p} className="row between">
                <span>{formatRef(r)}</span>
                <span className="row"><RefLink refv={r}>Read</RefLink><Link to={`/study/passage/${p}`}>Study</Link></span>
              </li>
            ) : null;
          })}
        </ul>
      </div>

      <div className="card">
        <h3>About this episode</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{ep.description}</p>
        <p className="muted small">Source: official feed metadata. <a href={ep.page} target="_blank" rel="noreferrer">Episode page ↗</a> · <a href={ep.audio} target="_blank" rel="noreferrer">Official audio file ↗</a></p>
        <p className="muted small">Transcript: the official feed does not provide one. Ascension may publish captions on its YouTube channel: <a href="https://www.youtube.com/@AscensionPresents" target="_blank" rel="noreferrer">Ascension Presents ↗</a>.</p>
        {ep.player && (
          <>
            <button className="btn small" onClick={() => setEmbed(!embed)}>{embed ? 'Hide' : 'Show'} the publisher’s own embedded player</button>
            {embed && <iframe title="Embedded player" src={ep.player} width="100%" height="200" loading="lazy" style={{ border: 0, marginTop: 8 }} />}
          </>
        )}
      </div>

      {teach.length > 0 && (
        <div className="card">
          <h3>Related teaching for the first reading</h3>
          {teach.map((t) => (
            <div key={t.id} className="item">
              <div className="t">{t.title}</div>
              <div className="why">{t.why}</div>
              {t.url ? <a href={t.url} target="_blank" rel="noreferrer">Open ↗</a> : t.internal ? <Link to={t.internal}>Open</Link> : null}
            </div>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="card">
          <h3>Other releases of Day {ep.day}</h3>
          {others.map((o) => <div key={o.id}><Link to={`/listen/episode/${o.id}`}>{o.year} release — {o.title}</Link></div>)}
        </div>
      )}
      {note && <NoteEditor initialTargets={[{ type: 'episode', episodeId: ep.id, label: ep.title }, ...ep.passages.slice(0, 3).map((p) => ({ type: 'passage' as const, ref: p }))]} onClose={() => setNote(false)} />}
    </div>
  );
}
