import { useEffect, useMemo, useState } from 'react';
import { getAuthors, getLibraryIndex, getSources, type LibraryWorkMeta } from '../../data/content';
import { useEditions } from '../../data/EditionsContext';
import type { Source } from '../../lib/types';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [works, setWorks] = useState<LibraryWorkMeta[]>([]);
  const [authors, setAuthors] = useState<Record<string, { name: string; dates: string; bio: string; period: string }>>({});
  const [auth, setAuth] = useState('');
  const [rights, setRights] = useState('');
  const [period, setPeriod] = useState('');
  const { editions, planned } = useEditions();
  useEffect(() => {
    getSources().then((s) => setSources(s?.sources ?? []));
    getLibraryIndex().then((l) => setWorks(l?.works ?? []));
    getAuthors().then((a) => setAuthors(a?.authors ?? {}));
  }, []);
  const list = useMemo(() => sources.filter((s) => (!auth || s.authority === auth) && (!rights || s.rights === rights) && (!period || s.period === period)), [sources, auth, rights, period]);
  return (
    <div className="page">
      <h1>Sources & licensing</h1>
      <p className="lede">Nothing here is copied without permission. Each source records its authority, period, language, rights and format; anything not public domain or openly licensed is only linked.</p>
      <div className="row" style={{ marginBottom: 10 }}>
        <select value={auth} onChange={(e) => setAuth(e.target.value)} aria-label="Authority"><option value="">Any authority</option>{['doctrine', 'magisterial', 'father', 'saint', 'scholarship', 'historical', 'reflection', 'media'].map((a) => <option key={a}>{a}</option>)}</select>
        <select value={rights} onChange={(e) => setRights(e.target.value)} aria-label="Rights"><option value="">Any rights status</option>{['public-domain', 'open-license', 'metadata-only', 'external-link', 'licensed'].map((a) => <option key={a}>{a}</option>)}</select>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period"><option value="">Any period</option>{['patristic', 'medieval', 'early-modern', 'contemporary'].map((a) => <option key={a}>{a}</option>)}</select>
      </div>
      {list.map((s) => (
        <div className="card" key={s.id}>
          <div className="row between"><h3>{s.name}</h3><span className={`chip ${s.rights === 'public-domain' || s.rights === 'open-license' ? 'good' : 'warn'}`}>{s.rights}</span></div>
          <div className="chips"><span className="chip">{s.authority}</span>{s.period && <span className="chip">{s.period}</span>}<span className="chip">{s.language}</span>{s.formats.map((f) => <span key={f} className="chip">{f}</span>)}</div>
          <p>{s.description}</p>
          <p className="muted small">{s.rightsNote}</p>
          {s.website && <a className="small" href={s.website} target="_blank" rel="noreferrer">{s.website} ↗</a>}
        </div>
      ))}

      <h2 style={{ fontSize: '1.2rem' }}>Bible editions</h2>
      {editions.map((e) => (
        <div className="card" key={e.id}>
          <div className="row between"><h3>{e.name}</h3><span className="chip good">{e.rights}</span></div>
          <p className="small">{e.rightsBasis}</p>
          <p className="muted small">{e.attribution} · <a href={e.sourceUrl} target="_blank" rel="noreferrer">source ↗</a></p>
        </div>
      ))}
      {planned.map((e) => (
        <div className="card" key={e.id}>
          <div className="row between"><h3>{e.name}</h3><span className="chip warn">{e.rights}</span></div>
          <p className="small">{e.note}</p>
        </div>
      ))}

      <h2 style={{ fontSize: '1.2rem' }}>Works in the Fathers & saints library</h2>
      {works.map((w) => (
        <div className="card" key={w.id}>
          <h3>{w.title} — {w.author}</h3>
          <p className="small">Translator/edition: {w.translator ?? '—'}</p>
          <p className="muted small">Rights evidence: {w.rightsEvidence} · Source: <a href={w.source.url} target="_blank" rel="noreferrer">{w.source.name} ↗</a> · retrieved {w.source.retrieved}</p>
        </div>
      ))}
      <h2 style={{ fontSize: '1.2rem' }}>Authors</h2>
      <ul className="list small">
        {Object.values(authors).sort((a, b) => a.name.localeCompare(b.name)).map((a) => (<li key={a.name}><strong>{a.name}</strong> ({a.dates}, {a.period}) — {a.bio}</li>))}
      </ul>
    </div>
  );
}
