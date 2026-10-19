import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTopicIndex, getTopics } from '../../data/content';
import RefLink from '../../components/RefLink';

/** Topical index: browse topics (OpenBible.info, CC BY) and the passages readers tied to them. */
export default function TopicalPage() {
  const [sp, setSp] = useSearchParams();
  const [index, setIndex] = useState<[string, number][]>([]);
  const [topics, setTopics] = useState<Record<string, [string, number][]> | null>(null);
  const [q, setQ] = useState('');
  const topic = sp.get('topic');
  useEffect(() => {
    getTopicIndex().then((i) => setIndex(i ?? []));
    getTopics().then(setTopics);
  }, []);
  const letters = useMemo(() => [...new Set(index.map(([n]) => n[0].toUpperCase()))].sort(), [index]);
  const list = useMemo(() => {
    const lc = q.trim().toLowerCase();
    return index.filter(([n]) => !lc || n.toLowerCase().includes(lc));
  }, [index, q]);
  const passages = topic && topics ? topics[topic] : null;
  return (
    <div className="page">
      <h1>Topical index</h1>
      <p className="lede">Topics and the passages readers connected to them. This is a community-voted aid for finding passages; it is not Church teaching. For doctrine, use the Doctrine & Catechism pages.</p>
      {topic ? (
        <div className="card">
          <div className="row between">
            <h2 className="card-title">{topic}</h2>
            <button className="btn small" onClick={() => setSp({})}>All topics</button>
          </div>
          {!passages && <p className="muted">Loading…</p>}
          <ul className="list">
            {passages?.map(([id, score]) => (
              <li key={id}>
                <RefLink id={id} /> <span className="chip">score {score}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <input type="search" placeholder="Find a topic…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a topic" style={{ width: '100%', marginBottom: 8 }} />
          {!q && <p className="small">{letters.map((l) => <a key={l} href={`#topic-${l}`} style={{ marginRight: 8 }} onClick={(e) => { e.preventDefault(); document.getElementById(`topic-${l}`)?.scrollIntoView(); }}>{l}</a>)}</p>}
          <div className="chips" style={{ flexWrap: 'wrap' }}>
            {list.slice(0, 1500).map(([n, c], i) => (
              <span key={n} style={{ display: 'contents' }}>
                {!q && (i === 0 || list[i - 1][0][0].toUpperCase() !== n[0].toUpperCase()) && <h3 id={`topic-${n[0].toUpperCase()}`} style={{ width: '100%', margin: '12px 0 2px' }}>{n[0].toUpperCase()}</h3>}
                <button className="chip" onClick={() => setSp({ topic: n })}>{n} <span className="muted">{c}</span></button>
              </span>
            ))}
          </div>
          {list.length > 1500 && <p className="muted small">Showing 1,500 of {list.length}; search to narrow.</p>}
        </>
      )}
      <p className="muted small" style={{ marginTop: 16 }}>Topical data © OpenBible.info, CC BY 4.0. Scores come from user votes; verse numbers were converted to the app’s anchor numbering.</p>
    </div>
  );
}
