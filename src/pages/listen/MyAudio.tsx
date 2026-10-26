import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserAudio } from '../../db/db';
import { rememberEpisode, usePlayer } from '../../data/PlayerContext';
import { registerEpisodes } from '../../data/podcasts';
import { fmtDuration } from '../../data/biay';
import type { BiayEpisode } from '../../data/content';
import Fold from '../../components/Fold';

const epOf = (a: UserAudio): BiayEpisode => ({ id: `ua:${a.id}`, day: null, year: null, kind: 'bonus', title: a.title, short: a.title, date: new Date(a.addedAt).toISOString().slice(0, 10), duration: a.secs ?? null, audio: `idb:${a.id}`, page: '', description: '', passages: [], passageSource: 'user', artist: a.album, album: a.album, link: '/listen?tab=audiobooks' });
const duration = (blob: Blob) => new Promise<number | undefined>((res) => { const u = URL.createObjectURL(blob); const a = new Audio(); a.preload = 'metadata'; a.onloadedmetadata = () => { URL.revokeObjectURL(u); res(Number.isFinite(a.duration) ? Math.round(a.duration) : undefined); }; a.onerror = () => { URL.revokeObjectURL(u); res(undefined); }; a.src = u; });

/** Audiobooks and talks from the reader's own files. They stay in this browser and play in the bottom player like everything else. */
export default function MyAudio() {
  const files = useLiveQuery(() => db.userAudio.orderBy('addedAt').toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.episodeProgress.toArray(), []) ?? [];
  const player = usePlayer();
  const [album, setAlbum] = useState('');
  const [msg, setMsg] = useState('');
  const done = new Map(progress.map((p) => [p.episodeId, p]));
  const albums = [...new Set(files.map((f) => f.album))];
  const add = async (list: FileList | null) => {
    if (!list?.length) return;
    let n = 0;
    for (const f of [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
      if (!/^audio\//.test(f.type) && !/\.(mp3|m4a|m4b|aac|ogg|opus|wav|flac)$/i.test(f.name)) continue;
      const id = crypto.randomUUID();
      await db.userAudio.put({ id, title: f.name.replace(/\.[^.]+$/, ''), album: album.trim() || 'My audio', blob: f, size: f.size, secs: await duration(f), addedAt: Date.now() + n++ });
    }
    setMsg(n ? `Added ${n} file${n === 1 ? '' : 's'}.` : 'Those files are not audio.');
  };
  const playAll = async (name: string, from = 0) => {
    const list = files.filter((f) => f.album === name);
    const eps = list.map(epOf);
    registerEpisodes(eps); for (const e of eps) await rememberEpisode(e);
    const old = await db.queue.filter((x) => x.episodeId.startsWith('ua:')).primaryKeys();
    await db.queue.bulkDelete(old);
    const base = Date.now() - 1e13;
    await db.queue.bulkAdd(eps.slice(from + 1).map((e, k) => ({ episodeId: e.id, order: base + k })));
    await player.play(eps[from]);
  };
  return (
    <Fold id="aud:mine" title={`Your own audio (${files.length})`} hint="Audiobooks, talks or recordings from your device. They stay on this device." open={files.length > 0}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Book or collection name (optional)" aria-label="Collection name" style={{ minWidth: 220 }} />
        <label className="btn primary">Choose audio files<input type="file" multiple accept="audio/*,.m4b,.mp3,.m4a" hidden onChange={(e) => { void add(e.target.files); e.target.value = ''; }} /></label>
      </div>
      <p className="muted small" role="status">{msg || 'Files play in order, and the app remembers where you stopped in each one.'}</p>
      {albums.map((name) => {
        const list = files.filter((f) => f.album === name);
        const heard = list.filter((f) => done.get(`ua:${f.id}`)?.completed).length;
        return (
          <section key={name} className="card" style={{ marginBottom: 10 }}>
            <div className="row between"><strong>{name}</strong><span className="muted small">{list.length} part{list.length === 1 ? '' : 's'} · {heard} heard</span></div>
            <div className="row" style={{ gap: 8, margin: '6px 0' }}>
              <button className="btn small primary" onClick={() => { const next = list.findIndex((f) => !done.get(`ua:${f.id}`)?.completed); void playAll(name, Math.max(0, next)); }}>{heard ? 'Continue' : '▶ Play'}</button>
              <button className="btn small ghost" onClick={async () => { if (confirm(`Remove “${name}” from this device?`)) { await db.userAudio.bulkDelete(list.map((f) => f.id)); await db.episodeProgress.bulkDelete(list.map((f) => `ua:${f.id}`)); } }}>Remove all</button>
            </div>
            <ol className="list">{list.map((f, i) => { const p = done.get(`ua:${f.id}`); return (
              <li key={f.id} className="row between"><span style={{ minWidth: 0 }}>{f.title}<span className="muted small"> · {f.secs ? fmtDuration(f.secs) : `${(f.size / 1e6).toFixed(1)} MB`}{p?.completed ? ' · ✓ heard' : p && p.position > 20 ? ` · stopped at ${Math.floor(p.position / 60)} min` : ''}</span></span>
                <span><button className="icon-btn" aria-label={`Play ${f.title}`} onClick={() => playAll(name, i)}>▶</button><button className="icon-btn" aria-label={`Remove ${f.title}`} onClick={() => confirm(`Remove ${f.title}?`) && db.userAudio.delete(f.id)}>✕</button></span></li>); })}</ol>
          </section>
        );
      })}
    </Fold>
  );
}
