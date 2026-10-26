import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useEditions } from '../../data/EditionsContext';
import { builtinPlans, type PlanDef } from '../../plans/builtin';
import { parseRefs, refId } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { getLibraryIndex } from '../../data/content';
import { choosePlan } from '../../lib/activePlan';
import { useSettings } from '../../lib/store';

const CAT: Record<string, string> = { bible: 'Whole Bible', gospel: 'Gospels', listening: 'Reading + listening', catechism: 'Catechism topics', saint: 'Saints & Fathers', seasonal: 'Seasons', psalms: 'Psalms' };

export default function PlansPage() {
  const { get } = useEditions();
  const [plans, setPlans] = useState<PlanDef[]>([]);
  const [cat, setCat] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [lines, setLines] = useState('');
  const [err, setErr] = useState('');
  const progress = useLiveQuery(() => db.planProgress.toArray(), []) ?? [];
  const user = useLiveQuery(() => db.userPlans.toArray(), []) ?? [];
  const nav = useNavigate();
  useEffect(() => {
    const v = get('vulgate');
    if (v) builtinPlans(v).then(setPlans);
    getLibraryIndex();
  }, []);
  const start = async (id: string) => {
    await db.planProgress.put({ planId: id, startedAt: Date.now(), status: 'active', done: [], offsetDays: 0 });
    choosePlan(id);
    nav(`/pray/plans/${encodeURIComponent(id)}`);
  };
  const createPlan = async () => {
    const days = lines.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = parseRefs(l.replace(/^day\s*\d+\s*[:\-]\s*/i, ''));
      if (!p.ok) throw new Error(`“${l}”: ${p.error}`);
      return { refs: p.refs.map((x) => refId(convertRef('kjv', 'vulgate', x.ref).ref)) };
    });
    return db.userPlans.add({ name: name.trim(), days, createdAt: Date.now() });
  };
  const show = plans.filter((p) => !cat || p.category === cat);
  return (
    <div className="page">
      <Link to="/pray" className="small">← Pray</Link>
      <h1>Reading plans</h1>
      <p className="lede">Plans are a help, not a measure. Skip days, pause, shift or restart whenever you need; there are no leaderboards or pressure.</p>
      <div className="chips" style={{ marginBottom: 12 }}>
        <button className={`chip${!cat ? ' sel' : ''}`} onClick={() => setCat('')}>All</button>
        {Object.entries(CAT).map(([k, v]) => <button key={k} className={`chip${cat === k ? ' sel' : ''}`} onClick={() => setCat(k)}>{v}</button>)}
        <button className="chip" onClick={() => setCreating(!creating)}>+ Make my own</button>
      </div>
      {creating && (
        <div className="card">
          <input type="text" placeholder="Plan name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <textarea placeholder={'One day per line, e.g.\nJohn 1:1-18\nGenesis 1-2; Psalm 8\nRomans 8'} value={lines} onChange={(e) => setLines(e.target.value)} />
          <p className="muted small">Typed passages use modern (English) numbering and are anchored to the Vulgate numbering automatically.</p>
          {err && <div className="notice">{err}</div>}
          <button className="btn primary" onClick={async () => { try { setErr(''); const id = await createPlan(); setCreating(false); setName(''); setLines(''); nav(`/pray/plans/${encodeURIComponent('user:' + id)}`); } catch (e: any) { setErr(e.message); } }}>Save plan</button>
        </div>
      )}
      {user.map((u) => (
        <div className="card" key={'u' + u.id}>
          <div className="row between"><h3>{u.name}</h3><span className="chip">my plan · {u.days.length} days</span></div>
          <div className="row"><Link className="btn small" to={`/pray/plans/${encodeURIComponent('user:' + u.id)}`}>Open</Link><button className="btn small danger" onClick={() => confirm('Delete this plan?') && db.userPlans.delete(u.id!)}>Delete</button></div>
        </div>
      ))}
      {show.map((p) => {
        const pr = progress.find((x) => x.planId === p.id);
        return (
          <div className="card" key={p.id}>
            <div className="row between"><h3>{p.name}</h3><span className="chip">{p.days.length} days</span></div>
            <p className="muted">{p.description}</p>
            <div className="row">
              {pr ? <Link className="btn small primary" to={`/pray/plans/${p.id}`}>{pr.status === 'paused' ? 'Paused — open' : 'Continue'} ({pr.done.length}/{p.days.length})</Link> : <button className="btn small primary" onClick={() => start(p.id)}>Start</button>}
              <Link className="btn small" to={`/pray/plans/${p.id}`}>Preview</Link>
            </div>
          </div>
        );
      })}
      {show.length === 0 && <div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading plans"><i /><i /><i /></div>}
    </div>
  );
}
