import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ShareButton from '../../components/ShareButton';
import { NAME_SAINTS, type NameSaint } from '../../data/confirmationSaints';
import { dayIndex, markDailyDone, seeded, shuffled } from '../../lib/dailyGame';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
const TAG: Record<string, string> = { courage: 'courage', youth: 'a young person', lead: 'leadership', martyr: 'martyrdom', faithful: 'faithfulness', joy: 'joy', quiet: 'a quiet life', mission: 'missionary work', prayer: 'prayer', ordinary: 'ordinary life', poor: 'care of the poor', conversion: 'a change of heart', creativity: 'creativity', learning: 'learning', scholar: 'scholarship', scripture: 'Scripture', teach: 'teaching', perseverance: 'perseverance', family: 'family life', charity: 'charity', humor: 'humor', forgiveness: 'forgiveness', suffering: 'suffering', justice: 'justice', healing: 'healing', nature: 'nature', art: 'art', mercy: 'mercy', reform: 'reform', work: 'work', humble: 'humility', soldier: 'soldiering', friend: 'friendship' };

/** The words of a saint's name must not appear in the clue that describes them. */
export function redact(why: string, name: string): string {
  let out = why;
  for (const w of name.replace(/\(.*?\)/g, ' ').split(/\s+/).filter((x) => x.length > 3 && !/^(of|the|and|great)$/i.test(x))) out = out.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '___');
  return out;
}
export const clueFor = (s: NameSaint, n: number): string => {
  const [mm, dd] = s.feast.split('-');
  switch (n) {
    case 0: return `The feast is kept in ${MONTHS[+mm - 1]}.`;
    case 1: return `Known for ${s.tags.slice(0, 3).map((t) => TAG[t] ?? t).join(', ')}.`;
    case 2: return `${s.g === 'f' ? 'A woman' : 'A man'}, and the name has ${s.name.replace(/\(.*?\)/g, '').trim().split(/\s+/).length} word${s.name.replace(/\(.*?\)/g, '').trim().split(/\s+/).length === 1 ? '' : 's'}.`;
    case 3: return redact(s.why, s.name);
    default: return `The feast day is ${MONTHS[+mm - 1]} ${+dd}. The name begins with “${s.name[0]}”.`;
  }
};
const TRIES = 5;

/** Guess the saint from clues that get easier. The same saint for everyone each day. */
export default function SaintGuessPage() {
  const [seed, setSeed] = useState(dayIndex());
  const [daily, setDaily] = useState(true);
  const saint = useMemo(() => shuffled(NAME_SAINTS, seeded(77))[seed % NAME_SAINTS.length], [seed]);
  const [shown, setShown] = useState(1);
  const [text, setText] = useState('');
  const [wrong, setWrong] = useState<string[]>([]);
  const [won, setWon] = useState<boolean | null>(null);
  const matches = useMemo(() => { const t = norm(text); return t.length < 2 ? [] : NAME_SAINTS.filter((s) => norm(s.name).includes(t) && !wrong.includes(s.name)).slice(0, 6); }, [text, wrong]);
  const guess = (g: NameSaint) => {
    setText('');
    if (g.name === saint.name) { setWon(true); if (daily) markDailyDone('saintguess', `${shown}/${TRIES}`, shown <= 2); return; }
    setWrong((w) => [...w, g.name]);
    if (shown >= TRIES) { setWon(false); if (daily) markDailyDone('saintguess', 'missed'); } else setShown((n) => n + 1);
  };
  const skip = () => { if (shown >= TRIES) { setWon(false); if (daily) markDailyDone('saintguess', 'missed'); } else setShown((n) => n + 1); };
  const again = () => { setDaily(false); setSeed(Math.floor(Math.random() * 1e6)); setShown(1); setWrong([]); setWon(null); setText(''); };
  const share = `Saint Guess ${daily ? '#' + dayIndex() : 'practice'} 🕊️ ${won ? shown : 'X'}/${TRIES}\n${Array.from({ length: TRIES }, (_, i) => (won && i === shown - 1 ? '🟨' : i < (won ? shown - 1 : shown) ? '⬛' : '⬜')).join('')}`;
  return (
    <div className="page saintguess">
      <h1>Saint Guess</h1>
      <p className="muted small">Who is it? One clue at a time: {TRIES} tries.</p>
      <ol className="sg-clues">{Array.from({ length: shown }, (_, i) => <li key={i}>{clueFor(saint, i)}</li>)}</ol>
      {wrong.length > 0 && <p className="small muted">Not: {wrong.join(', ')}</p>}
      {won === null ? (
        <>
          <input className="sg-input" type="search" value={text} placeholder="Type a name, then tap it" aria-label="Your guess" onChange={(e) => setText(e.target.value)} />
          <ul className="sg-matches">{matches.map((m) => <li key={m.name}><button className="btn" onClick={() => guess(m)}>{m.name}</button></li>)}</ul>
          <button className="btn small ghost" onClick={skip}>{shown >= TRIES ? 'Give up' : 'Another clue'}</button>
        </>
      ) : (
        <div className="ws-end">
          <p className="ws-score">{won ? `Yes: ${saint.name}` : `It was ${saint.name}`}</p>
          <p className="muted">{saint.why}</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}><ShareButton text={share} path="/play/saintguess" label="Share result" className="btn" /><button className="btn ghost" onClick={again}>Another saint</button></div>
          <p className="small"><Link to="/study/saint-names">Find saints by name</Link></p>
        </div>
      )}
    </div>
  );
}
