import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Fold from '../../components/Fold';
import FavoritesPicker from '../../components/FavoritesPicker';
import InlinePlayer from '../../components/InlinePlayer';
import { embedFor } from '../../lib/embed';
import { getJson } from '../../data/loader';
import { getLibraryIndex, type LibraryWorkMeta } from '../../data/content';
import { useFollows } from '../../lib/follow';
import ListenNow from './ListenNow';
import { updateSettings, useSettings } from '../../lib/store';

interface Lib { channels: string[]; videos: [string, string, number][] }

/** Media's front shelf: your favorite audiobooks and creators first, then where you stopped and what is new from the shows you follow. */
export default function ForYou() {
  const follows = useFollows();
  const [st] = useSettings();
  const [works, setWorks] = useState<LibraryWorkMeta[]>([]);
  const [lib, setLib] = useState<Lib | null>(null);
  const [play, setPlay] = useState<string | null>(null);
  const abIds = [...follows].filter((k) => k.startsWith('ab:')).map((k) => k.slice(3));
  const vcNames = [...follows].filter((k) => k.startsWith('vc:')).map((k) => k.slice(3));
  useEffect(() => { if (abIds.length) getLibraryIndex().then((l) => setWorks(l?.works ?? [])); }, [abIds.length]);
  useEffect(() => { if (vcNames.length && !lib) getJson<Lib>('media/video_library.json', true).then(setLib); }, [vcNames.length, lib]);
  const mineWorks = works.filter((w) => abIds.includes(w.id));
  const vids = lib ? vcNames.flatMap((n) => { const i = lib.channels.indexOf(n); return i < 0 ? [] : lib.videos.filter((v) => v[2] === i).slice(0, 2).map((v) => ({ v, ch: n })); }).slice(0, 8) : [];
  const total = follows.size;
  return (
    <div>
      <Fold id="media:favorites" title={total ? `Your favorites (${total})` : 'Choose your favorites'} hint="Podcasts, audiobooks and video creators to put first" open={!total}>
        <FavoritesPicker />
      </Fold>
      {total > 0 && <label className="row small" style={{ gap: 8, margin: '6px 0' }}><input type="checkbox" checked={st.autoFavorites} onChange={(e) => updateSettings({ autoFavorites: e.target.checked })} /> <span>When my queue ends, keep playing the newest episode from my favorite podcasts</span></label>}
      {mineWorks.length > 0 && (
        <section className="sect"><h2 className="eyebrow-h">Your audiobooks</h2>
          <ul className="list">{mineWorks.map((w) => <li key={w.id} className="row between"><span><Link to={`/room/work/${w.id}/0`} className="t" style={{ fontWeight: 600 }}>{w.title}</Link><span className="muted small"> · {w.author}</span></span><Link className="btn small" to={`/room/work/${w.id}/0`}>Listen</Link></li>)}</ul>
        </section>
      )}
      {vids.length > 0 && (
        <section className="sect"><h2 className="eyebrow-h">New from your video creators</h2>
          <ul className="plain" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {vids.map(({ v, ch }) => { const e = embedFor(`https://www.youtube.com/watch?v=${v[0]}`); return (
              <li key={v[0]} className="card" style={{ padding: 10 }}>
                <strong>{v[1]}</strong><div className="muted small">{ch}</div>
                {play === v[0] && e ? <InlinePlayer embed={e} title={v[1]} /> : <button className="btn small" style={{ marginTop: 6 }} onClick={() => setPlay(v[0])}>▶ Play here</button>}
              </li>); })}
          </ul>
        </section>
      )}
      <ListenNow />
    </div>
  );
}
