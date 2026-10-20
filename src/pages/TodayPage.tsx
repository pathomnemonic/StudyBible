import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { isDue } from '../lib/srs';
import { useEditions } from '../data/EditionsContext';
import { liturgicalDay, parseIso } from '../liturgy/compute';
import { readingsFor, type DayReadings } from '../liturgy/readings';
import YearHero from '../components/YearHero';
import { parseRefs, refId, formatRef, type Ref } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { passageText, anchorToNative } from '../lib/bibleText';
import { verseForDay } from '../study/verseOfDay';
import RefLink from '../components/RefLink';
import Icon from '../components/Icon';
import { BOOKS, getBook } from '../lib/canon';

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? 'Peace be with you' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};
const localIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

/** Home: today's Bible in a Year episode first, then where you left off, the Church's day and a verse to carry. */
export default function TodayPage() {
  const [s, setS] = useSettings();
  const { get, editions } = useEditions();
  const nav = useNavigate();
  const today = localIso();
  const day = liturgicalDay(parseIso(today), s.diocese === 'US' ? 'usa' : 'universal');
  const [rd, setRd] = useState<DayReadings | null>(null);
  const [verse, setVerse] = useState<{ ref: Ref; label: string; text: string } | null>(null);
  const edition = get(s.defaultEdition) ?? editions[0];
  const plans = (useLiveQuery(() => db.planProgress.filter((p) => p.status === 'active' && p.planId !== 'biay').toArray(), []) ?? []);
  const memDue = (useLiveQuery(() => db.memory.toArray(), []) ?? []).filter((c) => isDue(c)).length;
  const memTotal = useLiveQuery(() => db.memory.count(), []) ?? 0;
  const noteCount = useLiveQuery(() => db.notes.count(), []) ?? 0;
  const [jump, setJump] = useState('');

  useEffect(() => {
    readingsFor(s.diocese, today).then(setRd);
  }, [s.diocese]);
  useEffect(() => {
    const p = parseRefs(verseForDay());
    if (!p.ok || !edition) return;
    const anchor = convertRef('kjv', 'vulgate', p.refs[0].ref).ref;
    passageText(edition, anchor, 6).then((vs) => setVerse({ ref: anchor, label: formatRef(p.refs[0].ref, { noDual: true }), text: vs.map((v) => v.text).join(' ') }));
  }, [edition?.id]);

  const last = s.last;
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const t = jump.trim();
    if (!t) return;
    const p = parseRefs(t);
    if (p.ok) {
      const ref = p.refs[0].ref;
      const v = ref.v1 ? `?v=${ref.v1}${ref.v2 && ref.v2 !== ref.v1 && ref.c2 === ref.c1 ? '-' + ref.v2 : ''}` : '';
      nav(`/read/${s.defaultEdition}/${ref.book}/${ref.c1}${v}`);
      return;
    }
    const b = BOOKS.find((x) => x.name.toLowerCase() === t.toLowerCase());
    nav(b ? `/read/${s.defaultEdition}/${b.id}/1` : `/study/search?q=${encodeURIComponent(t)}`);
  };
  const nat = verse && edition ? anchorToNative(edition, verse.ref) : null;
  const dateLabel = new Date(today + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="today">
      <header className="today-top">
        <div>
          <div className="eyebrow">{dateLabel}</div>
          <h1>{greeting()}</h1>
          <div className="season">{day.dayName}</div>
        </div>
        <div className="today-tools">
          <button className="icon-btn" aria-label="Search and jump" title="Search and jump (Ctrl+K)" onClick={() => window.dispatchEvent(new Event('studybible:search'))}><Icon name="search" size={20} /></button>
          <Link className="icon-btn" to="/settings" aria-label="Settings and account" title="Settings and account"><Icon name="gear" size={20} /></Link>
        </div>
      </header>

      <YearHero />

      <div className="today-row">
        <section className="today-card">
          <div className="eyebrow">{last ? 'Continue reading' : 'Start reading'}</div>
          <div className="where">{last ? `${getBook(last.book).name} ${last.chapter}` : 'The Gospel of John'}</div>
          <div className="row">
            <Link className="btn primary" to={last ? `/read/${last.edition}/${last.book}/${last.chapter}` : `/read/${s.defaultEdition}/JHN/1`}>{last ? 'Continue' : 'Begin'}</Link>
            <button className="btn ghost hide-sm" onClick={() => { setS({ scriptureOnly: true }); nav(last ? `/read/${last.edition}/${last.book}/${last.chapter}` : `/read/${s.defaultEdition}/JHN/1`); }} title="Open the Bible with only the text on screen">In silence</button>
          </div>
        </section>
        <section className="today-card">
          <div className="eyebrow">Mass readings</div>
          <div className="where small-where">Today’s readings</div>
          {rd && rd.items.length > 0 ? (
            <p className="chips">{rd.items.slice(0, 4).map((i) => (i.refs[0] ? <RefLink key={i.slot} refv={i.refs[0]}>{i.text}</RefLink> : <span key={i.slot} className="chip">{i.text}</span>))}</p>
          ) : (
            <p className="muted small">{day.dayName}</p>
          )}
          <Link className="btn" to="/pray/readings">Open</Link>
        </section>
      </div>

      {verse && (
        <section className="today-verse">
          <div className="eyebrow">A verse to carry</div>
          <blockquote>{verse.text}</blockquote>
          <p className="muted small">{verse.label} ({edition.shortName})</p>
          <div className="row">
            <Link className="btn small" to={`/read/${edition.id}/${verse.ref.book}/${nat?.chapter ?? 1}${nat?.v1 ? `?v=${nat.v1}${nat.v2 && nat.v2 !== nat.v1 ? '-' + nat.v2 : ''}` : ''}`}>Read in context</Link>
            <Link className="btn small" to={`/study/passage/${refId(verse.ref)}`}>Study this</Link>
            <Link className="btn small" to={`/share?ref=${encodeURIComponent(refId(verse.ref))}`}>Share</Link>
          </div>
        </section>
      )}

      <form className="today-jump" onSubmit={go} role="search">
        <input type="search" value={jump} onChange={(e) => setJump(e.target.value)} placeholder="Go to John 6:35, or search anything" aria-label="Go to a passage or search" />
        <button className="btn" type="submit">Go</button>
      </form>

      <nav className="today-more" aria-label="More ways to pray and practise">
        {plans[0] && <Link to={`/pray/plans/${encodeURIComponent(plans[0].planId)}`}>Reading plan · {plans[0].done.length} days done</Link>}
        {!plans[0] && <Link to="/pray/plans">Reading plans</Link>}
        <Link to="/memorize">{memTotal ? `Memorize · ${memDue} due` : 'Memorize'}</Link>
        <Link to="/pray">Prayer</Link>
        <Link to="/session">A quiet moment</Link>
        <Link to="/library">{noteCount ? `Notes · ${noteCount}` : 'Notes'}</Link>
      </nav>
    </div>
  );
}
