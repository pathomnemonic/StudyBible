import { Fragment } from 'react';
import type { ChapterData } from '../lib/types';
import type { HighlightColor } from '../db/db';
import type { TermMatcher } from '../study/terms';
import type { InlineFig } from '../study/inlineArt';
import { findFx } from '../study/wordfx';

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
  /** paintings of the scene, shown after the given native verse */
  figures?: Map<number, InlineFig[]>;
  /** the ordinary footnotes (alternate readings, textual notes) by verse; shown as a coloured number that opens them */
  stdNotes?: Map<number, string[]>;
  onStdNote?: (n: number, el: HTMLElement) => void;
  /** words that act out their meaning (fire flickers, water ripples) */
  wordFx?: boolean;
}

/** Renders one chapter with paragraph/poetry structure preserved and every verse individually selectable. */
export default function ChapterText({ chapter, selected, decor, onVerse, lang, density, onMarker, terms, onTerm, figures, stdNotes, onStdNote, wordFx }: Props) {
  const fx = (text: string): React.ReactNode => {
    if (!wordFx || lang !== 'en') return text;
    const hits = findFx(text);
    if (!hits.length) return text;
    const out: React.ReactNode[] = [];
    let at = 0;
    hits.forEach((h, k) => {
      if (h.start > at) out.push(text.slice(at, h.start));
      out.push(<span key={k} className={`fx fx-${h.kind}`}>{text.slice(h.start, h.end)}</span>);
      at = h.end;
    });
    if (at < text.length) out.push(text.slice(at));
    return out;
  };
  const withTerms = (text: string): React.ReactNode => {
    if (!terms) return fx(text);
    const hits = terms.find(text);
    if (!hits.length) return fx(text);
    const out: React.ReactNode[] = [];
    let at = 0;
    hits.forEach((h, k) => {
      if (h.start > at) out.push(fx(text.slice(at, h.start)));
      out.push(
        <span key={k} className="term" role="button" tabIndex={0} data-term={h.id} onClick={(e) => { e.stopPropagation(); onTerm?.(h.id, e.currentTarget); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onTerm?.(h.id, e.currentTarget); } }}>{text.slice(h.start, h.end)}</span>,
      );
      at = h.end;
    });
    if (at < text.length) out.push(fx(text.slice(at)));
    return out;
  };
  let cur = 0;
  const seenNumber = new Set<number>();
  const notes = stdNotes ? {} : chapter.notes ?? {};
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
        const inBlock = new Set<number>();
        const content = runs.map(([v, text], j) => {
          if (v > 0) cur = v;
          const n = cur;
          if (n) inBlock.add(n);
          if (!n) return <Fragment key={j}>{text}</Fragment>;
          const d = decor.get(n);
          const showNum = v > 0 && !seenNumber.has(n);
          if (v > 0) seenNumber.add(n);
          const cls = ['v', selected.has(n) ? 'selected' : '', d?.highlight ? `hl-${d.highlight}` : ''].filter(Boolean).join(' ');
          const fnotes = notes[n];
          const lastRunOfVerse = j === lastIdx || runs[j + 1][0] > 0;
          // Sparkling key words are buttons of their own, so they sit beside the verse's text rather than inside it
          // (a button may not contain another button); every piece of the verse selects the same verse.
          const hits = terms ? terms.find(text) : [];
          const pieces: ({ t: 'text'; from: number; to: number } | { t: 'term'; from: number; to: number; id: string })[] = [];
          let at = 0;
          for (const h of hits) {
            if (h.start > at) pieces.push({ t: 'text', from: at, to: h.start });
            pieces.push({ t: 'term', from: h.start, to: h.end, id: h.id });
            at = h.end;
          }
          if (at < text.length || !pieces.length) pieces.push({ t: 'text', from: at, to: text.length });
          const lastTextIdx = pieces.map((p) => p.t).lastIndexOf('text');
          return (
            <Fragment key={j}>
              {pieces.map((pc, k) => pc.t === 'term' ? (
                <span key={k} className="term" role="button" tabIndex={0} data-term={pc.id} onClick={(e) => { e.stopPropagation(); onTerm?.(pc.id, e.currentTarget); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onTerm?.(pc.id, e.currentTarget); } }}>{text.slice(pc.from, pc.to)}</span>
              ) : (
                <span
                  key={k}
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
                  {showNum && k === 0 && <sup className="vn">{n}</sup>}
                  {fx(text.slice(pc.from, pc.to))}
                  {k === lastTextIdx && lastRunOfVerse && d?.note && <span className="mark" title="You have a note here">✎</span>}
                  {k === lastTextIdx && lastRunOfVerse && d?.bookmark && <span className="mark" title="Bookmarked">⚑</span>}
                  {k === lastTextIdx && lastRunOfVerse && fnotes && fnotes.map((f, q) => (
                    <span key={q} className="fn" title={f} aria-label={`Footnote: ${f}`}>†</span>
                  ))}
                </span>
              ))}
              {lastRunOfVerse && !!stdNotes?.get(n)?.length && (
                <button
                  className="rm rm-std"
                  title="Note on the text: an alternate reading or a variant in the manuscripts"
                  aria-label={`${stdNotes.get(n)!.length} note${stdNotes.get(n)!.length === 1 ? '' : 's'} on the text for verse ${n}`}
                  onClick={(e) => onStdNote?.(n, e.currentTarget)}
                >
                  {stdNotes.get(n)!.length}
                </button>
              )}
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
        // a picture follows the paragraph that contains the last verse of its scene
        const figs = figures ? [...inBlock].flatMap((vn) => figures.get(vn) ?? []) : [];
        return (
          <Fragment key={i}>
            <div className={`blk ${kind}`}>
              {content}
            </div>
            {figs.map((f) => (
              <figure key={f.id} className="inline-art">
                <a href={f.page} target="_blank" rel="noreferrer"><img src={`${import.meta.env.BASE_URL}${f.file}`} alt={`${f.title}, ${f.artist}`} loading="lazy" /></a>
                <figcaption>{f.title}{f.artist ? `, ${f.artist}` : ''}{f.date ? `, ${f.date}` : ''}. {f.credit}{f.credit.includes('Museum') || f.credit.includes('public domain') || f.credit.includes('CC0') ? '' : '. The Metropolitan Museum of Art (public domain)'}.</figcaption>
              </figure>
            ))}
          </Fragment>
        );
      })}
    </div>
  );
}
