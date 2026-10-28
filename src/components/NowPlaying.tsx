import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { resolveEpisode, usePlayer } from '../data/PlayerContext';
import type { BiayEpisode } from '../data/content';
import Modal from './Modal';
import { useSettings } from '../lib/store';
import { parseRefId } from '../lib/refs';
import ShowSettings from './ShowSettings';

export const SPEEDS = [0.5, 0.7, 0.85, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const fmt = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h ? h + ':' + String(m).padStart(2, '0') : m}:${String(Math.floor(s % 60)).padStart(2, '0')}`; };

/** The full player: large controls, speed (remembered for each show), sleep timer, skip intro, show notes, what plays next. */
export default function NowPlaying({ onClose }: { onClose: () => void }) {
  const p = usePlayer();
  const q = useLiveQuery(() => db.queue.orderBy('order').toArray(), []) ?? [];
  const [eps, setEps] = useState<Record<string, BiayEpisode>>({});
  const [cfg, setCfg] = useState(false);
  useEffect(() => { void Promise.all(q.map(async (x) => [x.episodeId, await resolveEpisode(x.episodeId)] as const)).then((r) => setEps(Object.fromEntries(r.filter((x): x is [string, BiayEpisode] => !!x[1])))); }, [q.map((x) => x.episodeId).join()]);
  const e = p.current;
  const [st] = useSettings();
  // a Bible in a Year day opens its first passage; a part of a recorded book opens the book. The audio keeps playing while you read.
  const readAlong = e ? (e.passages[0] ? (() => { const r = parseRefId(e.passages[0]); return r ? `/read/${st.defaultEdition}/${r.book}/${r.c1}` : null; })() : e.id.startsWith('lv:') ? e.link ?? null : null) : null;
  if (!e) return null;
  const share = async () => { const url = e.page || location.href; try { if (navigator.share) await navigator.share({ title: e.title, url }); else await navigator.clipboard.writeText(`${e.title} ${url}`); } catch { /* cancelled */ } };
  return (
    <Modal title="Now playing" onClose={onClose}>
      <div className="now">
        <div className="now-art" aria-hidden="true">🎧</div>
        <h3 style={{ margin: '6px 0 0' }}>{e.title}</h3>
        <p className="muted small" style={{ margin: 0 }}>{e.album ?? e.artist ?? ''}</p>
        <div className="row small muted" style={{ gap: 8 }}><span>{fmt(p.position)}</span><input type="range" min={0} max={p.duration || 1} value={p.position} step={1} onChange={(ev) => p.seek(+ev.target.value)} style={{ flex: 1 }} aria-label="Seek" /><span>−{fmt(Math.max(0, p.duration - p.position))}</span></div>
        <div className="row" style={{ justifyContent: 'center', gap: 14 }}>
          <button className="btn" onClick={() => p.skip(-60)} aria-label="Back one minute">−60</button>
          <button className="btn" onClick={() => p.skip(-p.back)} aria-label={`Back ${p.back} seconds`}>−{p.back}</button>
          <button className="btn primary big" onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'}>{p.playing ? '⏸' : '▶'}</button>
          <button className="btn" onClick={() => p.skip(p.fwd)} aria-label={`Forward ${p.fwd} seconds`}>+{p.fwd}</button>
          <button className="btn" onClick={() => p.skip(60)} aria-label="Forward one minute">+60</button>
        </div>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <label>Speed <select value={p.rate} onChange={(ev) => p.setRate(+ev.target.value)}>{SPEEDS.map((r) => <option key={r} value={r}>{r}×</option>)}</select></label>
          <label>Sleep <select value={p.sleep.mode === 'off' ? 'off' : p.sleep.mode === 'end' ? 'end' : 'min'} onChange={(ev) => p.setSleep(ev.target.value === 'off' ? 'off' : ev.target.value === 'end' ? 'end' : 15)}><option value="off">Off</option><option value="end">End of this episode</option><option value="min">{p.sleep.mode === 'minutes' ? `${Math.ceil(p.sleep.left / 60)} min left` : 'In minutes…'}</option></select></label>
          {p.sleep.mode !== 'end' && <label>Minutes <select value="" onChange={(ev) => ev.target.value && p.setSleep(+ev.target.value)}><option value="">choose</option>{[5, 10, 15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m}</option>)}</select></label>}
          {p.showKey && <button className="btn small" onClick={() => setCfg(true)}>This show’s settings</button>}
        </div>
        
        <div className="row" style={{ gap: 8 }}>
          <button className="btn small" onClick={share}>Share</button>
          <button className="btn small" onClick={() => { void db.episodeProgress.put({ episodeId: e.id, position: 0, completed: true, updatedAt: Date.now(), duration: p.duration }); }}>Mark played</button>
          {readAlong && <Link className="btn small primary" to={readAlong} onClick={onClose}>Read along</Link>}
          {e.link && <Link className="btn small" to={e.link} onClick={onClose}>Open the page</Link>}
        </div>
        {e.description && <details open><summary>Show notes</summary><p className="small" style={{ whiteSpace: 'pre-wrap' }}>{e.description}</p></details>}
        <details open={q.length > 0}><summary>Up next ({q.length})</summary>
          <ol className="list">{q.map((x) => <li key={x.id} className="row between"><span style={{ minWidth: 0 }}>{eps[x.episodeId]?.title ?? x.episodeId}</span><button className="icon-btn" aria-label="Remove from queue" onClick={() => db.queue.delete(x.id!)}>✕</button></li>)}</ol>
        </details>
      </div>
      {cfg && <ShowSettings showKey={p.showKey} name={e.album ?? e.artist ?? e.title} onClose={() => setCfg(false)} />}
    </Modal>
  );
}
