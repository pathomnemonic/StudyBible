import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { dayLabel, searchNames, type NameHit } from '../../study/saintNames';

/** Type a first name and see the saints who share it, and the day each is kept. */
export default function SaintNamesPage() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const [hits, setHits] = useState<NameHit[] | null>(null);
  useEffect(() => { let live = true; searchNames(q).then((h) => live && setHits(h)); return () => { live = false; }; }, [q]);
  return (
    <div className="page">
      <h1>Find a saint by name</h1>
      <p className="lede">Your own name, a child’s, a confirmation name: see who shares it, and the day Butler’s calendar keeps for each of them.</p>
      <label className="sr-only" htmlFor="sn">A name</label>
      <input id="sn" type="search" value={q} placeholder="A name, such as Anne or Thomas" autoFocus autoCapitalize="words" onChange={(e) => setSp(e.target.value ? { q: e.target.value } : {}, { replace: true })} style={{ width: '100%', minHeight: 44 }} />
      {q.trim().length >= 2 && hits && !hits.length && <p className="muted">No saint with that name in the list. Try another spelling, or the Latin form.</p>}
      <ul className="list">
        {(hits ?? []).map((h) => (
          <li key={h.name} className="row between" style={{ gap: 8 }}>
            <strong>{h.name}</strong>
            <span className="small">{h.dates.map((d, i) => <span key={d}>{i ? ', ' : ''}<Link to={`/study/saints/${d}?name=${encodeURIComponent(h.name.toLowerCase())}`}>{dayLabel(d)}</Link></span>)}</span>
          </li>
        ))}
      </ul>
      <p className="muted small">The days are those of Alban Butler’s Lives of the Saints (1750s), whose calendar and spellings are older than ours: St. John Chrysostom is kept on January 27 there and on September 13 in the present Roman calendar, and St. John of the Cross on November 24 there and on December 14 now. A few saints who lived after Butler, such as St. John Paul II and St. John Vianney, are included with their present days.</p>
    </div>
  );
}
