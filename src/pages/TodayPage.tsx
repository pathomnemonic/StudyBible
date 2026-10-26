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
import MementoCard from '../components/MementoCard';
import Icon from '../components/Icon';
import HomeExtras, { FavStar } from '../components/HomeExtras';
import ResumeChips from '../components/ResumeChips';
import { useT, dateLocale } from '../lib/i18n';

const localIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

/** Home: one quiet screen. The day, a verse, a saint, a question; ways back into reading. Nothing to scroll. */
export default function TodayPage() {
  const [s] = useSettings();
  const t = useT();
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
      const home = el.closest('.home');
      home?.classList.remove('grow');
      el.style.setProperty('--fit', '1');
      while (el.scrollHeight > el.clientHeight + 1 && f > 0.6) { f -= 0.04; el.style.setProperty('--fit', f.toFixed(2)); }
      // if it still does not fit (a long text, a small screen, extra cards), let the page scroll instead of letting things overlap
      if (el.scrollHeight > el.clientHeight + 1) home?.classList.add('grow');
    };
    fit();
    window.addEventListener('resize', fit);
    const ro = typeof ResizeObserver !== 'undefined' && el.closest('.home') ? new ResizeObserver(() => fit()) : null;
    const foot = el.closest('.home')?.querySelector('.home-actions');
    if (ro && foot) ro.observe(foot);
    return () => { window.removeEventListener('resize', fit); ro?.disconnect(); };
  }, [entry?.ref, verse?.text, date, s.memento.on, s.memento.onHome]);
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
      else if (e.key === 'Escape') { setInfo(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const last = s.last;
  const lastName = last ? `${getBook(last.book)?.name ?? last.book} ${last.chapter}` : null;
  // any verse in the Bible, each equally likely: pick a verse number at random from the whole canon (Vulgate anchor numbering)
  const random = () => {
    const vul = editions.find((e) => e.scheme === 'vulgate');
    if (!edition || !vul?.verseCounts) return nav(`/read/${s.defaultEdition}/JHN/1`);
    const books = Object.entries(vul.verseCounts).filter(([b]) => edition.chapters[b] !== undefined || vul.chapters[b] !== undefined);
    const total = books.reduce((n, [, cs]) => n + cs.reduce((a, b) => a + b, 0), 0);
    let k = Math.floor(Math.random() * total);
    for (const [book, cs] of books) {
      for (let c = 0; c < cs.length; c++) {
        if (k < cs[c]) return nav(readerPath(edition, { book, c1: c + 1, v1: k + 1, c2: c + 1, v2: k + 1 }));
        k -= cs[c];
      }
    }
  };
  const dateLabel = new Date(date + 'T12:00').toLocaleDateString(dateLocale(s.language), { weekday: 'long', month: 'long', day: 'numeric', year: date.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric' });
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
      <div className="home-tools-left"><FavStar date={date} label={verse?.label ?? ld.dayName} /></div>
      <div className="home-tools">
        <button className="icon-btn" onClick={() => setInfo((x) => !x)} aria-label={t('home.sourcesLabel')} aria-pressed={info} title={`${t('home.sources')} (i)`}><Icon name="info" /></button>
      </div>

      <header className="home-date">
        <button className="icon-btn" onClick={() => go(-1)} aria-label={t('home.prev')}><Icon name="chevL" /></button>
        <div>
          <div className="eyebrow">{dateLabel}</div>
          <h1 className="season">{ld.dayName}</h1>
        </div>
        <button className="icon-btn" onClick={() => go(1)} aria-label={t('home.next')}><Icon name="chevR" /></button>
      </header>

      <section className="home-body" key={date} ref={bodyRef} aria-label={ld.dayName} aria-live="polite">
        {entry && verse ? (
          <>
            <blockquote className="home-verse">
              <p>{verse.text}</p>
              <cite>{ref && edition ? <Link to={readerPath(edition, ref)}>{verse.label}</Link> : verse.label}</cite>
            </blockquote>
            {saint && (
              <figure className="home-saint">
                <blockquote>“{saint.text}”</blockquote>
                <figcaption>— {saint.who}{saint.work && !saint.who.includes(saint.work) ? `, ${saint.work}` : ''}{saint.src && (saint.src.work ? <> · <Link to={`/study/works/${saint.src.work}/${saint.src.section ?? 0}`}>{t('home.context')}</Link></> : saint.src.url ? <> · <a href={saint.src.url} target="_blank" rel="noreferrer">{t('home.context')} ↗</a></> : null)}</figcaption>
              </figure>
            )}
            <p className="home-question">{entry.q}</p>
          </>
        ) : <p className="muted home-wait">…</p>}
      </section>

      {info && entry && (
        <aside className="home-info" role="dialog" aria-label="Sources">
          <p><strong>Verse.</strong> {verse?.label} in {edition?.name ?? 'your translation'}{ref ? <> · <Link to={`/study/passage/${ref.book}.${ref.c1}${ref.v1 ? '.' + ref.v1 : ''}`}>study it</Link></> : null}.</p>
          <p><strong>Quote.</strong> {saint?.who}{saint?.work ? `, ${saint.work}` : ''}. {saint?.verified ? (saint.src?.work ? 'Checked word for word against the public-domain text in this app’s library; “see it in context” opens it.' : 'Checked against a published edition (see it in context).') : saint?.misattributed ? `Attribution doubtful: ${saint.misattributed}.` : 'Shown as attributed; we could not find it in a source text we can check.'}</p>
          <p><strong>Question.</strong> Written for this app to go with the verse and the season ({ld.seasonName}).</p>
          <p className="muted small">Keys: ← → change day · i sources.</p>
        </aside>
      )}

      <MementoCard />
      <HomeExtras date={date} season={ld.season} ref={ref} label={verse?.label ?? ''} onRandom={random} />
      <footer className="home-actions">
        <ResumeChips />
      </footer>
    </div>
  );
}
