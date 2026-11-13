import { useEffect, useState } from 'react';
import { anchorChapterText, type AnchorText } from '../../lib/bibleText';
import { formatRef } from '../../lib/refs';
import { getBook } from '../../lib/canon';
import { useSettings } from '../../lib/store';
import { bookAlignmentNote, psalmDualLabel } from '../../lib/versification';

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
  const cell = (side: AnchorText, v: number) => {
    const e = side.verses.get(v);
    if (!e) return <span className="muted">—</span>;
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
  return (
    <div className="scripture" style={{ maxWidth: 'none' }}>
      <h1 className="chapter-title">
        {getBook(book).name} {c}
        {book === 'PSA' && psalmDualLabel(c) ? ` (Hebrew ${psalmDualLabel(c)})` : ''}
      </h1>
      <div className="subtitle">Rows are aligned by the app's stable verse identifiers (Vulgate anchor), so differing numbering stays side by side.</div>
      {ln && <div className="notice">{ln}</div>}
      <table className="parallel">
        <thead>
          <tr>
            <th>{left.name}</th>
            <th>{right.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v} className={selected.has(v) ? 'selected' : ''} onClick={(e) => onToggle(v, e.shiftKey)} style={{ cursor: 'pointer' }}>
              <td lang={left.language}>{cell(a, v)}</td>
              <td lang={right.language}>{cell(b, v)}</td>
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
