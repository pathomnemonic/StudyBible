import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { useActivePlan } from '../lib/activePlan';
import { useBiay } from '../data/biay';
import { usePlayer } from '../data/PlayerContext';
import { countsAsRead } from '../lib/finished';
import { formatRef, parseRefId } from '../lib/refs';
import { readerPath } from '../lib/nav';
import { rangesOverlap } from '../db/ops';
import Icon from './Icon';
import PlanPicker from './PlanPicker';

/** The chapters (book.chapter keys) a plan day covers. */
const chaptersOf = (refs: string[]) => refs.flatMap((id) => { const r = parseRefId(id); return r ? Array.from({ length: Math.min(40, r.c2 - r.c1 + 1) }, (_, i) => `${r.book}.${r.c1 + i}`) : []; });

/**
 * One slim bar above the chapter: your reading plan (today's passage, a tick that is set for you once you have finished its chapters) and a
 * Listen button when Fr. Mike's Bible in a Year episode covers this chapter. Nothing shows if you have neither.
 */
export default function ReadingBar({ book, chapters }: { book: string; chapters: number[] }) {
  const ap = useActivePlan();
  const { get, editions } = useEditions();
  const { biay } = useBiay();
  const player = usePlayer();
  const [pick, setPick] = useState(false);
  const [s] = useSettings();
  const edition = get(s.defaultEdition) ?? editions[0];
  const since = ap?.startedAt ?? 0;
  const finished = useLiveQuery(async () => new Set((await db.history.where('ts').aboveOrEqual(since).toArray()).filter(countsAsRead).map((r) => r.ref)), [since]);
  const nextKeys = ap?.next ? chaptersOf(ap.next.refs) : [];
  const complete = !!ap?.next && nextKeys.length > 0 && !!finished && nextKeys.every((k) => finished.has(k));
  useEffect(() => { if (ap && complete) void ap.markDone(ap.nextIdx); }, [complete, ap?.nextIdx]);

  const ep = biay
    ? [...biay.dayEpisode.values()]
        .filter((e) => e.audio && e.passages.some((p) => { const r = parseRefId(p); return r && chapters.some((c) => rangesOverlap(r, { book, c1: c, c2: c })); }))
        .sort((a, b) => (a.day ?? 0) - (b.day ?? 0))[0]
    : undefined;
  if (!edition || (!ap && !ep)) return null;

  const refs = (ap?.next?.refs ?? []).map((id) => parseRefId(id)).filter(Boolean) as NonNullable<ReturnType<typeof parseRefId>>[];
  const here = refs.some((r) => r.book === book && chapters.some((c) => c >= r.c1 && c <= r.c2));
  const behind = ap ? ap.todayIdx - ap.nextIdx : 0;
  return (
    <div className="reading-bar" role="region" aria-label="Your reading plan and listening">
      {ep && (
        <button className="btn small primary rb-listen" onClick={() => void player.play(ep)} title={`Bible in a Year, day ${ep.day}: ${ep.short || ep.title}`}>
          <Icon name="play" size={14} /> Listen{ep.duration ? ` · ${Math.round(ep.duration / 60)} min` : ''}
        </button>
      )}
      {ap && !ap.finished && (
        <div className="rb-plan">
          <span className="rb-label">{ap.plan.name.replace(/^The whole /, '').replace(/ \(.*\)$/, '')} · day {ap.nextIdx + 1}/{ap.plan.days.length}{behind > 0 ? ` · ${behind} behind` : ''}</span>
          <span className="rb-refs">
            {refs.map((r) => <Link key={formatRef(r)} className="chip" to={readerPath(edition, r)} aria-current={here ? 'true' : undefined}>{formatRef(r, { abbr: true })}</Link>)}
            {refs.length === 0 && <span className="muted small">{ap.next?.note ?? ap.next?.title ?? ''}</span>}
          </span>
        </div>
      )}
      {ap && ap.finished && <span className="rb-label">You have finished {ap.plan.name}. <button className="rb-change" onClick={() => setPick(true)}>Choose another</button></span>}
      {ap && !ap.finished && (
        <span className="rb-acts">
          <button className="btn small icon" onClick={() => void ap.markDone(ap.nextIdx)} title="Check off today’s reading" aria-label="Mark today’s reading done">✓</button>
          <button className="rb-change" onClick={() => setPick(true)} title="Switch your reading plan">Switch plan</button>
        </span>
      )}
      {pick && <PlanPicker onClose={() => setPick(false)} />}
    </div>
  );
}
