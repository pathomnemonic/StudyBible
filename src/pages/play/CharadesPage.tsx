import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CHARADES_DECKS, type CharadesDeck } from '../../data/charades';
import { buzz } from '../../lib/haptics';

type Phase = 'pick' | 'ready' | 'play' | 'done';
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const bestKey = (id: string) => `sb:charades:best:${id}`;
const best = (id: string) => { try { return +(localStorage.getItem(bestKey(id)) ?? 0); } catch { return 0; } };

/**
 * Heads-up charades for Catholic topics. Hold the phone to your forehead so friends can see the word: tilt it down when you get it right,
 * up to pass. The buttons do the same for anyone who prefers to tap. It all runs on the phone, offline.
 */
export default function CharadesPage() {
  const [phase, setPhase] = useState<Phase>('pick');
  const [deck, setDeck] = useState<CharadesDeck>(CHARADES_DECKS[0]);
  const [secs, setSecs] = useState(60);
  const [flip, setFlip] = useState(() => { try { return localStorage.getItem('sb:charades:flip') === '1'; } catch { return false; } });
  const [count, setCount] = useState(3);
  const [left, setLeft] = useState(60);
  const [word, setWord] = useState('');
  const [flash, setFlash] = useState<'' | 'right' | 'pass'>('');
  const [right, setRight] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const queue = useRef<string[]>([]);
  const armed = useRef(true);
  const rightRef = useRef<string[]>([]);
  const passedRef = useRef<string[]>([]);
  const phaseRef = useRef<Phase>('pick');
  phaseRef.current = phase;

  const nextWord = useCallback(() => { if (!queue.current.length) queue.current = shuffle(deck.words); setWord(queue.current.pop() ?? ''); }, [deck]);
  const answer = useCallback((ok: boolean) => {
    if (phaseRef.current !== 'play') return;
    const w = word;
    if (ok) { rightRef.current = [...rightRef.current, w]; setRight(rightRef.current); } else { passedRef.current = [...passedRef.current, w]; setPassed(passedRef.current); }
    setFlash(ok ? 'right' : 'pass'); buzz(ok ? 30 : 12);
    window.setTimeout(() => setFlash(''), 450);
    nextWord();
  }, [word, nextWord]);

  const start = async () => {
    // some phones ask before they share motion, and only in response to a tap
    try { const D = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }; if (typeof D?.requestPermission === 'function') await D.requestPermission(); } catch { /* buttons still work */ }
    queue.current = shuffle(deck.words);
    rightRef.current = []; passedRef.current = []; setRight([]); setPassed([]);
    setCount(3); setPhase('ready');
  };
  useEffect(() => {
    if (phase !== 'ready') return;
    if (count === 0) { setLeft(secs); nextWord(); armed.current = false; setPhase('play'); return; }
    const t = window.setTimeout(() => setCount((c) => c - 1), 900);
    return () => window.clearTimeout(t);
  }, [phase, count, secs, nextWord]);
  useEffect(() => {
    if (phase !== 'play') return;
    const t = window.setInterval(() => setLeft((l) => { if (l <= 1) { window.clearInterval(t); setPhase('done'); return 0; } return l - 1; }), 1000);
    return () => window.clearInterval(t);
  }, [phase]);
  // tilt: the screen turned toward the floor is a right answer, toward the ceiling a pass. A tilt must come back to upright before the next counts.
  useEffect(() => {
    if (phase !== 'play') return;
    const h = (e: DeviceMotionEvent) => {
      const z = e.accelerationIncludingGravity?.z;
      if (z == null) return;
      const v = flip ? -z : z;
      if (Math.abs(v) < 3.5) { armed.current = true; return; }
      if (!armed.current) return;
      if (v <= -6.5) { armed.current = false; answer(true); } else if (v >= 6.5) { armed.current = false; answer(false); }
    };
    window.addEventListener('devicemotion', h);
    return () => window.removeEventListener('devicemotion', h);
  }, [phase, answer, flip]);
  useEffect(() => {
    if (phase !== 'done') return;
    const n = rightRef.current.length;
    try { if (n > best(deck.id)) localStorage.setItem(bestKey(deck.id), String(n)); } catch { /* private mode */ }
    buzz(60);
  }, [phase, deck.id]);

  if (phase === 'pick') {
    return (
      <div className="page charades">
        <h1>Charades</h1>
        <p className="muted">Hold the phone to your forehead. Your friends act out or describe the word. Tilt down when you get it, up to pass.</p>
        <div className="charades-decks" role="radiogroup" aria-label="Deck">
          {CHARADES_DECKS.map((d) => (
            <button key={d.id} role="radio" aria-checked={deck.id === d.id} className={`charades-deck${deck.id === d.id ? ' on' : ''}`} onClick={() => setDeck(d)}>
              <strong>{d.name}</strong><span>{d.blurb}</span><em>{d.words.length} words{best(d.id) ? ` · best ${best(d.id)}` : ''}</em>
            </button>
          ))}
        </div>
        <div className="row between" style={{ margin: '10px 0' }}>
          <span>Time</span>
          <div className="chips">{[60, 90, 120].map((n) => <button key={n} className={`chip${secs === n ? ' sel' : ''}`} aria-pressed={secs === n} onClick={() => setSecs(n)}>{n} s</button>)}</div>
        </div>
        <label className="row between" style={{ margin: '6px 0' }}>
          <span>Flip the tilt (if down and up feel the wrong way round)</span>
          <input type="checkbox" checked={flip} onChange={(e) => { setFlip(e.target.checked); try { localStorage.setItem('sb:charades:flip', e.target.checked ? '1' : '0'); } catch { /* private mode */ } }} />
        </label>
        <button className="btn primary big" onClick={() => void start()}>Start</button>
      </div>
    );
  }
  if (phase === 'ready') {
    return <div className="charades-stage ready" role="status" aria-live="polite"><p>Hold it to your forehead</p><div className="charades-count">{count || 'Go'}</div></div>;
  }
  if (phase === 'play') {
    return (
      <div className={`charades-stage play${flash ? ` flash-${flash}` : ''}`}>
        <div className="charades-top"><span>{deck.name}</span><span>{right.length} ✓</span><span className={left <= 10 ? 'low' : ''}>{left}</span></div>
        <div className="charades-word" aria-live="polite">{flash === 'right' ? 'Correct!' : flash === 'pass' ? 'Pass' : word}</div>
        <div className="charades-btns">
          <button className="btn big" onClick={() => answer(false)}>Pass</button>
          <button className="btn primary big" onClick={() => answer(true)}>Got it</button>
        </div>
        <button className="btn small ghost" onClick={() => setPhase('done')}>Stop</button>
      </div>
    );
  }
  return (
    <div className="page charades">
      <h1>{right.length} right</h1>
      <p className="muted">{deck.name}{best(deck.id) ? ` · best ${best(deck.id)}` : ''}</p>
      {right.length > 0 && <><h2 className="eyebrow-h">Got it</h2><ul className="list">{right.map((w, i) => <li key={i}>✓ {w}</li>)}</ul></>}
      {passed.length > 0 && <><h2 className="eyebrow-h">Passed</h2><ul className="list">{passed.map((w, i) => <li key={i} className="muted">{w}</li>)}</ul></>}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button className="btn primary" onClick={() => void start()}>Play again</button>
        <button className="btn" onClick={() => setPhase('pick')}>Choose another deck</button>
        <Link className="btn ghost" to="/learn">Done</Link>
      </div>
    </div>
  );
}
