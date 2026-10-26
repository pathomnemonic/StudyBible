import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import Icon from '../../components/Icon';
import Fold from '../../components/Fold';
import ContinueRow from '../../components/ContinueRow';

type Row = [string, string, string];
const GROUPS: { title: string; blurb: string; items: Row[] }[] = [
  {
    title: 'Guided study',
    blurb: 'Walk through the Bible and the faith in order.',
    items: [
      ['/study/course', 'Salvation history in twelve lessons', 'The story of the Bible in order, with a quiz for each lesson.'],
      ['/study/story', 'Follow a story', 'Trace the promise to Abraham, the Exodus, David, the exile, Peter or Mary through the whole Bible.'],
      ['/study/dossier', 'Passage dossier', 'Type any passage and get everything on it in one printable page.'],
      ['/study/paths', 'Study paths', 'Follow a theme through Scripture, with the Fathers and a question at each step.'],
      ['/study/fulfilment', 'Promise and fulfilment', 'Types and prophecies, in the Fathers’ own words.'],
    ],
  },
  {
    title: 'Church teaching and tradition',
    blurb: 'Learn the faith: lessons, questions, videos and themes. The Catechism, papal writings, councils and the saints now live in the Reading room.',
    items: [
      ['/teach', 'Teacher tools', 'Classes, attendance, participation, scores, exams, a gradebook and report cards.'],
      ['/join', 'Join a class', 'Type the code your teacher is showing to follow a lesson and play the quiz together.'],
      ['/study/curriculum', 'Catechism, Kindergarten to Grade 12', 'A full program of 370 lessons for classrooms, families and self-study, with teacher handbook.'],
      ['/study/young-adults', 'Young adults', 'Questions, vocation, Scripture, reading and people for the years of big decisions.'],
      ['/study/kids', 'Children’s Bible', 'Bible stories for kids, at three reading levels, with questions and videos.'],
      ['/study/apologetics', 'Questions about the faith', 'Common questions, each gathering what Catholic authors and apologists have written and said, with the verses and Catechism paragraphs involved.'],
      ['/study/videos', 'Catholic video library', 'Thousands of teaching videos from Catholic Answers, the St. Paul Center, Bishop Barron, Ascension and more, searchable by title and creator.'],
      ['/study/quotations', 'Who quoted this verse?', 'Every Father and saint who cites a passage, fullest first.'],
      ['/study/voices', 'Voices through time', 'The Fathers and saints on one timeline, with the councils.'],
      ['/study/concepts', 'Web of themes', 'How the great themes of Scripture are tied together.'],
      ['/study/themes', 'Biblical theology explorer', 'Follow a theme from Genesis to Revelation, with the Church’s reading.'],
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

const FEATURED: { to: string; title: string; text: string; c: string }[] = [
  { to: '/study/apologetics', title: 'Apologetics hub', text: 'Answers to the hard questions, from Catholic authors and the Catechism.', c: 'wine' },
  { to: '/study/videos', title: 'Video library', text: 'Thousands of teaching videos, newest first.', c: 'ocean' },
  { to: '/mass', title: 'Mass mode', text: 'Follow the Mass step by step, in English or Latin.', c: 'gold' },
  { to: '/study/universe', title: 'Scripture universe', text: 'Fly through the Bible as a galaxy of 73 books.', c: 'night' },
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
      <Link to="/read" className="notice info small" style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: 12 }}>
        <strong>Looking for book outlines, the Gospel comparison, key words, the concordance or the topical index?</strong> They are now with the Bible: open any chapter and tap the <Icon name="study" size={14} /> Bible tools button, or <u>open the Bible</u>.
      </Link>
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
            <ContinueRow />
      <div className="featured" role="list" aria-label="Explore">
        {FEATURED.map((f) => (
          <Link key={f.to} to={f.to} role="listitem" className={`feat ft-${f.c}`}>
            <span className="feat-t">{f.title}</span>
            <span className="feat-d">{f.text}</span>
          </Link>
        ))}
      </div>
      <div className="tool-groups">
        {GROUPS.map((g) => (
          <Fold key={g.title} id={`study:${g.title}`} title={g.title} hint={g.blurb}>
            <ul className="fold-list">
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
          </Fold>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 18 }}>
        The quickest route: open the Bible, and the study panel beside the text shows everything connected to the chapter, or to the verse you tap. <Link to="/read">Open the Bible</Link>.
      </p>
    </div>
  );
}
