import { useEffect, useMemo, useState } from 'react';
import { useShows } from '../data/podcasts';
import { getLibraryIndex, type LibraryWorkMeta } from '../data/content';
import { allRecordedWorks } from '../data/librivox';
import { getJson } from '../data/loader';
import { toggleFollow, useFollows } from '../lib/follow';
import { fold } from '../search/engine';
import { updateSettings } from '../lib/store';

type Group = 'podcasts' | 'audiobooks' | 'videos';
const LIMIT = 12;

/** Pick favorite podcasts, audiobooks and video creators. They are followed, so Media puts them first and Today can point to them. Skipping changes nothing: all of it stays available. */
export default function FavoritesPicker({ compact = false }: { compact?: boolean }) {
  const shows = useShows();
  const follows = useFollows();
  const [g, setG] = useState<Group>('podcasts');
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const [works, setWorks] = useState<LibraryWorkMeta[] | null>(null);
  const [channels, setChannels] = useState<string[] | null>(null);
  useEffect(() => {
    if (g === 'audiobooks' && !works) Promise.all([getLibraryIndex(), allRecordedWorks()]).then(([l, r]) => setWorks((l?.works ?? []).filter((w) => r[w.id])));
    if (g === 'videos' && !channels) getJson<{ channels: string[] }>('media/video_library.json', true).then((l) => setChannels(l?.channels ?? []));
  }, [g, works, channels]);
  const items = useMemo(() => {
    const f = fold(q.trim());
    const rows: { key: string; label: string; sub: string }[] =
      g === 'podcasts' ? (shows ?? []).map((s) => ({ key: s.id, label: s.title, sub: s.host }))
        : g === 'audiobooks' ? (works ?? []).map((w) => ({ key: `ab:${w.id}`, label: w.title, sub: w.author }))
        : (channels ?? []).map((c) => ({ key: `vc:${c}`, label: c, sub: '' }));
    return rows.filter((r) => !f || fold(`${r.label} ${r.sub}`).includes(f));
  }, [g, shows, works, channels, q]);
  const shown = all || q ? items : items.slice(0, LIMIT);
  const count = (pre: string | null) => [...follows].filter((k) => (pre ? k.startsWith(pre) : !k.includes(':'))).length;
  const loading = (g === 'podcasts' && !shows) || (g === 'audiobooks' && !works) || (g === 'videos' && !channels);
  return (
    <div className="fav-picker">
      <div className="tabbar" role="tablist" aria-label="What to pick from">
        {([['podcasts', `Podcasts${count(null) ? ` (${count(null)})` : ''}`], ['audiobooks', `Audiobooks${count('ab:') ? ` (${count('ab:')})` : ''}`], ['videos', `Video creators${count('vc:') ? ` (${count('vc:')})` : ''}`]] as [Group, string][]).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={g === k} onClick={() => { setG(k); setAll(false); setQ(''); }}>{l}</button>
        ))}
      </div>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search favorites" style={{ width: '100%', margin: '6px 0' }} />
      {loading ? <p className="muted small">Loading…</p> : (
        <div className="fav-chips" role="group" aria-label={`Choose ${g}`}>
          {shown.map((r) => {
            const on = follows.has(r.key);
            return <button key={r.key} className={`fav-chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => { void toggleFollow(r.key, !on); if (!on && compact) updateSettings({ autoFavorites: true }); }}><span>{on ? '✓ ' : ''}{r.label}</span>{r.sub && <small>{r.sub}</small>}</button>;
          })}
          {!shown.length && <p className="muted small">Nothing matches.</p>}
        </div>
      )}
      {!all && !q && items.length > LIMIT && <button className="btn small" onClick={() => setAll(true)}>Show all {items.length}</button>}
      {!compact && <p className="muted small">Favorites show up first in Media. You can change this any time.</p>}
    </div>
  );
}
