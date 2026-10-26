import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import Icon from '../../components/Icon';
import { Group, HubHeader, HubHero, Tiles } from '../../components/Hub';

/** Study: the big-picture tools (people, places, themes, sources). Lessons and the Catechism are in Learn; resuming is on Today. */
export default function StudyHome() {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const recent = useLiveQuery(() => db.recentSearches.orderBy('ts').reverse().limit(5).toArray(), []) ?? [];
  const go = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) nav(`/study/search?q=${encodeURIComponent(q.trim())}`); };
  return (
    <div className="page hub">
      <HubHeader title="Study" sub="Go deeper into the text: people, places, themes and sources." />
      <HubHero tone="study" eyebrow="Search" title="Find anything in the Bible and the library">
        <form className="row" style={{ gap: 8, width: '100%' }} onSubmit={go} role="search">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="John 6:51, bread of life, Augustine…" aria-label="Search everything" />
          <button className="btn" type="submit"><Icon name="search" size={16} /> Search</button>
        </form>
        {recent.length > 0 && <div className="chips" style={{ marginTop: 6 }}>{recent.map((r) => <Link key={r.id} className="chip" to={`/study/search?q=${encodeURIComponent(r.query)}`}>{r.query}</Link>)}</div>}
      </HubHero>
      <Group title="People and places" hint="The world the text was written in">
        <Tiles ids={['study.maps', 'study.world', 'study.timespace', 'study.people', 'read.gallery']} />
      </Group>
      <Group title="The big picture" hint="How the whole Bible fits together">
        <Tiles ids={['study.universe', 'study.constellation', 'study.themes', 'study.concepts', 'study.voices']} />
      </Group>
      <Group title="Sources and history" hint="Where the text comes from">
        <Tiles ids={['study.textual', 'study.manuscripts', 'study.sources']} />
      </Group>
      <p className="hub-hint">Looking for a concordance, book outlines or the Gospel comparison? Open any chapter in <Link to="/read">the Bible</Link> and tap <strong>Bible tools</strong>.</p>
    </div>
  );
}
