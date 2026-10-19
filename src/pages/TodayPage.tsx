import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { isDue } from '../lib/srs';
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

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? 'Peace be with you' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const localIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

/** A calm daily landing page: the Church's readings, today's Bible in a Year episode, a verse to carry, and where you left off. */
export default function TodayPage() {
  const [s, setS] = useSettings();
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

  const memDue = (useLiveQuery(() => db.memory.toArray(), []) ?? []).filter((c) => isDue(c)).length;
  const memTotal = useLiveQuery(() => db.memory.count(), []) ?? 0;
  const notes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().limit(3).toArray(), []) ?? [];
  const [customize, setCustomize] = useState(false);

  const widgets: Record<string, { title: string; body: ReactNode }> = {
    readings: {
      title: 'Mass readings',
      body: (
        <>
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
        </>
      ),
    },
    biay: {
      title: `Bible in a Year · Day ${Math.min(dayOfYear(), 365)}`,
      body: ep ? (
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
      ),
    },
    verse: {
      title: 'A verse to carry',
      body: verse ? (
        <>
          <blockquote style={{ margin: '6px 0', fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>{verse.text}</blockquote>
          <p className="muted small">{verse.label} ({edition.shortName})</p>
          <div className="row">
            <Link className="btn small" to={`/read/${edition.id}/${verse.ref.book}/${nat?.chapter ?? 1}${nat?.v1 ? `?v=${nat.v1}${nat.v2 && nat.v2 !== nat.v1 ? '-' + nat.v2 : ''}` : ''}`}>Read in context</Link>
            <Link className="btn small" to={`/study/passage/${refId(verse.ref)}`}>Study this</Link>
            <Link className="btn small" to={`/share?ref=${encodeURIComponent(refId(verse.ref))}`}>Share</Link>
          </div>
        </>
      ) : (
        <p className="muted">Loading…</p>
      ),
    },
    continue: {
      title: 'Where you left off',
      body: (
        <>
          {last ? (
            <>
              <p style={{ margin: '4px 0' }}>{getBook(last.book).name} {last.chapter}</p>
              <Link className="btn primary small" to={`/read/${last.edition}/${last.book}/${last.chapter}`}>Continue reading</Link>
            </>
          ) : (
            <Link className="btn primary small" to="/read">Start reading</Link>
          )}
          {s.showStreaks && streak > 0 && <p className="muted small">{streak} day{streak === 1 ? '' : 's'} in a row.</p>}
        </>
      ),
    },
    plans: {
      title: 'Reading plan progress',
      body: plans.length ? (
        <ul className="list">
          {plans.map((p) => {
            const total = p.planId === 'biay' ? 365 : Math.max(p.done.length, 1);
            return (
              <li key={p.planId}>
                <div className="row between"><Link to={`/pray/plans/${encodeURIComponent(p.planId)}`}>{p.planId === 'biay' ? 'Bible in a Year' : p.planId.replace(/^user:/, 'My plan ')}</Link><span className="muted small">{p.done.length} days done</span></div>
                {p.planId === 'biay' && <div className="progress" style={{ margin: '4px 0' }}><div style={{ width: `${(100 * p.done.length) / total}%` }} /></div>}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">No active plan. <Link to="/pray/plans">Choose a reading plan</Link>.</p>
      ),
    },
    memorize: {
      title: 'Memorize',
      body: (
        <>
          <p style={{ margin: '4px 0' }}>{memTotal ? `${memDue} verse${memDue === 1 ? '' : 's'} due for review (${memTotal} in your list).` : 'Learn verses by heart with spaced repetition.'}</p>
          <Link className="btn small primary" to="/memorize">{memDue ? 'Review now' : 'Open'}</Link>
        </>
      ),
    },
    notes: {
      title: 'Recent notes',
      body: notes.length ? (
        <ul className="list">{notes.map((n) => <li key={n.id}><Link to={`/library/notes/${n.id}`}>{n.title || n.body.slice(0, 40) || '(untitled)'}</Link></li>)}</ul>
      ) : (
        <p className="muted">Notes you write in the reader appear here.</p>
      ),
    },
    session: {
      title: 'Read with the Church',
      body: (
        <>
          <p style={{ margin: '4px 0' }}>A guided ten-minute session: pray, read, reflect, hear the Church, pray.</p>
          <Link className="btn small primary" to="/session">Begin</Link>
        </>
      ),
    },
    liturgy: {
      title: 'The Church’s day',
      body: (
        <>
          <p style={{ margin: '4px 0' }}><strong>{day.dayName}</strong></p>
          <p className="muted small">{day.seasonName} · Sunday cycle {day.sundayCycle}, weekday cycle {day.weekdayCycle} <span className="chip">{COLOR_NAME[day.color]}</span></p>
          <Link className="btn small" to="/pray">Prayer tools</Link>
        </>
      ),
    },
  };
  const order = [...s.dashboard.order.filter((id) => widgets[id]), ...Object.keys(widgets).filter((id) => !s.dashboard.order.includes(id))];
  const hidden = new Set(s.dashboard.hidden);
  const move = (id: string, d: number) => {
    const o = [...order];
    const i = o.indexOf(id);
    const j = i + d;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    setS({ dashboard: { ...s.dashboard, order: o } });
  };
  const toggle = (id: string) => setS({ dashboard: { ...s.dashboard, hidden: hidden.has(id) ? s.dashboard.hidden.filter((x) => x !== id) : [...s.dashboard.hidden, id] } });

  return (
    <div className="page">
      <header className="hero">
        <div className="eyebrow">{new Date(today + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <h1>{greeting()}</h1>
        <div className="season">{day.dayName} · {day.seasonName} <span className="chip">{COLOR_NAME[day.color]}</span></div>
        {!hidden.has('verse') && verse && (
          <>
            <blockquote>{verse.text}</blockquote>
            <div className="cite">{verse.label.toUpperCase()} · {edition.shortName}</div>
          </>
        )}
        <div className="actions">
          <Link className="btn primary" to="/session">Begin a quiet moment</Link>
          {last ? <Link className="btn" to={`/read/${last.edition}/${last.book}/${last.chapter}`}>Continue reading</Link> : <Link className="btn" to="/read">Start reading</Link>}
          {verse && <Link className="btn" to={`/study/passage/${refId(verse.ref)}`}>Explore this verse</Link>}
          <button className="btn ghost" aria-pressed={customize} onClick={() => setCustomize(!customize)}>{customize ? 'Done' : 'Customize'}</button>
        </div>
      </header>
      {s.backupEveryDays > 0 && (!s.lastBackup || Date.now() - s.lastBackup > s.backupEveryDays * 86400000) && (
        <div className="notice info" style={{ marginBottom: 12 }}>
          It has been a while since your last backup. <Link to="/library">Export your notes and marks</Link> to keep them safe.
        </div>
      )}
      {customize && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h2 className="card-title">Choose and order your home screen</h2>
          <ul className="list">
            {order.map((id, i) => (
              <li key={id} className="row between">
                <label className="row"><input type="checkbox" checked={!hidden.has(id)} onChange={() => toggle(id)} /> {widgets[id].title}</label>
                <span>
                  <button className="icon-btn" disabled={i === 0} onClick={() => move(id, -1)} aria-label={`Move ${widgets[id].title} up`}>↑</button>
                  <button className="icon-btn" disabled={i === order.length - 1} onClick={() => move(id, 1)} aria-label={`Move ${widgets[id].title} down`}>↓</button>
                </span>
              </li>
            ))}
          </ul>
          <button className="btn small ghost" onClick={() => setS({ dashboard: { order: Object.keys(widgets), hidden: [] } })}>Reset to default</button>
        </div>
      )}
      <div className="grid">
        {order.filter((id) => !hidden.has(id) && id !== 'verse' && id !== 'continue').map((id) => (
          <section className="card" key={id}>
            <h2 className="card-title">{widgets[id].title}</h2>
            {widgets[id].body}
          </section>
        ))}
      </div>
    </div>
  );
}
