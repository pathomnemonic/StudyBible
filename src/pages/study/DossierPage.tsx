import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseRefs, refId } from '../../lib/refs';
import { convertRef } from '../../lib/versification';

/** Type any passage and open its full study page: text, Catechism, commentary, Fathers, homilies, videos and more. */
export default function DossierPage() {
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseRefs(q);
    if (!p.ok) return setErr(p.error);
    nav(`/study/passage/${encodeURIComponent(refId(convertRef('kjv', 'vulgate', p.refs[0].ref).ref))}`);
  };
  return (
    <div className="page">
      <h1>Passage dossier</h1>
      <p className="lede">Type a passage to gather everything the app has on it in one page you can read or print: the text, the Catechism, commentary, the Fathers, homilies, videos and questions.</p>
      <form onSubmit={go} className="row" style={{ gap: 6 }}>
        <input value={q} onChange={(e) => { setQ(e.target.value); setErr(''); }} placeholder="e.g. John 6:51-58" aria-label="Passage" style={{ flex: 1 }} />
        <button className="btn primary" type="submit">Open</button>
      </form>
      {err && <p role="alert" className="muted">{err}</p>}
    </div>
  );
}
