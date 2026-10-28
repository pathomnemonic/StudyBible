import ShareButton from '../../components/ShareButton';
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
  const motionSeen = useRef(false);
  const beyond = useRef<{ dir: 1 | -1; since: number } | null>(null);
  const upright = useRef(0);
  const [gate, setGate] = useState(false);
  const gateRef = useRef(false);
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
    // with a tilting phone the next word waits until it is back on the forehead, upright and still
    if (motionSeen.current) { gateRef.current = true; setGate(true); setWord(''); upright.current = 0; } else nextWord();
  }, [word, nextWord]);

  const start = async () => {
    // some phones ask before they share motion, and only in response to a tap
    try { const D = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }; if (typeof D?.requestPermission === 'function') await D.requestPermission(); } catch { /* buttons still work */ }
    queue.current = shuffle(deck.words);
    rightRef.current = []; passedRef.current = []; setRight([]); setPassed([]);
    setCount(3); gateRef.current = false; setGate(false); motionSeen.current = false; beyond.current = null; setPhase('ready');
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
  // tilt: the screen turned toward the floor is a right answer, toward the ceiling a pass. It has to be a clear, held tilt (about 55 degrees for a fifth of a second),
  // and afterwards the next word only appears once the phone is back upright on the forehead and still.
  useEffect(() => {
    if (phase !== 'play') return;
    const started = Date.now();
    const h = (e: DeviceMotionEvent) => {
      const z = e.accelerationIncludingGravity?.z;
      if (z == null) return;
      motionSeen.current = true;
      const v = flip ? -z : z;
      const now = Date.now();
      if (gateRef.current) {
        if (Math.abs(v) < 2.5) {
          if (!upright.current) upright.current = now;
          if (now - upright.current >= 700) { gateRef.current = false; setGate(false); armed.current = true; beyond.current = null; nextWord(); }
        } else upright.current = 0;
        return;
      }
      if (now - started < 1200) return;
      if (Math.abs(v) < 4) { armed.current = true; beyond.current = null; return; }
      if (!armed.current) return;
      const dir: 1 | -1 | 0 = v <= -8 ? -1 : v >= 8 ? 1 : 0;
      if (!dir) { beyond.current = null; return; }
      if (!beyond.current || beyond.current.dir !== dir) { beyond.current = { dir, since: now }; return; }
      if (now - beyond.current.since >= 200) { armed.current = false; beyond.current = null; answer(dir === -1); }
    };
    window.addEventListener('devicemotion', h);
    return () => window.removeEventListener('devicemotion', h);
  }, [phase, answer, flip, nextWord]);
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
        <p className="muted">Hold the phone to your forehead. Your friends act out or describe the word. Tilt down when you get it, up to pass. After each word, put the phone back on your forehead and hold still for the next one. Pick a deck, then press Start.</p>
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
        <div className="charades-startbar"><span>{deck.name}</span><button className="btn primary big" onClick={() => void start()}>Start</button></div>
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
        <div className="charades-word" aria-live="polite">{flash === 'right' ? 'Correct!' : flash === 'pass' ? 'Pass' : gate ? 'Back on your forehead, hold still…' : word}</div>
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
        <ShareButton text={`Charades 🎭 ${deck.name}: ${right.length} right, ${passed.length} passed in ${secs}s\n${'🟨'.repeat(Math.min(right.length, 20))}${'⬛'.repeat(Math.min(passed.length, 10))}`} path="/play/charades" />
        <button className="btn" onClick={() => void start()}>Play again</button>
        <button className="btn" onClick={() => setPhase('pick')}>Choose another deck</button>
        <Link className="btn ghost" to="/learn">Done</Link>
      </div>
    </div>
  );
}
