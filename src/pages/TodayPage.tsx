import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSettings } from '../lib/store';
import { useEditions } from '../data/EditionsContext';
import { addDays, iso, liturgicalDay, parseIso } from '../liturgy/compute';
import { dailyRef, loadDaily, pickDaily, type DailyEntry } from '../study/daily';
import { passageText, anchorToNative } from '../lib/bibleText';
import { formatRef, parseRefId, type Ref } from '../lib/refs';
import { readerPath } from '../lib/nav';
import { getBook } from '../lib/canon';
import Icon from '../components/Icon';

const localIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
const MENU = [
  { to: '/read', label: 'Bible' },
  { to: '/study', label: 'Study' },
  { to: '/library', label: 'Notes' },
  { to: '/pray', label: 'Prayer' },
  { to: '/settings', label: 'Settings' },
];

/** Home: one quiet screen. The day, a verse, a saint, a question; ways back into reading. Nothing to scroll. */
export default function TodayPage() {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const today = localIso();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get('d') ?? '') ? params.get('d')! : today;
  const ld = useMemo(() => liturgicalDay(parseIso(date), s.diocese === 'US' ? 'usa' : 'universal'), [date, s.diocese]);
  const edition = get(s.defaultEdition) ?? editions[0];
  const [file, setFile] = useState<Awaited<ReturnType<typeof loadDaily>>>(null);
  const [verse, setVerse] = useState<{ ref: Ref; label: string; text: string } | null>(null);
  const [info, setInfo] = useState(false);
  const [menu, setMenu] = useState(false);
  const touch = useRef<number | null>(null);

  useEffect(() => { loadDaily().then(setFile); }, []);
  const entry: DailyEntry | null = file ? pickDaily(file, ld) : null;
  const ref = entry ? dailyRef(entry) : null;
  useEffect(() => {
    setVerse(null);
    if (!ref || !edition) return;
    let live = true;
    passageText(edition, ref, 4).then((vs) => {
      if (!live) return;
      const n = anchorToNative(edition, ref);
      const book = getBook(ref.book);
      const label = `${book?.name ?? ref.book} ${n.chapter}${n.v1 ? ':' + n.v1 + (n.v2 && n.v2 !== n.v1 ? '–' + n.v2 : '') : ''}`;
      setVerse({ ref, label, text: vs.map((v) => v.text).join(' ') });
    });
    return () => { live = false; };
  }, [entry?.ref, edition?.id]);

  // Shrink the type a little, on small screens or long texts, until everything fits without scrolling.
  const bodyRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const fit = () => {
      let f = 1;
      el.style.setProperty('--fit', '1');
      while (el.scrollHeight > el.clientHeight + 1 && f > 0.6) { f -= 0.04; el.style.setProperty('--fit', f.toFixed(2)); }
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [entry?.ref, verse?.text, date]);
  const go = (n: number) => {
    const d = iso(addDays(parseIso(date), n));
    setParams(d === today ? {} : { d }, { replace: true });
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return;
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key.toLowerCase() === 'i') setInfo((x) => !x);
      else if (e.key === 'Escape') { setInfo(false); setMenu(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const last = s.last;
  const lastName = last ? `${getBook(last.book)?.name ?? last.book} ${last.chapter}` : null;
  const random = () => {
    if (!file || !edition) return nav(`/read/${s.defaultEdition}/JHN/1`);
    const all = Object.values(file.generic);
    for (let i = 0; i < 6; i++) {
      const r = parseRefId(all[Math.floor(Math.random() * all.length)].ref);
      if (r) return nav(readerPath(edition, r));
    }
  };
  const dateLabel = new Date(date + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: date.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric' });
  const saint = entry?.saint;

  return (
    <div
      className="home"
      data-season={ld.season}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="home-tools">
        <button className="icon-btn" onClick={() => setInfo((x) => !x)} aria-label="About today’s verse, quote and question (i)" aria-pressed={info} title="Sources (i)"><Icon name="info" /></button>
        <button className="icon-btn" onClick={() => setMenu((x) => !x)} aria-label="Menu" aria-expanded={menu} title="Menu"><Icon name="queue" /></button>
        {menu && (
          <nav className="home-menu" aria-label="Sections">
            {MENU.map((m) => <Link key={m.to} to={m.to === '/read' && last ? `/read/${last.edition}/${last.book}/${last.chapter}` : m.to}>{m.label}</Link>)}
            <button onClick={() => window.dispatchEvent(new Event('studybible:search'))}>Search</button>
          </nav>
        )}
      </div>

      <header className="home-date">
        <button className="icon-btn" onClick={() => go(-1)} aria-label="Previous day"><Icon name="chevL" /></button>
        <div>
          <div className="eyebrow">{dateLabel}</div>
          <div className="season">{ld.dayName}</div>
        </div>
        <button className="icon-btn" onClick={() => go(1)} aria-label="Next day"><Icon name="chevR" /></button>
      </header>

      <main className="home-body" key={date} ref={bodyRef}>
        {entry && verse ? (
          <>
            <blockquote className="home-verse">
              <p>{verse.text}</p>
              <cite>{ref && edition ? <Link to={readerPath(edition, ref)}>{verse.label}</Link> : verse.label}</cite>
            </blockquote>
            {saint && (
              <figure className="home-saint">
                <blockquote>“{saint.text}”</blockquote>
                <figcaption>— {saint.who}{saint.work && !saint.who.includes(saint.work) ? `, ${saint.work}` : ''}</figcaption>
              </figure>
            )}
            <p className="home-question">{entry.q}</p>
          </>
        ) : <p className="muted home-wait">…</p>}
      </main>

      {info && entry && (
        <aside className="home-info" role="dialog" aria-label="Sources">
          <p><strong>Verse.</strong> {verse?.label} in {edition?.name ?? 'your translation'}{ref ? <> · <Link to={`/study/passage/${ref.book}.${ref.c1}${ref.v1 ? '.' + ref.v1 : ''}`}>study it</Link></> : null}.</p>
          <p><strong>Quote.</strong> {saint?.who}{saint?.work ? `, ${saint.work}` : ''}. {saint?.verified ? 'Checked word for word against the public-domain text in this app’s library.' : 'Shown as attributed; not yet checked against the source text.'}</p>
          <p><strong>Question.</strong> Written for this app to go with the verse and the season ({ld.seasonName}).</p>
          <p className="muted small">Keys: ← → change day · i sources.</p>
        </aside>
      )}

      <footer className="home-actions">
        {lastName && last ? <Link className="btn primary" to={`/read/${last.edition}/${last.book}/${last.chapter}${last.verse ? `?v=${last.verse}` : ''}`}>Continue · {lastName}</Link> : <Link className="btn primary" to={`/read/${s.defaultEdition}/JHN/1`}>Begin reading</Link>}
        <button className="btn" onClick={random}>Random passage</button>
        <Link className="btn" to={`/pray/readings/${date}`}>Mass readings</Link>
      </footer>
    </div>
  );
}
