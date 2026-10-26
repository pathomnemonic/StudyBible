import { useEffect, useState } from 'react';
import { setShelf, STATUS_LABEL, STATUSES, useShelf } from '../lib/shelf';

/** Goodreads-style details for one work: which shelf, a star rating, and a private note. */
export default function ShelfControl({ workId, total }: { workId: string; total: number }) {
  const shelf = useShelf().get(workId);
  const [review, setReview] = useState(shelf?.review ?? '');
  useEffect(() => setReview(shelf?.review ?? ''), [shelf?.review, workId]);
  const status = shelf?.status;
  const fmt = (t?: number) => (t ? new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');
  return (
    <section className="shelf-control" aria-label="Your shelf for this work">
      <h2 className="eyebrow-h">Your shelf</h2>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Reading status">
        {STATUSES.map((s) => (
          <button key={s} className="btn small" aria-pressed={status === s} onClick={() => setShelf(workId, { status: s })}>{STATUS_LABEL[s]}</button>
        ))}
        {status && <button className="btn small ghost" onClick={() => setShelf(workId, { clear: true })}>Mark not started</button>}
      </div>
      <p className="muted small" style={{ margin: '6px 0' }}>
        {status ? STATUS_LABEL[status] : STATUS_LABEL.none}
        {shelf?.startedAt ? ` · started ${fmt(shelf.startedAt)}` : ''}
        {shelf?.finishedAt ? ` · finished ${fmt(shelf.finishedAt)}` : ''}
        {shelf?.seen?.length ? ` · ${shelf.seen.length} of ${total} sections opened` : ''}
      </p>
      {(shelf?.seen?.length || shelf?.section !== undefined && shelf.section !== '0') && <button className="linklike small" onClick={() => setShelf(workId, { section: '0', seen: [] })}>Forget my place in this work</button>}
      <div role="radiogroup" aria-label="Your rating" className="stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={shelf?.rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={`star${(shelf?.rating ?? 0) >= n ? ' on' : ''}`} onClick={() => setShelf(workId, { rating: shelf?.rating === n ? undefined : n })}>★</button>
        ))}
      </div>
      <textarea value={review} onChange={(e) => setReview(e.target.value)} onBlur={() => review !== (shelf?.review ?? '') && setShelf(workId, { review })} placeholder="Your thoughts on this book (private)" rows={3} aria-label="Your thoughts on this book" style={{ width: '100%', marginTop: 6 }} />
    </section>
  );
}
