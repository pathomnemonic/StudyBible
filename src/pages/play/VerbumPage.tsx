import { useCallback, useEffect, useMemo, useState } from 'react';
import { getJson } from '../../data/loader';
import { THEMED } from '../../data/cloister';
import { ANSWERS } from '../../data/verbum';
import { markDailyDone } from '../../lib/dailyGame';
import ShareButton from '../../components/ShareButton';
import { buzz } from '../../lib/haptics';

type Mark = 'hit' | 'near' | 'miss';
const ROWS = 6, LEN = 5;
const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
const KEYS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const SAVE = 'sb:verbum:v1';

/** Marks for one guess: right letter in the right place, right letter elsewhere (counted once per letter in the answer), or neither. */
export function mark(guess: string, answer: string): Mark[] {
  const out: Mark[] = Array(LEN).fill('miss');
  const left: Record<string, number> = {};
  for (let i = 0; i < LEN; i++) { if (guess[i] === answer[i]) out[i] = 'hit'; else left[answer[i]] = (left[answer[i]] ?? 0) + 1; }
  for (let i = 0; i < LEN; i++) if (out[i] === 'miss' && left[guess[i]] > 0) { out[i] = 'near'; left[guess[i]]--; }
  return out;
}

interface Saved { day: number; guesses: string[]; played: number; won: number; streak: number; best: number; last: number; counted?: boolean }
const load = (): Saved => { try { return JSON.parse(localStorage.getItem(SAVE) ?? '') as Saved; } catch { return { day: -1, guesses: [], played: 0, won: 0, streak: 0, best: 0, last: -1 }; } };

/** A daily five-letter word of the faith, six tries. One word a day, the same for everyone, with nothing to sign up for. */
export default function VerbumPage() {
  const [valid, setValid] = useState<Set<string> | null>(null);
  const [practice, setPractice] = useState<string | null>(null);
  const today = dayIndex();
  const [st, setSt] = useState<Saved>(() => { const s = load(); return s.day === today ? s : { ...s, day: today, guesses: [], counted: false }; });
  const [pGuesses, setPGuesses] = useState<string[]>([]);
  const [cur, setCur] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => { getJson<{ words: string[] }>('play/words.json', true).then((d) => setValid(new Set([...(d?.words ?? []).filter((w) => w.length === LEN), ...THEMED, ...ANSWERS].filter((w) => w.length === LEN)))); }, []);
  const answer = practice ?? ANSWERS[(today * 7919) % ANSWERS.length];
  const guesses = practice ? pGuesses : st.guesses;
  const won = guesses.includes(answer);
  const over = won || guesses.length >= ROWS;
  const save = (s: Saved) => { setSt(s); try { localStorage.setItem(SAVE, JSON.stringify(s)); } catch { /* private mode */ } };

  const submit = useCallback(() => {
    if (cur.length < LEN) { setMsg('Five letters'); return; }
    if (valid && !valid.has(cur)) { setMsg('Not in the word list'); buzz(8); return; }
    setMsg(''); setCur('');
    if (practice) { setPGuesses((g) => [...g, cur]); return; }
    const g = [...st.guesses, cur];
    const finished = cur === answer || g.length >= ROWS;
    let s = { ...st, guesses: g };
    if (finished && !st.counted) {
      const w = cur === answer;
      const streak = w ? (st.last === today - 1 ? st.streak + 1 : 1) : 0;
      s = { ...s, counted: true, played: st.played + 1, won: st.won + (w ? 1 : 0), streak, best: Math.max(st.best, streak), last: today };
    }
    if (finished && !st.counted) markDailyDone('verbum', cur === answer ? `${g.length}/${ROWS}` : 'missed', cur === answer && g.length <= 3);
    save(s);
    buzz(cur === answer ? 30 : 10);
  }, [cur, valid, practice, st, answer, today]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (over || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') submit();
      else if (e.key === 'Backspace') setCur((c) => c.slice(0, -1));
      else if (/^[a-z]$/i.test(e.key)) setCur((c) => (c.length < LEN ? c + e.key.toLowerCase() : c));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [over, submit]);

  const keyState = useMemo(() => {
    const m: Record<string, Mark> = {};
    const rank = { miss: 0, near: 1, hit: 2 };
    for (const g of guesses) mark(g, answer).forEach((k, i) => { if (m[g[i]] === undefined || rank[k] > rank[m[g[i]]]) m[g[i]] = k; });
    return m;
  }, [guesses, answer]);
  const press = (k: string) => { if (over) return; if (k === '⏎') submit(); else if (k === '⌫') setCur((c) => c.slice(0, -1)); else setCur((c) => (c.length < LEN ? c + k : c)); };
  const shareText = () => {
    const sq = { hit: '🟨', near: '⬜', miss: '⬛' } as const;
    return `Verbum ${practice ? 'practice' : '#' + today} ${won ? guesses.length : 'X'}/${ROWS}\n` + guesses.map((g) => mark(g, answer).map((m) => sq[m]).join('')).join('\n');
  };
  const again = () => { const pool = ANSWERS.filter((w) => w !== answer); setPractice(pool[Math.floor(Math.random() * pool.length)]); setPGuesses([]); setCur(''); setMsg(''); };

  const rows = Array.from({ length: ROWS }, (_, r) => (r < guesses.length ? guesses[r] : r === guesses.length && !over ? cur : ''));
  return (
    <div className="page verbum">
      <h1>Verbum</h1>
      <p className="muted small">{practice ? 'Practice word' : 'The word of the day'}: five letters from the faith, six tries. Gold is the right place, grey-white is in the word elsewhere.</p>
      <div className="vb-grid" role="grid" aria-label="Guesses">
        {rows.map((w, r) => {
          const done = r < guesses.length;
          const ms = done ? mark(w, answer) : [];
          return <div className="vb-row" role="row" key={r}>{Array.from({ length: LEN }, (_, i) => <span role="gridcell" key={i} className={`vb-cell ${done ? ms[i] : w[i] ? 'typed' : ''}`} aria-label={done ? `${w[i]}, ${ms[i] === 'hit' ? 'right place' : ms[i] === 'near' ? 'elsewhere' : 'not in the word'}` : undefined}>{w[i] ?? ''}</span>)}</div>;
        })}
      </div>
      <p className="vb-msg" aria-live="polite">{msg || (over ? (won ? `Yes: ${answer.toUpperCase()}. ${guesses.length === 1 ? 'First try!' : `${guesses.length} of ${ROWS}.`}` : `The word was ${answer.toUpperCase()}.`) : '')}</p>
      {over ? (
        <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
          <ShareButton text={shareText()} path="/play/verbum" label="Share result" className="btn" />
          <button className="btn ghost" onClick={again}>Play another</button>
        </div>
      ) : (
        <div className="vb-keys">
          {KEYS.map((row, i) => (
            <div className="vb-keyrow" key={row}>
              {i === 2 && <button className="vb-key wide" onClick={() => press('⏎')} aria-label="Enter">⏎</button>}
              {[...row].map((k) => <button key={k} className={`vb-key ${keyState[k] ?? ''}`} onClick={() => press(k)}>{k}</button>)}
              {i === 2 && <button className="vb-key wide" onClick={() => press('⌫')} aria-label="Delete">⌫</button>}
            </div>
          ))}
        </div>
      )}
      {!practice && <p className="muted small" style={{ textAlign: 'center' }}>Played {st.played} · Won {st.won} · Streak {st.streak} · Best {st.best}</p>}
    </div>
  );
}
