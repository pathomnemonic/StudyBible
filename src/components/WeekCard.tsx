import { countsAsRead } from '../lib/finished';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

/** A quiet look back at the last seven days. Nothing is shown until there is something to say. */
export default function WeekCard() {
  const since = Date.now() - 7 * 86400000;
  const s = useLiveQuery(async () => {
    const hist = await db.history.where('ts').above(since).toArray();
    const chapters = new Set(hist.filter(countsAsRead).map((h) => h.ref.split(/[:\-–]/)[0]));
    const notes = await db.notes.where('createdAt').above(since).count().catch(() => 0);
    const works = new Set(hist.filter((h) => h.type === 'work').map((h) => h.label)).size;
    const days = new Set(hist.map((h) => new Date(h.ts).toDateString())).size;
    return { chapters: chapters.size, notes, works, days };
  }, []);
  if (!s || (!s.chapters && !s.notes && !s.works)) return null;
  const bits = [
    s.chapters ? `read ${s.chapters} chapter${s.chapters === 1 ? '' : 's'}` : '',
    s.works ? `opened ${s.works} work${s.works === 1 ? '' : 's'} in the reading room` : '',
    s.notes ? `wrote ${s.notes} note${s.notes === 1 ? '' : 's'}` : '',
  ].filter(Boolean);
  return (
    <section className="week-card" aria-label="Your week">
      <strong>Your week</strong>
      <p>On {s.days} of the last 7 days you {bits.join(', ').replace(/, ([^,]*)$/, ' and $1')}.</p>
    </section>
  );
}
