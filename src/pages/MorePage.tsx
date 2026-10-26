import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FEATURES, HUBS, searchFeatures, visible } from '../lib/features';
import { Group, HubHeader, Tile } from '../components/Hub';
import { useSync } from '../sync/state';

/** Every page in the app, grouped like the tabs. A directory for when something is hard to find; the tabs are the way in. */
export default function MorePage() {
  const [q, setQ] = useState('');
  useSync();
  const found = useMemo(() => (q.trim() ? searchFeatures(q, 40) : null), [q]);
  return (
    <div className="page hub">
      <HubHeader title="Everything" sub="Every part of the app, grouped like the tabs." />
      <input type="search" className="everything-filter" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a feature: rosary, maps, quiz, export…" aria-label="Find a feature" />
      {found ? (
        <Group title={found.length ? `${found.length} found` : 'Nothing matches'}><div className="hub-tiles">{found.map((f) => <Tile key={f.id} f={f} />)}</div></Group>
      ) : (
        HUBS.map((h) => (
          <Group key={h.id} title={h.title} hint={h.blurb}>
            <div className="hub-tiles">{FEATURES.filter((f) => f.hub === h.id && visible(f)).map((f) => <Tile key={f.id} f={f} />)}</div>
            <p className="hub-hint" style={{ margin: '8px 0 0' }}><Link to={h.to}>Open {h.title} →</Link></p>
          </Group>
        ))
      )}
    </div>
  );
}
