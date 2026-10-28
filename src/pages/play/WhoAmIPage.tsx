import { useMemo, useState } from 'react';
import ShareButton from '../../components/ShareButton';
import { WHO_AM_I, type WhoAmI } from '../../data/whoami';
import { dayIndex, markDailyDone, seeded, shuffled } from '../../lib/dailyGame';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/^(the|st|saint) /, '').replace(/\s+/g, ' ').trim();
export const accepts = (p: WhoAmI, guess: string) => { const g = norm(guess); return !!g && [p.name, ...(p.also ?? [])].some((n) => norm(n) === g); };

/** Five clues about a person in the Bible, from hard to easy. Guess early to score high. The same person for everyone each day. */
export default function WhoAmIPage() {
  const [seed, setSeed] = useState(dayIndex());
  const [daily, setDaily] = useState(true);
  const person = useMemo(() => shuffled(WHO_AM_I, seeded(31))[seed % WHO_AM_I.length], [seed]);
  const [shown, setShown] = useState(1);
  const [text, setText] = useState('');
  const [wrong, setWrong] = useState<string[]>([]);
  const [won, setWon] = useState<boolean | null>(null);
  const done = (w: boolean, n: number) => { setWon(w); if (daily) markDailyDone('whoami', w ? `${n}/5` : 'missed', w && n <= 2); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const g = text.trim(); if (!g) return;
    setText('');
    if (accepts(person, g)) return done(true, shown);
    setWrong((w) => [...w, g]);
    if (shown >= 5) done(false, 5); else setShown((n) => n + 1);
  };
  const another = () => { if (shown >= 5) done(false, 5); else setShown((n) => n + 1); };
  const again = () => { setDaily(false); setSeed(Math.floor(Math.random() * 1e6)); setShown(1); setWrong([]); setWon(null); setText(''); };
  const share = `Who Am I? ${daily ? '#' + dayIndex() : 'practice'} 🧔 ${won ? shown : 'X'}/5\n${Array.from({ length: 5 }, (_, i) => (won && i === shown - 1 ? '🟨' : i < (won ? shown - 1 : shown) ? '⬛' : '⬜')).join('')}`;
  return (
    <div className="page saintguess">
      <h1>Who Am I?</h1>
      <p className="muted small">A person from the Bible. The first clue is the hardest.</p>
      <ol className="sg-clues">{person.clues.slice(0, shown).map((c, i) => <li key={i}>{c}</li>)}</ol>
      {wrong.length > 0 && <p className="small muted">Not: {wrong.join(', ')}</p>}
      {won === null ? (
        <>
          <form onSubmit={submit} className="row" style={{ gap: 8 }}>
            <input className="sg-input" style={{ flex: 1 }} value={text} placeholder="Type a name" aria-label="Your guess" autoCapitalize="words" autoCorrect="off" onChange={(e) => setText(e.target.value)} />
            <button className="btn primary" type="submit">Guess</button>
          </form>
          <button className="btn small ghost" onClick={another}>{shown >= 5 ? 'Give up' : 'Another clue'}</button>
        </>
      ) : (
        <div className="ws-end">
          <p className="ws-score">{won ? `Yes: ${person.name}` : `It was ${person.name}`}</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}><ShareButton text={share} path="/play/whoami" label="Share result" className="btn" /><button className="btn ghost" onClick={again}>Another person</button></div>
        </div>
      )}
    </div>
  );
}
