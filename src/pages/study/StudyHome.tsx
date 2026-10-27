import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { Group, HubHeader, Tiles } from '../../components/Hub';
import { clearRecentSearches, useRecentSearches } from '../../lib/recent';
import { readingsFor } from '../../liturgy/readings';
import { useSettings } from '../../lib/store';
import { addDays, iso } from '../../liturgy/compute';

/** Study: tools for going deeper into the text itself. Lessons and the Catechism are in Learn; resuming is on Today. */
export default function StudyHome({ embedded = false }: { embedded?: boolean } = {}) {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const [s] = useSettings();
  const recent = useRecentSearches(5);
  const go = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) nav(`/study/search?q=${encodeURIComponent(q.trim())}`); };
  // today's Gospel and the coming Sunday's, ready to study
  const [gos, setGos] = useState<{ today?: { text: string; to: string }; sunday?: { text: string; to: string } }>({});
  useEffect(() => {
    const now = new Date();
    const d0 = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const sun = addDays(d0, (7 - d0.getUTCDay()) % 7 || 7);
    const gospel = async (d: Date) => { const r = await readingsFor(s.diocese, iso(d)).catch(() => null); const it = r?.items.find((i) => i.slot === 'gospel'); const f = it?.refs[0]; return it && f ? { text: it.text, to: `/study/passage/${f.book}.${f.c1}${f.v1 ? '.' + f.v1 : ''}` } : undefined; };
    Promise.all([gospel(d0), gospel(sun)]).then(([today, sunday]) => setGos({ today, sunday }));
  }, [s.diocese]);
  return (
    <div className={embedded ? 'hub' : 'page hub'}>
      {!embedded && <HubHeader title="Explore the Bible" sub="Study tools for the text: words, books, people, places and sources." />}
      <div className="hub-search">
        <form className="row" style={{ gap: 8, width: '100%' }} onSubmit={go} role="search">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="John 6:51, bread of life, Augustine…" aria-label="Search everything" />
          <button className="btn" type="submit"><Icon name="search" size={16} /> Search</button>
        </form>
        {recent.length > 0 && <div className="recent-row"><div className="chips">{recent.map((r) => <Link key={r.id} className="chip" to={`/study/search?q=${encodeURIComponent(r.query)}`}>{r.query}</Link>)}</div><button className="linklike small" onClick={() => void clearRecentSearches()} aria-label="Clear recent searches">Clear</button></div>}
      </div>
      {(gos.today || gos.sunday) && (
        <Group open={embedded} title="Study the Mass readings" hint="With the Fathers, commentary and Catechism">
          <div className="hub-tiles">
            {gos.today && <Link className="hub-tile" to={gos.today.to}><span className="hub-ico" aria-hidden="true">☀️</span><span className="hub-tile-t">Today’s Gospel</span><span className="hub-tile-d">{gos.today.text}</span></Link>}
            {gos.sunday && <Link className="hub-tile" to={gos.sunday.to}><span className="hub-ico" aria-hidden="true">⛪</span><span className="hub-tile-t">Sunday’s Gospel</span><span className="hub-tile-d">{gos.sunday.text}</span></Link>}
          </div>
        </Group>
      )}
      <Group open={embedded} title="Words and topics" hint="What the text says, and who said it about the text">
        <Tiles ids={['study.lexicon', 'bible.concordance', 'bible.topical', 'bible.terms', 'bible.quotations', 'bible.fulfilment']} />
      </Group>
      <Group open={embedded} title="Books and passages" hint="Understand what you are reading">
        <Tiles ids={['bible.books', 'bible.synopsis', 'bible.pauline', 'bible.dossier']} />
      </Group>
      <Group open={embedded} title="People and places" hint="The world the text was written in">
        <Tiles ids={['study.maps', 'study.world', 'study.timespace', 'study.people', 'read.gallery']} />
      </Group>
      <Group open={embedded} title="The big picture" hint="How the whole Bible fits together">
        <Tiles ids={['study.universe', 'study.constellation', 'study.themes', 'study.concepts', 'study.voices']} />
      </Group>
      <Group open={embedded} title="Sources and history" hint="Where the text comes from">
        <Tiles ids={['study.textual', 'study.manuscripts', 'study.sources']} />
      </Group>
    </div>
  );
}
