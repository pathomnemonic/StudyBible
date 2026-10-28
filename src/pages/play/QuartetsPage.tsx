import { markDailyDone } from '../../lib/dailyGame';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QUARTETS, type Quartet, type QuartetGroup } from '../../data/quartets';
import { copyText } from '../../lib/clipboard';
import { buzz } from '../../lib/haptics';

const LEVEL_EMOJI = ['🟨', '🟩', '🟦', '🟪'];
const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
// a stable shuffle for the daily puzzle, so everyone sees the same board
const seeded = <T,>(a: T[], seed: number) => { const b = [...a]; let s = seed * 9301 + 49297; for (let i = b.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const KEY = 'sb:quartets:done';
const loadDone = (): Record<string, { won: boolean; mistakes: number }> => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; } };

/** Sixteen tiles, four sets of four. Four mistakes allowed. One puzzle a day, and the others whenever you like. */
export default function QuartetsPage() {
  const [sp, setSp] = useSearchParams();
  const today = QUARTETS[dayIndex() % QUARTETS.length];
  const picked = QUARTETS.find((q) => q.id === sp.get('p'));
  const [done, setDone] = useState(loadDone);
  if (!picked) {
    return (
      <div className="page quartets">
        <h1>Quartets</h1>
        <p className="muted">Sixteen tiles hide four sets of four. Find the sets. Watch for tiles that fit two of them.</p>
        <button className="btn primary big" onClick={() => setSp({ p: today.id })}>Today’s puzzle{done[today.id] ? (done[today.id].won ? ' ✓' : ' (tried)') : ''}</button>
        <h2 className="eyebrow-h" style={{ marginTop: 16 }}>More puzzles</h2>
        <ul className="list">
          {QUARTETS.map((q) => <li key={q.id}><button className="linklike t" onClick={() => setSp({ p: q.id })}>{q.title}</button> <span className="muted small">{done[q.id] ? (done[q.id].won ? `· solved${done[q.id].mistakes ? `, ${done[q.id].mistakes} mistake${done[q.id].mistakes === 1 ? '' : 's'}` : ' with no mistakes'}` : '· not solved') : ''}</span></li>)}
        </ul>
        <p><Link className="btn ghost" to="/play">All games</Link></p>
      </div>
    );
  }
  return <Board key={picked.id} q={picked} daily={picked.id === today.id} onDone={(won, mistakes) => { if (picked.id === today.id) markDailyDone('quartets', won ? (mistakes ? `${mistakes} mistake${mistakes === 1 ? '' : 's'}` : 'perfect') : 'tried'); const d = { ...loadDone(), [picked.id]: { won, mistakes } }; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* private mode */ } setDone(d); }} back={() => setSp({})} />;
}

function Board({ q, daily, onDone, back }: { q: Quartet; daily: boolean; onDone: (won: boolean, mistakes: number) => void; back: () => void }) {
  const all = useMemo(() => q.groups.flatMap((g) => g.words), [q]);
  const [tiles, setTiles] = useState(() => (daily ? seeded(all, dayIndex()) : shuffle(all)));
  const [sel, setSel] = useState<string[]>([]);
  const [solved, setSolved] = useState<QuartetGroup[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [msg, setMsg] = useState('');
  const [log, setLog] = useState<number[]>([]);
  const over = solved.length === 4 || mistakes >= 4;
  const left = tiles.filter((t) => !solved.some((g) => g.words.includes(t as never)));
  useEffect(() => { if (over) onDone(solved.length === 4, mistakes); }, [over]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (t: string) => { if (over) return; setMsg(''); setSel((s) => (s.includes(t) ? s.filter((x) => x !== t) : s.length < 4 ? [...s, t] : s)); };
  const submit = () => {
    if (sel.length !== 4) return;
    const hit = q.groups.find((g) => !solved.includes(g) && sel.every((t) => g.words.includes(t as never)));
    if (hit) { setSolved((s) => [...s, hit]); setLog((l) => [...l, hit.level]); setSel([]); buzz(25); return; }
    const near = q.groups.some((g) => !solved.includes(g) && sel.filter((t) => g.words.includes(t as never)).length === 3);
    setMistakes((m) => m + 1); setMsg(near ? 'One away…' : 'Not a set.'); buzz(40); setSel([]);
  };
  const reveal = () => { const rest = q.groups.filter((g) => !solved.includes(g)); setSolved((s) => [...s, ...rest]); };
  useEffect(() => { if (mistakes >= 4 && solved.length < 4) reveal(); }, [mistakes]); // eslint-disable-line react-hooks/exhaustive-deps
  const share = async () => { const rows = log.map((l) => LEVEL_EMOJI[l].repeat(4)); await copyText(`Quartets · ${q.title}\n${solved.length === 4 && mistakes < 4 ? 'Solved' : 'Not this time'}, ${mistakes} mistake${mistakes === 1 ? '' : 's'}\n${rows.join('\n')}`); setMsg('Result copied'); };
  const byLevel = [...solved].sort((a, b) => a.level - b.level);
  const lost = mistakes >= 4;
  return (
    <div className="page quartets">
      <div className="row between"><button className="btn small ghost" onClick={back}>← Puzzles</button><span className="muted small">{daily ? 'Today · ' : ''}{q.title}</span></div>
      <div className="q-solved">
        {(over ? byLevel : solved).map((g) => <div key={g.name} className={`q-row lv${g.level}`}><strong>{g.name}</strong><span>{g.words.join(', ')}</span></div>)}
      </div>
      {!over && (
        <div className="q-grid" role="group" aria-label="Tiles">
          {left.map((t) => <button key={t} className={`q-tile${sel.includes(t) ? ' on' : ''}`} aria-pressed={sel.includes(t)} onClick={() => toggle(t)}>{t}</button>)}
        </div>
      )}
      <p className="q-msg" role="status" aria-live="polite">{over ? (lost ? 'Out of mistakes. Here are the sets.' : mistakes === 0 ? 'Perfect.' : 'Solved.') : msg || `Mistakes left: ${'●'.repeat(4 - mistakes)}${'○'.repeat(mistakes)}`}</p>
      {!over ? (
        <div className="row" style={{ gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setTiles((t) => shuffle(t))}>Shuffle</button>
          <button className="btn" disabled={!sel.length} onClick={() => setSel([])}>Deselect</button>
          <button className="btn primary" disabled={sel.length !== 4} onClick={submit}>Submit</button>
        </div>
      ) : (
        <div className="row" style={{ gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn primary" onClick={() => void share()}>Copy my result</button>
          <button className="btn" onClick={back}>More puzzles</button>
        </div>
      )}
    </div>
  );
}
