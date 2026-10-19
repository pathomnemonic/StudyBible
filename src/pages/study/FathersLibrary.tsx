import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthors, getLibraryIndex, type LibraryWorkMeta } from '../../data/content';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

const PERIODS: Record<string, string> = { patristic: 'Patristic (to c. 750)', medieval: 'Medieval', 'early-modern': 'Early modern' };

export default function FathersLibrary() {
  const [works, setWorks] = useState<LibraryWorkMeta[]>([]);
  const [authors, setAuthors] = useState<Record<string, { name: string; dates: string; bio: string }>>({});
  const [period, setPeriod] = useState('');
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const progress = useLiveQuery(() => db.libraryProgress.toArray(), []) ?? [];
  useEffect(() => {
    getLibraryIndex().then((l) => setWorks(l?.works ?? []));
    getAuthors().then((a) => setAuthors(a?.authors ?? {}));
  }, []);
  const list = useMemo(() => works.filter((w) => (!period || w.period === period) && (!kind || w.kind === kind) && (!q || (w.title + w.author).toLowerCase().includes(q.toLowerCase()))), [works, period, kind, q]);
  const byAuthor = useMemo(() => {
    const m = new Map<string, LibraryWorkMeta[]>();
    for (const w of list) (m.get(w.authorId) ?? m.set(w.authorId, []).get(w.authorId)!).push(w);
    return [...m.entries()];
  }, [list]);
  return (
    <div className="page">
      <h1>Fathers & saints</h1>
      <p className="lede">Full texts of public-domain English translations, searchable and linked to the verses they comment on or cite. Each work names its translator and source; summaries are never mixed with the original wording.</p>
      <div className="row" style={{ marginBottom: 12 }}>
        <input type="search" placeholder="Filter by title or author…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter works" />
        <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period"><option value="">Any period</option>{Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind"><option value="">Any kind</option>{[...new Set(works.map((w) => w.kind))].map((k) => <option key={k}>{k}</option>)}</select>
        <button className="btn" onClick={() => nav('/study/search')}>Search all texts</button>
      </div>
      {byAuthor.map(([id, ws]) => (
        <section key={id} className="sect">
          <h3 style={{ textTransform: 'none', fontSize: '1.1rem', letterSpacing: 0 }}>{authors[id]?.name ?? ws[0].author} <span className="muted small">{authors[id]?.dates}</span></h3>
          <p className="muted small">{authors[id]?.bio}</p>
          {ws.map((w) => {
            const p = progress.find((x) => x.workId === w.id);
            return (
              <div className="card" key={w.id}>
                <div className="row between">
                  <h3><Link to={`/study/works/${w.id}/${p?.section ?? ''}`}>{w.title}</Link></h3>
                  <span className="chip">{w.year}</span>
                </div>
                <p>{w.description}</p>
                <div className="chips"><span className="chip">{w.sections.length} sections</span><span className="chip">{Math.round(w.sections.reduce((a, s) => a + s.words, 0) / 1000)}k words</span><span className="chip good">public domain</span><span className="chip">{w.authority === 'father' ? 'Church Father' : 'Saint / spiritual master'}</span></div>
                <p className="muted small">Translator: {w.translator}. Source: {w.source.name}.</p>
                {p && <p className="small">Continue from section {Number(p.section) + 1}.</p>}
              </div>
            );
          })}
        </section>
      ))}
      {byAuthor.length === 0 && <div className="empty">No works match.</div>}
      <p className="muted small">More works can be added through <code>data/registry/library.json</code>; see docs/INGESTION.md. A few well-known texts were deliberately left out because their translation’s copyright status could not be verified.</p>
    </div>
  );
}
