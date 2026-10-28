import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSettings } from '../lib/store';
import { readingsFor, slotLabel, type DayReadings } from '../liturgy/readings';
import { addDays, liturgicalDay, parseIso, COLOR_NAME } from '../liturgy/compute';
import { loadDaily, pickDaily, type DailyEntry } from '../study/daily';
import { copyText } from '../lib/clipboard';
import PrintButton from '../components/PrintButton';

const KEY = 'sb:bulletin:v1';
interface Parish { name: string; times: string; contact: string; notes: string }
const load = (): Parish => { try { return { name: '', times: '', contact: '', notes: '', ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Parish>) }; } catch { return { name: '', times: '', contact: '', notes: '' }; } };
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const nextSunday = () => { const t = new Date(); const d = new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate() + ((7 - t.getDay()) % 7))); return isoOf(d); };

/** The words for a week's bulletin: the Sunday's name and color, its readings, a reflection question, the week's celebrations, and your parish's times and notes. Print it, or copy it as plain text for your own layout. */
export default function BulletinPage() {
  const [sp, setSp] = useSearchParams();
  const [s] = useSettings();
  const variant = s.diocese === 'US' ? 'usa' : 'universal';
  const date = sp.get('d') ?? nextSunday();
  const [parish, setParish] = useState<Parish>(load);
  const [readings, setReadings] = useState<DayReadings | null>(null);
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(parish)); } catch { /* private mode */ } }, [parish]);
  useEffect(() => { let live = true; setReadings(null); readingsFor(s.diocese, date).then((r) => live && setReadings(r)).catch(() => live && setReadings(null)); return () => { live = false; }; }, [date, s.diocese]);
  const ld = useMemo(() => liturgicalDay(parseIso(date), variant), [date, variant]);
  useEffect(() => { let live = true; loadDaily().then((f) => { if (f && live) setEntry(pickDaily(f, ld)); }); return () => { live = false; }; }, [ld]);
  const week = useMemo(() => Array.from({ length: 6 }, (_, i) => { const d = addDays(parseIso(date), i + 1); const l = liturgicalDay(d, variant); return { date: isoOf(d), name: l.dayName, rank: l.rank }; }).filter((x) => x.rank && x.rank !== 'weekday'), [date, variant]);
  const label = new Date(date + 'T12:00:00Z').toLocaleDateString(undefined, { dateStyle: 'long', timeZone: 'UTC' });
  const text = [
    parish.name, ld.dayName, label, `Liturgical color: ${COLOR_NAME[ld.color]}`, '',
    'READINGS', ...(readings?.items ?? []).map((r) => `${slotLabel(r.slot)}: ${r.text}`), '',
    entry ? `THINK ABOUT IT\n${entry.q}\n` : '',
    week.length ? `THIS WEEK\n${week.map((w) => `${new Date(w.date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'long', timeZone: 'UTC' })}: ${w.name}`).join('\n')}\n` : '',
    parish.times ? `MASS AND CONFESSION TIMES\n${parish.times}\n` : '', parish.notes ? `ANNOUNCEMENTS\n${parish.notes}\n` : '', parish.contact,
  ].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n').trim();
  const set = (k: keyof Parish, v: string) => setParish((p) => ({ ...p, [k]: v }));
  return (
    <div className="page bulletin">
      <div className="row between no-print"><h1>Parish bulletin helper</h1><div className="row" style={{ gap: 8 }}><input type="date" value={date} aria-label="Pick a Sunday" onChange={(e) => e.target.value && setSp({ d: e.target.value }, { replace: true })} /><PrintButton label="Print" className="btn small primary" /></div></div>
      <details className="no-print card" open={!parish.name}><summary><strong>Your parish</strong> <span className="muted small">(kept on this device)</span></summary>
        <label className="field"><span>Parish name</span><input value={parish.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label className="field"><span>Mass and confession times</span><textarea rows={3} value={parish.times} onChange={(e) => set('times', e.target.value)} placeholder={'Saturday 5:00 pm\nSunday 8:00 am, 10:30 am'} /></label>
        <label className="field"><span>Announcements</span><textarea rows={4} value={parish.notes} onChange={(e) => set('notes', e.target.value)} /></label>
        <label className="field"><span>Contact</span><input value={parish.contact} onChange={(e) => set('contact', e.target.value)} placeholder="Office hours, phone, email" /></label>
      </details>
      <div className="print-sheet bul-sheet">
        {parish.name && <p className="bul-parish">{parish.name}</p>}
        <h2 style={{ margin: '0 0 2px' }}>{ld.dayName}</h2>
        <p className="muted" style={{ margin: 0 }}>{label} · {COLOR_NAME[ld.color]}</p>
        <h3>Readings</h3>
        {readings === null ? <p className="muted small">Loading…</p> : readings.items.length ? <ul className="list">{readings.items.map((r) => <li key={r.slot}><strong>{slotLabel(r.slot)}:</strong> {r.text}</li>)}</ul> : <p className="muted small">The readings for this day are not listed offline.</p>}
        {entry && <><h3>Think about it</h3><p>{entry.q}</p></>}
        {week.length > 0 && <><h3>This week</h3><ul className="list">{week.map((w) => <li key={w.date}>{new Date(w.date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'long', timeZone: 'UTC' })}: {w.name}</li>)}</ul></>}
        {parish.times && <><h3>Mass and confession</h3><p style={{ whiteSpace: 'pre-line' }}>{parish.times}</p></>}
        {parish.notes && <><h3>Announcements</h3><p style={{ whiteSpace: 'pre-line' }}>{parish.notes}</p></>}
        {parish.contact && <p className="muted small">{parish.contact}</p>}
        <p className="muted small">Reading citations as listed by the USCCB (bible.usccb.org).</p>
      </div>
      <p className="no-print"><button className="btn" onClick={async () => { setCopied(await copyText(text)); window.setTimeout(() => setCopied(false), 2000); }}>{copied ? 'Copied' : 'Copy as plain text'}</button></p>
    </div>
  );
}
