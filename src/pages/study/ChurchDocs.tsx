import LibraryTabs from '../../components/LibraryTabs';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../data/loader';

interface Doc { id: string; title: string; author: string; year: string; kind: string; access: 'full-text' | 'link-only'; libraryWorkId: string | null; sectionIndex?: number; url: string; blurb: string }
const GROUPS: [string, string[]][] = [
  ['Councils', ['council', 'council decree', 'council constitution', 'council declaration']],
  ['Catechisms and law', ['catechism', 'code of law']],
  ['Encyclicals', ['encyclical']],
  ['Letters, exhortations and constitutions', ['apostolic letter', 'apostolic exhortation', 'apostolic constitution', 'motu proprio']],
  ['Other documents', ['document', 'pbc document']],
];

/** The Church's own documents. The older ones, whose English translations are in the public domain, are read here in full; the rest are linked to the official text and never copied. */
export default function ChurchDocs() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [q, setQ] = useState('');
  const [cites, setCites] = useState<Record<string, number>>({});
  useEffect(() => { getJson<{ works: { id: string; cites: number }[] }>('library/galaxy.json', true).then((g) => setCites(Object.fromEntries((g?.works ?? []).map((w) => [w.id, w.cites])))).catch(() => {}); }, []);
  const [access, setAccess] = useState<'all' | 'full-text' | 'link-only'>('all');
  useEffect(() => { getJson<{ docs: Doc[] }>('church/docs.json', true).then((d) => setDocs(d?.docs ?? [])); }, []);
  const list = useMemo(() => docs.filter((d) => (access === 'all' || d.access === access) && (!q || `${d.title} ${d.author} ${d.year} ${d.blurb}`.toLowerCase().includes(q.toLowerCase()))), [docs, q, access]);
  return (
    <div className="page">
      <LibraryTabs />
      <h1>Councils and Church documents</h1>
      <p className="lede">Councils, catechisms and encyclicals. Where an English translation is in the public domain it opens here as a full text you can read, search and note. Most modern documents are under copyright, so for those this page gives the official link and a line about what the document is: it never reproduces them.</p>
      <div className="row" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <input type="search" placeholder="Filter by title, pope, year…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter documents" />
        {([['all', 'All'], ['full-text', 'Read here in full'], ['link-only', 'Official link only']] as const).map(([k, l]) => <button key={k} className={`chip${access === k ? ' sel' : ''}`} aria-pressed={access === k} onClick={() => setAccess(k)}>{l}</button>)}
      </div>
      {GROUPS.map(([title, kinds]) => {
        const items = list.filter((d) => kinds.includes(d.kind)).sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));
        if (!items.length) return null;
        return (
          <section key={title} className="sect">
            <h2 className="eyebrow-h">{title} · {items.length}</h2>
            <div className="shelf">
              {items.map((d) => (
                d.access === 'full-text' && d.libraryWorkId ? (
                  <Link key={d.id} className="shelf-card" to={`/study/works/${d.libraryWorkId}/${d.sectionIndex ?? 0}`}>
                    <span className="t">{d.title}</span>
                    <span className="d">{d.author} · {d.year}</span>
                    <span className="d">{d.blurb}</span>
                    <span className="chip good">Read here</span>
                    {cites[d.libraryWorkId] > 0 && <span className="d">Tied to {cites[d.libraryWorkId]} places in Scripture</span>}
                  </Link>
                ) : (
                  <a key={d.id} className="shelf-card" href={d.url} target="_blank" rel="noreferrer">
                    <span className="t">{d.title} ↗</span>
                    <span className="d">{d.author} · {d.year}</span>
                    <span className="d">{d.blurb}</span>
                    <span className="chip">Official text (link)</span>
                  </a>
                )
              ))}
            </div>
          </section>
        );
      })}
      {docs.length > 0 && list.length === 0 && <div className="empty">No document matches that search. Try a pope’s name, a year or a word from the title, or choose “All”.</div>}
    </div>
  );
}
