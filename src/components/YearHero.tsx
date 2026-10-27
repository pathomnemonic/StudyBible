import SaveOffline from './SaveOffline';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { useEditions } from '../data/EditionsContext';
import { loadBiay } from '../data/biay';
import { usePlayer } from '../data/PlayerContext';
import type { BiayEpisode } from '../data/content';
import { parseRefId } from '../lib/refs';
import { readerPath } from '../lib/nav';
import { dayOfYear } from '../study/verseOfDay';
import RefLink from './RefLink';
import Icon from './Icon';
import ShowSettings from './ShowSettings';
import { choosePlan } from '../lib/activePlan';
import PlanPicker from './PlanPicker';

/** Progress ring: the Bible in a Year days you have finished, out of 365. */
function Ring({ done, day }: { done: number; day: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 124 124" className="year-ring" role="img" aria-label={`Day ${day} of 365. ${done} days finished.`}>
      <circle cx="62" cy="62" r={R} fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="8" />
      <circle cx="62" cy="62" r={R} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, done / 365))} transform="rotate(-90 62 62)" />
      <text x="62" y="58" textAnchor="middle" className="rn">{day}</text>
      <text x="62" y="78" textAnchor="middle" className="rl">of 365</text>
    </svg>
  );
}


/** Today's Bible in a Year episode: progress ring, listen, read, mark done. Shared by Today and the Bible in a Year tab. */
export default function YearHero() {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const player = usePlayer();
  const edition = get(s.defaultEdition) ?? editions[0];
  const [biay, setBiay] = useState<Awaited<ReturnType<typeof loadBiay>>>(null);
  const prog = useLiveQuery(() => db.planProgress.get('biay'), []);
  useEffect(() => {
    loadBiay().then(setBiay);
  }, []);
  // today's day in the plan: the learner's own count if they started tracking, else the calendar day
  const todayIdx = prog ? Math.max(0, Math.min(364, Math.floor((Date.now() - prog.startedAt) / 86400000) + prog.offsetDays)) : Math.min(364, dayOfYear() - 1);
  const dayN = todayIdx + 1;
  const ep: BiayEpisode | null = biay?.dayEpisode.get(dayN) ?? null;
  const finished = prog?.done.includes(todayIdx) ?? false;
  const first = ep?.passages.map((p) => parseRefId(p)).find(Boolean);
  const startTracking = async () => { await db.planProgress.put({ planId: 'biay', startedAt: Date.now(), status: 'active', done: [], offsetDays: dayOfYear() - 1 }); if (!s.activePlan) choosePlan('biay'); };
  const toggleDone = async () => {
    if (!prog) return db.planProgress.put({ planId: 'biay', startedAt: Date.now(), status: 'active', done: [todayIdx], offsetDays: dayOfYear() - 1 });
    const done = finished ? prog.done.filter((x) => x !== todayIdx) : [...prog.done, todayIdx];
    await db.planProgress.put({ ...prog, done });
  };
  const [cfg, setCfg] = useState(false);
  const [pick, setPick] = useState(false);
  return (
      <section className="year-card" aria-labelledby="year-h">
        <Ring done={prog?.done.length ?? 0} day={dayN} />
        <div className="year-body">
          <div className="eyebrow" id="year-h">Bible in a Year{prog ? '' : ' · today'}</div>
          <h2>{ep ? ep.short : 'Today’s episode'}</h2>
          {ep && <p className="year-ps">{ep.passages.slice(0, 5).map((p) => <span key={p} className="chip"><RefLink id={p} /></span>)}</p>}
          <div className="year-acts">
            <button className="btn primary big" disabled={!ep} onClick={() => ep && player.play(ep)}><Icon name="play" size={16} /> Listen</button>
            {ep && <SaveOffline ep={ep} compact />}
            {first && edition && <Link className="btn" to={readerPath(edition, first)}>Read</Link>}
            <button className={'btn icon' + (finished ? ' on' : '')} aria-pressed={finished} onClick={toggleDone} title={finished ? 'Finished today' : 'Mark today finished'} aria-label={finished ? 'Finished today. Tap to undo' : 'Mark today finished'}>✓</button>
            <button className="btn icon" onClick={() => setCfg(true)} title="Skip the intro, speed and skip buttons for this show" aria-label="Bible in a Year settings"><Icon name="gear" size={16} /></button>
          </div>
          <p className="year-foot muted small">
            {prog ? <>{prog.done.length} of 365 days finished · Fr. Mike Schmitz, Ascension · <button className="linklike" onClick={() => setPick(true)}>Switch plan</button></> : <>Following the calendar. <button className="linklike" onClick={startTracking}>Track my progress</button></>}
          </p>
        </div>
      {pick && <PlanPicker onClose={() => setPick(false)} />}
      {cfg && <ShowSettings showKey="biay" name="Bible in a Year" onClose={() => setCfg(false)} />}
      </section>
  );
}
