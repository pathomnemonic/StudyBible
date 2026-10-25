import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { rangesOverlap } from '../db/ops';
import { parseRefId, formatRef, type Ref } from '../lib/refs';
import { gatherAll, type SectionKey, type StudyItem } from '../study/providers';
import { useToast } from './Toast';

/** A one-page printable sheet for a study group: the passage, a little background with its sources, and open questions. Private notes are left out unless you tick the box. */
const QUESTIONS = ['What does the passage say? Retell it in your own words.', 'What does it show us about God, and about us?', 'What word or phrase stands out, and why?', 'How does it connect with the Church’s teaching or another passage you know?', 'What is one thing we could do this week in response?'];

/** Full-screen slides for a group: the passage in readable chunks, a little background, then the questions. Private notes never appear here. */
function Present({ title, text, background, onClose }: { title: string; text: { v: number; text: string }[]; background: StudyItem[]; onClose: () => void }) {
  const slides = useMemo(() => {
    const out: { head: string; body: string }[] = [{ head: title, body: '' }];
    for (let i = 0; i < text.length; i += 3) out.push({ head: title, body: text.slice(i, i + 3).map((t) => `${t.v}  ${t.text}`).join('\n\n') });
    for (const b of background.slice(0, 6)) out.push({ head: b.title, body: `${b.excerpt?.slice(0, 400) ?? ''}${b.author ? `\n\n${b.author}` : ''}\n${b.sourceName}` });
    QUESTIONS.forEach((q, i) => out.push({ head: `Question ${i + 1}`, body: q }));
    return out;
  }, [title, text, background]);
  const [i, setI] = useState(0);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight' || e.key === ' ') setI((x) => Math.min(slides.length - 1, x + 1)); else if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1)); else if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [slides.length, onClose]);
  const sl = slides[i];
  return (
    <div className="present" role="dialog" aria-modal="true" aria-label="Presentation">
      <button className="btn small present-x" onClick={onClose}>Close (Esc)</button>
      <h1>{sl.head}</h1>
      {sl.body && <p className="present-body" style={{ whiteSpace: 'pre-line' }}>{sl.body}</p>}
      <div className="present-nav">
        <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>← Back</button>
        <span>{i + 1} / {slides.length}</span>
        <button className="btn primary" disabled={i === slides.length - 1} onClick={() => setI(i + 1)}>Next →</button>
      </div>
    </div>
  );
}

export default function GroupSheet({ r, text, translation }: { r: Ref; text: { v: number; text: string }[]; translation: string }) {
  const [data, setData] = useState<Partial<Record<SectionKey, StudyItem[]>>>({});
  const [withNotes, setWithNotes] = useState(false);
  const [present, setPresent] = useState(false);
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
          <button className="btn small" onClick={() => setPresent(true)}>Present</button>
          <button className="btn small primary" onClick={() => window.print()}>Print</button>
        </span>
      </div>
      <label className="no-print small" style={{ display: 'block', margin: '6px 0' }}>
        <input type="checkbox" checked={withNotes} onChange={(e) => setWithNotes(e.target.checked)} /> Include my own notes on this passage ({notes.length}). They are private and left out unless you tick this.
      </label>
      {present && <Present title={formatRef(r)} text={text} background={background} onClose={() => setPresent(false)} />}
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
      <ol>{QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ol>
      {withNotes && notes.length > 0 && (<><h3>My notes</h3><ul>{notes.map((n) => <li key={n.id}><strong>{n.title || 'Note'}</strong>: {n.body.slice(0, 400)}</li>)}</ul></>)}
      {background.length > 0 && (<><h3>Sources</h3><ol className="small">{background.map((i) => <li key={i.id}>{cite(i)}</li>)}</ol></>)}
    </section>
  );
}
