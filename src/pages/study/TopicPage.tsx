import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cccUrl, CCC_OFFICIAL, getDoctrine, type DoctrineData } from '../../data/content';
import RefLink from '../../components/RefLink';
import { parseRefId } from '../../lib/refs';
import { db } from '../../db/db';

export default function TopicPage() {
  const { id } = useParams();
  const [d, setD] = useState<DoctrineData | null>(null);
  useEffect(() => {
    getDoctrine().then(setD);
  }, []);
  if (!d) return <div className="center-note">Loading…</div>;
  const t = d.topics.find((x) => x.id === id);
  if (!t) return <div className="page"><p>Topic not found. <Link to="/study/doctrine">All topics</Link></p></div>;
  return (
    <div className="page">
      <Link to="/study/doctrine" className="small">← Doctrine index</Link>
      <h1>{t.title}</h1>
      <div className="notice info">
        Editorial entry point. The summary is written for this app; the passages and Catechism ranges below are <strong>suggested topical connections</strong>, not a statement that each text “proves” a doctrine. Follow the sources for the Church’s actual wording.
      </div>
      <p className="md" style={{ lineHeight: 1.6 }}>{t.summary}</p>

      <h2 style={{ fontSize: '1.15rem' }}>Catechism of the Catholic Church</h2>
      <p className="muted small">Paragraph ranges where the Catechism treats this topic (suggested). Links open the paragraph online; the app does not reproduce Catechism text.</p>
      <ul className="list">
        {t.ccc.map(([a, b]) => (
          <li key={a}>
            §{a}{b !== a ? `–${b}` : ''} · <a href={cccUrl(a)} target="_blank" rel="noreferrer">Open §{a}</a>{' '}
            <button className="btn small ghost" onClick={() => db.saved.add({ key: `ccc:${a}`, type: 'catechism', label: `CCC §${a}${b !== a ? '–' + b : ''} (${t.title})`, url: cccUrl(a), createdAt: Date.now() }).catch(() => {})}>Save</button>
          </li>
        ))}
        <li><a href={CCC_OFFICIAL} target="_blank" rel="noreferrer">Official Catechism (Vatican) — table of contents ↗</a></li>
      </ul>

      <h2 style={{ fontSize: '1.15rem' }}>Key passages</h2>
      <div className="chips">
        {t.scripture.map((s) => {
          const r = parseRefId(s);
          return r ? <span key={s} className="chip"><RefLink refv={r} /> · <Link to={`/study/passage/${s}`}>study</Link></span> : null;
        })}
      </div>

      {t.docs.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.15rem' }}>Official documents</h2>
          <ul className="list">
            {t.docs.map((k) => (
              <li key={k}>
                <a href={d.documents[k].url} target="_blank" rel="noreferrer">{d.documents[k].title} ↗</a>
                <div className="muted small">{d.documents[k].body} · {d.documents[k].level === 'doctrine' ? 'Official doctrine (conciliar constitution)' : 'Authoritative Church teaching'}</div>
              </li>
            ))}
          </ul>
        </>
      )}
      {t.related.length > 0 && (
        <p className="small">Related: {t.related.map((r) => (
          <Link key={r} to={`/study/topics/${r}`} style={{ marginRight: 10 }}>{d.topics.find((x) => x.id === r)?.title}</Link>
        ))}</p>
      )}
    </div>
  );
}
