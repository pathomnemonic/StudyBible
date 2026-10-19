import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FEATURES, STATUS_LABEL, type Status } from '../featureStatus';
import { CANON_NOTES } from '../lib/canon';

const COLOR: Record<Status, string> = { working: 'good', partial: 'warn', 'needs-license': 'warn', 'needs-credentials': 'warn', planned: '' };

export default function AboutPage() {
  const [f, setF] = useState<Status | ''>('');
  const list = FEATURES.filter((x) => !f || x.status === f);
  return (
    <div className="page">
      <h1>About & feature status</h1>
      <p className="lede">A study library built on legitimately available texts. This page says plainly what works, what is partial, and what needs a licence, credentials or future work.</p>
      {CANON_NOTES.map((n, i) => <div className="notice info" key={i}>{n}</div>)}
      <div className="chips" style={{ margin: '10px 0' }}>
        <button className={`chip${!f ? ' sel' : ''}`} onClick={() => setF('')}>All</button>
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <button key={s} className={`chip${f === s ? ' sel' : ''}`} onClick={() => setF(s)}>{STATUS_LABEL[s]}</button>)}
      </div>
      {list.map((x, i) => (
        <div className="card" key={i}>
          <div className="row between"><strong>{x.name}</strong><span className={`chip ${COLOR[x.status]}`}>{STATUS_LABEL[x.status]}</span></div>
          <div className="muted small">{x.area}</div>
          <p className="small">{x.detail}</p>
        </div>
      ))}
      <p className="small"><Link to="/study/sources">Sources & licensing</Link> · <Link to="/settings">Settings</Link></p>
    </div>
  );
}
