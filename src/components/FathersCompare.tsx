import type { StudyItem } from '../study/providers';

/** The Fathers and saints who comment on a passage, side by side: one column per author. */
export default function FathersCompare({ items }: { items: StudyItem[] }) {
  const real = items.filter((i) => i.kind !== 'Search' && (i.author || i.title));
  const by = new Map<string, StudyItem[]>();
  for (const i of real) {
    const k = i.author ?? i.title;
    (by.get(k) ?? by.set(k, []).get(k)!).push(i);
  }
  const cols = [...by.entries()].sort((a, b) => b[1].length - a[1].length);
  if (!cols.length) return <p className="muted small">No author has commented on this passage in the library yet.</p>;
  return (
    <div className="fathers-compare" role="group" aria-label="Authors compared side by side">
      {cols.map(([author, list]) => (
        <section key={author} className="card">
          <h4 className="by-author" style={{ marginTop: 0 }}>{author}</h4>
          {list.slice(0, 3).map((i) => (
            <div key={i.id} style={{ marginBottom: 8 }}>
              <div className="small"><strong>{i.title}</strong></div>
              {i.excerpt && <div className="ex clamp" lang={i.lang}>{i.excerpt}</div>}
              {i.url ? <a className="small" href={i.url} target="_blank" rel="noreferrer">Source ↗</a> : i.internal ? <a className="small" href={`#${i.internal}`}>Open</a> : null}
            </div>
          ))}
          {list.length > 3 && <p className="muted small">and {list.length - 3} more</p>}
        </section>
      ))}
    </div>
  );
}
