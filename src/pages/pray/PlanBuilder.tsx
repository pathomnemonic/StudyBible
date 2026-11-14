import { useMemo, useState } from 'react';
import { db } from '../../db/db';
import { BOOKS } from '../../lib/canon';
import { parseRefId, parseRefs, type Ref } from '../../lib/refs';
import { useEditions } from '../../data/EditionsContext';
import { pooledCounts, resolveRef } from '../../lib/refCheck';
import { buildDays, chapterUnits, dayLabel, MAX_DAYS, type Pace } from '../../lib/planBuilder';

/** Make a plan from a run of chapters or a list of passages at a pace you choose; every day is shown before anything is saved. */
export default function PlanBuilder({ onSaved }: { onSaved: (id: number) => void }) {
  const { editions } = useEditions();
  const [mode, setMode] = useState<'book' | 'list'>('book');
  const [name, setName] = useState('');
  const [book, setBook] = useState('JHN');
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(21);
  const [list, setList] = useState('');
  const [paceKind, setPaceKind] = useState<'perDay' | 'days'>('perDay');
  const [n, setN] = useState(1);
  const b = BOOKS.find((x) => x.id === book)!;
  const built = useMemo(() => {
    let units: Ref[] = [];
    let err = '';
    if (mode === 'book') units = chapterUnits(book, from, to);
    else {
      for (const l of list.split('\n').map((x) => x.trim()).filter(Boolean)) {
        const p = parseRefs(l);
        if (!p.ok) { err = `“${l}”: ${p.error}`; break; }
        for (const x of p.refs) {
          // Typed passages use English/KJV numbering; do not silently store an unverified Vulgate approximation.
          const source = pooledCounts(editions, 'english');
          const anchor = editions.find((e) => e.scheme === 'vulgate');
          if (!source || !anchor) { err = 'Scripture verse counts are not loaded yet. Try again when the editions have finished loading.'; break; }
          const resolved = resolveRef(source, anchor, x.ref, 'english', anchor);
          if (resolved.status !== 'exact' || !resolved.anchor) { err = `“${l}” cannot be verified in the source and anchor editions: ${resolved.reason ?? 'the verse mapping is not exact'}. Remove it or choose a verified passage.`; break; }
          units.push(resolved.anchor);
        }
        if (err) break;
      }
    }
    const pace: Pace = paceKind === 'perDay' ? { perDay: n } : { days: n };
    return { err, units, days: err ? [] : buildDays(units, pace) };
  }, [mode, book, from, to, list, paceKind, n, editions]);
  const what = mode === 'book' ? `${b.name} ${from}${to !== from ? `-${to}` : ''}` : `${built.units.length} passages`;
  const pace = paceKind === 'perDay' ? `${n} ${mode === 'book' ? (n === 1 ? 'chapter' : 'chapters') : (n === 1 ? 'passage' : 'passages')} a day` : `over ${built.days.length} days`;
  const save = async () => {
    const id = (await db.userPlans.add({ name: name.trim() || `${what}, ${pace}`, description: `Built in the app: ${what}, ${pace}.`, days: built.days, createdAt: Date.now() } as never)) as number;
    onSaved(id);
  };
  return (
    <section className="card" aria-label="Build a reading plan">
      <h2 className="card-title">Build a plan by pace</h2>
      <div className="chips" role="group" aria-label="What to read">
        <button className={`chip${mode === 'book' ? ' sel' : ''}`} aria-pressed={mode === 'book'} onClick={() => setMode('book')}>A book or run of chapters</button>
        <button className={`chip${mode === 'list' ? ' sel' : ''}`} aria-pressed={mode === 'list'} onClick={() => setMode('list')}>A list of passages</button>
      </div>
      <input type="text" aria-label="Plan name" placeholder="Plan name (optional)" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', margin: '8px 0' }} />
      {mode === 'book' ? (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <label>Book <select value={book} onChange={(e) => { const nb = BOOKS.find((x) => x.id === e.target.value)!; setBook(nb.id); setFrom(1); setTo(nb.chapters); }}>{BOOKS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>From chapter <input type="number" min={1} max={b.chapters} value={from} onChange={(e) => setFrom(Math.max(1, Math.min(+e.target.value || 1, b.chapters)))} style={{ width: 70 }} /></label>
          <label>to <input type="number" min={from} max={b.chapters} value={to} onChange={(e) => setTo(Math.max(from, Math.min(+e.target.value || from, b.chapters)))} style={{ width: 70 }} /></label>
          <span className="muted small">Chapters use the Vulgate numbering the app anchors to ({b.chapters} in {b.name}); Psalms are shown with both numbers in the preview.</span>
        </div>
      ) : (
        <>
          <textarea aria-label="Passages, one per line" placeholder={'One passage per line, e.g.\nJohn 6:51-58\nPsalm 23\nRomans 8'} value={list} onChange={(e) => setList(e.target.value)} rows={4} style={{ width: '100%' }} />
          <p className="muted small">Typed passages use modern (English) numbering and are anchored to the Vulgate numbering automatically.</p>
        </>
      )}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
        <label>Pace <select value={paceKind} onChange={(e) => setPaceKind(e.target.value as 'perDay' | 'days')}><option value="perDay">{mode === 'book' ? 'chapters' : 'passages'} each day</option><option value="days">finish in this many days</option></select></label>
        <input type="number" aria-label={paceKind === 'perDay' ? 'How many each day' : 'How many days'} min={1} max={MAX_DAYS} value={n} onChange={(e) => setN(Math.max(1, Math.min(+e.target.value || 1, MAX_DAYS)))} style={{ width: 80 }} />
      </div>
      {built.err && <div className="notice" role="alert">{built.err}</div>}
      {built.days.length > 0 && (
        <>
          <h3 className="h-sm">Preview: {built.days.length} {built.days.length === 1 ? 'day' : 'days'}</h3>
          <ol className="list" aria-label="Day by day preview" style={{ maxHeight: 260, overflow: 'auto' }}>
            {built.days.map((d, i) => <li key={i} data-preview-day><strong>Day {i + 1}</strong>: {dayLabel(d.refs, parseRefId)}</li>)}
          </ol>
        </>
      )}
      {!built.err && built.days.length === 0 && <p className="muted small">Nothing to preview yet.</p>}
      <button className="btn primary" disabled={!built.days.length} onClick={() => void save()}>Save this plan</button>
    </section>
  );
}
