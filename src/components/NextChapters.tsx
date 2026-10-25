import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChapterText from './ChapterText';
import { getBookText } from '../data/loader';
import { adjacentBook, getBook } from '../lib/canon';
import { jesusWords, type RedRanges } from '../study/jesusWords';
import { updateSettings } from '../lib/store';
import type { ChapterData } from '../lib/types';

interface Loaded { book: string; chapter: number; data: ChapterData; red: RedRanges | null }
const NONE = new Set<number>();
const NO_DECOR = new Map();

/**
 * Infinite scroll: the chapters that follow the one on the page are added as the end comes into view, so there is no button to press
 * between chapters. Tapping a verse opens that chapter for study. The place you have scrolled to is remembered for "continue reading".
 */
export default function NextChapters({ editionId, chapters, lang, book, chapter, wordFx, redLetters }: { editionId: string; chapters: Record<string, number>; lang: string; book: string; chapter: number; wordFx: boolean; redLetters: boolean }) {
  const [list, setList] = useState<Loaded[]>([]);
  const [done, setDone] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const nav = useNavigate();
  const last = list[list.length - 1] ?? { book, chapter };

  useEffect(() => { setList([]); setDone(false); }, [editionId, book, chapter]);

  const more = async () => {
    if (busy.current || done) return;
    busy.current = true;
    try {
      let b = last.book, c = last.chapter + 1;
      if (c > (chapters[b] ?? 0)) { const nb = adjacentBook(b, 1); if (!nb) { setDone(true); return; } b = nb.id; c = 1; }
      const d = await getBookText(editionId, b);
      const ch = d.chapters[c - 1];
      if (!ch) { setDone(true); return; }
      const red = redLetters ? await jesusWords(editionId, b, c).catch(() => null) : null;
      setList((l) => [...l, { book: b, chapter: c, data: ch, red }]);
    } catch { setDone(true); } finally { busy.current = false; }
  };

  useEffect(() => {
    const el = end.current;
    if (!el || done || list.length >= 60) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) void more(); }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  });

  // remember how far the reader has scrolled
  useEffect(() => {
    if (!list.length) return;
    const heads = [...document.querySelectorAll<HTMLElement>('[data-nc]')];
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting && e.boundingClientRect.top < window.innerHeight * 0.5) {
        const [b, c] = (e.target as HTMLElement).dataset.nc!.split('.');
        updateSettings({ last: { edition: editionId, book: b, chapter: +c } });
      }
    }, { threshold: 0, rootMargin: '0px 0px -50% 0px' });
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [list.length, editionId]);

  return (
    <div className="next-chapters">
      {list.map((l) => (
        <section key={`${l.book}.${l.chapter}`} className="more-chapter" aria-label={`${getBook(l.book).name} ${l.chapter}`}>
          <h2 className="chapter-title" data-nc={`${l.book}.${l.chapter}`}>{l.book === 'PSA' ? `Psalm ${l.chapter}` : `${getBook(l.book).name} ${l.chapter}`}</h2>
          <ChapterText chapter={l.data} selected={NONE} decor={NO_DECOR} lang={lang} wordFx={wordFx} red={l.red} onVerse={(n) => nav(`/read/${editionId}/${l.book}/${l.chapter}?v=${n}`)} />
        </section>
      ))}
      <div ref={end} className="nc-end" aria-hidden="true">{done ? 'End of the Bible' : ''}</div>
    </div>
  );
}
