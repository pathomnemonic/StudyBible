import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ReadingBlock from '../../components/ReadingBlock';
import { BOOK_PRAYERS } from '../../data/prayerbook';
import { convertRef } from '../../lib/versification';
import { parseRefs, type Ref } from '../../lib/refs';

type Block =
  | { t: 'prayer'; id: string }
  | { t: 'scripture'; ref: string }
  | { t: 'silence'; min: number };

const KEY = 'sb:playlist';
const load = (): Block[] => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return Array.isArray(v) ? v : [{ t: 'prayer', id: 'sign' }, { t: 'silence', min: 2 }, { t: 'prayer', id: 'pater' }]; } catch { return []; } };
const toRefs = (s: string): Ref[] => { const p = parseRefs(s); return p.ok ? p.refs.map((x) => convertRef('kjv', 'vulgate', x.ref).ref) : []; };

function Silence({ min }: { min: number }) {
  const [left, setLeft] = useState(min * 60);
  const [on, setOn] = useState(false);
  useEffect(() => { setLeft(min * 60); setOn(false); }, [min]);
  useEffect(() => {
    if (!on || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [on, left]);
  return (
    <div>
      <p style={{ fontSize: '2rem', margin: '8px 0' }} aria-live="off">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</p>
      <button className="btn primary" onClick={() => setOn(!on)}>{left <= 0 ? 'Finished' : on ? 'Pause' : 'Begin'}</button>
    </div>
  );
}

export default function SessionBuilderPage() {
  const [blocks, setBlocks] = useState<Block[]>(load);
  const [run, setRun] = useState<number | null>(null);
  const [ref, setRef] = useState('');
  const [min, setMin] = useState(2);
  const [pick, setPick] = useState(BOOK_PRAYERS[0].id);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(blocks)); } catch { /* storage unavailable */ } }, [blocks]);
  const label = (b: Block) => b.t === 'prayer' ? BOOK_PRAYERS.find((p) => p.id === b.id)?.title ?? b.id : b.t === 'scripture' ? b.ref : `Silence, ${b.min} min`;
  const move = (i: number, d: number) => setBlocks((bs) => { const n = [...bs]; const j = i + d; if (j < 0 || j >= n.length) return bs; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const cur = run != null ? blocks[run] : null;
  const refs = useMemo(() => (cur?.t === 'scripture' ? toRefs(cur.ref) : []), [cur]);
  if (run != null && cur) {
    const prayer = cur.t === 'prayer' ? BOOK_PRAYERS.find((p) => p.id === cur.id) : null;
    return (
      <div className="page">
        <p><button className="linklike" onClick={() => setRun(null)}>← Edit playlist</button></p>
        <p className="muted small">Step {run + 1} of {blocks.length}</p>
        <div className="progress" aria-hidden><div style={{ width: `${(100 * (run + 1)) / blocks.length}%` }} /></div>
        <section className="card" style={{ marginTop: 10 }} aria-live="polite">
          <h2 className="card-title">{label(cur)}</h2>
          {prayer && <p className="scripture" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>{prayer.text}</p>}
          {cur.t === 'scripture' && <ReadingBlock refs={refs} label="Scripture" text={cur.ref} max={20} />}
          {cur.t === 'silence' && <Silence min={cur.min} />}
        </section>
        <div className="row between" style={{ marginTop: 12 }}>
          <button className="btn" disabled={run === 0} onClick={() => setRun(run - 1)}>Back</button>
          {run < blocks.length - 1 ? <button className="btn primary" onClick={() => setRun(run + 1)}>Next</button> : <button className="btn primary" onClick={() => setRun(null)}>Amen</button>}
        </div>
      </div>
    );
  }
  return (
    <div className="page">
      <p><Link to="/pray">← Prayer</Link></p>
      <h1>Build your own prayer time</h1>
      <p className="lede">Put prayers, Scripture and silence in the order you like, then pray through them one at a time. Your playlist stays on this device.</p>
      <ol className="list">
        {blocks.map((b, i) => (
          <li key={i} className="row between">
            <span>{label(b)}</span>
            <span className="row" style={{ gap: 4 }}>
              <button className="btn small" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="btn small" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === blocks.length - 1}>↓</button>
              <button className="btn small" aria-label="Remove" onClick={() => setBlocks(blocks.filter((_, k) => k !== i))}>✕</button>
            </span>
          </li>
        ))}
        {blocks.length === 0 && <li className="muted">Nothing yet. Add something below.</li>}
      </ol>
      <button className="btn primary" disabled={!blocks.length} onClick={() => setRun(0)}>Begin</button>
      <h2 style={{ marginTop: 18 }}>Add</h2>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Prayer">{BOOK_PRAYERS.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        <button className="btn" onClick={() => setBlocks([...blocks, { t: 'prayer', id: pick }])}>Add prayer</button>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Passage, e.g. Psalm 23 or John 15:1-8" aria-label="Passage" />
        <button className="btn" disabled={!parseRefs(ref).ok} onClick={() => { setBlocks([...blocks, { t: 'scripture', ref: ref.trim() }]); setRef(''); }}>Add Scripture</button>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <select value={min} onChange={(e) => setMin(+e.target.value)} aria-label="Minutes of silence">{[1, 2, 3, 5, 10, 15, 20].map((m) => <option key={m} value={m}>{m} min</option>)}</select>
        <button className="btn" onClick={() => setBlocks([...blocks, { t: 'silence', min }])}>Add silence</button>
      </div>
      <p className="muted small" style={{ marginTop: 14 }}>For the Rosary, the Office and the novenas, use their own pages: <Link to="/pray/devotions">Devotions</Link>, <Link to="/pray/office">Office</Link>, <Link to="/pray/novenas">Novenas</Link>.</p>
    </div>
  );
}
