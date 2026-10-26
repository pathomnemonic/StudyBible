import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FEASTS, type Feast } from '../data/feasts';
import { parseRefs } from '../lib/refs';
import { useSettings } from '../lib/store';
import { useEditions } from '../data/EditionsContext';
import { readerPath } from '../lib/nav';

const SEASONS: Feast['season'][] = ['Advent', 'Christmas', 'Lent', 'Triduum', 'Easter', 'Ordinary Time'];

/** The great feasts of the Roman calendar, each explained, with the readings to pray with. */
export default function FeastsGuide() {
  const [season, setSeason] = useState<Feast['season'] | ''>('');
  const [open, setOpen] = useState('');
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const edition = get(s.defaultEdition) ?? editions[0];
  const shown = FEASTS.filter((f) => !season || f.season === season);
  return (
    <div>
      <div className="chips" role="group" aria-label="Season" style={{ margin: '4px 0 10px' }}>
        <button className={`chip${!season ? ' sel' : ''}`} aria-pressed={!season} onClick={() => setSeason('')}>All</button>
        {SEASONS.map((x) => <button key={x} className={`chip${season === x ? ' sel' : ''}`} aria-pressed={season === x} onClick={() => setSeason(x)}>{x}</button>)}
      </div>
      <ul className="list">
        {shown.map((f) => (
          <li key={f.id}>
            <button className="linklike t" aria-expanded={open === f.id} onClick={() => setOpen(open === f.id ? '' : f.id)}>{f.name}</button>
            <span className="muted small"> · {f.when}{f.obligation ? ' · holy day of obligation' : ''}</span>
            {open === f.id && (
              <div className="card" style={{ marginTop: 6 }}>
                <p style={{ margin: '0 0 6px' }}>{f.about}</p>
                {f.customs && <p className="small" style={{ margin: '0 0 6px' }}><strong>Customs.</strong> {f.customs}</p>}
                <p className="small chips" style={{ margin: 0 }}>
                  {f.scripture.map((r) => {
                    const p = parseRefs(r);
                    if (!p.ok || !edition) return <span key={r} className="chip">{r}</span>;
                    return <Link key={r} className="chip" to={readerPath(edition, p.refs[0].ref)}>{r}</Link>;
                  })}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="muted small">Holy days of obligation follow the usual rule in the United States. Other countries keep different ones, so check with your own bishops’ conference.</p>
    </div>
  );
}
