import { useEffect, useState } from 'react';

export interface DeckState { i: number; total: number; label: string; lines: string[]; notes: string[]; next?: { label: string; lines: string[] }; title: string }
export const DECK_CHANNEL = 'studybible-deck';

/** Opened in a second window: shows this slide's notes and the next slide while the class sees the deck. Follows the deck through a same-browser channel. */
export default function PresenterView() {
  const [st, setSt] = useState<DeckState | null>(null);
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(DECK_CHANNEL);
    ch.onmessage = (e) => setSt(e.data as DeckState);
    ch.postMessage({ hello: true });
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { ch.close(); window.clearInterval(tick); };
  }, []);
  const secs = Math.floor((now - t0) / 1000);
  return (
    <div className="page presenter">
      <header className="row between"><h1 style={{ margin: 0 }}>Presenter view</h1><span className="run-clock sm" aria-label="Time since you opened this window">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span></header>
      {!st && <p className="muted">Open this from the slide deck (the Presenter button). Keep the deck window on the projector and this one in front of you.</p>}
      {st && <>
        <p className="muted small">{st.title} · slide {st.i + 1} of {st.total} · {st.label}</p>
        <section className="card"><h2>On screen</h2>{st.lines.map((l, k) => <p key={k}>{l}</p>)}</section>
        <section className="card pres-notes"><h2>Your notes</h2>{st.notes.length ? <ul>{st.notes.map((n) => <li key={n}>{n}</li>)}</ul> : <p className="muted">No notes for this slide.</p>}</section>
        {st.next && <section className="card"><h2>Next: {st.next.label}</h2>{st.next.lines.slice(0, 3).map((l, k) => <p key={k} className="muted">{l}</p>)}</section>}
      </>}
    </div>
  );
}
