import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { rangesOverlap } from '../db/ops';
import { parseRefId, formatRef, type Ref } from '../lib/refs';
import { gatherAll, type SectionKey, type StudyItem } from '../study/providers';
import { useToast } from './Toast';

/** A one-page printable sheet for a study group: the passage, a little background with its sources, and open questions. Private notes are left out unless you tick the box. */
export default function GroupSheet({ r, text, translation }: { r: Ref; text: { v: number; text: string }[]; translation: string }) {
  const [data, setData] = useState<Partial<Record<SectionKey, StudyItem[]>>>({});
  const [withNotes, setWithNotes] = useState(false);
  const toast = useToast();
  useEffect(() => {
    let live = true;
    gatherAll([r], (k, items) => live && setData((d) => ({ ...d, [k]: items })));
    return () => { live = false; };
  }, [JSON.stringify(r)]);
  const notes = useLiveQuery(async () => (await db.notes.toArray()).filter((n) => n.targets.some((t) => t.type === 'passage' && (() => { const x = parseRefId(t.ref); return !!x && rangesOverlap(x, r); })())), [JSON.stringify(r)]) ?? [];
  const pick = (k: SectionKey, n: number) => (data[k] ?? []).filter((i) => i.title && (i.url || i.internal || i.excerpt)).slice(0, n);
  const background = [...pick('catechism', 3), ...pick('commentary', 3), ...pick('fathers', 3)];
  const cite = (i: StudyItem) => [i.author, `“${i.title}”`, i.sourceName, i.date, i.url ? `<${i.url}>` : ''].filter(Boolean).join(', ');
  const citations = background.map((i) => `${cite(i)} [${i.authority}]`).join('\n');
  return (
    <section className="group-sheet card" aria-label="Group study sheet">
      <div className="row between no-print">
        <h2 className="card-title" style={{ margin: 0 }}>Group study sheet</h2>
        <span className="row" style={{ gap: 6 }}>
          <button className="btn small" onClick={async () => { try { await navigator.clipboard.writeText(`${formatRef(r)} (${translation})\n\n${citations}`); toast('Sources copied.'); } catch { toast('Could not copy.', 'error'); } }}>Copy sources</button>
          <button className="btn small primary" onClick={() => window.print()}>Print</button>
        </span>
      </div>
      <label className="no-print small" style={{ display: 'block', margin: '6px 0' }}>
        <input type="checkbox" checked={withNotes} onChange={(e) => setWithNotes(e.target.checked)} /> Include my own notes on this passage ({notes.length}). They are private and left out unless you tick this.
      </label>
      <h1 style={{ marginTop: 8 }}>{formatRef(r)}</h1>
      <p className="scripture">{text.map((t) => <span key={t.v}><sup>{t.v}</sup>{t.text} </span>)}</p>
      <p className="muted small">{translation}</p>
      {background.length > 0 && (
        <>
          <h3>Background</h3>
          <ul>{background.map((i) => <li key={i.id}><strong>{i.title}</strong>{i.author ? `, ${i.author}` : ''}{i.excerpt ? `: ${i.excerpt.slice(0, 220)}${i.excerpt.length > 220 ? '…' : ''}` : ''} <span className="muted small">({i.sourceName})</span></li>)}</ul>
        </>
      )}
      <h3>For discussion</h3>
      <ol>
        <li>What does the passage say? Retell it in your own words.</li>
        <li>What does it show us about God, and about us?</li>
        <li>What word or phrase stands out, and why?</li>
        <li>How does it connect with the Church’s teaching or another passage you know?</li>
        <li>What is one thing we could do this week in response?</li>
      </ol>
      {withNotes && notes.length > 0 && (<><h3>My notes</h3><ul>{notes.map((n) => <li key={n.id}><strong>{n.title || 'Note'}</strong>: {n.body.slice(0, 400)}</li>)}</ul></>)}
      {background.length > 0 && (<><h3>Sources</h3><ol className="small">{background.map((i) => <li key={i.id}>{cite(i)}</li>)}</ol></>)}
    </section>
  );
}
