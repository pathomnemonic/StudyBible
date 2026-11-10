import { useEffect, useMemo, useState } from 'react';
import { db } from '../db/db';
import { updateSettings, useSettings } from '../lib/store';
import { loadBiay, type BiayView } from '../data/biay';

/** Where in Bible in a Year to carry on: today becomes day N, and the days before it count as heard. */
export async function catchUp(day: number) {
  const n = Math.max(1, Math.min(365, Math.round(day) || 1));
  await db.planProgress.put({ planId: 'biay', startedAt: Date.now(), status: 'active', done: Array.from({ length: n - 1 }, (_, i) => i), offsetDays: n - 1 } as never);
  updateSettings({ activePlan: 'biay' });
}

type Mode = 'ask' | 'yes' | 'start' | 'no';

/** The one question the tour asks: have you listened to Bible in a Year before? Every answer is optional, and the default (do nothing) leaves it as it is. */
export default function BiayChoice({ onAnswered }: { onAnswered?: (note: string) => void }) {
  const [mode, setMode] = useState<Mode>('ask');
  const [day, setDay] = useState(1);
  const [find, setFind] = useState('');
  const [note, setNote] = useState('');
  const [view, setView] = useState<BiayView | null>(null);
  const [s] = useSettings();
  useEffect(() => { loadBiay().then(setView).catch(() => undefined); }, []);
  const hits = useMemo(() => {
    const q = find.trim().toLowerCase();
    if (!q || !view) return [];
    return [...view.dayEpisode.entries()].filter(([, e]) => `${e.short} ${e.title}`.toLowerCase().includes(q)).sort((a, b) => a[0] - b[0]).slice(0, 4);
  }, [find, view]);
  const settle = async (m: Mode) => {
    let msg = '';
    if (m === 'yes') { await catchUp(day); msg = `Done: you carry on at day ${day}.`; }
    else if (m === 'start') { await catchUp(1); msg = 'Done: you start at day 1.'; }
    else { updateSettings({ activePlan: '', dashboard: { ...s.dashboard, hidden: [...new Set([...s.dashboard.hidden, 'biay'])] } }); msg = 'Done: Bible in a Year is left out.'; }
    setNote(msg); setMode('ask'); onAnswered?.(msg);
  };
  if (note) return <p className="tour-note" role="status">{note}</p>;
  return (
    <div className="biay-choice">
      {mode === 'ask' && (
        <div className="tour-switch col" role="group" aria-label="Have you listened to Bible in a Year before?">
          <button onClick={() => setMode('yes')}>Yes, I was partway through</button>
          <button onClick={() => setMode('start')}>No, but I would like to</button>
          <button onClick={() => setMode('no')}>Not for me</button>
        </div>
      )}
      {mode === 'yes' && (
        <>
          <label className="tour-row"><span>Which day do you listen to next?</span>
            <input type="number" min={1} max={365} value={day} aria-label="Day number" onChange={(e) => setDay(Math.max(1, Math.min(365, +e.target.value || 1)))} /></label>
          <p className="tour-sub" role="status">{view?.dayEpisode.get(day) ? <>Day {day}: <strong>{view.dayEpisode.get(day)!.short}</strong></> : `Day ${day}`}</p>
          <input type="search" className="tour-select" value={find} placeholder="Or search for its title" aria-label="Find an episode" onChange={(e) => setFind(e.target.value)} />
          {hits.length > 0 && <div className="tour-switch col">{hits.map(([d, e]) => <button key={d} onClick={() => { setDay(d); setFind(''); }}>Day {d}: {e.short}</button>)}</div>}
          <div className="tour-switch"><button onClick={() => setMode('ask')}>Change answer</button><button className="on" onClick={() => void settle('yes')}>Carry on from day {day}</button></div>
        </>
      )}
      {mode === 'start' && (
        <div className="tour-switch"><button onClick={() => setMode('ask')}>Change answer</button><button className="on" onClick={() => void settle('start')}>Start at day 1</button></div>
      )}
      {mode === 'no' && (
        <>
          <p className="tour-sub">We will leave it out of Today. The next step shows where to pick other Catholic media.</p>
          <div className="tour-switch"><button onClick={() => setMode('ask')}>Change answer</button><button className="on" onClick={() => void settle('no')}>Leave it out</button></div>
        </>
      )}
    </div>
  );
}
