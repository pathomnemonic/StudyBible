import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../../db/db';
import { addDays, iso, liturgicalDay, parseIso, COLOR_NAME } from '../../liturgy/compute';
import { gradeName, loadLitYear, NATIONS, type LitYear } from '../../liturgy/litcal';
import { importLectionary, readingsFor, saveManualReadings, SLOT_LABEL, type DayReadings, type Slot } from '../../liturgy/readings';
import { useSettings } from '../../lib/store';
import RefLink from '../../components/RefLink';
import Icon from '../../components/Icon';
import { formatRef } from '../../lib/refs';

const localIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

export default function ReadingsPage() {
  const { date = localIso() } = useParams();
  const nav = useNavigate();
  const [s, set] = useSettings();
  const [rd, setRd] = useState<DayReadings | null>(null);
  const [month, setMonth] = useState<LitYear | null>(null);
  const [manual, setManual] = useState<Partial<Record<Slot, string>>>({});
  const [showManual, setShowManual] = useState(false);
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const d = parseIso(date);
  const lit = liturgicalDay(d, s.diocese === 'US' ? 'usa' : 'universal');
  const [view, setView] = useState<'day' | 'month'>('day');

  useEffect(() => {
    setRd(null);
    readingsFor(s.diocese, date).then(setRd);
  }, [date, s.diocese]);
  useEffect(() => {
    loadLitYear(s.diocese, d.getUTCFullYear()).then(setMonth);
  }, [s.diocese, d.getUTCFullYear()]);

  const events = useMemo(() => (rd?.events ?? []).filter((e) => e.grade >= 2 || e.grade === 0).sort((a, b) => b.grade - a.grade), [rd]);
  const go = (n: number) => nav(`/pray/readings/${iso(addDays(d, n))}`);
  const [y, m] = date.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const usccb = `https://bible.usccb.org/bible/readings/${String(m).padStart(2, '0')}${date.slice(8, 10)}${String(y).slice(2)}.cfm`;
  const saveDay = () => {
    db.saved.add({ key: `reading:${date}`, type: 'reading', label: `Readings ${date} — ${lit.dayName}`, url: `#/pray/readings/${date}`, createdAt: Date.now() }).then(() => setMsg('Saved to your Library.')).catch(() => setMsg('Already saved.'));
  };
  return (
    <div className="page">
      <Link to="/pray" className="small">← Pray</Link>
      <h1>Readings</h1>
      <div className="row between">
        <div className="row">
          <button className="icon-btn" onClick={() => go(-1)} aria-label="Previous day"><Icon name="chevL" /></button>
          <input type="date" value={date} onChange={(e) => e.target.value && nav(`/pray/readings/${e.target.value}`)} aria-label="Date" />
          <button className="icon-btn" onClick={() => go(1)} aria-label="Next day"><Icon name="chevR" /></button>
          <button className="btn small" onClick={() => nav('/pray/readings')}>Today</button>
        </div>
        <select value={s.diocese} onChange={(e) => set({ diocese: e.target.value })} aria-label="Liturgical calendar">
          {Object.entries(NATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <p className="muted small">Dates are your device’s local calendar days. The universal calendar and national calendars differ (for example in the transfer of Epiphany, the Ascension and Corpus Christi, and in saints’ days); choose yours above.</p>

      <div className="card">
        <div className="row between"><h3>{lit.dayName}</h3><span className="chip">{COLOR_NAME[lit.color]}</span></div>
        <div className="muted small">{lit.seasonName}{lit.week ? `, week ${lit.week}` : ''} · Sunday cycle {lit.sundayCycle} · weekday cycle {lit.weekdayCycle} (computed offline)</div>
        {events.length > 0 && (
          <ul className="list small">
            {events.map((e) => <li key={e.event_key}>{e.name} <span className="chip">{gradeName(e.grade)}</span></li>)}
          </ul>
        )}
        {rd && !rd.events.length && <div className="muted small">Saints’ days and national observances come from the online LitCal service; it is unreachable or has not been loaded yet, so only the computed liturgical day is shown.</div>}
      </div>

      <div className="card">
        <h3>Mass readings</h3>
        {!rd && <div className="muted">Loading…</div>}
        {rd && rd.items.length > 0 && (
          <ul className="list">
            {rd.items.map((i) => (
              <li key={i.slot}>
                <div className="muted small">{SLOT_LABEL[i.slot]}</div>
                <div className="row between">
                  <strong>{i.text}</strong>
                  <span className="row">
                    {i.refs.map((r, k) => <RefLink key={k} refv={r}>{k === 0 ? 'Read' : formatRef(r, { abbr: true })}</RefLink>)}
                    {i.refs[0] && <Link to={`/study/passage/${i.refs[0].book}.${i.refs[0].c1}${i.refs[0].v1 ? '.' + i.refs[0].v1 : ''}${i.refs[0].c2 !== i.refs[0].c1 || i.refs[0].v2 !== i.refs[0].v1 ? '-' + (i.refs[0].c2 !== i.refs[0].c1 ? i.refs[0].c2 + '.' : '') + (i.refs[0].v2 ?? '') : ''}`.replace(/-$/, '')}>Study</Link>}
                  </span>
                </div>
                {i.note && <div className="muted small">{i.note}</div>}
              </li>
            ))}
          </ul>
        )}
        {rd && <div className="notice info">{rd.sourceNote}</div>}
        <div className="notice">
          The Lectionary text (NABRE-based in the United States) is copyrighted, so this app shows <em>references</em> and opens them in the bundled translations, not the Lectionary wording.
        </div>
        <div className="row">
          <a className="btn" href={usccb} target="_blank" rel="noreferrer">Official daily readings (USCCB) ↗</a>
          <button className="btn" onClick={saveDay}>Save this day</button>
          <button className="btn" onClick={() => setShowManual(!showManual)}>Enter references</button>
          <button className="btn" onClick={() => file.current?.click()}>Import lectionary file</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try { setMsg(`Imported ${await importLectionary(await f.text())} days.`); readingsFor(s.diocese, date).then(setRd); } catch (err: any) { setMsg(err.message); }
          }} />
        </div>
        {msg && <p className="small">{msg}</p>}
        {showManual && (
          <div className="card" style={{ marginTop: 8 }}>
            <p className="muted small">Type the day’s references (as printed in your missal, e.g. “Ephesians 2:1-10”). They stay on this device and open in the reader.</p>
            {(['first_reading', 'responsorial_psalm', 'second_reading', 'gospel'] as Slot[]).map((sl) => (
              <label key={sl} className="row" style={{ margin: '4px 0' }}>
                <span style={{ width: 150 }}>{SLOT_LABEL[sl]}</span>
                <input type="text" value={manual[sl] ?? ''} onChange={(e) => setManual({ ...manual, [sl]: e.target.value })} style={{ flex: 1 }} />
              </label>
            ))}
            <button className="btn primary" onClick={async () => { await saveManualReadings(date, manual); setShowManual(false); readingsFor(s.diocese, date).then(setRd); }}>Save for {date}</button>
          </div>
        )}
        <details className="small" style={{ marginTop: 8 }}>
          <summary>Importing a lectionary data file</summary>
          <p className="muted">If you hold a licence to a lectionary reference list, import it as JSON: <code>{`{"2026-10-19": {"first_reading": "Ephesians 2:1-10", "responsorial_psalm": "Psalm 100:1-5", "gospel": "Luke 12:13-21"}}`}</code>. Nothing is uploaded.</p>
        </details>
      </div>

      <div className="tabbar"><button aria-selected={view === 'day'} onClick={() => setView('day')}>Day</button><button aria-selected={view === 'month'} onClick={() => setView('month')}>Calendar</button></div>
      {view === 'month' && (
        <div className="card">
          <div className="row between"><strong>{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</strong>
            <span><button className="icon-btn" onClick={() => nav(`/pray/readings/${iso(addDays(first, -1)).slice(0, 8)}01`)}><Icon name="chevL" /></button><button className="icon-btn" onClick={() => nav(`/pray/readings/${iso(addDays(first, 32)).slice(0, 8)}01`)}><Icon name="chevR" /></button></span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 8 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x, i) => <div key={i} className="muted small" style={{ textAlign: 'center' }}>{x}</div>)}
            {Array.from({ length: first.getUTCDay() }, (_, i) => <div key={'b' + i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const ds = `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
              const ld = liturgicalDay(parseIso(ds), s.diocese === 'US' ? 'usa' : 'universal');
              const evs = month?.events.filter((e) => e.date === ds && e.grade >= 3) ?? [];
              const top = [...evs].sort((a, b) => b.grade - a.grade)[0];
              const col: Record<string, string> = { green: '#4a7c4a', violet: '#6b4a8a', white: '#bbb', red: '#a33', rose: '#c78' };
              return (
                <button key={ds} onClick={() => { nav(`/pray/readings/${ds}`); setView('day'); }} title={top?.name ?? ld.dayName} style={{ border: ds === date ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: 4, minHeight: 54, textAlign: 'left', cursor: 'pointer', borderTop: `4px solid ${col[ld.color]}` }}>
                  <div className="small">{i + 1}</div>
                  <div style={{ fontSize: 10, lineHeight: 1.1 }} className="muted">{(top?.name ?? '').slice(0, 22)}</div>
                </button>
              );
            })}
          </div>
          <p className="muted small">Top border = liturgical colour of the season. Titles show memorials and above.</p>
        </div>
      )}
    </div>
  );
}
