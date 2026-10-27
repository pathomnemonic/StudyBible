import { getSettings, updateSettings } from '../../lib/store';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useEditions } from '../../data/EditionsContext';
import { builtinPlans, type PlanDef } from '../../plans/builtin';
import RefLink from '../../components/RefLink';
import { useSettings } from '../../lib/store';
import { usePlayer } from '../../data/PlayerContext';
import { loadBiay } from '../../data/biay';
import { choosePlan } from '../../lib/activePlan';

export default function PlanPage() {
  const { id: rawId = '' } = useParams();
  const id = decodeURIComponent(rawId);
  const { get } = useEditions();
  const [plan, setPlan] = useState<PlanDef | null>(null);
  const [s] = useSettings();
  const player = usePlayer();
  const prog = useLiveQuery(() => db.planProgress.get(id), [id]);
  useEffect(() => {
    (async () => {
      if (id.startsWith('user:')) {
        const u = await db.userPlans.get(+id.slice(5));
        if (u) setPlan({ id, name: u.name, description: u.description ?? 'Your own plan.', category: 'bible', days: u.days });
      } else {
        const v = get('vulgate');
        if (v) setPlan((await builtinPlans(v)).find((p) => p.id === id) ?? null);
      }
    })();
  }, [id]);
  if (!plan) return <div className="center-note">Loading plan…</div>;
  const todayIdx = prog ? Math.max(0, Math.min(plan.days.length - 1, Math.floor((Date.now() - prog.startedAt) / 86400000) + prog.offsetDays)) : -1;
  const toggle = async (i: number) => {
    if (!prog) return;
    const done = prog.done.includes(i) ? prog.done.filter((x) => x !== i) : [...prog.done, i];
    await db.planProgress.put({ ...prog, done, status: done.length >= plan.days.length ? 'finished' : prog.status });
  };
  // the first day not yet checked, if it lies before today: offer to pick up from there instead of skipping
  const firstUnread = prog ? plan.days.findIndex((_, i) => !prog.done.includes(i)) : -1;
  const behind = prog && prog.status === 'active' && firstUnread >= 0 ? todayIdx - firstUnread : 0;
  // optional streak: consecutive checked days ending at or before today (never the headline)
  const streak = (() => {
    if (!prog || !s.showStreaks) return 0;
    let n = 0;
    for (let i = todayIdx; i >= 0 && prog.done.includes(i); i--) n++;
    return n;
  })();
  return (
    <div className="page">
      <Link to="/pray/plans" className="small">← Plans</Link>
      <h1>{plan.name}</h1>
      <p className="lede">{plan.description}</p>
      {!prog ? (
        <button className="btn primary" onClick={async () => { await db.planProgress.put({ planId: id, startedAt: Date.now(), status: 'active', done: [], offsetDays: 0 }); choosePlan(id); }}>Start this plan today and make it mine</button>
      ) : (
        <div className="card">
          <div className="progress"><div style={{ width: `${(100 * prog.done.length) / plan.days.length}%` }} /></div>
          <p className="small">{prog.done.length} of {plan.days.length} days read · started {new Date(prog.startedAt).toLocaleDateString()} · status: <strong>{prog.status}</strong>{streak > 1 ? ` · ${streak} days in a row` : ''}</p>
          {behind > 0 && (
            <p className="small" role="status">
              You are {behind} {behind === 1 ? 'day' : 'days'} behind, and that is fine. <button className="btn small" onClick={() => db.planProgress.put({ ...prog, offsetDays: prog.offsetDays - behind })}>Pick up at day {firstUnread + 1}</button> <a href={`#d${firstUnread}`} onClick={(e) => { e.preventDefault(); document.getElementById(`d${firstUnread}`)?.scrollIntoView({ block: 'center' }); }}>or see it in the list</a>
            </p>
          )}
          <div className="row">
            {s.activePlan === id
              ? <span className="chip sel">This is your plan: it shows in the Bible tab and Today</span>
              : <button className="btn small primary" onClick={() => choosePlan(id)}>Make this my plan</button>}
            {prog.status === 'active' ? <button className="btn small" onClick={() => db.planProgress.put({ ...prog, status: 'paused', pausedAt: Date.now() })}>Pause</button> : <button className="btn small" onClick={() => db.planProgress.put({ ...prog, status: 'active', startedAt: prog.startedAt + (Date.now() - (prog.pausedAt ?? Date.now())), pausedAt: undefined })}>Resume</button>}
            <button className="btn small" onClick={() => db.planProgress.put({ ...prog, offsetDays: prog.offsetDays - 1 })}>Slow down a day</button>
            <button className="btn small" onClick={() => db.planProgress.put({ ...prog, offsetDays: prog.offsetDays + 1 })}>Skip ahead a day</button>
            <button className="btn small" onClick={() => confirm('Restart this plan from day 1? Your checked days will be cleared.') && db.planProgress.put({ planId: id, startedAt: Date.now(), status: 'active', done: [], offsetDays: 0 })}>Restart</button>
            <button className="btn small danger" onClick={async () => { await db.planProgress.delete(id); if (getSettings().activePlan === id) updateSettings({ activePlan: '' }); }}>Stop</button>
          </div>
        </div>
      )}
      <ul className="list">
        {plan.days.map((d, i) => (
          <li key={i} id={`d${i}`} style={i === todayIdx ? { background: 'var(--sel)', borderRadius: 8, padding: 10 } : undefined}>
            <div className="row between">
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong>{d.title ?? `Day ${i + 1}`}</strong>{i === todayIdx && <span className="chip sel" style={{ marginLeft: 6 }}>today</span>}
                <div className="chips" style={{ marginTop: 4 }}>
                  {d.refs.length === 0 && <span className="muted small">{d.note ?? 'No passage listed.'}</span>}
                  {d.refs.map((r, k) => <span className="chip" key={k}><RefLink id={r} /></span>)}
                </div>
                {d.note && d.refs.length > 0 && <div className="muted small">{d.note}</div>}
                <div className="row" style={{ marginTop: 4 }}>
                  {d.workSection && <Link className="btn small" to={`/study/works/${d.workSection.workId}/${d.workSection.section}`}>Read this section</Link>}
                  {d.episodeId && <button className="btn small" onClick={async () => { const v = await loadBiay(); const e = v?.byId.get(d.episodeId!); if (e) player.play(e); }}>Listen</button>}
                </div>
              </div>
              {prog && <input type="checkbox" checked={prog.done.includes(i)} onChange={() => toggle(i)} aria-label={`Mark day ${i + 1} read`} style={{ width: 22, height: 22 }} />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
