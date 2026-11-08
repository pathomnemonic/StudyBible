import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HARD_KINDS, ENERGY, HARD_PRAYER } from '../data/hardDay';
import { loadSituations } from '../chains/load';
import type { Situation } from '../chains/types';
import { getBookText } from '../data/loader';
import { flattenChapter } from '../lib/bibleText';
import { BOOK_BY_ID } from '../lib/canon';
import { contextLink } from '../chains/links';

const dayNo = () => Math.floor(Date.now() / 864e5);
const parse = (r: string) => { const m = /^([A-Z0-9]{3})\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(r); return m ? { book: m[1], c: +m[2], a: +m[3], b: m[4] ? +m[4] : +m[3] } : null; };

/** A page for a day when everything is heavy: choose what kind, choose how much energy you have, and take only what helps. */
export default function HardDayPage() {
  const [kind, setKind] = useState('');
  const [energy, setEnergy] = useState(0);
  const [sits, setSits] = useState<Situation[]>([]);
  const [verse, setVerse] = useState<{ label: string; rows: { n: number; text: string }[]; ref: string } | null>(null);
  useEffect(() => { void loadSituations().then(setSits); }, []);
  const k = HARD_KINDS.find((x) => x.id === kind);
  const ref = k ? k.verses[dayNo() % k.verses.length] : '';
  useEffect(() => {
    setVerse(null);
    const p = ref && parse(ref); if (!p) return;
    let live = true;
    getBookText('webc', p.book).then((d) => { const ch = d.chapters.find((c) => c.n === p.c); const rows = flattenChapter(ch).filter((v) => v.n >= p.a && v.n <= p.b); if (live && rows.length) setVerse({ ref, rows, label: `${BOOK_BY_ID[p.book]?.name ?? p.book} ${p.c}:${p.a}${p.b !== p.a ? `-${p.b}` : ''}` }); }).catch(() => {});
    return () => { live = false; };
  }, [ref]);
  const sit = useMemo(() => sits.find((s) => s.id === k?.situation), [sits, k]);
  const mentor = sit ? sit.mentors[dayNo() % sit.mentors.length] : undefined;
  const link = mentor && contextLink(mentor.step);
  return (
    <div className="page hard-day">
      <h1>A hard day</h1>
      <p className="lede">Take what helps and leave the rest. There is nothing to do here and nothing to finish.</p>
      <h2 className="chain-h2">What kind of day is it?</h2>
      <div className="chips" role="group" aria-label="What kind of day">
        {HARD_KINDS.map((x) => <button key={x.id} className={`chip${kind === x.id ? ' sel' : ''}`} aria-pressed={kind === x.id} onClick={() => { setKind(x.id); if (!energy) setEnergy(1); }}>{x.label}</button>)}
      </div>
      {k && <>
        <h2 className="chain-h2">How much do you have in you?</h2>
        <div className="chips" role="group" aria-label="Energy">
          {ENERGY.map((e) => <button key={e.id} className={`chip${energy === e.id ? ' sel' : ''}`} aria-pressed={energy === e.id} onClick={() => setEnergy(e.id)}>{e.label}</button>)}
        </div>
        <p className="muted small">{ENERGY.find((e) => e.id === energy)?.blurb}</p>
        <section className="card hd-verse" aria-live="polite">
          {verse ? <><blockquote className="chain-quote">{verse.rows.map((v) => <p key={v.n}><sup>{v.n}</sup> {v.text}</p>)}</blockquote><p className="small muted">{verse.label} · World English Bible, Catholic edition</p></> : <p className="muted">One moment…</p>}
        </section>
        <section className="card" aria-label="A line to say">
          <p className="chain-meta"><span className="chain-kind k-liturgy">If you can say one line</span></p>
          <p className="hd-prayer">{HARD_PRAYER}</p>
          <p className="small muted">The Jesus Prayer. Say it slowly, as often as you like, or only think it.</p>
        </section>
        {energy >= 2 && mentor && (
          <section className="card" aria-label="A saint who has been here">
            <p className="chain-meta"><span className="chain-kind k-saint">A saint who has been here</span></p>
            <h2 className="mentor-name">{mentor.name} <span className="muted small">{mentor.lifespan}</span></h2>
            <p>{mentor.why}</p>
            {mentor.step.quote && <blockquote className="chain-quote"><p>{mentor.step.quote}</p></blockquote>}
            <p className="small muted" style={{ margin: 0 }}>{mentor.step.label}</p>
            {link && <p className="small"><Link to={link.to}>{link.text}</Link></p>}
          </section>
        )}
        {energy >= 3 && (
          <section className="card" aria-label="Somewhere to go next">
            <p className="chain-meta"><span className="chain-kind k-catechism">When you’re ready</span></p>
            <ul className="list">
              {sit && <li><Link to={`/study/mentors/${sit.id}`}>More saints and their words: {sit.title.toLowerCase()}</Link></li>}
              <li><Link to="/pray">The prayers, by need</Link></li>
              <li><Link to="/pray/examen">A short evening examen</Link></li>
              <li><Link to="/study/mentors">All the situations</Link></li>
            </ul>
          </section>
        )}
        <p className="muted small">If you are in danger, or thinking of harming yourself, please contact local emergency services or a crisis line now, and tell someone near you. Prayer is a companion, not a replacement for help.</p>
      </>}
    </div>
  );
}
