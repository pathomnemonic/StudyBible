import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../lib/store';
import { FEATURES, HUBS, searchFeatures, type Feature } from '../lib/features';
import { NewDot } from '../components/Hints';

/** A plain map of everything in the app, grouped like the tabs, with a filter and a red dot on what you have not opened. */
export default function MorePage() {
  const [s] = useSettings();
  const [q, setQ] = useState('');
  const found = useMemo(() => (q.trim() ? searchFeatures(q, 40) : null), [q]);
  const link = (f: Feature) => (
    <li key={f.id}>
      <Link to={f.to === '/read' && s.last ? `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}` : f.to} data-seen={f.id}>
        <span className="t">{f.title} <NewDot id={f.id} inline label="New" /></span>
        <span className="d">{f.blurb}</span>
        <span className="go" aria-hidden="true">→</span>
      </Link>
    </li>
  );
  return (
    <div className="page">
      <h1>Everything in Study Bible</h1>
      <p className="lede">Every part of the app in one list, grouped like the tabs. A red dot marks something you have not opened yet.</p>
      <input type="search" className="everything-filter" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a feature: rosary, maps, quiz, export…" aria-label="Find a feature" />
      {found ? (
        <section className="tool-group"><h2>{found.length ? `${found.length} found` : 'Nothing matches'}</h2><ul>{found.map(link)}</ul></section>
      ) : (
        <div className="tool-groups">
          {HUBS.map((h) => (
            <section key={h.id} className="tool-group">
              <h2><Link to={h.to}>{h.title}</Link></h2>
              <p className="muted small">{h.blurb}</p>
              <ul>{FEATURES.filter((f) => f.hub === h.id).map(link)}</ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
