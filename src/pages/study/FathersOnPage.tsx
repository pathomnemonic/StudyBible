import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { providers, type StudyItem } from '../../study/providers';
import { parseRefId, parseRefs, formatRef, refId } from '../../lib/refs';

const clip = (t: string, n = 420) => (t.length > n ? `${t.slice(0, n).replace(/\s+\S*$/, '')}…` : t);

/** What several Fathers said on the same passage, one card each, side by side. */
export default function FathersOnPage() {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('ref') ?? 'JHN.6.51';
  const [text, setText] = useState(raw.includes('.') ? (() => { const r = parseRefId(raw); return r ? formatRef(r) : raw; })() : raw);
  const [items, setItems] = useState<StudyItem[] | null>(null);
  useEffect(() => {
    const r = raw.includes('.') ? parseRefId(raw) : (() => { const p = parseRefs(raw); return p.ok ? p.refs[0].ref : null; })();
    if (!r) { setItems([]); return; }
    let live = true;
    setItems(null);
    providers.fathers([r]).then((l) => live && setItems(l)).catch(() => live && setItems([]));
    return () => { live = false; };
  }, [raw]);
  // one card per Father, the nearest passage first
  const byAuthor = new Map<string, StudyItem[]>();
  for (const it of items ?? []) { const k = it.author ?? it.title; byAuthor.set(k, [...(byAuthor.get(k) ?? []), it]); }
  const go = (e: React.FormEvent) => { e.preventDefault(); const p = parseRefs(text); if (p.ok) setSp({ ref: refId(p.refs[0].ref) }); };
  return (
    <div className="page fathers-on">
      <h1>The Fathers on a passage</h1>
      <form className="rowform" onSubmit={go} role="search">
        <label className="sr-only" htmlFor="fo-ref">Passage</label>
        <input id="fo-ref" value={text} onChange={(e) => setText(e.target.value)} placeholder="John 6:51" />
        <button className="btn primary" type="submit">Show</button>
      </form>
      {items === null && <div className="center-note">Reading the Fathers…</div>}
      {items && items.length === 0 && <p className="muted">No Father in the library speaks to this passage yet. Try a nearby verse or a whole chapter.</p>}
      <div className="fo-cols">
        {[...byAuthor.entries()].slice(0, 8).map(([author, list]) => (
          <section key={author} className="card fo-card">
            <h2 className="eyebrow-h">{author}</h2>
            <p>{clip(list[0].fullExcerpt ?? list[0].excerpt ?? '')}</p>
            {list[0].internal && <Link className="chip" to={list[0].internal}>Read in context</Link>}
            {list.length > 1 && <span className="muted small"> · {list.length - 1} more</span>}
          </section>
        ))}
      </div>
    </div>
  );
}
