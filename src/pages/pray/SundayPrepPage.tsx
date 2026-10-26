import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ReadingBlock from '../../components/ReadingBlock';
import { useSettings } from '../../lib/store';
import { liturgicalDay, parseIso } from '../../liturgy/compute';
import { readingsFor, slotLabel, type DayReadings } from '../../liturgy/readings';
import { gatherAll, type SectionKey, type StudyItem } from '../../study/providers';

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function upcomingSunday(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d;
}

const HOMILY_SECTIONS: SectionKey[] = ['catholic-answers', 'word-on-fire', 'creators', 'ascension', 'resources', 'videos'];

function Item({ i }: { i: StudyItem }) {
  const inner = <>{i.title}{i.author && <span className="muted small"> — {i.author}</span>}{i.kind && <span className="chip" style={{ marginLeft: 6 }}>{i.kind}</span>}</>;
  return (
    <li>
      {i.internal ? <Link to={i.internal}>{inner}</Link> : i.url ? <a href={i.url} target="_blank" rel="noreferrer noopener">{inner}</a> : inner}
      {i.basis && <div className="muted small">{i.basis}</div>}
    </li>
  );
}

export default function SundayPrepPage() {
  const [s] = useSettings();
  const [offset, setOffset] = useState(0);
  const date = useMemo(() => { const d = upcomingSunday(); d.setDate(d.getDate() + 7 * offset); return d; }, [offset]);
  const iso = isoOf(date);
  const lit = liturgicalDay(parseIso(iso), s.diocese === 'US' ? 'usa' : 'universal');
  const [rd, setRd] = useState<DayReadings | null>(null);
  const [data, setData] = useState<Partial<Record<SectionKey, StudyItem[]>>>({});
  const gospel = rd?.items.find((x) => x.slot === 'gospel');
  useEffect(() => { setRd(null); readingsFor(s.diocese, iso).then(setRd); }, [iso, s.diocese]);
  useEffect(() => {
    setData({});
    if (!gospel?.refs.length) return;
    let live = true;
    gatherAll(gospel.refs, (k, items) => live && setData((d) => ({ ...d, [k]: items })));
    return () => { live = false; };
  }, [gospel?.text]);
  const homilies = HOMILY_SECTIONS.flatMap((k) => data[k] ?? []).filter((x) => x.kind === 'Homily' || x.basis?.startsWith('Matched by the Sunday') || x.format === 'video' || x.format === 'audio').slice(0, 8);
  const top = (k: SectionKey, n = 3) => (data[k] ?? []).slice(0, n);
  return (
    <div className="page">
      <h1>Prepare for Sunday</h1>
      <p className="lede">Read the Mass readings ahead of time, then listen or read what others have said about the Gospel.</p>
      <div className="row between" style={{ marginBottom: 8 }}>
        <button className="btn small" onClick={() => setOffset(offset - 1)}>Previous Sunday</button>
        <strong>{lit.dayName}<span className="muted small"> · {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span></strong>
        <button className="btn small" onClick={() => setOffset(offset + 1)}>Next Sunday</button>
      </div>
      {!rd && <p className="muted">Loading readings…</p>}
      {rd && rd.items.length === 0 && <div className="card"><p>{rd.sourceNote}</p><p><Link to={`/pray/readings/${iso}`}>Open the readings page for this date</Link> to enter or import them.</p></div>}
      {rd?.items.map((it) => it.refs.length ? <ReadingBlock key={it.slot} refs={it.refs} label={slotLabel(it.slot)} text={it.text} max={60} /> : null)}
      {gospel && (
        <>
          <h2>Going deeper into the Gospel</h2>
          {homilies.length > 0 && (
            <section className="card">
              <h3>Homilies and talks for this Sunday</h3>
              <p className="muted small">These were given for the Sunday when this Gospel is read at Mass. Where the note says so, the link was matched by the calendar only: the homily may take up another reading of the day, or treat this passage only in part.</p>
              <ul className="list">{homilies.map((i) => <Item key={i.id} i={i} />)}</ul>
            </section>
          )}
          {top('catechism').length > 0 && <section className="card"><h3>The Catechism</h3><ul className="list">{top('catechism').map((i) => <Item key={i.id} i={i} />)}</ul></section>}
          {top('commentary').length > 0 && <section className="card"><h3>Commentary</h3><ul className="list">{top('commentary').map((i) => <Item key={i.id} i={i} />)}</ul></section>}
          {top('fathers').length > 0 && <section className="card"><h3>The Church Fathers</h3><ul className="list">{top('fathers').map((i) => <Item key={i.id} i={i} />)}</ul></section>}
          <p><Link className="btn" to={`/pray/readings/${iso}`}>Open the full readings page</Link></p>
        </>
      )}
      <p className="muted small" style={{ marginTop: 14 }}>{rd?.sourceNote}</p>
    </div>
  );
}
