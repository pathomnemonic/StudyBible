import { useEffect, useMemo, useState } from 'react';
import { getJson } from '../../data/loader';
import { LADDERS } from '../../data/ladders';
import ShareButton from '../../components/ShareButton';
import { dayIndex, markDailyDone } from '../../lib/dailyGame';

/** The shortest chain of words between two words, found by walking one-letter changes. Null if there is none. */
export function shortest(from: string, to: string, words: Set<string>): string[] | null {
  const prev = new Map<string, string>([[from, '']]);
  let layer = [from];
  while (layer.length && !prev.has(to)) {
    const nextLayer: string[] = [];
    for (const w of layer) for (let i = 0; i < w.length; i++) for (const c of 'abcdefghijklmnopqrstuvwxyz') {
      if (c === w[i]) continue;
      const n = w.slice(0, i) + c + w.slice(i + 1);
      if (words.has(n) && !prev.has(n)) { prev.set(n, w); nextLayer.push(n); }
    }
    layer = nextLayer;
  }
  if (!prev.has(to)) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0])!);
  return path;
}
const oneApart = (a: string, b: string) => a.length === b.length && [...a].filter((c, i) => c !== b[i]).length === 1;

/** Change one letter at a time to turn the first word into the last. Fewer steps is better; the same puzzle for everyone each day. */
export default function ChainPage() {
  const [words, setWords] = useState<Set<string> | null>(null);
  const [n, setN] = useState(dayIndex() % LADDERS.length);
  const [daily, setDaily] = useState(true);
  const [chain, setChain] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [hints, setHints] = useState(0);
  useEffect(() => { getJson<{ words: string[] }>('play/words.json', true).then((d) => setWords(new Set((d?.words ?? []).filter((w) => w.length >= 3 && w.length <= 5)))); }, []);
  const [from, to] = LADDERS[n];
  const best = useMemo(() => (words ? shortest(from, to, words) : null), [words, from, to]);
  useEffect(() => { setChain([from]); setText(''); setMsg(''); setHints(0); }, [from]);
  const last = chain[chain.length - 1] ?? from;
  const won = last === to;
  const steps = chain.length - 1;
  const par = best ? best.length - 1 : 0;
  useEffect(() => { if (won && daily) markDailyDone('chain', `${steps} steps (best ${par})`); }, [won]); // eslint-disable-line

  const submit = () => {
    const w = text.toLowerCase().trim();
    if (w.length !== from.length) { setMsg(`${from.length} letters`); return; }
    if (!oneApart(last, w)) { setMsg('Change exactly one letter'); return; }
    if (!words?.has(w)) { setMsg('Not in the word list'); return; }
    if (chain.includes(w)) { setMsg('Already used'); return; }
    setChain((c) => [...c, w]); setText(''); setMsg('');
  };
  const hint = () => { if (!best) return; const at = best.indexOf(last); const nxt = at >= 0 ? best[at + 1] : best[1]; setHints((h) => h + 1); setMsg(`Try ${nxt?.toUpperCase()}`); };
  const another = () => { setDaily(false); setN((x) => (x + 1 + Math.floor(Math.random() * (LADDERS.length - 1))) % LADDERS.length); };
  const shareText = () => `Chain of Grace ${daily ? '#' + dayIndex() : 'practice'} 🔗 ${steps} step${steps === 1 ? '' : 's'} (best ${par})${hints ? ` · ${hints} hint${hints > 1 ? 's' : ''}` : ''}\n${chain.map((_, i) => (i === 0 ? '⬜' : i <= par ? '🟨' : '🟫')).join('')}`;

  return (
    <div className="page chain">
      <h1>Chain of Grace</h1>
      <p className="muted small">Turn <strong>{from.toUpperCase()}</strong> into <strong>{to.toUpperCase()}</strong>, changing one letter at a time. Every step must be a word.{par ? ` It can be done in ${par}.` : ''}</p>
      <ol className="ch-list" aria-label="Your chain">{chain.map((w, i) => <li key={w} className={w === to ? 'goal' : ''}>{[...w].map((c, k) => <span key={k} className={i > 0 && c !== chain[i - 1][k] ? 'chg' : ''}>{c}</span>)}</li>)}</ol>
      {won ? (
        <div className="ws-end">
          <p className="ws-score">{steps} steps</p>
          <p className="muted">{steps <= par ? 'The shortest way. Well done.' : `The shortest is ${par}: ${best?.join(' → ')}.`}{hints ? ` (${hints} hint${hints > 1 ? 's' : ''})` : ''}</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}><ShareButton text={shareText()} path="/play/chain" label="Share result" className="btn" /><button className="btn ghost" onClick={another}>Another chain</button></div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="row" style={{ gap: 8 }}>
          <input aria-label="Next word" value={text} maxLength={from.length} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(e) => setText(e.target.value.replace(/[^a-z]/gi, ''))} style={{ textTransform: 'uppercase', width: 40 + from.length * 22, letterSpacing: 4, textAlign: 'center' }} />
          <button className="btn primary" type="submit">Add</button>
          <button className="btn ghost" type="button" onClick={() => setChain((c) => (c.length > 1 ? c.slice(0, -1) : c))}>Undo</button>
          <button className="btn ghost" type="button" onClick={hint}>Hint</button>
        </form>
      )}
      <p className="vb-msg" aria-live="polite">{msg}</p>
    </div>
  );
}
