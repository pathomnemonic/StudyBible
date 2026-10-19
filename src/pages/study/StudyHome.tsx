import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import Icon from '../../components/Icon';

export default function StudyHome() {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const recent = useLiveQuery(() => db.recentSearches.orderBy('ts').reverse().limit(6).toArray(), []) ?? [];
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) nav(`/study/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <div className="page">
      <h1>Study</h1>
      <p className="lede">Commentary, the Catechism, the Fathers and saints, and search — all connected to the verses you read.</p>
      <form className="search-box" onSubmit={go} role="search">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="John 6:51, “bread of life”, Eucharist, Augustine…" aria-label="Search everything" />
        <button className="btn primary" type="submit">
          <Icon name="search" size={18} /> Search
        </button>
      </form>
      {recent.length > 0 && (
        <div className="chips" style={{ marginBottom: 16 }}>
          <span className="muted small">Recent:</span>
          {recent.map((r) => (
            <Link key={r.id} className="chip" to={`/study/search?q=${encodeURIComponent(r.query)}`}>
              {r.query}
            </Link>
          ))}
        </div>
      )}
      <div className="grid">
        <Link className="card" to="/study/doctrine" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2 className="card-title">Doctrine & Catechism</h2>
          <p className="muted">Topic index (Eucharist, Trinity, grace, Mary…), the Scripture ↔ Catechism links, and official documents.</p>
        </Link>
        <Link className="card" to="/study/fathers" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2 className="card-title">Fathers & saints</h2>
          <p className="muted">Augustine, Chrysostom, Irenaeus, Athanasius, Teresa of Ávila, Catherine of Siena and more, in a reading mode.</p>
        </Link>
        <Link className="card" to="/study/sources" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2 className="card-title">Sources & licensing</h2>
          <p className="muted">Every source: its authority, period, rights and format. What is public domain, what is only linked.</p>
        </Link>
        <Link className="card" to="/listen" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2 className="card-title">Bible in a Year</h2>
          <p className="muted">Episodes mapped to the passages they read.</p>
        </Link>
      </div>
      <p className="muted small" style={{ marginTop: 16 }}>
        Tip: select any verse in the Read tab and tap <Icon name="study" size={14} /> to see everything attached to it.
      </p>
    </div>
  );
}
