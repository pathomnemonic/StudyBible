import { useEffect, useMemo, useState } from 'react';
import ShareButton from '../../components/ShareButton';
import { getJson } from '../../data/loader';
import { dayIndex, markDailyDone, seeded, shuffled } from '../../lib/dailyGame';

interface Work { id: string; title: string; artist: string; date: string; file: string; refs: string[]; theme: string }
const ROUNDS = 5;

/** A painting or engraving of a Bible scene with its title hidden: which scene is it? A wrong first guess costs a point and a second try is allowed. */
export default function ArtDetectivePage() {
  const [works, setWorks] = useState<Work[] | null>(null);
  const [seed, setSeed] = useState(dayIndex());
  const [daily, setDaily] = useState(true);
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [marks, setMarks] = useState<number[]>([]);
  useEffect(() => { getJson<{ works: Work[] }>('art-more.json', true).then((d) => setWorks((d?.works ?? []).filter((w) => w.refs?.length && w.title && w.file))); }, []);
  const qs = useMemo(() => {
    if (!works) return [];
    const r = seeded(seed + 41);
    const titles = new Map<string, Work[]>();
    for (const w of works) titles.set(w.title, [...(titles.get(w.title) ?? []), w]);
    return shuffled([...titles.values()].map((l) => l[0]), r).slice(0, ROUNDS).map((w) => {
      const same = works.filter((x) => x.theme === w.theme && x.title !== w.title);
      const pool = same.length >= 3 ? same : works.filter((x) => x.title !== w.title);
      const opts = shuffled([w.title, ...shuffled([...new Set(pool.map((x) => x.title))], r).slice(0, 3)], r);
      return { w, opts };
    });
  }, [works, seed]);
  const done = !!works && i >= qs.length;
  const q = qs[i];
  const solved = !!q && marks.length > i;
  useEffect(() => { if (done && daily) markDailyDone('artdetective', `${score}/${qs.length * 2}`, score >= qs.length * 2 - 1); }, [done]); // eslint-disable-line
  const pick = (t: string) => {
    if (!q || solved) return;
    if (t === q.w.title) { const pts = wrong.length === 0 ? 2 : wrong.length === 1 ? 1 : 0; setScore((s) => s + pts); setMarks((m) => [...m, pts]); } else setWrong((x) => [...x, t]);
  };
  const next = () => { setWrong([]); setI((n) => n + 1); };
  const again = () => { setDaily(false); setSeed(Math.floor(Math.random() * 1e6)); setI(0); setScore(0); setMarks([]); setWrong([]); };
  const share = `Art Detective ${daily ? '#' + dayIndex() : 'practice'} 🖼️ ${score}/${qs.length * 2}\n${marks.map((m) => ['⬛', '🟨', '🟨🟨'][m]).join(' ')}`;
  return (
    <div className="page whosaid">
      <h1>Art Detective</h1>
      {!works ? <p className="muted">Loading…</p> : !done && q ? (
        <>
          <p className="muted small">Picture {i + 1} of {qs.length}. What scene is shown?</p>
          <img className="ad-img" src={`${import.meta.env.BASE_URL}${q.w.file}`} alt="A painting or engraving of a Bible scene, title hidden" />
          <div className="ws-options" role="group" aria-label="Which scene?">
            {q.opts.map((o) => <button key={o} className={`btn ws-opt${solved && o === q.w.title ? ' right' : wrong.includes(o) ? ' wrong' : ''}`} disabled={wrong.includes(o) || solved} onClick={() => pick(o)}>{o}</button>)}
          </div>
          {solved && <div className="ws-after"><p>{q.w.title}: {q.w.refs[0]}. <span className="muted small">{q.w.artist}, {q.w.date}</span></p><button className="btn primary" onClick={next}>{i + 1 === qs.length ? 'See my score' : 'Next picture'}</button></div>}
        </>
      ) : (
        <div className="ws-end"><p className="ws-score">{score} of {qs.length * 2}</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}><ShareButton text={share} path="/play/artdetective" label="Share result" className="btn" /><button className="btn ghost" onClick={again}>Play another five</button></div>
          <p className="muted small">Engravings by Gustave Doré (public domain).</p>
        </div>
      )}
    </div>
  );
}
