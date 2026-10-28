import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PROPHET, COUNTS, type ProphetQ } from '../../data/prophet';
import ShareButton from '../../components/ShareButton';
import { getBookText } from '../../data/loader';
import { flattenChapter } from '../../lib/bibleText';

const ROUNDS = 8;
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const points = (guess: number, q: ProphetQ) => Math.round(100 * Math.pow(0.5, Math.abs(guess - q.answer) / q.scale));
const BEST = 'sb:prophet:best';
const best = () => { try { return +(localStorage.getItem(BEST) ?? 0); } catch { return 0; } };

async function countWord(book: string, word: string): Promise<number> {
  const d = await getBookText('webc', book);
  const re = new RegExp(`\\b${word}\\b`, 'gi');
  return d.chapters.reduce((n, ch) => n + flattenChapter(ch).reduce((m, v) => m + (v.text.match(re)?.length ?? 0), 0), 0);
}

/** Make a prediction, then see how close you were. Dates, measures and counts; the closer you are, the more you score. */
export default function ProphetPage() {
  const [deck, setDeck] = useState<ProphetQ[] | null>(null);
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState('');
  const [shown, setShown] = useState<{ pts: number; off: number } | null>(null);
  const [total, setTotal] = useState(0);
  const [log, setLog] = useState<number[]>([]);
  const [phase, setPhase] = useState<'start' | 'play' | 'done'>('start');
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true);
    // one or two questions are counted from the Bible text itself
    const picks = shuffle(COUNTS).slice(0, 2);
    const counted: ProphetQ[] = await Promise.all(picks.map(async (c) => {
      const n = await countWord(c.book, c.word);
      return { q: `How many times does the word “${c.word}” appear in ${c.bookName} (WEB-C text in this app)?`, answer: n, unit: 'times', scale: Math.max(2, c.scale(n)), note: `Counted from the text on your device: ${n}.` };
    }));
    setDeck(shuffle([...shuffle(PROPHET).slice(0, ROUNDS - counted.length), ...counted]));
    setI(0); setTotal(0); setLog([]); setGuess(''); setShown(null); setPhase('play'); setBusy(false);
  };
  useEffect(() => { if (phase === 'done') { try { if (total > best()) localStorage.setItem(BEST, String(total)); } catch { /* private mode */ } } }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = deck?.[i];
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q || shown || guess.trim() === '' || Number.isNaN(+guess)) return;
    const pts = points(+guess, q);
    setShown({ pts, off: Math.abs(+guess - q.answer) }); setTotal((t) => t + pts); setLog((l) => [...l, pts]);
  };
  const next = () => { if (i + 1 >= (deck?.length ?? 0)) setPhase('done'); else { setI(i + 1); setGuess(''); setShown(null); } };
  const verdict = useMemo(() => (total >= 600 ? 'A true prophet.' : total >= 400 ? 'A sound sense of things.' : total >= 200 ? 'Learning.' : 'Keep guessing.'), [total]);
  if (phase === 'start') {
    return (
      <div className="page prophet">
        <h1>The Prophet</h1>
        <p className="muted">Eight questions: a year, a number, or a count of a word in Scripture. You are scored on how close you get, not on being exact. Up to 100 points each.</p>
        <button className="btn primary big" disabled={busy} onClick={() => void start()}>{busy ? 'Counting…' : 'Begin'}</button>
        <p className="muted small">Best score: {best()} of {ROUNDS * 100}</p>
        <p><Link className="btn ghost" to="/play">All games</Link></p>
      </div>
    );
  }
  if (phase === 'done') {
    return (
      <div className="page prophet">
        <h1>{total} points</h1>
        <p className="muted">{verdict} Best: {Math.max(best(), total)}.</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <ShareButton text={`The Prophet 🔮 ${total}/${log.length * 100}\n${log.map((p) => (p >= 80 ? '🟩' : p >= 50 ? '🟨' : p >= 20 ? '🟧' : '🟥')).join('')}`} path="/play/prophet" />
          <button className="btn" onClick={() => void start()}>Play again</button>
          <Link className="btn ghost" to="/play">All games</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="page prophet">
      <div className="row between"><span className="muted small">Question {i + 1} of {deck!.length}</span><strong>{total}</strong></div>
      <h2 className="prophet-q">{q!.q}</h2>
      <form className="rowform" onSubmit={submit}>
        <label className="sr-only" htmlFor="pg">Your guess</label>
        <input id="pg" type="number" inputMode="numeric" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder={q!.year ? 'A year' : `A number of ${q!.unit}`} disabled={!!shown} autoFocus />
        <button className="btn primary" type="submit" disabled={!!shown || guess === ''}>Guess</button>
      </form>
      {shown && (
        <section className="card prophet-answer" role="status">
          <strong>{q!.answer} {q!.year ? q!.unit : q!.unit}</strong>
          <p>{shown.off === 0 ? 'Exactly right!' : `You were off by ${shown.off} ${q!.year ? 'years' : q!.unit}.`} <b>+{shown.pts}</b></p>
          <p className="muted small">{q!.note}</p>
          <button className="btn primary" onClick={next}>{i + 1 >= deck!.length ? 'See my score' : 'Next'}</button>
        </section>
      )}
    </div>
  );
}
