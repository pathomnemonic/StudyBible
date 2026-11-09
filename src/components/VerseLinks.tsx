import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { KIND_ICON, KIND_LABEL, getChapterLinks, getVerseLinks, type LinkResult } from '../lib/verseLinks';
import type { Scheme } from '../lib/types';

const NONE: LinkResult = { items: [], more: 0, total: 0, notes: [] };
const SHOWN = 3;

/** Loads the links for a verse (or, with no verse, the whole chapter). `null` while loading. */
export function useVerseLinks(book: string, chapter: number, verse?: number, scheme?: Scheme): LinkResult | null {
  const [res, setRes] = useState<{ key: string; r: LinkResult } | null>(null);
  const key = `${book}.${chapter}.${verse ?? ''}.${scheme ?? ''}`;
  useEffect(() => {
    let live = true;
    (verse === undefined ? getChapterLinks(book, chapter, scheme) : getVerseLinks(book, chapter, verse, scheme))
      .then((r) => live && setRes({ key, r }))
      .catch(() => live && setRes({ key, r: NONE }));
    return () => { live = false; };
  }, [key, book, chapter, verse, scheme]);
  return res && res.key === key ? res.r : null;
}

/** Number of things in the app about this verse, for a badge. 0 while loading or when there are none. */
export function useVerseLinkCount(book: string, chapter: number, verse?: number, scheme?: Scheme): number {
  return useVerseLinks(book, chapter, verse, scheme)?.total ?? 0;
}

/** A compact "More in this app" card. Renders nothing when there is nothing to show. */
export default function VerseLinks({ book, chapter, verse, scheme }: { book: string; chapter: number; verse?: number; scheme?: Scheme }) {
  const res = useVerseLinks(book, chapter, verse, scheme);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [book, chapter, verse]);
  if (!res || res.items.length === 0) return null;
  const shown = open ? res.items : res.items.slice(0, SHOWN);
  const hidden = res.items.length - shown.length;
  return (
    <section className="vl-card" aria-label="More in this app">
      <h3 className="vl-h">More in this app</h3>
      {res.notes.map((n) => (
        <p key={n.topic ?? n.text} className="vl-note small">{n.topic && <strong>{n.topic}. </strong>}{n.text}</p>
      ))}
      <ul className="vl-list">
        {shown.map((it) => (
          <li key={`${it.kind}:${it.id}`}>
            <Link className="vl-item" to={it.route}>
              <span className="vl-kind"><span aria-hidden="true">{KIND_ICON[it.kind]}</span> {KIND_LABEL[it.kind]}</span>
              <span className="vl-title">{it.title}</span>
              {it.why && <span className="vl-why small muted">{it.why}</span>}
            </Link>
          </li>
        ))}
      </ul>
      {(hidden > 0 || open) && (
        <button type="button" className="btn small ghost vl-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Show fewer' : `Show ${hidden} more`}
        </button>
      )}
      {open && res.more > 0 && <p className="small muted vl-more">{res.more} more connect to this {verse === undefined ? 'chapter' : 'verse'}.</p>}
    </section>
  );
}
