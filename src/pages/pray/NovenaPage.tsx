import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReadingBlock from '../../components/ReadingBlock';
import { PLANS } from '../../data/novenas';
import { convertRef } from '../../lib/versification';
import { parseRefs, type Ref } from '../../lib/refs';

const KEY = 'sb:novena';
const load = (): Record<string, number[]> => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; } };
const store = (v: Record<string, number[]>) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } };
const toRefs = (s: string): Ref[] => { const p = parseRefs(s); return p.ok ? p.refs.map((x) => convertRef('kjv', 'vulgate', x.ref).ref) : []; };

export default function NovenaPage() {
  const { id } = useParams();
  const [done, setDone] = useState(load);
  const plan = PLANS.find((p) => p.id === id);
  const first = plan ? Math.max(0, plan.days.findIndex((_, i) => !(done[plan.id] ?? []).includes(i))) : 0;
  const [day, setDay] = useState<number | null>(null);
  const cur = day ?? first;
  const refs = useMemo(() => (plan ? toRefs(plan.days[cur].refs) : []), [plan, cur]);
  const mark = (i: number) => {
    if (!plan) return;
    const set = new Set(done[plan.id] ?? []);
    set.has(i) ? set.delete(i) : set.add(i);
    const next = { ...done, [plan.id]: [...set].sort((a, b) => a - b) };
    setDone(next); store(next);
  };
  if (!plan) {
    return (
      <div className="page">
        <p><Link to="/pray">← Prayer</Link></p>
        <h1>Novenas and short plans</h1>
        <p className="lede">A passage and a prayer for each day. Your progress stays on this device.</p>
        <div className="grid">
          {PLANS.map((p) => (
            <Link key={p.id} to={`/pray/novenas/${p.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 className="card-title">{p.name}</h2><p className="muted">{p.blurb}</p>
              <p className="muted small">{(done[p.id] ?? []).length} of {p.days.length} days prayed</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  const d = plan.days[cur];
  const prayed = (done[plan.id] ?? []).includes(cur);
  return (
    <div className="page">
      <p><Link to="/pray/novenas">← Novenas</Link></p>
      <h1>{plan.name}</h1>
      {plan.opening && <p className="muted small">{plan.opening}</p>}
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {plan.days.map((_, i) => (
          <button key={i} className={`btn small${i === cur ? ' primary' : ''}`} aria-label={`Day ${i + 1}${(done[plan.id] ?? []).includes(i) ? ', prayed' : ''}`} onClick={() => setDay(i)}>{(done[plan.id] ?? []).includes(i) ? '✓' : i + 1}</button>
        ))}
      </div>
      <section className="card">
        <h2 className="card-title">{d.title}</h2>
        <ReadingBlock refs={refs} label="Scripture" text={d.refs} max={20} />
        {d.prayer && <p className="scripture" style={{ fontSize: '1.08rem', lineHeight: 1.6 }}>{d.prayer}</p>}
        <button className={`btn${prayed ? '' : ' primary'}`} onClick={() => mark(cur)}>{prayed ? 'Prayed today ✓ (undo)' : 'I prayed this'}</button>
      </section>
    </div>
  );
}
