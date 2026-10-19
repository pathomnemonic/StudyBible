import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getIndexes, type IndexData } from '../../study/refData';
import RefChips from '../../components/RefChips';

const TABS: [keyof IndexData, string, string][] = [
  ['parables', 'Parables', 'The parables of Jesus in the Gospels.'],
  ['miracles', 'Miracles', 'The miracles of Jesus, grouped by kind.'],
  ['prophecies', 'Prophecy and fulfilment', 'Passages the New Testament itself links to the Old Testament. Not every messianic reading is listed.'],
  ['covenants', 'Covenants', 'The covenants of salvation history, with key passages.'],
];

/** Indexes of parables, miracles, prophecies and covenants (editorial). */
export default function IndexPage() {
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as keyof IndexData) || 'parables';
  const [data, setData] = useState<IndexData | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    getIndexes().then(setData);
  }, []);
  const lc = q.trim().toLowerCase();
  const rows: any[] = (data?.[tab] ?? []).filter((r: string[]) => !lc || r.join(' ').toLowerCase().includes(lc));
  const cur = TABS.find((t) => t[0] === tab)!;
  return (
    <div className="page">
      <h1>Biblical indexes</h1>
      <div className="segmented" role="tablist" style={{ marginBottom: 12 }}>
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setSp({ tab: k })}>{label}</button>
        ))}
      </div>
      <p className="lede">{cur[2]}</p>
      <input type="search" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter" style={{ width: '100%', marginBottom: 8 }} />
      <div className="card">
        {tab === 'prophecies' ? (
          <table className="parallel">
            <thead><tr><th>Subject</th><th>Old Testament</th><th>New Testament</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]}><td>{r[0]}</td><td><RefChips text={r[1]} /></td><td><RefChips text={r[2]} /></td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ul className="list">
            {rows.map((r) => (
              <li key={r[0]}>
                <strong>{r[0]}</strong> {tab === 'miracles' && <span className="chip">{r[2]}</span>}
                <div><RefChips text={r[1]} /></div>
                {tab === 'covenants' && <p className="muted small" style={{ margin: '4px 0' }}>{r[2]}</p>}
              </li>
            ))}
          </ul>
        )}
        {!rows.length && <p className="muted">Nothing matches.</p>}
      </div>
      <p className="muted small">Editorial indexes written for this app as study aids. Where the New Testament cites an Old Testament text, the pairing is the New Testament’s own; other connections belong in the commentary.</p>
    </div>
  );
}
