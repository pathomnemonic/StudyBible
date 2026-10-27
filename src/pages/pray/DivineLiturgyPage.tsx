import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../data/loader';

interface Block { who: 'deacon' | 'priest' | 'choir' | 'reader' | 'rubric' | 'text'; sec?: boolean; t: string }
const LABEL: Record<string, string> = { deacon: 'Deacon', priest: 'Priest', choir: 'Choir', reader: 'Reader' };

/** The Byzantine Divine Liturgy of St John Chrysostom, for following along. English rendering of 1914 (public domain). */
export default function DivineLiturgyPage() {
  const [d, setD] = useState<{ title: string; blocks: Block[] } | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { getJson<{ title: string; blocks: Block[] }>('liturgy/chrysostom.json').then(setD).catch((e) => setErr(String(e.message ?? e))); }, []);
  return (
    <div className="page office">
      <h1>Divine Liturgy of St John Chrysostom</h1>
      <p className="lede">The Byzantine Liturgy, for following along at church or praying with. The Epistle, Gospel and the hymns that change each day are not here: today’s readings are on the <Link to="/pray/readings">Readings</Link> page, and the Church’s books give the hymns.</p>
      <div className="notice info" role="note"><strong>A guide to the order of the service.</strong> An English rendering of 1914 (public domain); your Church’s own wording differs.</div>
      {err && <p role="alert" className="card">Could not load the Liturgy ({err}).</p>}
      {!d && !err && <p className="muted">Loading…</p>}
      {d?.blocks.map((b, i) => b.who === 'rubric'
        ? <p key={i} className="muted small" style={{ fontStyle: 'italic' }}>{b.t}</p>
        : b.who === 'text'
          ? <p key={i}>{b.t}</p>
          : <p key={i}><span className="office-k">{LABEL[b.who]}{b.sec ? ' (quietly)' : ''}.</span> {b.t}</p>)}
    </div>
  );
}
