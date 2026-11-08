import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getJson } from '../../data/loader';
import { cccRange, type CccPara } from '../../data/ccc';
import { readingsFor, slotLabel, type DayReadings } from '../../liturgy/readings';
import { addDays, iso, liturgicalDay, parseIso } from '../../liturgy/compute';
import { useSettings } from '../../lib/store';
import ReadingBlock from '../../components/ReadingBlock';
import Icon from '../../components/Icon';
import FinePrint from '../../components/FinePrint';

interface Link_ { a: string; b: string; from: string; to: string; votes?: number; note?: string; kind: 'xref' | 'quoted' }
interface TogetherDay {
  title: string;
  readings: Record<string, string>;
  links: Link_[];
  quote: { author: string; label: string; work: string; file: string; on: string; text: string } | null;
}
interface TogetherYear { days: Record<string, TogetherDay>; sources: { ccc: number[] } }

const localIso = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
const SLOT_WORD: Record<string, string> = { first_reading: 'The first reading', responsorial_psalm: 'The psalm', second_reading: 'The second reading', gospel: 'The Gospel' };
const WANT = ['first_reading', 'responsorial_psalm', 'second_reading', 'gospel'];

/** Why these readings together: the Bible's own cross-references between the day's readings, a Father on the Gospel, and the Catechism's frame. Nothing here is interpreted by the app. */
export default function ReadingsTogetherPage() {
  const { date = localIso() } = useParams();
  const nav = useNavigate();
  const [s] = useSettings();
  const d = parseIso(date);
  const year = d.getUTCFullYear();
  const lit = liturgicalDay(d, s.diocese === 'US' ? 'usa' : 'universal');
  const [data, setData] = useState<TogetherYear | null | undefined>(undefined);
  const [rd, setRd] = useState<DayReadings | null>(null);
  const [ccc, setCcc] = useState<CccPara[]>([]);
  useEffect(() => { setData(undefined); getJson<TogetherYear>(`readings-together/${year}.json`, true).then(setData); }, [year]);
  useEffect(() => { setRd(null); readingsFor(s.diocese, date).then(setRd); }, [date, s.diocese]);
  useEffect(() => { Promise.all([cccRange(128, 130), cccRange(140, 140), cccRange(1093, 1095)]).then((x) => setCcc(x.flat())); }, []);
  const day = data?.days[date];
  const go = (n: number) => nav(`/pray/readings-together/${iso(addDays(d, n))}`);
  const nextSunday = () => nav(`/pray/readings-together/${iso(addDays(d, ((7 - d.getUTCDay()) % 7) || 7))}`);

  const groups = useMemo(() => {
    const m = new Map<string, Link_[]>();
    for (const l of day?.links ?? []) { const k = `${l.a}|${l.b}`; m.set(k, [...(m.get(k) ?? []), l]); }
    return [...m.entries()].sort((x, y) => WANT.indexOf(x[0].split('|')[1]) - WANT.indexOf(y[0].split('|')[1]) || WANT.indexOf(x[0].split('|')[0]) - WANT.indexOf(y[0].split('|')[0]));
  }, [day]);
  const cc = (n: number) => ccc.find((p) => p.n === n);
  const shown = rd?.items.filter((i) => i.slot !== 'gospel_acclamation') ?? [];

  return (
    <div className="page rt-page">
      <h1>Why these readings together</h1>
      <p className="muted">On Sundays and great feasts the Church chooses the readings so that they speak to one another. Here is where the Bible’s own cross-references join them, what a Father of the Church said about the Gospel, and the Catechism’s frame.</p>
      <div className="row between rt-date">
        <div className="row">
          <button className="icon-btn" onClick={() => go(-1)} aria-label="Previous day"><Icon name="chevL" /></button>
          <input type="date" value={date} onChange={(e) => e.target.value && nav(`/pray/readings-together/${e.target.value}`)} aria-label="Date" />
          <button className="icon-btn" onClick={() => go(1)} aria-label="Next day"><Icon name="chevR" /></button>
        </div>
        <div className="row">
          <button className="btn small" onClick={() => nav('/pray/readings-together')}>Today</button>
          <button className="btn small" onClick={nextSunday}>Next Sunday</button>
        </div>
      </div>

      <div className="card">
        <h2>{day?.title ?? lit.dayName}</h2>
        <div className="muted small">{lit.seasonName}{lit.week ? `, week ${lit.week}` : ''} · Sunday cycle {lit.sundayCycle}</div>
      </div>

      {data === undefined && <p className="muted">Loading…</p>}
      {data !== undefined && !day && (
        <div className="notice info" role="note">
          This note is prepared for Sundays and major feasts in 2026 to 2028. {d.getUTCDay() === 0 ? 'This Sunday is outside those years, but the readings are shown here.' : 'This day is an ordinary weekday or outside those years; its readings are shown here.'}
          {' '}<button className="btn small" onClick={nextSunday}>Go to the next Sunday</button>
        </div>
      )}

      {day && (
        <section className="card rt-fit" aria-label="How the readings fit">
          <h2>How they fit</h2>
          {groups.length === 0 && <p className="rt-turn">These readings are chosen in turn.</p>}
          {groups.map(([k, ls]) => {
            const [a, b] = k.split('|');
            return (
              <div key={k} className="rt-meet">
                <p className="rt-meet-head"><strong>{SLOT_WORD[a]} and {SLOT_WORD[b].replace(/^The /, 'the ')} meet here:</strong></p>
                <ul>
                  {ls.map((l, i) => (
                    <li key={i}>
                      <span className="rt-pair">{l.from} <span aria-hidden="true">↔</span> {l.to}</span>
                      {l.kind === 'xref' && <span className="muted small"> · cross-reference, {l.votes} votes on OpenBible.info</span>}
                      {l.kind === 'quoted' && <span className="muted small"> · New Testament quotation of the Old</span>}
                      {l.note && <div className="small">{l.note}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {groups.length > 0 && <p className="muted small">Cross-reference votes are community scores from OpenBible.info (CC BY 4.0), not Church teaching. A psalm is matched by the whole psalm, because its verse numbers differ between the Lectionary and older Bibles.</p>}
          {day.quote && (
            <figure className="rt-quote">
              <figcaption className="eyebrow">A Father on today’s Gospel · {day.quote.on}</figcaption>
              <blockquote>“{day.quote.text}”</blockquote>
              <figcaption className="small">{day.quote.author}, in <em>Catena Aurea</em> (St. Thomas Aquinas’s chain of the Fathers), on {day.quote.on}.</figcaption>
            </figure>
          )}
          {!day.quote && <p className="muted small">No comment from the Fathers is bundled for this Gospel.</p>}
        </section>
      )}

      <section className="card rt-ccc">
        <h2>The Catechism’s frame</h2>
        {!ccc.length && <p className="muted">Loading…</p>}
        {[129, 140].map((n) => cc(n) && (
          <p key={n}>{cc(n)!.t} <Link className="small" to={`/study/catechism/${n}`}>CCC {n}</Link></p>
        ))}
        <details>
          <summary>More from the Catechism on the two Testaments</summary>
          {[128, 130, 1093, 1094, 1095].map((n) => cc(n) && (
            <p key={n}>{cc(n)!.t} <Link className="small" to={`/study/catechism/${n}`}>CCC {n}</Link></p>
          ))}
        </details>
      </section>

      <section className="card">
        <h2>The readings</h2>
        {!rd && <p className="muted">Loading…</p>}
        {rd && !shown.length && <p className="muted">No readings are bundled for this date. <Link to={`/pray/readings/${date}`}>Open the readings page</Link>.</p>}
        <div className="reading-stack">
          {shown.map((i) => <ReadingBlock key={i.slot} refs={i.refs} label={slotLabel(i.slot)} text={i.text} max={80} />)}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <Link className="btn small" to={`/pray/readings/${date}`}>Today’s readings page</Link>
          <Link className="btn small" to="/pray/mass-along">Read the Mass along</Link>
        </div>
      </section>
      <FinePrint>The passages are printed in your chosen translation, not the Lectionary wording. Links between readings come from the app’s cross-reference and quotation data; the Father’s words are copied unchanged from the Catena Aurea in the library. The app adds no interpretation of its own.</FinePrint>
    </div>
  );
}
