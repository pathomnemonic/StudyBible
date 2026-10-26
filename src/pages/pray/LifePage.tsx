import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Fold from '../../components/Fold';
import { addDays, iso, liturgicalDay } from '../../liturgy/compute';
import { dutiesOn, nextHolyDays } from '../../liturgy/discipline';
import { useSettings } from '../../lib/store';
import { churchYearIcs } from '../../liturgy/ics';
import { download } from '../../db/ops';

const KEY = 'sb:lastConfession';
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } };
const localToday = () => { const n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); };
const fmt = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const days = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000);

export default function LifePage() {
  const [s] = useSettings();
  const variant = s.diocese === 'US' ? 'usa' : 'universal';
  const today = localToday();
  const day = liturgicalDay(today, variant);
  const duties = dutiesOn(today, variant);
  const tomorrow = dutiesOn(addDays(today, 1), variant);
  const next = nextHolyDays(addDays(today, 1), variant, 4);
  const [last, setLast] = useState<string | null>(get(KEY));
  const [rosaries, setRosaries] = useState(0);
  const [icsSun, setIcsSun] = useState(false);
  const [icsFast, setIcsFast] = useState(true);
  useEffect(() => {
    let n = 0;
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; if (k.startsWith('sb:pray:done:rosary-')) n += Number(localStorage.getItem(k) ?? 0); } } catch { /* none */ }
    setRosaries(n);
  }, []);
  const since = last ? days(new Date(`${last}T00:00:00Z`), today) : null;
  return (
    <div className="page">
      <p><Link to="/pray">← Prayer</Link></p>
      <h1>Catholic life</h1>
      <p className="lede">What the Church asks today, how to go to Confession, and where to find a Mass. Nothing here is sent anywhere.</p>

      <section className="card">
        <h2 className="card-title">Today, {fmt(today)}</h2>
        <p className="muted small">{day.dayName} · {day.seasonName}</p>
        {duties.length === 0 && <p>No special obligation today beyond your daily prayer. Friday penance and Sunday Mass are the usual ones.</p>}
        <ul className="list">
          {duties.map((d) => <li key={d.title}><strong>{d.title}</strong><br /><span className="muted small">{d.text}</span></li>)}
        </ul>
        {tomorrow.length > 0 && <p className="small"><strong>Tomorrow:</strong> {tomorrow.map((d) => d.title).join('; ')}</p>}
        <p className="muted small" style={{ marginBottom: 0 }}>Before Communion, fast from food and drink (except water and medicine) for one hour. {variant === 'usa' ? 'Calendar: United States.' : 'Calendar: universal; your country may differ. Choose “US” in Settings for the U.S. norms.'}</p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="card-title">Coming up</h2>
        <ul className="list">{next.map((h) => <li key={h.date.toISOString()}><strong>{h.name}</strong> · {fmt(h.date)} <span className="muted small">({days(today, h.date)} days){h.note ? ` · ${h.note}` : ''}</span></li>)}</ul>
        <p className="muted small" style={{ marginBottom: 0 }}>Holy days of obligation: attend Mass and rest from unnecessary work (CCC 2042–2043). Dioceses can move some of them; check your own.</p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Confession</h2>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <Link to="/pray/examination" className="btn">Examine my conscience</Link>
            <Link to="/pray/devotions/confession" className="btn primary">Guide me through it</Link>
          </div>
        </div>
        <p className="muted small">The Church asks everyone who has reached the age of reason to confess grave sin at least once a year, and before Communion if in mortal sin. Many people go monthly.</p>
        <p style={{ margin: '6px 0' }}>{last ? <>Last Confession: <strong>{new Date(`${last}T00:00:00Z`).toLocaleDateString(undefined, { dateStyle: 'long', timeZone: 'UTC' })}</strong> ({since === 0 ? 'today' : `${since} days ago`}). </> : 'You have not logged a Confession. This is kept only on this device. '}</p>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          <button className="btn small" onClick={() => { const v = iso(today); set(KEY, v); setLast(v); }}>I went to Confession today</button>
          {last && <button className="btn small" onClick={() => { set(KEY, null); setLast(null); }}>Clear</button>}
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="card-title">Find a Mass, Adoration or Confession</h2>
        <ul className="list">
          <li><a href="https://www.masstimes.org/" target="_blank" rel="noreferrer">MassTimes.org</a> <span className="muted small">· Mass, Confession and Adoration times near you</span></li>
          <li><a href="https://www.usccb.org/about/bishops-and-dioceses/all-dioceses" target="_blank" rel="noreferrer">U.S. dioceses (USCCB)</a> <span className="muted small">· find your diocese and its parish list</span></li>
        </ul>
        <p className="muted small" style={{ marginBottom: 0 }}>These open other sites. Your parish bulletin or office is the surest source for times.</p>
      </section>

      <Fold id="life:indulgences" title="Indulgences, plainly" hint="What they are and how to gain one">
        <p>An indulgence remits the <em>temporal punishment</em> due to sins that are already forgiven; it never forgives the sin itself and can never be bought (CCC 1471–1479). A <strong>partial</strong> indulgence needs only that you do the work with a contrite heart. A <strong>plenary</strong> indulgence also requires:</p>
        <ul className="list">
          <li>Detachment from all sin, even venial</li>
          <li>Sacramental Confession (within about 20 days before or after)</li>
          <li>Holy Communion, ideally the same day</li>
          <li>Prayer for the Pope’s intentions (an Our Father and a Hail Mary suffice)</li>
        </ul>
        <p><strong>Common works:</strong> half an hour of adoration of the Blessed Sacrament; half an hour of Scripture reading; the Stations of the Cross; the Rosary prayed in a church or with family; a visit to a cemetery on November 1 to 8 (for the dead); Divine Mercy Sunday; the Portiuncula on August 2. One plenary indulgence can be gained per day; it can be offered for yourself or for a soul in purgatory.</p>
        <p className="muted small">See the Enchiridion Indulgentiarum for the full list. Ask a priest if you are unsure.</p>
      </Fold>

      <Fold id="life:calendar" title="Add the Church year to your calendar" hint="A file for Apple, Google or Outlook">
        <p className="muted small">Downloads the next twelve months of solemnities, feasts and holy days of obligation as all-day events, for the calendar you chose in Settings. Add Sundays and Lenten fast days if you like.</p>
        <label className="row"><input type="checkbox" checked={icsSun} onChange={(e) => setIcsSun(e.target.checked)} /> <span>Include Sundays</span></label>
        <label className="row"><input type="checkbox" checked={icsFast} onChange={(e) => setIcsFast(e.target.checked)} /> <span>Include Ash Wednesday, Good Friday and Lenten fasting days</span></label>
        <p><button className="btn primary" onClick={() => download('church-year.ics', churchYearIcs({ from: today, days: 365, variant, sundays: icsSun, fasting: icsFast }), 'text/calendar')}>Download calendar file</button></p>
      </Fold>
      <Fold id="life:log" title="Your prayer log" hint="Kept on this device only">
        <p>Rosaries prayed in this app: <strong>{rosaries}</strong>. <Link to="/pray/devotions">Pray one</Link>.</p>
      </Fold>
    </div>
  );
}
