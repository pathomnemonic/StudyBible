import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { passageText } from '../lib/bibleText';
import { formatRef, type Ref } from '../lib/refs';
import { readerPath } from '../lib/nav';

/** A passage printed in full in the reader's own translation, with a link on to the reader and study panel. */
export default function ReadingBlock({ refs, label, text, max = 60 }: { refs: Ref[]; label: string; text: string; max?: number }) {
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const edition = get(s.defaultEdition) ?? editions[0];
  const [verses, setVerses] = useState<{ v: number; c: number; text: string }[] | null>(null);
  const key = refs.map((r) => `${r.book}${r.c1}.${r.v1}-${r.c2}.${r.v2}`).join();
  useEffect(() => {
    if (!edition) return;
    let live = true;
    Promise.all(refs.map((r) => passageText(edition, r, max))).then((all) => live && setVerses(all.flat()));
    return () => { live = false; };
  }, [key, edition?.id]);
  const first = refs[0];
  return (
    <section className="reading-block">
      <div className="eyebrow">{label}</div>
      <h3>{text}</h3>
      {verses === null && <p className="muted">Loading…</p>}
      {verses && !verses.length && <p className="muted">This passage is not in {edition?.name ?? 'this translation'}.</p>}
      {verses && verses.length > 0 && (
        <p className="scripture reading-text">
          {verses.map((v) => <span key={`${v.c}.${v.v}`}><sup>{v.v}</sup>{v.text} </span>)}
        </p>
      )}
      {first && edition && <Link className="small" to={readerPath(edition, first)}>Open in the reader{refs.length > 1 ? ` (${formatRef(first, { abbr: true })})` : ''} →</Link>}
    </section>
  );
}
