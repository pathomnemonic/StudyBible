import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../data/loader';
import { liturgicalDay, parseIso } from '../../liturgy/compute';
import { HONESTY, HOUR_NOTES, INTERCESSIONS, LAST_KEY, PARTS, WHY_INTRO, WHY_QUOTES, type HourId, type LastPrayed, type PartId } from '../../data/officeCompanion';

interface Psalm { title: string; lines: string[][]; psalm: number }
interface Resp { k?: 'R' | 'V'; t?: string; gloria?: boolean }
interface Chapter { ref: string | null; text: string }
interface Vers { v: string | null; r: string | null }
interface Entry { a: string; p?: string; ps?: string[] }
interface Major { psalms: Entry[]; chapter: Chapter; hymn: string[][]; responsory: Resp[]; versicle: Vers; canticleAnt: string }
interface SeasonPart { chapter?: Chapter; responsory?: Resp[]; hymn?: string[][]; versicle?: Vers }
interface Season { collect: string; lauds: SeasonPart; vespers: SeasonPart; laudesAlt?: Record<string, Entry[]>; sundayLauds?: Entry[] }
interface Office {
  seasons: Record<string, Season>;
  gloria: string; pater: string; collect: string;
  days: { lauds: Major; vespers: Major }[];
  canticles: { benedictus: string[][]; magnificat: string[][] };
  psalms: Record<string, Psalm>;
}
type SeasonId = 'ordinary' | 'adv' | 'quad' | 'quad5' | 'pasch';
const SEASON_NAME: Record<SeasonId, string> = { ordinary: 'Ordinary time', adv: 'Advent', quad: 'Lent', quad5: 'Passiontide', pasch: 'Eastertide' };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ant = (s: string) => s.replace(/\s*\*\s*/g, ' ');
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function seasonNow(): SeasonId {
  const d = liturgicalDay(parseIso(iso(new Date())), 'universal');
  if (d.season === 'advent') return 'adv';
  if (d.season === 'lent') return (d.week ?? 0) >= 5 ? 'quad5' : 'quad';
  if (d.season === 'easter') return 'pasch';
  return 'ordinary';
}
function readLast(): LastPrayed | null {
  try { const v = JSON.parse(localStorage.getItem(LAST_KEY) || 'null'); return v && (v.hour === 'lauds' || v.hour === 'vespers') && typeof v.date === 'string' ? v : null; } catch { return null; }
}
function readNotesPref(): boolean { try { return localStorage.getItem('sb:office-companion-notes') === '1'; } catch { return false; } }

interface Step { part: PartId; heading: string; node: ReactNode }

const Lines = ({ rows }: { rows: string[][] }) => <>{rows.map((r, i) => <p key={i}>{r.map((l, j) => <span key={j}>{l.replace(/^\*\s*/, '')}<br /></span>)}</p>)}</>;

export default function OfficeCompanionPage() {
  const now = useMemo(() => new Date(), []);
  const [data, setData] = useState<Office | null>(null);
  const [err, setErr] = useState('');
  const [saint, setSaint] = useState('');
  const [hour, setHour] = useState<HourId>(now.getHours() < 14 ? 'lauds' : 'vespers');
  const [day, setDay] = useState(now.getDay());
  const [season, setSeason] = useState<SeasonId>(seasonNow);
  const [last, setLast] = useState<LastPrayed | null>(readLast);
  const [praying, setPraying] = useState(false);
  const [i, setI] = useState(0);
  const [notes, setNotes] = useState(readNotesPref);

  useEffect(() => { getJson<Office>('office/office.json').then((d) => setData(d)).catch((e) => setErr(String(e.message ?? e))); }, []);
  useEffect(() => {
    const mm = String(now.getMonth() + 1).padStart(2, '0'), dd = String(now.getDate()).padStart(2, '0');
    getJson<Record<string, { name: string }>>(`office/sancti-${mm}.json`, true).then((m) => setSaint(m?.[dd]?.name ?? '')).catch(() => {});
  }, [now]);
  useEffect(() => { setI(0); }, [hour, day, season]);
  const toggleNotes = (v: boolean) => { setNotes(v); try { localStorage.setItem('sb:office-companion-notes', v ? '1' : '0'); } catch { /* private mode */ } };

  const steps = useMemo<Step[]>(() => {
    if (!data) return [];
    const g = data.gloria;
    const base = data.days[day][hour];
    const S = season === 'ordinary' ? null : data.seasons[season];
    const sp = S?.[hour];
    const m = { ...base, chapter: sp?.chapter ?? base.chapter, responsory: sp?.responsory ?? base.responsory, hymn: sp?.hymn ?? base.hymn, versicle: sp?.versicle ?? base.versicle };
    const l = hour === 'lauds';
    let psalms: Entry[] = base.psalms;
    let psalmNote = '';
    if (season === 'pasch') psalms = l && day === 0 && S?.sundayLauds ? S.sundayLauds : base.psalms.map((e) => ({ ...e, a: 'Alleluia, alleluia, alleluia.' }));
    else if (S?.laudesAlt && l && day > 0) { psalms = S.laudesAlt[String(day)] ?? psalms; psalmNote = 'In this season weekday Lauds begins with Psalm 50. Some psalms have no seasonal antiphon in the data.'; }
    const lentish = season === 'quad' || season === 'quad5';
    const out: Step[] = [];
    out.push({ part: 'opening', heading: 'Opening', node: (
      <>
        <p><b className="office-k">V.</b> O God, come to my assistance.<br /><b className="office-k">R.</b> O Lord, make haste to help me.</p>
        <p className="oc-sub">{g} {lentish ? 'Praise be to thee, O Lord, King of eternal glory.' : season === 'pasch' ? 'Alleluia, alleluia.' : 'Alleluia.'}</p>
      </>) });
    out.push({ part: 'hymn', heading: 'Hymn', node: <div className="oc-poem"><Lines rows={m.hymn} /></div> });
    psalms.forEach((e, n) => {
      const keys = e.ps ?? [e.p!];
      out.push({ part: 'psalmody', heading: `Psalmody ${n + 1} of ${psalms.length}`, node: (
        <>
          {n === 0 && psalmNote && <p className="oc-sub">{psalmNote}</p>}
          {e.a && <p className="oc-ant"><b className="office-k">Ant.</b> {ant(e.a)}</p>}
          {keys.map((k) => data.psalms[k] && (
            <div key={k} className="oc-poem">
              <div className="oc-sub">{data.psalms[k].title || `Psalm ${data.psalms[k].psalm}`}</div>
              <Lines rows={data.psalms[k].lines} />
              <p className="oc-sub">{g}</p>
            </div>))}
          {e.a && <p className="oc-ant"><b className="office-k">Ant.</b> {ant(e.a)}</p>}
        </>) });
    });
    out.push({ part: 'reading', heading: 'Short reading', node: <p>{m.chapter.text}{m.chapter.ref && <span className="oc-sub"> — {m.chapter.ref}</span>}<br /><b className="office-k">R. Thanks be to God.</b></p> });
    out.push({ part: 'responsory', heading: 'Responsory', node: (
      <>
        {m.responsory.map((x, k) => x.gloria ? <p key={k} className="oc-sub">{g}</p> : <p key={k}><b className="office-k">{x.k}.</b> {ant(x.t ?? '')}</p>)}
        {m.versicle.v && <p><b className="office-k">V.</b> {m.versicle.v}<br /><b className="office-k">R.</b> {m.versicle.r}</p>}
      </>) });
    out.push({ part: 'canticle', heading: HOUR_NOTES[hour].canticleName, node: (
      <>
        <p className="oc-ant"><b className="office-k">Ant.</b> {ant(m.canticleAnt)}</p>
        <div className="oc-poem"><Lines rows={l ? data.canticles.benedictus : data.canticles.magnificat} /><p className="oc-sub">{g}</p></div>
        <p className="oc-ant"><b className="office-k">Ant.</b> {ant(m.canticleAnt)}</p>
      </>) });
    out.push({ part: 'intercessions', heading: 'Intercessions', node: (
      <>
        <p className="oc-sub">Our own plain words. After each one you may say: “Lord, hear our prayer.” Add your own names and needs.</p>
        <ul className="oc-list">{INTERCESSIONS[hour].map((t) => <li key={t}>{t}</li>)}</ul>
      </>) });
    out.push({ part: 'ourfather', heading: 'Our Father', node: <p>{data.pater}</p> });
    out.push({ part: 'collect', heading: 'Concluding prayer', node: (
      <>
        <p>{S?.collect ?? data.collect}</p>
        <p className="oc-sub">Through our Lord Jesus Christ, thy Son, who liveth and reigneth with thee in the unity of the Holy Ghost, God, world without end. Amen.</p>
        {S && <p className="oc-sub">The season’s collect, from the traditional Missal.</p>}
      </>) });
    out.push({ part: 'blessing', heading: 'Blessing and dismissal', node: (
      <p><b className="office-k">V.</b> Let us bless the Lord.<br /><b className="office-k">R.</b> Thanks be to God.<br /><b className="office-k">V.</b> May the souls of the faithful departed, through the mercy of God, rest in peace.<br /><b className="office-k">R.</b> Amen.</p>) });
    return out;
  }, [data, hour, day, season]);

  const finish = () => {
    const v: LastPrayed = { hour, date: iso(new Date()) };
    try { localStorage.setItem(LAST_KEY, JSON.stringify(v)); } catch { /* ignore */ }
    setLast(v); setPraying(false); setI(0);
  };

  useEffect(() => {
    if (!praying) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((n) => Math.min(n + 1, steps.length - 1));
      else if (e.key === 'ArrowLeft') setI((n) => Math.max(n - 1, 0));
      else if (e.key === 'Escape') setPraying(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [praying, steps.length]);

  const note = (id: PartId) => PARTS.find((p) => p.id === id)!;
  const lastText = last ? `${HOUR_NOTES[last.hour].name} on ${last.date === iso(now) ? 'today' : last.date}` : '';

  if (praying && steps[i]) {
    const s = steps[i]; const pn = note(s.part); const lastStep = i === steps.length - 1;
    return (
      <div className="page oc oc-pray">
        <div className="oc-top">
          <button className="btn small" onClick={() => setPraying(false)}>Close</button>
          <span className="oc-count" aria-live="polite">{HOUR_NOTES[hour].name}, step {i + 1} of {steps.length}</span>
          <label className="oc-toggle"><input type="checkbox" checked={notes} onChange={(e) => toggleNotes(e.target.checked)} /> Why?</label>
        </div>
        <div className="oc-bar" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={i + 1}><span style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>
        <h1 className="oc-h">{s.heading}</h1>
        <div className="oc-text">{s.node}</div>
        {notes && (
          <aside className="oc-note card">
            <strong>Why do we do this? {pn.title}</strong>
            <p>{pn.what}</p><p>{pn.why}</p>
            {pn.quote && <p className="oc-q">“{pn.quote.text}” <span className="oc-sub">— {pn.quote.label}</span></p>}
          </aside>
        )}
        <div className="oc-nav">
          <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
          {lastStep
            ? <button className="btn primary" onClick={finish}>Amen. Mark as prayed</button>
            : <button className="btn primary" onClick={() => setI(i + 1)}>Next</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="page oc">
      <h1>The Daily Office Companion</h1>
      <p className="lede">Morning and Evening Prayer, one step at a time, with a short note on why we pray each part.</p>
      {saint && <p className="oc-saint">Today the Church remembers: <strong>{saint}</strong> <span className="oc-sub">(traditional calendar)</span></p>}
      {last && <p className="oc-sub">You last prayed {lastText}.</p>}

      <section className="card oc-why">
        <h2>Why we pray the hours</h2>
        {WHY_INTRO.map((t) => <p key={t}>{t}</p>)}
        {WHY_QUOTES.map((q) => <blockquote key={q.label} className="oc-quote">“{q.text}”<footer>{q.label}</footer></blockquote>)}
      </section>

      <div className="row oc-pick" role="tablist" aria-label="Hour">
        {(['lauds', 'vespers'] as HourId[]).map((h) => (
          <button key={h} role="tab" aria-selected={hour === h} className={`btn${hour === h ? ' primary' : ''}`} onClick={() => setHour(h)}>{HOUR_NOTES[h].name} <span className="oc-sub">{HOUR_NOTES[h].english}</span></button>
        ))}
      </div>
      <p>{HOUR_NOTES[hour].why} <span className="oc-sub">{HOUR_NOTES[hour].when}.</span></p>
      <div className="row oc-pick">
        <label>Day <select value={day} onChange={(e) => setDay(+e.target.value)} aria-label="Day of the week">{DAYS.map((n, k) => <option key={n} value={k}>{n}</option>)}</select></label>
        <label>Season <select value={season} onChange={(e) => setSeason(e.target.value as SeasonId)} aria-label="Season">{(Object.keys(SEASON_NAME) as SeasonId[]).map((k) => <option key={k} value={k}>{SEASON_NAME[k]}</option>)}</select></label>
      </div>
      {err && <p role="alert" className="card">Could not load the Office ({err}). Check your connection and try again.</p>}
      <button className="btn primary oc-go" disabled={!data} onClick={() => { setI(0); setPraying(true); }}>{data ? `Pray now: ${HOUR_NOTES[hour].english}` : 'Loading…'}</button>

      <h2>The parts of the hour</h2>
      <p className="oc-sub">Tap a part to read what it is and why the Church prays it.</p>
      {PARTS.map((p, n) => (
        <details key={p.id} className="oc-part">
          <summary><span className="oc-n">{n + 1}</span> {p.id === 'canticle' ? HOUR_NOTES[hour].canticleName : p.title}</summary>
          <p>{p.what}</p><p>{p.why}</p>
          {p.quote && <p className="oc-q">“{p.quote.text}” <span className="oc-sub">— {p.quote.label}</span></p>}
        </details>
      ))}

      <div className="card small muted oc-honest"><strong>What this is, and isn’t.</strong> {HONESTY} See also the full <Link to="/pray/office">Divine Office</Link>, and the Catechism on prayer (paragraphs 2700 to 2704). The explanations are ours; every quotation is checked against the app’s bundled texts.</div>
    </div>
  );
}
