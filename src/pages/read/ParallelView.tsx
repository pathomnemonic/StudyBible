import { useEffect, useState } from 'react';
import { anchorChapterText, type AnchorText } from '../../lib/bibleText';
import { formatRef } from '../../lib/refs';
import { getBook } from '../../lib/canon';
import { useSettings } from '../../lib/store';
import { bookAlignmentNote, chapterAlignmentNote, psalmDualLabel } from '../../lib/versification';

/** Two translations side by side, verse by verse, aligned on the shared (Vulgate-anchored) numbering. */
export default function ParallelView({
  book,
  anchorChapters,
  left,
  right,
  selected,
  onToggle,
  onPrev,
  onNext,
}: {
  book: string;
  anchorChapters: number[];
  left: import('../../data/loader').EditionRecord;
  right: import('../../data/loader').EditionRecord;
  selected: Set<number>;
  onToggle: (v: number, shift: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const c = anchorChapters[0];
  const [a, setA] = useState<AnchorText | null>(null);
  const [b, setB] = useState<AnchorText | null>(null);
  useEffect(() => {
    let live = true;
    setA(null);
    setB(null);
    anchorChapterText(left, book, c).then((x) => live && setA(x));
    anchorChapterText(right, book, c).then((x) => live && setB(x));
    return () => {
      live = false;
    };
  }, [left.id, right.id, book, c]);
  if (!a || !b) return <div className="center-note">Loading parallel text…</div>;
  const verses = [...new Set([...a.verses.keys(), ...b.verses.keys()])].sort((x, y) => x - y);
  const skip = new Set<number>();
  const cell = (side: AnchorText, v: number, name: string) => {
    const e = side.verses.get(v);
    if (!e) return <span className="muted missing" data-missing="1"><span aria-hidden="true">— </span><em>Not in {name}</em><span className="sr-only">: this verse has no counterpart in this translation&apos;s text</span></span>;
    return (
      <>
        <span className="vno">{e.native}</span>
        {e.text}
        {!e.exact && <div className="cave">{e.note ?? 'numbering differs'}</div>}
      </>
    );
  };
  const rows = verses.filter((v) => !skip.has(v));
  const ln = bookAlignmentNote(left.scheme, book) ?? bookAlignmentNote(right.scheme, book);
  const chNotes = [...new Set([chapterAlignmentNote(left.scheme, book, c), chapterAlignmentNote(right.scheme, book, c)].filter((x): x is string => !!x && x !== ln))];
  const missing = rows.filter((v) => !a.verses.has(v) || !b.verses.has(v)).length;
  return (
    <div className="scripture" style={{ maxWidth: 'none' }}>
      <h1 className="chapter-title">
        {getBook(book).name} {c}
        {book === 'PSA' && psalmDualLabel(c) ? ` (Hebrew ${psalmDualLabel(c)})` : ''}
      </h1>
      <div className="subtitle">Rows are aligned by the app's stable verse identifiers (Vulgate anchor), so differing numbering stays side by side.</div>
      {ln && <div className="notice">{ln}</div>}
      {chNotes.map((n) => <div key={n} className="notice">{n}</div>)}
      {missing > 0 && <div className="notice" role="status">{missing} verse{missing === 1 ? ' is' : 's are'} in only one of these translations here; the other side says “Not in …” rather than leaving a gap.</div>}
      <table className="parallel">
        <thead>
          <tr>
            <th>{left.name}</th>
            <th>{right.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v} className={selected.has(v) ? 'selected' : ''} tabIndex={0} aria-selected={selected.has(v)} aria-label={`Verse ${v}. ${selected.has(v) ? 'Selected' : 'Press Enter to select'}`} onClick={(e) => onToggle(v, e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(v, e.shiftKey); } }} style={{ cursor: 'pointer' }}>
              <td lang={left.language}>{cell(a, v, left.shortName)}</td>
              <td lang={right.language}>{cell(b, v, right.shortName)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="chapter-nav">
        <button className="btn" onClick={onPrev}>← Previous</button>
        <button className="btn" onClick={onNext}>Next →</button>
      </div>
    </div>
  );
}
