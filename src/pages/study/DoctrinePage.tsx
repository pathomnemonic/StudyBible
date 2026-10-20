import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cccUrl, CCC_OFFICIAL, getCccLinks, getDoctrine, type DoctrineData } from '../../data/content';
import { parseRefId, formatRef } from '../../lib/refs';
import RefLink from '../../components/RefLink';
import { fold } from '../../search/engine';
import { db } from '../../db/db';

export default function DoctrinePage() {
  const [d, setD] = useState<DoctrineData | null>(null);
  const [links, setLinks] = useState<{ ref: string; para: number; kind: string; verifiedOn: string }[]>([]);
  const [q, setQ] = useState('');
  const [para, setPara] = useState('');
  useEffect(() => {
    getDoctrine().then(setD);
    getCccLinks().then((x) => setLinks(x?.links ?? []));
  }, []);
  const topics = useMemo(() => (d?.topics ?? []).filter((t) => !q || fold([t.title, t.summary, ...t.keywords].join(' ')).includes(fold(q))), [d, q]);
  const byPara = useMemo(() => {
    const m = new Map<number, typeof links>();
    for (const l of links) (m.get(l.para) ?? m.set(l.para, []).get(l.para)!).push(l);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [links]);
  if (!d) return <div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /><i /></div>;
  return (
    <div className="page">
      <h1>Doctrine & Catechism</h1>
      <p className="lede">Scripture and Church teaching, connected in both directions.</p>
      <div className="card">
        <h3>How the Church’s teaching is labelled here</h3>
        <ul className="list small">
          {Object.entries(d.levels).map(([k, v]) => (
            <li key={k}><strong>{k}</strong> — {v}</li>
          ))}
        </ul>
        <p className="muted small">A <em>direct citation</em> means the source itself quotes the verse. A <em>suggested topical connection</em> is an editorial pointer. They are never mixed.</p>
      </div>

      <h2 style={{ fontSize: '1.2rem' }}>Topics</h2>
      <input type="search" placeholder="Filter doctrine index (e.g. Mary, grace, sacrifice)…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%', marginBottom: 10 }} aria-label="Filter topics" />
      <div className="grid">
        {topics.map((t) => (
          <Link key={t.id} to={`/study/topics/${t.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3>{t.title}</h3>
            <p className="muted small">{t.summary.slice(0, 120)}…</p>
          </Link>
        ))}
        {topics.length === 0 && <div className="empty">No topic matches. Try a single word such as “grace” or “baptism”, or use the main search.</div>}
      </div>

      <h2 style={{ fontSize: '1.2rem', marginTop: 24 }}>Catechism paragraph ↔ Scripture</h2>
      <p className="muted small">
        Verified verse-level links: each paragraph below was checked to contain the quoted or discussed phrase. This is a seed set — the full Scripture index of the Catechism needs a licensed data file (see docs/DATA_SOURCES.md).
      </p>
      <div className="row" style={{ marginBottom: 8 }}>
        <input type="text" inputMode="numeric" placeholder="Open Catechism paragraph…" value={para} onChange={(e) => setPara(e.target.value.replace(/\D/g, ''))} aria-label="Catechism paragraph number" />
        <a className="btn" href={para ? `#/study/catechism/${para}` : '#/study/catechism'}>{para ? `Read §${para}` : 'Official table of contents ↗'}</a>
      </div>
      <table className="parallel">
        <thead><tr><th>Catechism</th><th>Scripture</th><th>Type</th><th></th></tr></thead>
        <tbody>
          {byPara.map(([p, ls]) => (
            <tr key={p}>
              <td><a href={`#/study/catechism/${p}`}>§{p}</a></td>
              <td>{ls.map((l, i) => { const r = parseRefId(l.ref)!; return <span key={i} style={{ marginRight: 8 }}><RefLink refv={r}>{formatRef(r)}</RefLink></span>; })}</td>
              <td className="small">{ls[0].kind === 'quotation' ? 'quotes the passage' : 'discusses the passage'}</td>
              <td><button className="btn small ghost" onClick={() => db.saved.add({ key: `ccc:${p}`, type: 'catechism', label: `CCC §${p} · ${ls.map((l) => formatRef(parseRefId(l.ref)!)).join(', ')}`, url: cccUrl(p), createdAt: Date.now() }).catch(() => {})}>Save</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: '1.2rem', marginTop: 24 }}>Official documents</h2>
      <ul className="list">
        {Object.entries(d.documents).map(([k, doc]) => (
          <li key={k}>
            <a href={doc.url} target="_blank" rel="noreferrer">{doc.title} ↗</a>
            <div className="muted small">{doc.body} · {doc.level === 'doctrine' ? 'Official doctrine' : 'Authoritative teaching'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
