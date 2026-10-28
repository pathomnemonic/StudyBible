import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ShareLinkButton from '../../components/ShareLinkButton';
import { GLOSSARY } from '../../data/glossary';

/** Terms of the faith in plain language, A to Z, each with the Catechism paragraph that treats it. */
export default function GlossaryPage() {
  const [sp] = useSearchParams();
  const [q, setQ] = useState('');
  const open = sp.get('t');
  const list = useMemo(() => {
    const f = q.trim().toLowerCase();
    return [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term)).filter((g) => !f || `${g.term} ${g.aliases.join(' ')} ${g.definition}`.toLowerCase().includes(f));
  }, [q]);
  return (
    <div className="page glossary">
      <h1>Glossary</h1>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a term" aria-label="Find a term" />
      <p className="muted small">{list.length} terms. Select a word anywhere in the app to see its meaning.</p>
      <ul className="list">
        {list.map((g) => (
          <li key={g.term} id={g.term} className={open === g.term ? 'glossary-open' : undefined}>
            <strong>{g.term}</strong>
            <p style={{ margin: '2px 0 4px' }}>{g.definition}</p>
            <Link className="chip" to={`/study/catechism/${g.ccc}`}>Catechism §{g.ccc}</Link> <ShareLinkButton path={`/s/term/${encodeURIComponent(g.term)}`} title={g.term} />
          </li>
        ))}
        {!list.length && <li className="empty">No matching term.</li>}
      </ul>
    </div>
  );
}
