import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { passageText } from '../lib/bibleText';
import { formatRef, parseRefId } from '../lib/refs';
import { readerPath } from '../lib/nav';

const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);

/** One of your own highlights, a different one each day, so what you marked comes back to you. Nothing shows until you have highlighted something. */
export default function HighlightOfDay() {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const edition = get(s.defaultEdition) ?? editions[0];
  const hs = useLiveQuery(() => db.highlights.toArray(), []);
  const [text, setText] = useState('');
  const pick = hs && hs.length ? [...hs].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))[dayIndex() % hs.length] : null;
  const ref = pick ? parseRefId(pick.ref) : null;
  useEffect(() => {
    setText('');
    if (!ref || !edition) return;
    let live = true;
    passageText(edition, ref, 4).then((v) => live && setText(v.map((x) => x.text).join(' ')));
    return () => { live = false; };
  }, [pick?.id, edition?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!pick || !ref || !edition || !text) return null;
  return (
    <figure className="card hl-day" style={{ borderLeft: `6px solid var(--hl-${pick.color})` }}>
      <p className="eyebrow">You marked this</p>
      <blockquote>{text.length > 260 ? `${text.slice(0, 260).replace(/\s+\S*$/, '')}…` : text}</blockquote>
      <figcaption><Link to={readerPath(edition, ref)}>{formatRef(ref)}</Link></figcaption>
    </figure>
  );
}
