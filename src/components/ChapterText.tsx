import { Fragment } from 'react';
import type { ChapterData } from '../lib/types';
import type { HighlightColor } from '../db/db';
import type { TermMatcher } from '../study/terms';

export interface VerseDecor {
  highlight?: HighlightColor;
  note?: boolean;
  bookmark?: boolean;
}

interface Props {
  chapter: ChapterData;
  selected: Set<number>;
  decor: Map<number, VerseDecor>;
  onVerse: (n: number, e: React.MouseEvent | React.KeyboardEvent, openMenu?: boolean) => void;
  lang?: string;
  /** number of connected resources per native verse; click opens the study panel */
  density?: Map<number, number>;
  onMarker?: (n: number) => void;
  /** key words and phrases that sparkle; a click opens a note about the term */
  terms?: TermMatcher | null;
  onTerm?: (id: string, el: HTMLElement) => void;
}

/** Renders one chapter with paragraph/poetry structure preserved and every verse individually selectable. */
export default function ChapterText({ chapter, selected, decor, onVerse, lang, density, onMarker, terms, onTerm }: Props) {
  const withTerms = (text: string) => {
    if (!terms) return text;
    const hits = terms.find(text);
    if (!hits.length) return text;
    const out: React.ReactNode[] = [];
    let at = 0;
    hits.forEach((h, k) => {
      if (h.start > at) out.push(text.slice(at, h.start));
      out.push(
        <span key={k} className="term" role="button" tabIndex={0} data-term={h.id} onClick={(e) => { e.stopPropagation(); onTerm?.(h.id, e.currentTarget); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onTerm?.(h.id, e.currentTarget); } }}>{text.slice(h.start, h.end)}</span>,
      );
      at = h.end;
    });
    if (at < text.length) out.push(text.slice(at));
    return out;
  };
  let cur = 0;
  const seenNumber = new Set<number>();
  const notes = chapter.notes ?? {};
  return (
    <div lang={lang}>
      {chapter.blocks.map((b, i) => {
        const kind = b[0];
        if (typeof b[1] === 'string') {
          if (kind === 'd') return <p key={i} className="psalm-title">{b[1]}</p>;
          return <div key={i} className="head" role="heading" aria-level={3}>{b[1]}</div>;
        }
        if (kind === 'b') return <div key={i} className="blk b" />;
        const runs = b[1];
        const lastIdx = runs.length - 1;
        const content = runs.map(([v, text], j) => {
          if (v > 0) cur = v;
          const n = cur;
          if (!n) return <Fragment key={j}>{text}</Fragment>;
          const d = decor.get(n);
          const showNum = v > 0 && !seenNumber.has(n);
          if (v > 0) seenNumber.add(n);
          const cls = ['v', selected.has(n) ? 'selected' : '', d?.highlight ? `hl-${d.highlight}` : ''].filter(Boolean).join(' ');
          const fnotes = notes[n];
          const lastRunOfVerse = j === lastIdx || runs[j + 1][0] > 0;
          return (
            <Fragment key={j}>
              <span
                className={cls}
                data-v={n}
                role="button"
                tabIndex={0}
                aria-pressed={selected.has(n)}
                aria-description={[d?.highlight ? 'highlighted' : '', d?.note ? 'has a note' : '', d?.bookmark ? 'bookmarked' : ''].filter(Boolean).join(', ') || undefined}
                onClick={(e) => onVerse(n, e)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onVerse(n, e, true);
                }}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onVerse(n, e))}
              >
                {showNum && <sup className="vn">{n}</sup>}
                {withTerms(text)}
                {lastRunOfVerse && d?.note && <span className="mark" title="You have a note here">✎</span>}
                {lastRunOfVerse && d?.bookmark && <span className="mark" title="Bookmarked">⚑</span>}
                {lastRunOfVerse && fnotes && fnotes.map((f, k) => (
                  <span key={k} className="fn" title={f} aria-label={`Footnote: ${f}`}>†</span>
                ))}
              </span>
              {lastRunOfVerse && !!density?.get(n) && (
                <button
                  className="rm"
                  title={`${density.get(n)} connected resources: commentary, Fathers, Catechism, articles`}
                  aria-label={`${density.get(n)} connected resources for verse ${n}. Open study panel`}
                  onClick={() => onMarker?.(n)}
                >
                  {density.get(n)}
                </button>
              )}
              {j !== lastIdx && ' '}
            </Fragment>
          );
        });
        return (
          <div key={i} className={`blk ${kind}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
