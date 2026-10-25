import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { iso, liturgicalDay, parseIso, COLOR_NAME } from '../../liturgy/compute';
import { useSettings } from '../../lib/store';
import { readingsFor, type DayReadings } from '../../liturgy/readings';
import RefLink from '../../components/RefLink';
import { useEditions } from '../../data/EditionsContext';
import { builtinPlans, type PlanDef } from '../../plans/builtin';

const localIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

export default function PrayHome() {
  const [s] = useSettings();
  const today = localIso();
  const day = liturgicalDay(parseIso(today), s.diocese === 'US' ? 'usa' : 'universal');
  const [rd, setRd] = useState<DayReadings | null>(null);
  const [plans, setPlans] = useState<PlanDef[]>([]);
  const { get } = useEditions();
  const active = useLiveQuery(() => db.planProgress.filter((p) => p.status === 'active').toArray(), []) ?? [];
  useEffect(() => {
    readingsFor(s.diocese, today).then(setRd);
    const v = get('vulgate');
    if (v) builtinPlans(v).then(setPlans);
  }, [s.diocese]);
  return (
    <div className="page">
      <h1>Prayer</h1>
      <p className="lede">Quiet ways to pray with Scripture. Everything here is optional; the Bible and your readings are one tab away.</p>
      <div className="grid">
        <Link to="/pray/lectio" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Lectio Divina</h2><p className="muted">Read, meditate, pray, rest — with a gentle timer you control.</p></Link>
        <Link to="/pray/office" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">The Divine Office</h2><p className="muted">Lauds, Vespers, Compline and the little hours, from the Psalms. Works offline.</p></Link>
        <Link to="/pray/devotions" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Devotions</h2><p className="muted">The Rosary, Divine Mercy, Angelus, Stations of the Cross and the Seven Sorrows, step by step.</p></Link>
        <Link to="/pray/sunday" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Prepare for Sunday</h2><p className="muted">The coming Sunday’s readings, with homilies, the Catechism and commentary on the Gospel.</p></Link>
        <Link to="/pray/prayers" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Prayer book</h2><p className="muted">Traditional prayers you can search by need: morning, the sick, the dead, study, peace.</p></Link>
        <Link to="/pray/examination" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Examination of conscience</h2><p className="muted">A private checklist before Confession. Nothing is saved.</p></Link>
        <Link to="/pray/novenas" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Novenas and short plans</h2><p className="muted">Nine days with the Holy Spirit or St Joseph, the penitential psalms, an Advent week.</p></Link>
        <Link to="/pray/build" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Build a prayer time</h2><p className="muted">Order your own prayers, Scripture and silence, then pray through them.</p></Link>
        <Link to="/pray/mass" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Following the Mass</h2><p className="muted">The parts of the Mass in order, with links to the official texts.</p></Link>
        <Link to="/pray/examen" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Daily Examen</h2><p className="muted">Five quiet steps at the end of the day: thanks, review, sorrow, resolve. Saved only if you choose.</p></Link>
        <Link to="/pray/year" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">The Church’s year</h2><p className="muted">Advent to Christ the King: the seasons, their colours and the great days, with the readings for each.</p></Link>
        <Link to="/session" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">A quiet moment</h2><p className="muted">A guided ten-minute pause: pray, read, reflect, hear the Church, pray.</p></Link>
        <Link to="/pray/sleep" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Sleep mode</h2><p className="muted">A psalm read slowly while the sound fades and the screen dims.</p></Link>
        <Link to="/pray/journal" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">Prayer journal</h2><p className="muted">Reflections, intentions and saved prayers. Private to this device.</p></Link>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row between"><h2 className="card-title">The Church today</h2><span className="chip" title="The colour of the priest’s vestments today">Vestments: {COLOR_NAME[day.color]}</span></div>
        <p style={{ margin: '4px 0' }}><strong>{day.dayName}</strong></p>
        <p className="muted small">{day.seasonName} · Sunday cycle {day.sundayCycle}, weekday cycle {day.weekdayCycle}</p>
        {rd && rd.items.length > 0 && (
          <ul className="list">
            {rd.items.map((i) => <li key={i.slot}><span className="muted small">{i.slot.replace('_', ' ')}: </span>{i.refs[0] ? <RefLink refv={i.refs[0]}>{i.text}</RefLink> : i.text}</li>)}
          </ul>
        )}
      </div>
      {active.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.15rem' }}>Your plans</h2>
          {active.map((p) => {
            const def = plans.find((x) => x.id === p.planId) ?? (p.planId.startsWith('user:') ? undefined : undefined);
            const dayIdx = Math.max(0, Math.floor((Date.now() - p.startedAt) / 86400000) + p.offsetDays);
            return (
              <div className="card" key={p.planId}>
                <div className="row between"><strong>{def?.name ?? p.planId}</strong><Link to={`/pray/plans/${encodeURIComponent(p.planId)}`} className="btn small">Open</Link></div>
                <div className="progress" style={{ margin: '8px 0' }}><div style={{ width: `${(100 * p.done.length) / (def?.days.length ?? 365)}%` }} /></div>
                <span className="muted small">{p.done.length} of {def?.days.length ?? '—'} days read · today is day {dayIdx + 1}</span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
