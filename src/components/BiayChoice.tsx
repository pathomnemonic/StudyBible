import { useEffect, useMemo, useState } from 'react';
import { startPlan } from '../lib/activePlan';
import { updateSettings, useSettings } from '../lib/store';
import { loadBiay, type BiayView } from '../data/biay';
import { getLibraryIndex } from '../data/content';
import { allRecordedWorks } from '../data/librivox';
import { toggleFollow, useFollows } from '../lib/follow';

/** Where in Bible in a Year to carry on: today becomes day N, and the days before it count as heard. */
export async function catchUp(day: number) {
  const n = Math.max(1, Math.min(365, Math.round(day) || 1));
  await startPlan('biay', { restart: true, done: Array.from({ length: n - 1 }, (_, i) => i), offsetDays: n - 1 });
}

type Mode = 'ask' | 'yes' | 'start' | 'else';

/** What to listen to after Bible in a Year (or instead of it). Choosing follows it, so Media puts it first. */
const NEXT: [string, string, string][] = [
  ['catechism-in-a-year', 'The Catechism in a Year', 'Fr. Mike Schmitz'],
  ['rosary-in-a-year', 'The Rosary in a Year', 'Fr. Mike Schmitz'],
];
const FEATURED_BOOKS = ['aug-confessions', 'kempis-imitation'];

function NextPicker({ finished }: { finished: boolean }) {
  const follows = useFollows();
  const [books, setBooks] = useState<{ id: string; title: string; author: string }[] | null>(null);
  const [showBooks, setShowBooks] = useState(false);
  useEffect(() => {
    if (!showBooks || books) return;
    Promise.all([getLibraryIndex(), allRecordedWorks()]).then(([l, r]) => {
      const rec = (l?.works ?? []).filter((w) => r[w.id]);
      const rank = (id: string) => { const i = FEATURED_BOOKS.indexOf(id); return i < 0 ? 99 : i; };
      setBooks(rec.sort((a, b) => rank(a.id) - rank(b.id)).slice(0, 8).map((w) => ({ id: w.id, title: w.title, author: w.author })));
    }).catch(() => setBooks([]));
  }, [showBooks, books]);
  return (
    <>
      <p className="tour-sub">{finished ? 'Well done. What would you like to listen to next?' : 'What would you like to listen to instead?'} Pick any, or none.</p>
      <div className="tour-switch col" role="group" aria-label="What to listen to next">
        {NEXT.map(([id, title, host]) => (
          <button key={id} className={follows.has(id) ? 'on' : ''} aria-pressed={follows.has(id)} onClick={() => void toggleFollow(id, !follows.has(id))}>{follows.has(id) ? '✓ ' : ''}{title} <small>{host}</small></button>
        ))}
        <button aria-expanded={showBooks} onClick={() => setShowBooks((x) => !x)}>An audiobook</button>
      </div>
      {showBooks && (books === null ? <p className="tour-sub">Loading…</p> : (
        <div className="tour-switch col" role="group" aria-label="Audiobooks">
          {books.map((b) => { const k = `ab:${b.id}`; return <button key={b.id} className={follows.has(k) ? 'on' : ''} aria-pressed={follows.has(k)} onClick={() => void toggleFollow(k, !follows.has(k))}>{follows.has(k) ? '✓ ' : ''}{b.title} <small>{b.author}</small></button>; })}
        </div>
      ))}
    </>
  );
}

/** The one question the tour asks: have you listened to Bible in a Year before? Every answer is optional, and the default (do nothing) leaves it as it is. */
export default function BiayChoice({ onAnswered }: { onAnswered?: (note: string) => void }) {
  const [mode, setMode] = useState<Mode>('ask');
  const [day, setDay] = useState(1);
  const [find, setFind] = useState('');
  const [note, setNote] = useState('');
  const [finished, setFinished] = useState(false);
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
    else { updateSettings({ activePlan: '', dashboard: { ...s.dashboard, hidden: [...new Set([...s.dashboard.hidden, 'biay'])] } }); msg = 'Done: Bible in a Year is left out, and your picks are in Media.'; }
    setNote(msg); setMode('ask'); onAnswered?.(msg);
  };
  if (note) return <p className="tour-note" role="status">{note}</p>;
  return (
    <div className="biay-choice">
      {mode === 'ask' && (
        <div className="tour-switch col" role="group" aria-label="Have you listened to Bible in a Year before?">
          <button onClick={() => setMode('yes')}>Yes, I was partway through</button>
          <button onClick={() => setMode('start')}>No, but I would like to</button>
          <button onClick={() => { setFinished(true); setMode('else'); }}>I finished it and want something else</button>
          <button onClick={() => { setFinished(false); setMode('else'); }}>Not for me</button>
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
      {mode === 'else' && (
        <>
          <NextPicker finished={finished} />
          <div className="tour-switch"><button onClick={() => setMode('ask')}>Change answer</button><button className="on" onClick={() => void settle('else')}>Done</button></div>
        </>
      )}
    </div>
  );
}
