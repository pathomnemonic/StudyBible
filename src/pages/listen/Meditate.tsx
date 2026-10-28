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
  /** A long run of real recordings that plays on its own for an hour or more, then stops (the player's own sleep timer also works). */
  const sleepMix = async (cats: Track['category'][], album: string) => {
    if (!tracks) return;
    const pool = tracks.filter((t) => cats.includes(t.category) && (t.durationSec ?? 0) >= 100).sort(() => Math.random() - 0.5);
    if (!pool.length) return;
    const list: Track[] = [];
    while (list.reduce((n, t) => n + (t.durationSec ?? 180), 0) < 75 * 60) list.push(...pool);
    await queueAll(list, album);
    p.setSleep(75);
  };
  /** Sacred radio: a shuffled run of chant and hymns, long enough for an afternoon, with no sleep timer. */
  const radio = async (pick: (t: Track) => boolean, album: string) => {
    if (!tracks) return;
    const pool = tracks.filter((t) => pick(t) && (t.durationSec ?? 0) >= 30);
    if (!pool.length) return;
    const list: Track[] = [];
    let last = '';
    while (list.reduce((n, t) => n + (t.durationSec ?? 180), 0) < 4 * 3600) {
      const round = [...pool].sort(() => Math.random() - 0.5);
      if (round.length > 1 && round[0].id === last) round.push(round.shift()!);
      list.push(...round); last = round[round.length - 1].id;
    }
    p.setSleep('off');
    await queueAll(list, album);
  };
  return (
    <div className="meditate">
      <Group open title="Sacred radio" hint="A shuffled run of real recordings that keeps going for hours. Stop it any time.">
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button className="btn primary" onClick={() => void radio((t) => t.category === 'chant' || t.category === 'hymn', 'Sacred radio')}><Icon name="play" size={14} /> Chant and hymns</button>
          <button className="btn" onClick={() => void radio((t) => /ave-maria|salve|stabat|tantum|salutaris/.test(t.id), 'Marian and Eucharistic')}>Mary and the Eucharist</button>
          <button className="btn" onClick={() => void radio((t) => /resurrexi|haec-dies|alleluia|victimae|terra-tremuit/.test(t.id), 'Easter chant')}>Easter chant</button>
          <button className="btn" onClick={() => void radio((t) => /adeste|silent-night|holy-night/.test(t.id), 'Christmas hymns')}>Christmas hymns</button>
          <button className="btn" onClick={() => void radio((t) => t.category !== 'nature', 'Sacred radio: everything')}>Everything quiet</button>
        </div>
      </Group>
      <Group title="To fall asleep to" hint="Real recordings, not a synthetic voice. Each runs for about an hour and then stops by itself.">
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button className="btn primary" onClick={() => void sleepMix(['chant'], 'Chant for sleep')}><Icon name="play" size={14} /> Monastic chant</button>
          <button className="btn" onClick={() => void sleepMix(['chant', 'hymn'], 'Chant and hymns for sleep')}>Chant and hymns</button>
          <button className="btn" onClick={() => void sleepMix(['classical'], 'Piano for sleep')}>Piano nocturnes</button>
          <button className="btn" onClick={() => void sleepMix(['nature'], 'Nature for sleep')}>Rain, sea and wind</button>
        </div>
      </Group>
      <Link to="/pray/sleep" className="card meditate-sleep">
        <strong>Fall asleep with a psalm</strong>
        <span className="muted small">A psalm read slowly, one verse at a time, over rain or a stream, while the screen dims and the sound fades.</span>
      </Link>
      <p className="muted small">Pick something and press play. The timer in the full player stops it after the time you choose, or at the end of the track.</p>
      {tracks === null && <div className="center-note">Loading…</div>}
      {tracks && SECTIONS.map((s, si) => {
        const list = tracks.filter((t) => t.category === s.cat);
        if (!list.length) return null;
        return (
          <Group key={s.cat} open={si === 0} title={s.title} hint={s.blurb}>
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
