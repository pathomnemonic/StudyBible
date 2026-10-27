import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEncArticle, getEncList, type EncArticle } from '../../data/content';
import { readableText } from '../../lib/readable';

/** The 1913 Catholic Encyclopedia articles that were selected for Bible study. */
export default function EncyclopediaPage() {
  const { slug } = useParams();
  const [art, setArt] = useState<EncArticle | null | undefined>(undefined);
  const [list, setList] = useState<{ slug: string; title: string; kind: string }[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => { getEncList().then((l) => setList(l ?? [])); }, []);
  useEffect(() => { setArt(undefined); if (slug) getEncArticle(slug).then(setArt); }, [slug]);
  const shown = useMemo(() => list.filter((a) => !q || a.title.toLowerCase().includes(q.toLowerCase())), [list, q]);
  const credit = <p className="muted small">The Catholic Encyclopedia (1913), public domain, via <a href="https://www.newadvent.org/cathen/" target="_blank" rel="noreferrer">New Advent</a>. Scholarship of its day: read it as background, not as a statement of Church teaching.</p>;
  if (slug) {
    if (art === undefined) return <div className="page"><div className="skeleton-list" aria-busy="true"><i /><i /></div></div>;
    if (!art) return <div className="page"><Link to="/study/encyclopedia">← Encyclopedia</Link><p className="muted">That article is not in the app’s selection.</p></div>;
    return (
      <div className="page">
        <Link to="/study/encyclopedia">← Catholic Encyclopedia</Link>
        <h1>{art.title}</h1>
        {art.author && <p className="muted">{art.author}</p>}
        {art.blocks.map((b, i) => typeof b === 'string' ? <p key={i}>{readableText(b)}</p> : 'q' in b ? <blockquote key={i}>{b.q}</blockquote> : <h2 key={i}>{b.h}</h2>)}
        <p className="small"><a href={art.url} target="_blank" rel="noreferrer">Original at New Advent ↗</a></p>
        {credit}
      </div>
    );
  }
  return (
    <div className="page">
      <h1>The Catholic Encyclopedia</h1>
      <p className="lede">The 1913 articles on Bible books, people, places and topics.</p>
      <input type="search" placeholder="Find an article" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find an article" style={{ width: '100%', maxWidth: 420, marginBottom: 12 }} />
      {(['book', 'person', 'place', 'topic'] as const).map((k) => {
        const items = shown.filter((a) => a.kind === k);
        if (!items.length) return null;
        return <section key={k} className="sect"><h2 className="eyebrow-h">{{ book: 'Books of the Bible', person: 'People', place: 'Places', topic: 'Topics' }[k]} · {items.length}</h2><p className="chips">{items.map((a) => <Link key={a.slug} className="chip" to={`/study/encyclopedia/${a.slug}`}>{a.title}</Link>)}</p></section>;
      })}
      {credit}
    </div>
  );
}
