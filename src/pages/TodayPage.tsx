import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { useEditions } from '../data/EditionsContext';
import { liturgicalDay, parseIso, COLOR_NAME } from '../liturgy/compute';
import { readingsFor, type DayReadings } from '../liturgy/readings';
import { loadBiay } from '../data/biay';
import { usePlayer } from '../data/PlayerContext';
import type { BiayEpisode } from '../data/content';
import { parseRefs, refId, formatRef, type Ref } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { passageText, anchorToNative } from '../lib/bibleText';
import { dayOfYear, verseForDay } from '../study/verseOfDay';
import RefLink from '../components/RefLink';
import Icon from '../components/Icon';
import { getBook } from '../lib/canon';

const localIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

/** A calm daily landing page: the Church's readings, today's Bible in a Year episode, a verse to carry, and where you left off. */
export default function TodayPage() {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const player = usePlayer();
  const today = localIso();
  const day = liturgicalDay(parseIso(today), s.diocese === 'US' ? 'usa' : 'universal');
  const [rd, setRd] = useState<DayReadings | null>(null);
  const [ep, setEp] = useState<BiayEpisode | null>(null);
  const [verse, setVerse] = useState<{ ref: Ref; label: string; text: string } | null>(null);
  const edition = get(s.defaultEdition) ?? editions[0];
  const plans = useLiveQuery(() => db.planProgress.filter((p) => p.status === 'active').toArray(), []) ?? [];
  const history = useLiveQuery(() => db.history.where('type').equals('read').toArray(), []) ?? [];

  useEffect(() => {
    readingsFor(s.diocese, today).then(setRd);
    loadBiay().then((b) => setEp(b?.dayEpisode.get(Math.min(dayOfYear(), 365)) ?? null));
  }, [s.diocese]);

  useEffect(() => {
    const p = parseRefs(verseForDay());
    if (!p.ok || !edition) return;
    const anchor = convertRef('kjv', 'vulgate', p.refs[0].ref).ref;
    passageText(edition, anchor, 6).then((vs) => setVerse({ ref: anchor, label: formatRef(p.refs[0].ref, { noDual: true }), text: vs.map((v) => v.text).join(' ') }));
  }, [edition?.id]);

  // consecutive days with any reading, only shown when the user turns streaks on
  const days = new Set(history.map((h) => new Date(h.ts).toLocaleDateString('en-CA')));
  let streak = 0;
  for (let d = new Date(); days.has(d.toLocaleDateString('en-CA')) || (streak === 0 && (d.setDate(d.getDate() - 1), days.has(d.toLocaleDateString('en-CA')))); d.setDate(d.getDate() - 1)) streak++;
  const last = s.last;
  const nat = verse && edition ? anchorToNative(edition, verse.ref) : null;

  return (
    <div className="page">
      <h1>{new Date(today + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h1>
      <p className="lede">
        {day.dayName} · {day.seasonName} <span className="chip">{COLOR_NAME[day.color]}</span>
      </p>

      <div className="grid">
        <section className="card">
          <h2 className="card-title">Mass readings</h2>
          {rd && rd.items.length > 0 ? (
            <ul className="list">
              {rd.items.map((i) => (
                <li key={i.slot}>
                  <span className="muted small">{i.slot.replace('_', ' ')}: </span>
                  {i.refs[0] ? <RefLink refv={i.refs[0]}>{i.text}</RefLink> : i.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Readings come from the open LitCal calendar when online, or from a lectionary you import in Settings.</p>
          )}
          <Link className="btn small" to="/pray/readings">Open readings</Link>
        </section>

        <section className="card">
          <h2 className="card-title">Bible in a Year · Day {Math.min(dayOfYear(), 365)}</h2>
          {ep ? (
            <>
              <p style={{ margin: '4px 0' }}>{ep.short}</p>
              <p className="muted small">{ep.passages.slice(0, 4).map((p) => <span key={p} className="chip" style={{ marginRight: 4 }}><RefLink id={p} /></span>)}</p>
              <div className="row">
                <button className="btn primary small" onClick={() => player.play(ep)}><Icon name="play" size={14} /> Play here</button>
                <Link className="btn small" to={`/listen/episode/${ep.id}`}>Details</Link>
              </div>
              <p className="muted small">Fr. Mike Schmitz · Ascension. Plays from the publisher’s own feed. Day number follows the calendar year.</p>
            </>
          ) : (
            <p className="muted">Loading today’s episode…</p>
          )}
        </section>

        <section className="card">
          <h2 className="card-title">A verse to carry</h2>
          {verse ? (
            <>
              <blockquote style={{ margin: '6px 0', fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>{verse.text}</blockquote>
              <p className="muted small">{verse.label} ({edition.shortName})</p>
              <div className="row">
                <Link className="btn small" to={`/read/${edition.id}/${verse.ref.book}/${nat?.chapter ?? 1}${nat?.v1 ? `?v=${nat.v1}${nat.v2 && nat.v2 !== nat.v1 ? '-' + nat.v2 : ''}` : ''}`}>Read in context</Link>
                <Link className="btn small" to={`/study/passage/${refId(verse.ref)}`}>Study this</Link>
              </div>
            </>
          ) : (
            <p className="muted">Loading…</p>
          )}
        </section>

        <section className="card">
          <h2 className="card-title">Where you left off</h2>
          {last ? (
            <>
              <p style={{ margin: '4px 0' }}>{getBook(last.book).name} {last.chapter}</p>
              <Link className="btn primary small" to={`/read/${last.edition}/${last.book}/${last.chapter}`}>Continue reading</Link>
            </>
          ) : (
            <Link className="btn primary small" to="/read">Start reading</Link>
          )}
          {s.showStreaks && streak > 0 && <p className="muted small">{streak} day{streak === 1 ? '' : 's'} in a row.</p>}
          {plans.length > 0 && (
            <p className="small">
              Active plans: {plans.map((p) => <Link key={p.planId} to={`/pray/plans/${encodeURIComponent(p.planId)}`} style={{ marginRight: 8 }}>{p.planId.replace(/^user:/, 'My plan ')}</Link>)}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
