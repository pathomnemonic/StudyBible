import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../data/loader';

interface Q { book: string; topic: string; text: string; where: string }
interface File { books: Record<string, { author: string; title: string; publisher: string; year: number }>; topics: Record<string, { label: string; to: string }>; quotes: Q[] }

/** Short quotations from modern Catholic authors, each naming its book. One writer's view, not Church teaching. */
export default function ModernVoicesPage() {
  const [f, setF] = useState<File | null>(null);
  useEffect(() => { getJson<File>('modern/quotes.json', true).then(setF).catch(() => setF({ books: {}, topics: {}, quotes: [] })); }, []);
  if (!f) return <div className="page"><p className="muted" role="status">Loading…</p></div>;
  const groups = Object.entries(f.quotes.reduce<Record<string, Q[]>>((m, q) => ((m[q.topic] ??= []).push(q), m), {}));
  return (
    <div className="page">
      <h1>Modern Catholic voices</h1>
      <p className="lede">A sentence or two from four books by modern Catholic writers, each tied to a question the app already covers. These are one author’s explanations, not Church teaching: the Catechism, Scripture and the Fathers on the linked pages are the sources. To read more, get the books.</p>
      {groups.map(([topic, qs]) => (
        <section className="card" key={topic} aria-label={f.topics[topic]?.label ?? topic}>
          <h2 className="card-title">{f.topics[topic]?.label ?? topic}</h2>
          {qs.map((q, i) => { const b = f.books[q.book]; return (
            <blockquote key={i}>
              {q.text}
              <footer className="muted small">{b.author}, <cite>{b.title}</cite> ({b.publisher}, {b.year})</footer>
            </blockquote>
          ); })}
          {f.topics[topic] && <p className="small"><Link to={f.topics[topic].to}>See what the sources say</Link></p>}
        </section>
      ))}
      <p className="muted small">Quotations are short and credited. Copyright remains with the authors and publishers.</p>
    </div>
  );
}
