import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SLOW_TOTAL, SLOW_YEARS, YEAR_DAYS, dayLabel, isoToday, loadSlow, massHits, overview, saveSlow, segmentsOf, todayIndex, versesIn, yearOf, type LitHit, type Segment, type SlowState } from '../lib/slowBible';
import { getBookText } from '../data/loader';
import { flattenChapter } from '../lib/bibleText';
import { providers, type StudyItem } from '../study/providers';

const clip = (t: string, n = 460) => (t.length > n ? `${t.slice(0, n).replace(/\s+\S*$/, '')}…` : t);
const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

function Passage({ segs }: { segs: Segment[] }) {
  const [rows, setRows] = useState<{ label: string; verses: { n: number; text: string }[] }[] | null>(null);
  useEffect(() => {
    let live = true; setRows(null);
    Promise.all(segs.map(async (s) => { const d = await getBookText('webc', s.book); const ch = d.chapters.find((c) => c.n === s.c); return { label: `${s.name} ${s.c}`, verses: flattenChapter(ch).filter((v) => v.n >= s.v1 && v.n <= s.v2) }; })).then((r) => live && setRows(r)).catch(() => live && setRows([]));
    return () => { live = false; };
  }, [segs.map((s) => `${s.book}${s.c}${s.v1}${s.v2}`).join()]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!rows) return <p className="muted">Opening the passage…</p>;
  return <>{rows.map((r) => <div key={r.label} className="sb-text">{rows.length > 1 && <p className="muted small">{r.label}</p>}{r.verses.map((v) => <p key={v.n}><sup>{v.n}</sup> {v.text}</p>)}</div>)}</>;
}

/** The whole Bible over about seven years: a few verses each day, with a Father’s word on the passage and where it is read at Mass. */
export default function SlowBiblePage() {
  const [st, setSt] = useState<SlowState | null>(loadSlow);
  const [view, setView] = useState<number | null>(null);
  const [fathers, setFathers] = useState<StudyItem[] | null>(null);
  const [mass, setMass] = useState<LitHit[] | null>(null);
  const today = st ? todayIndex(st) : 0;
  const day = view ?? today;
  const segs = useMemo(() => segmentsOf(day), [day]);
  const set = (s: SlowState | null) => { setSt(s); saveSlow(s); };

  useEffect(() => {
    if (!st) return;
    let live = true; setFathers(null); setMass(null);
    const s = segs[0]; if (!s) return;
    const ref = { book: s.book, c1: s.c, v1: s.v1, c2: s.c, v2: s.v2 } as never;
    Promise.all([providers.fathers([ref]).catch(() => [] as StudyItem[]), providers.commentary([ref]).catch(() => [] as StudyItem[])]).then(([a, b]) => {
      if (!live) return;
      const seen = new Set<string>();
      const all = [...b.filter((x) => x.authorId !== 'haydock' && (x.excerpt ?? '').length > 80), ...a.filter((x) => (x.excerpt ?? '').length > 80)];
      setFathers(all.filter((x) => { const k = x.author ?? x.title; return seen.has(k) ? false : (seen.add(k), true); }).slice(0, 2));
    });
    massHits(segs, isoToday()).then((h) => live && setMass(h));
    return () => { live = false; };
  }, [day, !!st]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!st) {
    const years = overview();
    return (
      <div className="page slow-bible">
        <h1>The slow Bible</h1>
        <p className="lede">The whole Catholic Bible, from Genesis to Revelation, over about seven years. A few verses a day, never rushed, each with a Father of the Church beside it and a note of where it is read at Mass.</p>
        <p>It is the opposite of a read-it-in-a-year plan. Most days are about {Math.round(13)} verses: a scene, a psalm, a short letter. Nothing is skipped, and the Bible is read in order, so you see the story as it unfolds.</p>
        <p><button className="btn primary big" onClick={() => set({ start: isoToday(), done: [] })}>Begin today</button></p>
        <h2 className="chain-h2">The seven years</h2>
        <ol className="list sb-years">{years.map((y) => <li key={y.year}><strong>Year {y.year}</strong>: {y.books.map((b) => b.name).join(', ')}</li>)}</ol>
        <p className="muted small">{SLOW_TOTAL.toLocaleString()} days. Your progress is kept on this device only. Readings are from the World English Bible, Catholic edition.</p>
      </div>
    );
  }
  const isDone = st.done.includes(day);
  const yr = yearOf(day);
  const behind = today - st.done.length;
  const meets = (ref: string) => <Link to={ref}>Read it in the Bible</Link>;
  const s0 = segs[0];
  return (
    <div className="page slow-bible">
      <h1>The slow Bible</h1>
      <div className="sb-head card">
        <p className="chain-meta"><span className="chain-when big">Day {day + 1} of {SLOW_TOTAL.toLocaleString()}</span><span className="muted">Year {yr} of {SLOW_YEARS}</span></p>
        <div className="sb-bar" role="progressbar" aria-valuenow={st.done.length} aria-valuemax={SLOW_TOTAL} aria-label="Days read"><i style={{ width: `${(100 * st.done.length) / SLOW_TOTAL}%` }} /></div>
        <p className="muted small">{st.done.length} day{st.done.length === 1 ? '' : 's'} read · {Math.round((100 * st.done.length) / SLOW_TOTAL)}% of the Bible{view !== null && view !== today ? ` · today is day ${today + 1}` : ''}</p>
      </div>
      <h2 className="sb-ref">{dayLabel(day)}</h2>
      <p className="muted small" style={{ margin: 0 }}>{versesIn(day)} verses</p>
      <section className="card sb-passage" aria-label="The reading"><Passage segs={segs} /></section>
      <div className="row no-print" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button className={`btn${isDone ? '' : ' primary'}`} onClick={() => set({ ...st, done: isDone ? st.done.filter((d) => d !== day) : [...st.done, day] })}>{isDone ? '✓ Read (undo)' : 'Mark as read'}</button>
        <button className="btn" disabled={day === 0} onClick={() => setView(day - 1)}>← Yesterday’s</button>
        <button className="btn" disabled={day >= SLOW_TOTAL - 1} onClick={() => setView(day + 1)}>Tomorrow’s →</button>
        {view !== null && view !== today && <button className="btn ghost" onClick={() => setView(null)}>Back to today</button>}
        {s0 && meets(`/read/webc/${s0.book}/${s0.c}?v=${s0.v1}-${s0.v2}`)}
      </div>

      <h2 className="chain-h2">With the Fathers</h2>
      {fathers === null ? <p className="muted">Looking in the library…</p> : fathers.length === 0 ? <p className="muted">No Father in the library has a note on this passage today. The <Link to={s0 ? `/study/fathers-on?ref=${s0.book}.${s0.c}.${s0.v1}` : '/study/fathers-on'}>Fathers on a passage</Link> page can look at a nearby verse.</p> : (
        <div className="sb-fathers">{fathers.map((f) => (
          <blockquote key={f.id} className="chain-quote"><p>{clip(f.fullExcerpt ?? f.excerpt ?? '')}</p><footer className="small muted">{f.author}{f.internal && <> · <Link to={f.internal}>Read in context</Link></>}</footer></blockquote>
        ))}</div>
      )}

      <h2 className="chain-h2">In the liturgy</h2>
      {mass === null ? <p className="muted">Checking the readings of the Church…</p> : mass.length === 0 ? <p className="muted">This passage does not come up in the daily Mass readings the app has for 2026 to 2028. It may still be read in other years.</p> : (
        <ul className="list">{mass.map((h) => <li key={h.date + h.slot}><strong>{fmt(h.date)}</strong>: {h.title}<br /><span className="muted small">{h.slot}: {h.ref}</span></li>)}</ul>
      )}
      {behind > 14 && view === null && <p className="callout">You are {behind} days behind. That is fine: the slow Bible is not a race. <button className="btn small" onClick={() => set({ start: isoToday(), done: [] })}>Start over from today</button></p>}

      <details className="chain-obj"><summary>The whole course, year by year</summary>
        <ol className="list sb-years">{overview().map((y) => <li key={y.year}><strong>Year {y.year}</strong>: {y.books.map((b) => b.name).join(', ')}</li>)}</ol>
      </details>
      <details className="chain-obj"><summary>Jump to a day</summary>
        <label>Day <input type="number" min={1} max={SLOW_TOTAL} defaultValue={day + 1} onChange={(e) => { const n = +e.target.value; if (n >= 1 && n <= SLOW_TOTAL) setView(n - 1); }} style={{ width: 90 }} /></label>
        <p className="small muted">Years run {YEAR_DAYS} days each. <button className="linklike" onClick={() => { if (confirm('Stop the slow Bible and clear your progress on this device?')) set(null); }}>Stop and clear my progress</button></p>
      </details>
    </div>
  );
}
