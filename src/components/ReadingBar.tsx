import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { useActivePlan } from '../lib/activePlan';
import { useBiay } from '../data/biay';
import { usePlayer } from '../data/PlayerContext';
import { countsAsRead } from '../lib/finished';
import { parseRefId } from '../lib/refs';
import { rangesOverlap } from '../db/ops';
import Icon from './Icon';

/** The chapters (book.chapter keys) a plan day covers. */
const chaptersOf = (refs: string[]) => refs.flatMap((id) => { const r = parseRefId(id); return r ? Array.from({ length: Math.min(40, r.c2 - r.c1 + 1) }, (_, i) => `${r.book}.${r.c1 + i}`) : []; });

/**
 * One slim bar above the chapter: a Listen button for the Bible in a Year episode that covers this chapter, wherever you are in the plan.
 * Finishing a plan day's chapters still ticks it off quietly. Your place in the plan is in the reader's menu.
 */
export default function ReadingBar({ book, chapters }: { book: string; chapters: number[] }) {
  const ap = useActivePlan();
  const { get, editions } = useEditions();
  const { biay } = useBiay();
  const player = usePlayer();
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
  if (!edition || !ep) return null;
  return (
    <div className="reading-bar" role="region" aria-label="Listen to this chapter">
      <button className="btn small primary rb-listen" onClick={() => void player.play(ep)} title={`Bible in a Year, day ${ep.day}: ${ep.short || ep.title}`}>
        <Icon name="play" size={14} /> Listen · Day {ep.day}{ep.duration ? ` · ${Math.round(ep.duration / 60)} min` : ''}
      </button>
      <span className="rb-label">Bible in a Year: {ep.short || ep.title}</span>
    </div>
  );
}
