import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { loadTracks, type Track } from '../../lib/ambience';
import { rememberEpisode, usePlayer } from '../../data/PlayerContext';
import type { BiayEpisode } from '../../data/content';
import Icon from '../../components/Icon';
import { Group } from '../../components/Hub';

const BASE = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
const fmt = (s?: number) => (s ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '');

const asEpisode = (t: Track, album: string): BiayEpisode => ({
  id: `med:${t.id}`, day: null, year: null, kind: 'bonus', title: t.title, short: t.title, date: '', duration: t.durationSec ?? null,
  audio: `${BASE}audio/${t.file}`, page: '', description: '', passages: [], passageSource: '', link: '/listen?tab=meditate', artist: t.artist, album,
});

const SECTIONS: { cat: Track['category']; title: string; blurb: string }[] = [
  { cat: 'chant', title: 'Chant', blurb: 'Gregorian chant and plainsong. Quiet, unhurried, with nothing to follow.' },
  { cat: 'hymn', title: 'Hymns', blurb: 'Old hymns and the great Marian and Eucharistic songs.' },
  { cat: 'classical', title: 'Piano', blurb: 'Nocturnes to settle the mind.' },
  { cat: 'music', title: 'Quiet music', blurb: 'Soft instrumental pieces.' },
  { cat: 'nature', title: 'Sounds of nature', blurb: 'Rain, streams, wind and night. Set the player’s sleep timer and drift off.' },
];

/** Media › Meditate: things to rest with, and to fall asleep to. Plays through the same player, so the sleep timer, lock-screen controls and queue all work. */
export default function Meditate() {
  const p = usePlayer();
  const [tracks, setTracks] = useState<Track[] | null>(null);
  useEffect(() => { void loadTracks().then(setTracks); }, []);
  const queueAll = async (list: Track[], album: string) => {
    const eps = list.map((t) => asEpisode(t, album));
    for (const e of eps) await rememberEpisode(e);
    await p.play(eps[0]);
    let n = Date.now();
    for (const e of eps.slice(1)) await db.queue.add({ episodeId: e.id, order: ++n });
  };
  return (
    <div className="meditate">
      <Link to="/pray/sleep" className="card meditate-sleep">
        <strong>Fall asleep with a psalm</strong>
        <span className="muted small">A psalm read slowly, one verse at a time, over rain or a stream, while the screen dims and the sound fades.</span>
      </Link>
      <p className="muted small">Pick something and press play. The timer in the full player stops it after the time you choose, or at the end of the track.</p>
      {tracks === null && <div className="center-note">Loading…</div>}
      {tracks && SECTIONS.map((s) => {
        const list = tracks.filter((t) => t.category === s.cat);
        if (!list.length) return null;
        return (
          <Group key={s.cat} title={s.title} hint={s.blurb}>
            <div className="row" style={{ marginBottom: 6 }}>
              <button className="btn small" onClick={() => void queueAll(list, s.title)}><Icon name="play" size={14} /> Play all</button>
            </div>
            <ul className="list med-list">
              {list.map((t) => (
                <li key={t.id} className="row between">
                  <span style={{ minWidth: 0 }}>{t.title}{t.artist ? <span className="muted small"> · {t.artist}</span> : null}</span>
                  <span className="row" style={{ gap: 8 }}>
                    <span className="muted small">{fmt(t.durationSec)}</span>
                    <button className="icon-btn" aria-label={`Play ${t.title}`} onClick={() => { const e = asEpisode(t, s.title); void rememberEpisode(e); void p.play(e); }}><Icon name="play" size={16} /></button>
                  </span>
                </li>
              ))}
            </ul>
          </Group>
        );
      })}
    </div>
  );
}
