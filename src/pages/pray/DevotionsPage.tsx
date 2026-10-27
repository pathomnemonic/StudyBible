import { Link, useParams, useSearchParams } from 'react-router-dom';
import FinePrint from '../../components/FinePrint';
import { ANGELUS, MERCY, MYSTERIES, REGINA, SORROWS, STATIONS, todaysMysteries } from '../../data/devotions';
import { CONFESSION, MORE } from '../../data/devotions2';
import { liturgicalDay, parseIso } from '../../liturgy/compute';
import BeadPrayer from '../../pray/BeadPrayer';
import StepPrayer from '../../pray/StepPrayer';
import { MERCY_ART, MYSTERY_ART, STATION_ART, usePic } from '../../pray/art';
import { CREEDAL } from '../../pray/creedal';
import { mercyPlan, rosaryPlan } from '../../pray/plan';
import type { Mode } from '../../pray/useGuide';

const iso = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
const base = import.meta.env.BASE_URL;

function Thumb({ id, title }: { id: string; title: string }) {
  const pic = usePic(id);
  return <figure className="thumb">{pic ? <img src={`${base}${pic.file}`} alt="" loading="lazy" decoding="async" /> : <div className="rosary-art-ph" aria-hidden />}<figcaption>{title}</figcaption></figure>;
}

export default function DevotionsPage() {
  const { id } = useParams();
  const [q, setQ] = useSearchParams();
  const today = todaysMysteries();
  const set = MYSTERIES.find((m) => m.id === q.get('set')) ?? today;
  const startMode = (['pace', 'voice', 'audio'] as Mode[]).find((m) => m === q.get('mode'));
  const eastertide = liturgicalDay(parseIso(iso()), 'universal').season === 'easter';

  if (id === 'rosary') return <BeadPrayer plan={rosaryPlan(set)} art={MYSTERY_ART[set.id]} episode={CREEDAL[set.id]} back="/pray/devotions" backLabel="Devotions" startMode={startMode} intro={`The ${set.name} mysteries. Tap Next on each bead, or choose to be led.`} />;
  if (id === 'divine-mercy') return <BeadPrayer plan={mercyPlan()} art={MERCY_ART} episode={CREEDAL.mercy} back="/pray/devotions" backLabel="Devotions" startMode={startMode} intro="Prayed on ordinary rosary beads. The Chaplet was given to St Faustina; it is a private devotion, often prayed at three in the afternoon." />;
  if (id === 'angelus') return <StepPrayer d={ANGELUS} back="/pray/devotions" bells={{ 0: 3, 2: 3, 4: 3 }} />;
  if (id === 'regina-caeli') return <StepPrayer d={REGINA} back="/pray/devotions" />;
  if (id === 'stations') return <StepPrayer d={STATIONS} back="/pray/devotions" art={(n) => (n >= 1 && n <= 14 ? STATION_ART[n - 1] : null)} />;
  if (id === 'seven-sorrows') return <StepPrayer d={SORROWS} back="/pray/devotions" />;
  const more = [...MORE, CONFESSION].find((x) => x.id === id);
  if (more) return <StepPrayer d={more} back="/pray/devotions" />;
  if (id?.startsWith('rosary')) return <BeadPrayer plan={rosaryPlan(set)} art={MYSTERY_ART[set.id]} episode={CREEDAL[set.id]} back="/pray/devotions" backLabel="Devotions" startMode={startMode} />;

  const hasAudio = !!CREEDAL[set.id];
  return (
    <div className="page">
      <h1>Devotions</h1>
      <p className="lede">Pray the Rosary and the Divine Mercy chaplet bead by bead, with the mysteries pictured.</p>

      <section className="card rosary-hero">
        <div className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
          <h2 className="card-title" style={{ margin: 0 }}>The Rosary</h2>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <Link to={`/pray/devotions/rosary?set=${set.id}`} className="btn primary">Pray it</Link>
            {hasAudio && <Link to={`/pray/devotions/rosary?set=${set.id}&mode=audio`} className="btn">Pray with me <span className="muted small">· Creedal</span></Link>}
          </div>
        </div>
        <p className="muted small">By the usual weekly custom, today is the {today.name.toLowerCase()} mysteries. Choose another set if you wish.</p>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }} role="radiogroup" aria-label="Mysteries">
          {MYSTERIES.map((m) => <button key={m.id} role="radio" aria-checked={set.id === m.id} className={`btn small${set.id === m.id ? ' primary' : ''}`} onClick={() => setQ({ set: m.id }, { replace: true })}>{m.name}{m.id === today.id ? ' · today' : ''}</button>)}
        </div>
        <div className="mystery-strip">
          {set.mysteries.map((m, n) => <Thumb key={m.title} id={MYSTERY_ART[set.id][n]} title={`${n + 1}. ${m.title}`} />)}
        </div>
        <ul className="list small">{set.mysteries.map((m) => <li key={m.title}>{m.title} <span className="muted">· {m.refs} · {m.fruit}</span></li>)}</ul>
      </section>

      <section className="card rosary-hero" style={{ marginTop: 14 }}>
        <div className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Chaplet of Divine Mercy</h2>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <Link to="/pray/devotions/divine-mercy" className="btn primary">Pray it</Link>
            <Link to="/pray/devotions/divine-mercy?mode=audio" className="btn">Pray with me <span className="muted small">· Creedal</span></Link>
          </div>
        </div>
        <p className="muted small">{MERCY.blurb} About ten minutes.</p>
        <div className="mystery-strip one"><Thumb id={MERCY_ART[0]} title="The source of mercy" /></div>
      </section>

      <div className="grid" style={{ marginTop: 14 }}>
        {[eastertide ? REGINA : ANGELUS, STATIONS, SORROWS].map((d) => (
          <Link key={d.id} to={`/pray/devotions/${d.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 className="card-title">{d.name}</h2><p className="muted">{d.blurb}</p>
            <p className="muted small" style={{ margin: 0 }}>{d.id === 'angelus' ? 'With the bell.' : d.id === 'stations' ? 'With a picture for the stations.' : 'Seven by seven, counted.'} Led by your device if you like.</p>
          </Link>
        ))}
      </div>
      <h2 style={{ fontSize: '1.15rem', marginTop: 18 }}>More devotions</h2>
      <div className="grid">
        {MORE.map((d) => (
          <Link key={d.id} to={`/pray/devotions/${d.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 className="card-title">{d.name}</h2><p className="muted">{d.blurb}</p>
          </Link>
        ))}
      </div>
      <FinePrint>Recordings of the Rosary and Divine Mercy chaplet are from the <a href="https://www.creedalpodcast.com/rosary" target="_blank" rel="noreferrer">Creedal podcast</a>, streamed from the publisher. Paintings and engravings are public domain (credits on each picture and in the <Link to="/study/gallery">Gallery</Link>). The Divine Mercy chaplet is a private devotion from the revelations to St Faustina; the prayer texts are the long-used traditional wordings.</FinePrint>
    </div>
  );
}
