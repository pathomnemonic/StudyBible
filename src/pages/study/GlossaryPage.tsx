import PrintButton from '../../components/PrintButton';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ShareLinkButton from '../../components/ShareLinkButton';
import { GLOSSARY, lookupTerm } from '../../data/glossary';
import GlossaryExtras from '../../components/GlossaryExtras';
import { getJson } from '../../data/loader';

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** Where each glossary word is taught: the lessons that list it as vocabulary. */
function useLessonVocab() {
  const [v, setV] = useState<Record<string, [string, string][]>>({});
  useEffect(() => { getJson<Record<string, [string, string][]>>('curriculum/lesson-vocab.json', true).then((x) => x && setV(x)).catch(() => undefined); }, []);
  return v;
}
const gradeOf = (id: string) => (id.startsWith('YA-') ? 'YA' : id.split('-')[0]);

/** Terms of the faith in plain language, A to Z, each with the Catechism paragraph that treats it. */
export default function GlossaryPage() {
  const [sp] = useSearchParams();
  const [q, setQ] = useState('');
  const open = sp.get('t');
  const vocab = useLessonVocab();
  const list = useMemo(() => {
    const f = q.trim().toLowerCase();
    return [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term)).filter((g) => !f || `${g.term} ${g.aliases.join(' ')} ${g.definition}`.toLowerCase().includes(f));
  }, [q]);
  return (
    <div className="page glossary">
      <h1>Glossary <PrintButton /></h1>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a term" aria-label="Find a term" />
      <p className="muted small">{list.length} terms. Select a word anywhere in the app to see its meaning. The explanations are in plain words written for this app; the Church’s own wording is in the Catechism paragraph linked on each entry. “Nearest teaching” means that paragraph treats the idea without defining the word itself.</p>
      <ul className="list">
        {list.map((g) => (
          <li key={g.term} id={g.term} className={open === g.term ? 'glossary-open' : undefined}>
            <strong>{g.term}</strong>
            <p className="small muted" style={{ margin: '2px 0 0' }}>In plain words (written for this app, not an official definition)</p>
            <p style={{ margin: '2px 0 4px' }}>{g.definition}</p>
            <Link className="chip" to={`/study/catechism/${g.ccc}`} title={g.near ? 'The Catechism treats the idea here without defining the word itself' : 'The Church’s own words'}>Church’s own words: Catechism §{g.ccc}{g.near ? ' (nearest teaching)' : ''}</Link> <ShareLinkButton path={`/s/term/${encodeURIComponent(g.term)}`} title={g.term} />
            {(() => { const ls = [g.term, ...g.aliases].map((t) => vocab[slug(t)]).find((x) => x?.length); return ls ? <p className="muted small" style={{ margin: '4px 0 0' }}>Taught in: {ls.map(([id, t], i) => <span key={id}>{i ? ', ' : ''}<Link to={`/study/curriculum/${gradeOf(id)}/${id}`}>{t}</Link></span>)}</p> : null; })()}
            <GlossaryExtras para={g.ccc} />
            {!!g.aliases.length && <p className="muted small" style={{ margin: '4px 0 0' }}>Also called: {g.aliases.join(', ')}</p>}
            {!!g.related?.length && <p className="muted small" style={{ margin: '4px 0 0' }}>See also: {g.related.map((r, i) => { const x = lookupTerm(r); return <span key={r}>{i ? ', ' : ''}{x ? <Link to={`/study/glossary?t=${encodeURIComponent(x.term)}`}>{x.term}</Link> : r}</span>; })}</p>}
          </li>
        ))}
        {!list.length && <li className="empty">No matching term.</li>}
      </ul>
    </div>
  );
}
