import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSettings } from '../lib/store';
import { liturgicalDay, parseIso, type Color } from '../liturgy/compute';
import { dutiesOn } from '../liturgy/discipline';
import { loadLitYear, gradeName, type LitEvent } from '../liturgy/litcal';

const DOT: Record<Color, string> = { green: '#2e7d4f', violet: '#6a3d9a', white: '#d8d2c2', red: '#b3261e', rose: '#d98aa8' };
const pad = (n: number) => String(n).padStart(2, '0');

/** A month of the Church's calendar, in the shape of a wall calendar: the color of each day, its feast, and the days of obligation, fasting and abstinence. Print it or save it as a PDF. */
export default function CalendarMonthPage() {
  const [sp, setSp] = useSearchParams();
  const [s] = useSettings();
  const now = new Date();
  const y = +(sp.get('y') ?? now.getFullYear()), m = +(sp.get('m') ?? now.getMonth() + 1);
  const variant = s.diocese === 'US' ? 'usa' : 'universal';
  const [events, setEvents] = useState<Map<string, LitEvent[]> | null>(null);
  useEffect(() => {
    let live = true;
    loadLitYear(s.diocese, y).then((yr) => { if (!live) return; const mp = new Map<string, LitEvent[]>(); for (const e of yr?.events ?? []) mp.set(e.date, [...(mp.get(e.date) ?? []), e]); setEvents(mp); }).catch(() => live && setEvents(new Map()));
    return () => { live = false; };
  }, [s.diocese, y]);
  const days = useMemo(() => {
    const first = new Date(Date.UTC(y, m - 1, 1));
    const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(Date.UTC(y, m - 1, i + 1));
      const key = `${y}-${pad(m)}-${pad(i + 1)}`;
      const ld = liturgicalDay(d, variant);
      const ev = (events?.get(key) ?? []).filter((e) => e.grade >= 2).sort((a, b) => b.grade - a.grade);
      const duties = dutiesOn(d, variant);
      const name = ev[0] ? ev[0].name : ld.rank && ld.rank !== 'weekday' ? ld.dayName : '';
      return { n: i + 1, dow: d.getUTCDay(), key, ld, name, grade: ev[0] ? gradeName(ev[0].grade) : '', mass: duties.some((x) => x.kind === 'mass' && x.title.startsWith('Holy day')), fast: duties.some((x) => x.kind === 'fast'), abstain: duties.some((x) => x.kind === 'abstain'), offset: i === 0 ? first.getUTCDay() : 0 };
    });
  }, [y, m, variant, events]);
  const title = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const go = (dm: number) => { const d = new Date(Date.UTC(y, m - 1 + dm, 1)); setSp({ y: String(d.getUTCFullYear()), m: String(d.getUTCMonth() + 1) }, { replace: true }); };
  const lead = days[0]?.offset ?? 0;
  return (
    <div className="page cal-month">
      <div className="row between no-print"><h1>Church calendar</h1><div className="row" style={{ gap: 6 }}><button className="btn small" onClick={() => go(-1)} aria-label="Previous month">‹</button><button className="btn small" onClick={() => go(1)} aria-label="Next month">›</button><button className="btn small primary" onClick={() => window.print()}>Print</button></div></div>
      <div className="print-sheet cal-sheet">
        <h2 className="cal-title">{title}</h2>
        <div className="cal-grid" role="grid" aria-label={title}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
          {Array.from({ length: lead }, (_, i) => <div key={`b${i}`} className="cal-cell blank" />)}
          {days.map((d) => (
            <div key={d.key} role="gridcell" className={`cal-cell${d.dow === 0 ? ' sun' : ''}`}>
              <span className="cal-num">{d.n}</span>
              <i className="cal-dot" style={{ background: DOT[d.ld.color] }} title={d.ld.color} />
              {d.name && <span className="cal-name">{d.name}</span>}
              <span className="cal-marks">{d.mass ? '✝ ' : ''}{d.fast ? 'Fast ' : ''}{d.abstain ? 'No meat' : ''}</span>
            </div>
          ))}
        </div>
        <p className="cal-key">Color dots show the liturgical color: <span style={{ color: DOT.green }}>● green</span> <span style={{ color: DOT.violet }}>● violet</span> <span style={{ color: DOT.red }}>● red</span> <span style={{ color: DOT.rose }}>● rose</span> ○ white. ✝ holy day of obligation. {events && events.size === 0 ? 'Saints’ days appear when the calendar can be loaded online.' : ''} Dates follow the {s.diocese === 'US' ? 'United States' : 'general Roman'} calendar; your diocese may differ.</p>
      </div>
      <p className="no-print small"><Link to="/pray/year">The Church year</Link></p>
    </div>
  );
}
