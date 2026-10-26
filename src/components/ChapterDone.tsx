import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { countsAsRead, markChapterFinished, minDwellMs, unmarkChapterToday } from '../lib/finished';

/**
 * The end of a chapter: it counts as read when this end has come into view after a believable time on the page (only time the page was in
 * front of you and touched or scrolled counts), or when you tap the button. The button also lets you undo.
 */
export default function ChapterDone({ book, anchorChapter, label, words, onFinished }: { book: string; anchorChapter: number; label: string; words: number; onFinished?: () => void }) {
  const ref = `${book}.${anchorChapter}`;
  const end = useRef<HTMLDivElement>(null);
  const active = useRef(0);
  const endSeen = useRef(false);
  const [auto, setAuto] = useState(false);
  const todays = useLiveQuery(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return db.history.where('ts').aboveOrEqual(d.getTime()).filter((r) => countsAsRead(r) && r.ref === ref).count(); }, [ref]) ?? 0;
  const done = todays > 0;

  useEffect(() => {
    active.current = 0; endSeen.current = false; setAuto(false);
    let last = Date.now();
    let touched = Date.now();
    const poke = () => { touched = Date.now(); };
    const evs = ['scroll', 'pointerdown', 'keydown', 'wheel', 'touchmove'] as const;
    evs.forEach((e) => window.addEventListener(e, poke, { passive: true }));
    const need = minDwellMs(words);
    const tick = window.setInterval(() => {
      const now = Date.now();
      // time counts while the page is showing and was touched within the last minute
      if (document.visibilityState === 'visible' && now - touched < 60000) active.current += now - last;
      last = now;
      if (endSeen.current && active.current >= need) { window.clearInterval(tick); setAuto(true); }
    }, 1000);
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) endSeen.current = true; }, { threshold: 0.6 });
    if (end.current) io.observe(end.current);
    return () => { window.clearInterval(tick); io.disconnect(); evs.forEach((e) => window.removeEventListener(e, poke)); };
  }, [ref, words]);

  useEffect(() => { if (auto && !done) { void markChapterFinished(book, anchorChapter, label).then(() => onFinished?.()); } }, [auto]);

  return (
    <div ref={end} className="chapter-done row" style={{ justifyContent: 'center', margin: '18px 0 6px', gap: 8 }}>
      {done
        ? <><span className="chip sel" role="status">✓ Read</span><button className="linklike small" onClick={() => void unmarkChapterToday(book, anchorChapter)}>undo</button></>
        : <button className="btn" onClick={() => void markChapterFinished(book, anchorChapter, label).then(() => onFinished?.())}>Mark this chapter read</button>}
    </div>
  );
}
