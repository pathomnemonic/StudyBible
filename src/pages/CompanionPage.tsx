import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ADVENT, LENT, type CompanionDay } from '../data/companion';
import { addDays, easter, liturgicalDay, parseIso } from '../liturgy/compute';
import { useSettings } from '../lib/store';
import PrintButton from '../components/PrintButton';

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const KEY = 'sb:companion:done';
const loadDone = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]; } catch { return []; } };

/** Which day of the companion a date falls on, and in which season. Advent counts from 27 November so its last day is 24 December; Lent counts from Ash Wednesday. */
export function companionFor(date: string): { season: 'advent' | 'lent'; index: number; total: number; entry: CompanionDay } | null {
  const d = parseIso(date);
  const y = d.getUTCFullYear();
  const day = Math.round((d.getTime() - Date.UTC(y, 10, 27)) / 864e5);
  if (d.getTime() >= Date.UTC(y, 10, 27) && day <= 27 && liturgicalDay(d, 'usa').season === 'advent') return { season: 'advent', index: day, total: ADVENT.length, entry: ADVENT[day] };
  const ash = addDays(easter(y), -46);
  const since = Math.round((d.getTime() - ash.getTime()) / 864e5);
  if (since >= 0 && since < LENT.length) return { season: 'lent', index: since, total: LENT.length, entry: LENT[since] };
  return null;
}

/** A short companion for each day of Advent and Lent: a passage, a reflection, one thing to do, and a prayer. */
export default function CompanionPage() {
  const [sp, setSp] = useSearchParams();
  const [s] = useSettings();
  void s;
  const now = new Date();
  const today = isoOf(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
  const date = sp.get('d') ?? today;
  const c = companionFor(date);
  const [done, setDone] = useState<string[]>(loadDone);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch { /* private mode */ } }, [done]);
  const go = (n: number) => setSp({ d: isoOf(addDays(parseIso(date), n)) }, { replace: true });
  const isDone = done.includes(date);
  const label = new Date(date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  return (
    <div className="page companion">
      <div className="row between no-print"><h1>{c ? (c.season === 'advent' ? 'Advent companion' : 'Lent companion') : 'Advent and Lent companion'}</h1><PrintButton /></div>
      <div className="row no-print" style={{ gap: 8, marginBottom: 8 }}>
        <button className="btn small" onClick={() => go(-1)} aria-label="Previous day">‹</button><strong>{label}</strong><button className="btn small" onClick={() => go(1)} aria-label="Next day">›</button>
        {date !== today && <button className="btn small ghost" onClick={() => setSp({}, { replace: true })}>Today</button>}
      </div>
      {c ? (
        <article className="card">
          <p className="eyebrow">{c.season === 'advent' ? 'Advent' : 'Lent'} · day {c.index + 1}{c.season === 'lent' ? ` of ${c.total}` : ''}</p>
          <h2 style={{ margin: '0 0 6px' }}>{c.entry.title}</h2>
          <p className="muted small" style={{ margin: 0 }}>Read: <Link to={`/study/search?q=${encodeURIComponent(c.entry.ref)}`}>{c.entry.ref}</Link></p>
          <h3>Reflect</h3><p>{c.entry.reflection}</p>
          <h3>Do</h3><p>{c.entry.action}</p>
          <h3>Pray</h3><p className="scripture">{c.entry.prayer}</p>
          <button className="btn small no-print" aria-pressed={isDone} onClick={() => setDone((d) => (d.includes(date) ? d.filter((x) => x !== date) : [...d, date]))}>{isDone ? 'Done ✓' : 'Mark as done'}</button>
        </article>
      ) : (
        <div className="card"><p>The companion runs through Advent (the weeks before Christmas) and Lent (Ash Wednesday to Holy Saturday). Pick a date in one of those seasons.</p>
          <p className="muted small">Next in this year: Lent begins {addDays(easter(parseIso(date).getUTCFullYear()), -46).toLocaleDateString(undefined, { month: 'long', day: 'numeric', timeZone: 'UTC' })}; Advent begins on the fourth Sunday before Christmas.</p></div>
      )}
    </div>
  );
}
