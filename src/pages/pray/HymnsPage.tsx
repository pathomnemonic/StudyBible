import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../data/loader';

interface Src { label: string; url: string }
interface Hymn {
  id: string; title: string; english: string; seasons: string[]; feast: string; background: string; backgroundSource: Src;
  latin: { text: string[]; source: Src } | null; latinNote?: string;
  translation: { text: string[]; translator: string; year: string; source: Src } | null; translationNote?: string;
}
const SEASONS = ['Pentecost', 'Lent and Holy Week', 'Easter', 'Corpus Christi and the Eucharist', 'Marian', 'All Souls and the dead', 'Thanksgiving'];

/** Old Latin hymns and chants with public-domain English translations. Every text is checked against a saved copy of its source (tests/hymns.test.ts). */
export default function HymnsPage() {
  const [data, setData] = useState<{ about: string; hymns: Hymn[] } | null | undefined>(undefined);
  const [season, setSeason] = useState<string>('All');
  useEffect(() => { getJson<{ about: string; hymns: Hymn[] }>('hymns/hymns.json', true).then(setData).catch(() => setData(null)); }, []);
  const list = useMemo(() => (data?.hymns ?? []).filter((h) => season === 'All' || h.seasons.includes(season)), [data, season]);
  return (
    <div className="page hy-page">
      <Link to="/pray" className="small">← Pray</Link>
      <h1>Hymns and chants</h1>
      <p className="muted">Old Latin texts of the Church, with English translations from before 1929 that are in the public domain. For recordings, see <Link to="/listen/meditate">Meditate</Link>.</p>
      <div className="chips" role="group" aria-label="Filter by season">
        {['All', ...SEASONS].map((s) => <button key={s} className={`chip${season === s ? ' on' : ''}`} aria-pressed={season === s} onClick={() => setSeason(s)}>{s}</button>)}
      </div>
      {data === undefined && <div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /></div>}
      {data === null && <p className="muted">The hymns could not be loaded.</p>}
      {list.map((h) => (
        <article key={h.id} className="card hy-card" id={h.id}>
          <p className="eyebrow">{h.seasons.join(' · ')}</p>
          <h2>{h.title}</h2>
          <p className="hy-en">{h.english}</p>
          <p className="muted"><strong>Used at.</strong> {h.feast}</p>
          <p>{h.background} <span className="muted small">(<a href={h.backgroundSource.url} target="_blank" rel="noreferrer noopener">{h.backgroundSource.label}</a>)</span></p>
          <div className="hy-cols">
            <section aria-label="Latin">
              <h3>Latin</h3>
              {h.latin ? <>{h.latin.text.map((s, i) => <p key={i} lang="la" className="hy-stanza">{s}</p>)}<p className="muted small">Source: <a href={h.latin.source.url} target="_blank" rel="noreferrer noopener">{h.latin.source.label}</a></p></> : <p className="muted">{h.latinNote}</p>}
            </section>
            <section aria-label="English">
              <h3>English</h3>
              {h.translation ? <>{h.translation.text.map((s, i) => <p key={i} className="hy-stanza">{s}</p>)}<p className="muted small">Translation: {h.translation.translator}, {h.translation.year}. Source: <a href={h.translation.source.url} target="_blank" rel="noreferrer noopener">{h.translation.source.label}</a></p></> : <p className="muted">{h.translationNote}</p>}
            </section>
          </div>
        </article>
      ))}
      {data && list.length === 0 && <p className="muted">Nothing in this season yet.</p>}
      {data && <p className="muted small">{data.about} Not yet included: Exsultet and others, because no checkable public-domain English text was found.</p>}
    </div>
  );
}
