import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { useActivePlan } from '../lib/activePlan';
import { countsAsRead } from '../lib/finished';
import { formatRef, parseRefId } from '../lib/refs';
import { readerPath } from '../lib/nav';

/** The chapters (book.chapter keys) a plan day covers. */
const chaptersOf = (refs: string[]) => refs.flatMap((id) => { const r = parseRefId(id); return r ? Array.from({ length: Math.min(40, r.c2 - r.c1 + 1) }, (_, i) => `${r.book}.${r.c1 + i}`) : []; });

/**
 * "Your plan" at the top of the reader: today's passage, a jump to it, and a tick that is set for you once you have finished its chapters.
 * It shows where you are in the plan wherever you are reading, so the next passage is one tap away.
 */
export default function PlanStrip({ book, chapters }: { book: string; chapters: number[] }) {
  const ap = useActivePlan();
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const edition = get(s.defaultEdition) ?? editions[0];
  const since = ap?.startedAt ?? 0;
  const finished = useLiveQuery(async () => new Set((await db.history.where('ts').aboveOrEqual(since).toArray()).filter(countsAsRead).map((r) => r.ref)), [since]);
  const nextKeys = ap?.next ? chaptersOf(ap.next.refs) : [];
  const complete = !!ap?.next && nextKeys.length > 0 && !!finished && nextKeys.every((k) => finished.has(k));
  useEffect(() => { if (ap && complete) void ap.markDone(ap.nextIdx); }, [complete, ap?.nextIdx]);
  if (!ap || !edition) return null;
  if (ap.finished) return <div className="plan-strip card small" role="status">You have finished <strong>{ap.plan.name}</strong>. <Link to="/pray/plans">Choose another plan</Link></div>;
  const refs = (ap.next?.refs ?? []).map((id) => parseRefId(id)).filter(Boolean) as NonNullable<ReturnType<typeof parseRefId>>[];
  const here = refs.some((r) => r.book === book && chapters.some((c) => c >= r.c1 && c <= r.c2));
  const behind = ap.todayIdx - ap.nextIdx;
  return (
    <div className="plan-strip card" role="region" aria-label="Your reading plan">
      <div className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{ap.plan.name} · day {ap.nextIdx + 1} of {ap.plan.days.length}{behind > 0 ? ` · ${behind} behind` : ''}</div>
          <div className="chips" style={{ marginTop: 4 }}>
            {refs.map((r) => <Link key={formatRef(r)} className="chip" to={readerPath(edition, r)}>{formatRef(r, { abbr: true })}</Link>)}
            {refs.length === 0 && <span className="muted small">{ap.next?.note ?? ap.next?.title ?? 'No passage listed'}</span>}
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {refs[0] && !here && <Link className="btn small primary" to={readerPath(edition, refs[0])}>Go to today’s reading</Link>}
          {here && <span className="chip sel">you are in it</span>}
          <button className="btn small" onClick={() => void ap.markDone(ap.nextIdx)} title="Check off this day without reading it here">Done ✓</button>
          <Link className="btn small" to="/pray/plans" title="Change or pause your plan">Change plan</Link>
        </div>
      </div>
    </div>
  );
}
