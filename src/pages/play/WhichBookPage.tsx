import { useEffect, useMemo, useState } from 'react';
import { useEditions } from '../../data/EditionsContext';
import { loadDaily } from '../../study/daily';
import { getJson } from '../../data/loader';
import { passageText, nativeToAnchorRef } from '../../lib/bibleText';
import { parseRefId, refId } from '../../lib/refs';
import { BOOK_BY_ID, BOOKS } from '../../lib/canon';
import ShareButton from '../../components/ShareButton';
import { dayIndex, markDailyDone, seeded, shuffled } from '../../lib/dailyGame';
import { useSettings } from '../../lib/store';

const ROUNDS = 5;
interface Q { book: string; text: string; options: string[] }

/** Five verses with the reference removed: which book is each from? A wrong first guess costs a point, and a second try is allowed. */
export default function WhichBookPage() {
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const edition = get(s.defaultEdition) ?? editions[0];
  const [refs, setRefs] = useState<string[] | null>(null);
  const [seed, setSeed] = useState(dayIndex());
  const [daily, setDaily] = useState(true);
  const [qs, setQs] = useState<Q[] | null>(null);
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [marks, setMarks] = useState<number[]>([]);
  const webc = get('webc');
  useEffect(() => {
    if (!webc) return;
    // the curated daily verses, and a few quotable verses from every book (listed in the WEB-C numbering, turned into anchor references)
    Promise.all([loadDaily(), getJson<Record<string, string[]>>('play/verses.json', true)]).then(([d, v]) => {
      const out = new Set(Object.values(d?.generic ?? {}).map((e) => e.ref));
      for (const list of Object.values(v ?? {})) for (const id of list) {
        const [b, c, n] = id.split('.');
        const a = nativeToAnchorRef(webc, b, +c, +n, +n);
        if (a.exact && a.ref.c1 === a.ref.c2) out.add(refId(a.ref));
      }
      setRefs([...out]);
    });
  }, [webc]);
  const picks = useMemo(() => {
    if (!refs) return [];
    const r = seeded(seed + 5);
    const byBook = new Map<string, string[]>();
    for (const x of refs) { const p = parseRefId(x); if (p) byBook.set(p.book, [...(byBook.get(p.book) ?? []), x]); }
    // one verse from each of five different books
    return shuffled([...byBook.keys()], r).slice(0, ROUNDS).map((b) => ({ book: b, ref: shuffled(byBook.get(b)!, r)[0], r }));
  }, [refs, seed]);
  useEffect(() => {
    if (!picks.length || !edition) return;
    let live = true;
    setQs(null);
    Promise.all(picks.map(async (p) => {
      const ref = parseRefId(p.ref)!;
      const v = await passageText(edition, ref, 3);
      const b = BOOK_BY_ID[p.book];
      const same = BOOKS.filter((x) => x.group === b.group && x.id !== b.id);
      const others = same.length >= 3 ? same : BOOKS.filter((x) => x.testament === b.testament && x.id !== b.id);
      const opts = shuffled([b.id, ...shuffled(others, p.r).slice(0, 3).map((x) => x.id)], p.r);
      return { book: b.id, text: v.map((x) => x.text).join(' '), options: opts } as Q;
    })).then((r) => live && setQs(r.filter((q) => q.text)));
    return () => { live = false; };
  }, [picks, edition?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = qs?.length ?? ROUNDS;
  const done = !!qs && i >= qs.length;
  useEffect(() => { if (done && daily) markDailyDone('whichbook', `${score}/${total * 2}`, score >= total * 2 - 1); }, [done]); // eslint-disable-line
  const q = qs?.[i];
  const right = q && marks.length > i;
  const pick = (b: string) => {
    if (!q || right) return;
    if (b === q.book) { const pts = wrong.length === 0 ? 2 : wrong.length === 1 ? 1 : 0; setScore((x) => x + pts); setMarks((m) => [...m, pts]); }
    else setWrong((w) => [...w, b]);
  };
  const next = () => { setWrong([]); setI((n) => n + 1); };
  const again = () => { setDaily(false); setSeed(Math.floor(Math.random() * 1e6)); setI(0); setScore(0); setMarks([]); setWrong([]); };
  const shareText = () => `Which Book? ${daily ? '#' + dayIndex() : 'practice'} ${score}/${total * 2}\n${marks.map((m) => ['⬛', '🟨', '🟨🟨'][m]).join(' ')}`;

  return (
    <div className="page whosaid">
      <h1>Which Book?</h1>
      {!qs ? <p className="muted">Loading…</p> : !done && q ? (
        <>
          <p className="muted small">Verse {i + 1} of {total}</p>
          <blockquote className="ws-quote">“{q.text}”</blockquote>
          <div className="ws-options" role="group" aria-label="Which book is it from?">
            {q.options.map((o) => (
              <button key={o} className={`btn ws-opt${right && o === q.book ? ' right' : wrong.includes(o) ? ' wrong' : ''}`} onClick={() => pick(o)} disabled={wrong.includes(o) || !!right}>{BOOK_BY_ID[o].name}</button>
            ))}
          </div>
          {right && <div className="ws-after"><p>{BOOK_BY_ID[q.book].name}. {marks[i] === 2 ? 'First try.' : marks[i] === 1 ? 'Second try.' : ''}</p><button className="btn primary" onClick={next}>{i + 1 === total ? 'See my score' : 'Next verse'}</button></div>}
        </>
      ) : (
        <div className="ws-end">
          <p className="ws-score">{score} of {total * 2}</p>
          <p className="muted">{score >= total * 2 - 1 ? 'You know your Bible.' : 'Every chapter you read makes the next round easier.'}</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}><ShareButton text={shareText()} path="/play/whichbook" label="Share result" className="btn" /><button className="btn ghost" onClick={again}>Play another five</button></div>
        </div>
      )}
    </div>
  );
}
