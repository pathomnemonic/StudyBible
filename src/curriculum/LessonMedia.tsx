import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InlinePlayer from '../components/InlinePlayer';
import { embedFor } from '../lib/embed';
import { resolveInapp, trackPath } from '../lib/apolTracks';
import type { Extras, Media } from './extras';

const KIND: Record<string, string> = { video: 'Video', talk: 'Talk', debate: 'Debate', podcast: 'Podcast', series: 'Series', article: 'Article', tract: 'Article' };

function Item({ m }: { m: Media }) {
  const [play, setPlay] = useState(false);
  const e = embedFor(m.url);
  return (
    <li className="lm-item">
      <div className="lm-meta"><span className="chip">{KIND[m.kind] ?? m.kind}</span> <strong>{m.title}</strong></div>
      <div className="muted small">{m.creator}{m.minutes ? ` · ${m.minutes} min` : ''}</div>
      <p className="small" style={{ margin: '2px 0 6px' }}>{m.why}</p>
      {play && e ? <InlinePlayer embed={e} title={m.title} /> : (
        <div className="row" style={{ gap: 6 }}>
          {e && <button className="btn small primary" onClick={() => setPlay(true)}>▶ Play here</button>}
          <a className="btn small" href={m.url} target="_blank" rel="noreferrer">{e ? 'Open' : 'Open to read or listen'} ↗</a>
        </div>
      )}
    </li>
  );
}

/** Videos, talks and debates for a lesson, picked by hand for the topic, with the reading behind them. */
export function WatchListen({ extras }: { extras: Extras }) {
  return (
    <div className="lm">
      {extras.watch.length > 0 && <><h3 className="lp-ask">Watch and listen</h3><ul className="lm-list">{extras.watch.map((m) => <Item key={m.url} m={m} />)}</ul></>}
      {extras.read.length > 0 && <><h3 className="lp-ask">Read more</h3><ul className="lm-list">{extras.read.map((m) => <Item key={m.url} m={m} />)}</ul></>}
      <p className="muted small">Chosen by hand, not by search. They are linked at their source and have not been reviewed by a bishop, so weigh them against the Catechism.</p>
    </div>
  );
}

/** A way to argue the question well, with the strongest objections and the Church’s replies one tap away. */
export function DebateIt({ extras, question }: { extras: Extras | null; question?: string }) {
  const [rows, setRows] = useState<{ title: string; to: string; label: string }[]>([]);
  const key = extras?.debate.map((d) => `${d.type}:${d.id}`).join(',') ?? '';
  useEffect(() => {
    let live = true;
    Promise.all((extras?.debate ?? []).map(async (d) => { const r = await resolveInapp({ kind: 'inapp', type: d.type as never, id: d.id, why: '' }); return r.found ? { title: r.title, to: r.to, label: r.typeLabel } : null; })).then((x) => live && setRows(x.filter((r): r is { title: string; to: string; label: string } => !!r)));
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="lm-debate">
      <h3 className="lp-ask">Debate it</h3>
      {question && <p className="cur-idea">“{question}”</p>}
      <p className="small">People really disagree about this, and a good conversation is a good way to learn it. Pair up, or split the group, and try this:</p>
      <ol className="small">
        <li><strong>Say their view first.</strong> Put the other side so well that they say, “That is exactly what I think.”</li>
        <li><strong>Name what you agree on.</strong> Even a small point.</li>
        <li><strong>Give your reply</strong> with one reason and one source (Scripture, the Catechism, a Father, or plain reason).</li>
        <li><strong>Say what would change your mind,</strong> or what you still do not know. Honest questions are allowed.</li>
        <li><strong>Swap sides</strong> and do it again.</li>
      </ol>
      {rows.length > 0 && (
        <>
          <p className="small" style={{ marginBottom: 4 }}><strong>The strongest objections and the replies:</strong></p>
          <ul className="small bullets">{rows.map((r) => <li key={r.to}><Link to={r.to}>{r.title}</Link> <span className="muted">· {r.label}</span></li>)}</ul>
        </>
      )}
      {extras && extras.tracks.length > 0 && <p className="small">Go deeper, step by step: {extras.tracks.map((t, i) => <span key={t.id}>{i ? ', ' : ''}<Link to={trackPath(t.id)}>{t.title}</Link></span>)}.</p>}
    </div>
  );
}
