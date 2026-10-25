import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReadingBlock from '../../components/ReadingBlock';
import { useSettings } from '../../lib/store';
import { useWakeLock } from '../../lib/wakeLock';
import { convertRef } from '../../lib/versification';
import { parseRefs, type Ref } from '../../lib/refs';
import { liturgicalDay, parseIso } from '../../liturgy/compute';
import { ANGELUS, MERCY, MYSTERIES, REGINA, SORROWS, STATIONS, rosary, todaysMysteries, type Devotion } from '../../data/devotions';

const toRefs = (s: string): Ref[] => {
  const p = parseRefs(s);
  return p.ok ? p.refs.map((x) => convertRef('kjv', 'vulgate', x.ref).ref) : [];
};

const iso = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };

function Prayer({ d, back }: { d: Devotion; back: string }) {
  const [s] = useSettings();
  useWakeLock(s.keepAwake);
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const step = d.steps[i];
  const need = step.count ?? 1;
  useEffect(() => setN(0), [i]);
  const refs = useMemo(() => (step.refs ? toRefs(step.refs) : []), [step.refs]);
  const next = () => (i < d.steps.length - 1 ? setI(i + 1) : undefined);
  const tap = () => { if (n + 1 >= need) { setN(need); } else setN(n + 1); };
  const ready = n >= need;
  return (
    <div className="page">
      <p><Link to={back}>← Devotions</Link></p>
      <h1>{d.name}</h1>
      <div className="progress" aria-hidden><div style={{ width: `${(100 * (i + 1)) / d.steps.length}%` }} /></div>
      <p className="muted small">Step {i + 1} of {d.steps.length}</p>
      <div className="row between" style={{ marginBottom: 12 }}>
        <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {i < d.steps.length - 1
          ? <button className="btn primary" onClick={next}>Next</button>
          : <Link className="btn primary" to={back}>Amen</Link>}
      </div>
      <section className="card" aria-live="polite">
        <h2 className="card-title">{step.title}</h2>
        {step.note && <p className="muted small">{step.note}</p>}
        {refs.length > 0 && <ReadingBlock refs={refs} label="Scripture" text={step.refs!} max={9} />}
        {step.text && <p className="scripture" style={{ fontSize: '1.1rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{step.text}</p>}
        {need > 1 && (
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <button className="btn primary" onClick={tap} disabled={ready}>{ready ? 'Done' : 'Said one'}</button>
            <span aria-label="count">{Math.min(n, need)} of {need}</span>
          </div>
        )}
      </section>
    </div>
  );
}

export default function DevotionsPage() {
  const { id } = useParams();
  const [set, setSet] = useState(todaysMysteries().id);
  const mysteries = MYSTERIES.find((m) => m.id === set)!;
  const eastertide = liturgicalDay(parseIso(iso()), 'universal').season === 'easter';
  const all: Devotion[] = [rosary(mysteries), ANGELUS, REGINA, MERCY, STATIONS, SORROWS];
  const picked = id ? all.find((d) => d.id === id || (id === 'rosary' && d.id.startsWith('rosary'))) : null;
  if (picked) return <Prayer d={picked} back="/pray/devotions" />;
  return (
    <div className="page">
      <h1>Devotions</h1>
      <p className="lede">Traditional prayers, one step at a time. Scripture in each is shown in your own translation.</p>
      <div className="card">
        <div className="row between"><h2 className="card-title">The Rosary</h2><Link to="/pray/devotions/rosary" className="btn primary small">Pray it</Link></div>
        <p className="muted small">Today’s mysteries are the {todaysMysteries().name.toLowerCase()} mysteries, by the usual weekly custom. Choose another set if you wish.</p>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }} role="radiogroup" aria-label="Mysteries">
          {MYSTERIES.map((m) => <button key={m.id} role="radio" aria-checked={set === m.id} className={`btn small${set === m.id ? ' primary' : ''}`} onClick={() => setSet(m.id)}>{m.name}</button>)}
        </div>
        <ul className="list">{mysteries.mysteries.map((m) => <li key={m.title}>{m.title} <span className="muted small">— {m.refs}</span></li>)}</ul>
      </div>
      <div className="grid" style={{ marginTop: 14 }}>
        {[eastertide ? REGINA : ANGELUS, MERCY, STATIONS, SORROWS].map((d) => (
          <Link key={d.id} to={`/pray/devotions/${d.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 className="card-title">{d.name}</h2><p className="muted">{d.blurb}</p>
          </Link>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 14 }}>The Divine Mercy chaplet is a private devotion from the revelations to St Faustina. These prayer texts are the long-used traditional wordings.</p>
    </div>
  );
}
