import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import Icon from '../../components/Icon';
import WhatsNew from '../../components/WhatsNew';
import ContinueRow from '../../components/ContinueRow';

type Row = [string, string, string];
const GROUPS: { title: string; blurb: string; items: Row[] }[] = [
  {
    title: 'Understand the text',
    blurb: 'Where you are in the book and how the pieces fit.',
    items: [
      ['/study/books', 'Books & outlines', 'An introduction and outline for each of the 73 books.'],
      ['/study/synopsis', 'Gospel synopsis', 'Matthew, Mark, Luke and John side by side.'],
      ['/study/pauline', 'Paul’s letters', 'Argument outlines for each letter.'],
      ['/study/index', 'Parables, miracles, prophecies, covenants', 'Indexes with every passage linked.'],
      ['/study/textual', 'Textual history', 'Where manuscripts and editions differ.'],
      ['/study/manuscripts', 'Manuscripts', 'Zoom into real pages, from a 4th-century fragment of John.'],
    ],
  },
  {
    title: 'Church teaching and tradition',
    blurb: 'What the Church teaches and how the Fathers and saints read Scripture.',
    items: [
      ['/study/catechism', 'Catechism of the Catholic Church', 'The full text, paragraph by paragraph, with search and links to the Scripture it cites.'],
      ['/study/doctrine', 'Doctrine & Catechism', 'Topics (Eucharist, Trinity, grace, Mary…) with Scripture and Catechism links.'],
      ['/study/church', 'Councils and Church documents', 'Councils, catechisms and encyclicals: read in full where public domain, official links for the rest.'],
      ['/study/fathers', 'Reading room: saints, Fathers, catechisms', 'Augustine, Chrysostom, Teresa, the Imitation of Christ and more, to read in full.'],
      ['/study/quotations', 'Who quoted this verse?', 'Every Father and saint who cites a passage, fullest first.'],
      ['/study/voices', 'Voices through time', 'The Fathers and saints on one timeline, with the councils.'],
      ['/study/concepts', 'Web of themes', 'How the great themes of Scripture are tied together.'],
      ['/study/themes', 'Biblical theology explorer', 'Follow a theme from Genesis to Revelation, with the Church’s reading.'],
    ],
  },
  {
    title: 'Words and topics',
    blurb: 'Find every place something is said.',
    items: [
      ['/study/terms', 'Key words and phrases', 'Son of Man, Kingdom of God, Lamb of God… what they mean and where they occur.'],
      ['/study/concordance', 'Concordance', 'Every verse containing a word, counted by book.'],
      ['/study/topical', 'Topical index', 'Thousands of topics with their passages.'],
    ],
  },
  {
    title: 'People and places',
    blurb: 'The world the text was written in.',
    items: [
      ['/study/constellation', 'Constellation', 'All 73 books as stars, joined by their cross-references.'],
      ['/study/timespace', 'Time and place', 'Slide through the biblical story and watch the map follow.'],
      ['/study/maps', 'Maps', 'Places named in Scripture on an interactive map.'],
      ['/study/world', 'The biblical world', 'Journeys, eras and archaeology.'],
      ['/study/people', 'Genealogies', 'Family trees from Adam to Jesus.'],
      ['/study/gallery', 'Gallery', 'Paintings and engravings of Bible scenes, with a side-by-side compare.'],
    ],
  },
  {
    title: 'About the sources',
    blurb: 'Authority, rights and what is only linked.',
    items: [['/study/sources', 'Sources & licensing', 'Every source, its period, authority and rights.']],
  },
];

const FEATURED: { to: string; title: string; text: string; hue: number }[] = [
  { to: '/study/paths', title: 'Study paths', text: 'Follow a theme through Scripture, with the Fathers and a question at each step.', hue: 330 },
  { to: '/study/fathers', title: 'Reading room', text: 'Read the saints, the Fathers and the catechisms, in full, right here.', hue: 25 },
  { to: '/study/universe', title: 'Scripture universe', text: 'Fly through the canon as a galaxy of 73 books.', hue: 265 },
  { to: '/study/fulfilment', title: 'Promise and fulfilment', text: 'Types and prophecies, in the Fathers’ own words.', hue: 35 },
];

export default function StudyHome() {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const recent = useLiveQuery(() => db.recentSearches.orderBy('ts').reverse().limit(6).toArray(), []) ?? [];
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) nav(`/study/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <div className="page">
      <h1>Study</h1>
      <p className="lede">Everything is connected to the verses you read. Search it, or browse by what you want to do.</p>
      <form className="search-box" onSubmit={go} role="search">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="John 6:51, “bread of life”, Eucharist, Augustine…" aria-label="Search everything" />
        <button className="btn primary" type="submit">
          <Icon name="search" size={18} /> Search
        </button>
      </form>
      {recent.length > 0 && (
        <div className="chips" style={{ marginBottom: 16 }}>
          <span className="muted small">Recent:</span>
          {recent.map((r) => (
            <Link key={r.id} className="chip" to={`/study/search?q=${encodeURIComponent(r.query)}`}>
              {r.query}
            </Link>
          ))}
        </div>
      )}
      <WhatsNew />
      <ContinueRow />
      <div className="featured" role="list" aria-label="Explore">
        {FEATURED.map((f) => (
          <Link key={f.to} to={f.to} role="listitem" className="feat" style={{ ['--h' as string]: f.hue }}>
            <span className="feat-t">{f.title}</span>
            <span className="feat-d">{f.text}</span>
          </Link>
        ))}
      </div>
      <div className="tool-groups">
        {GROUPS.map((g) => (
          <section key={g.title} className="tool-group" aria-labelledby={`tg-${g.title}`}>
            <h2 id={`tg-${g.title}`}>{g.title}</h2>
            <p className="muted small">{g.blurb}</p>
            <ul>
              {g.items.map(([to, t, d]) => (
                <li key={to}>
                  <Link to={to}>
                    <span className="t">{t}</span>
                    <span className="d">{d}</span>
                    <span className="go" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 18 }}>
        The quickest route: open the Bible, and the study panel beside the text shows everything connected to the chapter, or to the verse you tap. <Link to="/read">Open the Bible</Link>.
      </p>
    </div>
  );
}
