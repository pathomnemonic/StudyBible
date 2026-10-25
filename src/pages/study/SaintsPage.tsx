import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { butlerDay, nameScore, nameTokens, type ButlerEntry } from '../../study/butler';
import Icon from '../../components/Icon';

const today = () => { const d = new Date(); return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const shift = (md: string, n: number) => { const d = new Date(Date.UTC(2024, +md.slice(0, 2) - 1, +md.slice(3) + n)); return `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; };
const label = (md: string) => new Date(Date.UTC(2024, +md.slice(0, 2) - 1, +md.slice(3))).toLocaleDateString(undefined, { month: 'long', day: 'numeric', timeZone: 'UTC' });
const OCR = new Set(['04', '05', '06', '08', '09', '10', '11', '12']);

/** Alban Butler's Lives of the Saints, for a calendar day. */
export default function SaintsPage() {
  const { md = today() } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const day = /^\d{2}-\d{2}$/.test(md) ? md : today();
  const [list, setList] = useState<ButlerEntry[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hit, setHit] = useState(-1);
  useEffect(() => { setList(null); butlerDay(day).then((l) => { setList(l); const w = nameTokens(sp.get('name') ?? ''); let i = -1, top = 0.6; l.forEach((e, k) => { const sc = nameScore(nameTokens(e.name), w); if (sc > top) { top = sc; i = k; } }); setOpen(i >= 0 ? i : l.length === 1 ? 0 : null); setHit(i); }); }, [day]);
  return (
    <div className="page">
      <h1>Lives of the Saints</h1>
      <p className="lede">Alban Butler’s eighteenth-century lives, day by day. Butler keeps the feast days of his own calendar, which can differ from today’s, so a saint may sit a day or two away from where you expect.</p>
      <div className="row" style={{ gap: 8, marginBottom: 10 }}>
        <button className="icon-btn" onClick={() => nav(`/study/saints/${shift(day, -1)}`)} aria-label="Previous day"><Icon name="chevL" /></button>
        <strong>{label(day)}</strong>
        <button className="icon-btn" onClick={() => nav(`/study/saints/${shift(day, 1)}`)} aria-label="Next day"><Icon name="chevR" /></button>
        <input type="date" aria-label="Pick a day" onChange={(e) => e.target.value && nav(`/study/saints/${e.target.value.slice(5)}`)} />
      </div>
      {OCR.has(day.slice(0, 2)) && <div className="notice">This month was scanned from an old print and has not been proofread, so expect misprints and the odd damaged heading.</div>}
      {list === null && <div className="skeleton-list" aria-busy="true"><i /><i /></div>}
      {list?.length === 0 && <p className="muted">No life is printed for this day in Butler.</p>}
      {list?.map((e, i) => (
        <article key={i} className="card" style={i === hit ? { outline: '2px solid var(--accent)' } : undefined} ref={(el) => { if (el && i === hit && !el.dataset.seen) { el.dataset.seen = '1'; el.scrollIntoView({ block: 'start' }); } }}>
          <h2 className="card-title">{e.name}</h2>
          {(open === i ? e.text : e.text.slice(0, 2)).map((p, k) => <p key={k}>{p}</p>)}
          {e.text.length > 2 && <button className="btn small" onClick={() => setOpen(open === i ? null : i)}>{open === i ? 'Show less' : 'Read the whole life'}</button>}
        </article>
      ))}
      <p className="muted small">Source: Alban Butler, <em>The Lives of the Fathers, Martyrs, and Other Principal Saints</em> (public domain; footnotes omitted). Editions are listed under <Link to="/study/sources">Sources</Link>.</p>
    </div>
  );
}
