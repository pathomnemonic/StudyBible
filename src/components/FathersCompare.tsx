import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MATCH_LABEL, type StudyItem } from '../study/providers';

const PERIOD: Record<string, string> = { apostolic: 'Apostolic age', patristic: 'Patristic (to about 750)', medieval: 'Medieval', 'early-modern': 'Early modern', modern: 'Modern', contemporary: 'Contemporary' };
/** How firmly the connection to this passage is established, in the app's own words. */
const DIRECT = new Set(['direct-citation', 'verse-by-verse', 'explicit-reference']);
const shortMatch = (m: string) => (MATCH_LABEL[m as keyof typeof MATCH_LABEL] ?? m).split(' — ')[0];

/** Fathers, saints and theologians on the selected passage, side by side. Pick any number of authors; each card names the work, where in it the text sits, the period, how the link to this passage was established, and a link to the original. */
export default function FathersCompare({ items }: { items: StudyItem[] }) {
  const real = useMemo(() => items.filter((i) => i.kind !== 'Search' && (i.author || i.title) && (i.excerpt || i.fullExcerpt)), [items]);
  const authors = useMemo(() => {
    const by = new Map<string, StudyItem[]>();
    for (const i of real) { const k = i.author ?? i.title; (by.get(k) ?? by.set(k, []).get(k)!).push(i); }
    return [...by.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  }, [real]);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const picked = chosen ?? authors.slice(0, 3).map(([a]) => a);
  if (!authors.length) return <p className="muted small">No author has commented on this passage in the library yet.</p>;
  const toggle = (a: string) => setChosen(picked.includes(a) ? picked.filter((x) => x !== a) : [...picked, a]);
  return (
    <div className="fathers-compare" role="group" aria-label="Authors compared side by side">
      <fieldset className="fc-pick">
        <legend className="small muted">Choose the authors to compare ({authors.length} on this passage)</legend>
        <div className="chips">
          {authors.slice(0, 40).map(([a, list]) => (
            <label key={a} className={`chip${picked.includes(a) ? ' sel' : ''}`}>
              <input type="checkbox" checked={picked.includes(a)} onChange={() => toggle(a)} className="sr-only" /> {a} <span className="muted small">{list.length}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {picked.length === 0 && <p className="muted small">Pick at least one author from the list.</p>}
      <div className="fc-cols">
        {authors.filter(([a]) => picked.includes(a)).map(([author, list]) => (
          <section key={author} className="card fc-col">
            <h4 className="by-author" style={{ marginTop: 0 }}>{author}</h4>
            {list.slice(0, 3).map((i) => {
              const direct = DIRECT.has(i.match);
              const read = i.ctx ? `/study/works/${i.ctx.work}/${i.ctx.section}` : i.internal ? i.internal.replace(/^#/, '') : null;
              return (
                <article key={i.id} className="fc-item">
                  <p className="small" style={{ margin: 0 }}><strong>{i.title}</strong></p>
                  <p className="small muted" style={{ margin: '2px 0' }}>
                    {i.sourceName}{i.ctx ? ` · section ${i.ctx.section + 1}, paragraph ${i.ctx.para + 1}` : ''}{i.period ? ` · ${PERIOD[i.period] ?? i.period}` : ''}{i.kind ? ` · ${i.kind}` : ''}
                  </p>
                  <p className="small" style={{ margin: '2px 0' }}><span className={`chip ${direct ? 'good' : 'warn'}`}>{direct ? 'Direct' : 'Editorial'}</span> {shortMatch(i.match)}</p>
                  <div className="ex clamp" lang={i.lang}>{i.excerpt ?? i.fullExcerpt}</div>
                  {i.basis && <p className="small muted" style={{ margin: '2px 0' }}>{i.basis}</p>}
                  <p className="small" style={{ margin: '2px 0 8px' }}>
                    {read ? <Link to={read}>Read in the original work</Link> : i.url ? <a href={i.url} target="_blank" rel="noreferrer">Open the source ↗</a> : null}
                  </p>
                </article>
              );
            })}
            {list.length > 3 && <p className="muted small">and {list.length - 3} more by {author}</p>}
          </section>
        ))}
      </div>
      <p className="muted small">Words from the original works, shown as the library has them. Two authors appearing together does not mean they agree, and “Editorial” links are suggestions, not citations.</p>
    </div>
  );
}
