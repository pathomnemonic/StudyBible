import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { litDay } from '../liturgy/litcal';
import { butlerDay, butlerFor, nameScore, nameTokens, type ButlerEntry } from '../study/butler';
import { FEASTS, type Feast } from '../data/feasts';
import { getJson } from '../data/loader';
import { formatRef, parseRefs } from '../lib/refs';
import { readerPath } from '../lib/nav';
import { useEditions } from '../data/EditionsContext';
import { copyText } from '../lib/clipboard';
import { dateLocale } from '../lib/i18n';
import { liturgicalDay, parseIso } from '../liturgy/compute';

interface Work { theme: string; title: string; artist: string; date: string; credit: string; file: string; page?: string }
const THEMES: [RegExp, string][] = [
  [/annunciation/i, 'Annunciation'], [/nativity|christmas|holy family/i, 'Nativity'], [/epiphany|magi/i, 'Magi'], [/baptism/i, 'Baptism'],
  [/resurrection|easter|pentecost/i, 'Resurrection'], [/cross|crucif|good friday|sorrow|passion/i, 'Crucifixion'], [/last supper|holy thursday|corpus|eucharist|body and blood/i, 'Last Supper'],
  [/peter|paul|apostle/i, 'Peter and Paul'], [/mary|our lady|immaculate|assumption|rosary|guadalupe|lourdes|fatima|carmel|visitation/i, 'Madonna and Child'],
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** MM-DD of a feast kept on a fixed date, read from its "8 December" wording */
const fixedDate = (f: Feast) => { const m = /^(\d{1,2}) (\w+)/.exec(f.when); const i = m ? MONTHS.indexOf(m[2]) : -1; return m && i >= 0 ? `${String(i + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}` : null; };
const themeFor = (name: string) => THEMES.find(([re]) => re.test(name))?.[1] ?? 'Landscape and sky';

/** A card for the day's feast or saint: a painting, a short life, the readings it points to, and a way to keep or share it. */
export default function FeastCardPage() {
  const { date: dp } = useParams();
  const date = dp && /^\d{4}-\d{2}-\d{2}$/.test(dp) ? dp : new Date().toISOString().slice(0, 10);
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const edition = get(s.defaultEdition) ?? editions[0];
  const [name, setName] = useState<string | null | undefined>(undefined);
  const [life, setLife] = useState<ButlerEntry | null>(null);
  const [art, setArt] = useState<Work | null>(null);
  const fav = useLiveQuery(() => db.cache.get(`daily-fav:${date}`), [date]);
  useEffect(() => {
    let live = true;
    setName(undefined); setLife(null); setArt(null);
    litDay(s.diocese, date).then(async (ev) => {
      if (!live) return;
      // the calendar service when it answers; otherwise the day's own name from the offline calendar, and the feast or saint kept on that date
      const top = [...(ev ?? [])].sort((a, b) => b.grade - a.grade)[0] ?? (() => {
        const fixed = FEASTS.find((f) => fixedDate(f) === date.slice(5));
        const nm = fixed?.name ?? liturgicalDay(parseIso(date), 'universal').dayName;
        return { name: nm, grade: 0 };
      })();
      setName(top.name);
      const md = (await butlerFor(top.name, date)) ?? (ev?.length ? null : date.slice(5));
      if (md && live) {
        const list = await butlerDay(md);
        const want = nameTokens(top.name.replace(/,.*$/, ''));
        const best = [...list].sort((a, b) => nameScore(nameTokens(b.name), want) - nameScore(nameTokens(a.name), want))[0];
        if (best && live) setLife(best);
      }
      const works = (await getJson<{ works: Work[] }>('art.json', true).catch(() => null))?.works ?? [];
      const pool = works.filter((w) => w.theme === themeFor(top.name));
      if (pool.length && live) setArt(pool[Math.abs([...date].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) % pool.length]);
    });
    return () => { live = false; };
  }, [date, s.diocese]);
  const feast: Feast | undefined = name ? FEASTS.find((f) => { const a = nameTokens(f.name), b = nameTokens(name); return nameScore(a, b) >= 0.6; }) : undefined;
  const label = new Date(date + 'T12:00').toLocaleDateString(dateLocale(s.language), { weekday: 'long', month: 'long', day: 'numeric' });
  const sameAsName = !!(life && name && nameScore(nameTokens(life.name), nameTokens(name.replace(/,.*$/, ''))) >= 0.6);
  const clip = (t: string) => (t.length > 420 ? `${t.slice(0, 420).replace(/\s+\S*$/, '')}…` : t);
  const paras = (life?.text ?? []).filter((t) => t.length > 60).slice(0, feast ? 1 : 2).map(clip);
  const share = async () => {
    const text = `${name} (${label}). ${feast?.about ?? paras[0] ?? ''}`;
    try { if (navigator.share) await navigator.share({ title: name ?? 'Feast of the day', text, url: location.href }); else await copyText(`${text} ${location.href}`); } catch { /* cancelled */ }
  };
  const toggleFav = () => (fav ? db.cache.delete(`daily-fav:${date}`) : db.cache.put({ key: `daily-fav:${date}`, value: name ?? label, ts: Date.now() }));
  if (name === undefined) return <div className="page"><div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /></div></div>;
  return (
    <div className="page feast-card">
      <article className="card feast-hero">
        {art && <figure className="feast-art"><img src={`${import.meta.env.BASE_URL}${art.file}`} alt={art.title} loading="lazy" /><figcaption>{art.title}, {art.artist}</figcaption></figure>}
        <p className="eyebrow">{label}{feast ? ` · ${feast.rank}` : ''}</p>
        <h1>{name ?? 'A day in ordinary time'}</h1>
        {feast ? <p>{feast.about}</p> : !life ? <p className="muted">The Church keeps this as an ordinary day. Today’s Mass readings are the place to start.</p> : null}
        {life && (feast || !sameAsName) && <h2 className="feast-saint">{life.name.replace(/\.$/, '')}</h2>}
        {life && paras.map((t, i) => <p key={i}>{t}</p>)}
        {feast?.customs && <p className="muted"><strong>How it is kept.</strong> {feast.customs}</p>}
        {feast && feast.scripture.length > 0 && edition && (
          <div className="chips" aria-label="Readings for the feast">
            {feast.scripture.map((r) => { const p = parseRefs(r); return p.ok ? <Link key={r} className="chip" to={readerPath(edition, p.refs[0].ref)}>{formatRef(p.refs[0].ref, { abbr: true })}</Link> : null; })}
          </div>
        )}
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button className="btn primary" onClick={() => void share()}>Share</button>
          <button className="btn" aria-pressed={!!fav} onClick={() => void toggleFav()}>{fav ? 'Saved' : 'Save this day'}</button>
          <Link className="btn ghost" to={`/pray/readings/${date}`}>Mass readings</Link>
          {life && <Link className="btn ghost" to={`/study/saints/${date.slice(5)}`}>Their life in full</Link>}
        </div>
      </article>
      <div className="row between" style={{ marginTop: 10 }}>
        <Link className="btn small ghost" to={`/feast/${new Date(new Date(date + 'T12:00').getTime() - 864e5).toISOString().slice(0, 10)}`}>← Day before</Link>
        <Link className="btn small ghost" to={`/feast/${new Date(new Date(date + 'T12:00').getTime() + 864e5).toISOString().slice(0, 10)}`}>Day after →</Link>
      </div>
    </div>
  );
}
