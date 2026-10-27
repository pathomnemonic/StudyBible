import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Fold, { FoldControls } from '../../components/Fold';
import { getGrade, gradeLabel, flatLessons } from '../../curriculum/model';

interface Topic { id: string; title: string; blurb: string; lessons: string[]; extra?: { to: string; label: string }[] }

const TOPICS: Topic[] = [
  { id: 'confession', title: 'First Confession and returning to Confession', blurb: 'What sin and mercy are, how to examine your conscience, and what to say and expect in the confessional.', lessons: ['K-5-3', '1-6-3', '2-3-1', '2-3-2', '2-3-3', '5-5-2', '11-3-1', '11-3-2', 'YA-4-1', 'YA-4-2'], extra: [{ to: '/pray/devotions/confession', label: 'A step-by-step Confession guide' }, { to: '/pray/examination', label: 'Examination of conscience' }] },
  { id: 'communion', title: 'First Communion and the Mass', blurb: 'Who Jesus is in the Eucharist, the parts of the Mass, and how to receive him with reverence.', lessons: ['K-5-2', '1-6-2', '2-4-1', '2-4-2', '2-4-3', '5-3-1', '5-3-2', '5-3-3', '5-4-1', '5-4-2', '11-2-3'], extra: [{ to: '/mass', label: 'Mass mode: follow along' }] },
  { id: 'confirmation', title: 'Confirmation', blurb: 'The Holy Spirit, his gifts and fruits, and what it means to be sealed and sent.', lessons: ['5-2-2', '8-6-1', '8-6-2', '8-6-3', '11-2-2', 'YA-5-3'], extra: [{ to: '/pray/novenas/holy-spirit', label: 'Novena to the Holy Spirit' }] },
  { id: 'baptism', title: 'Baptism and becoming Catholic (RCIA)', blurb: 'New life in Christ, the Creed and the Church, for parents, godparents and adults entering the Church.', lessons: ['1-6-1', '5-2-1', '10-8-1', '11-2-1', 'YA-1-1', 'YA-1-2', 'YA-1-3', 'YA-2-1', 'YA-2-2', 'YA-2-3', 'YA-5-1', 'YA-5-2'], extra: [{ to: '/study/young-adults', label: 'The whole young-adults course, 36 sessions' }, { to: '/study/catechism', label: 'Catechism of the Catholic Church' }] },
  { id: 'marriage', title: 'Marriage', blurb: 'A covenant of love: what the Church teaches about marriage, family, annulment and responsible parenthood.', lessons: ['5-6-2', '11-4-2', '11-4-3', 'YA-6-1', 'YA-6-2', 'YA-7-2', '10-9-2', '11-9-1'] },
  { id: 'sick', title: 'Sickness, dying and funerals', blurb: 'The Anointing of the Sick, accompanying the dying, and the hope of the resurrection.', lessons: ['5-5-3', '11-3-3', '12-4-2', '4-5-3', '12-7-1', '12-7-2', '11-10-3'] },
  { id: 'vocation', title: 'Priesthood, religious life and vocation', blurb: 'How God calls, the states of life, and how to discern.', lessons: ['5-6-1', '5-6-3', '11-4-1', '12-1-1', '12-1-2', 'YA-7-1', 'YA-7-3'] },
];

/** A guide to the lessons, prayers and tools in the app for each sacrament, for parents, catechists and adults preparing to receive one. */
export default function PreparePage() {
  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    let live = true;
    const grades = [...new Set(TOPICS.flatMap((t) => t.lessons.map((l) => l.split('-')[0])))];
    Promise.all(grades.map((g) => getGrade(g))).then((all) => {
      const m: Record<string, string> = {};
      for (const d of all) if (d) for (const l of flatLessons(d)) m[l.id] = l.title;
      if (live) setTitles(m);
    });
    return () => { live = false; };
  }, []);
  return (
    <div className="page">
      <p><Link to="/learn">← Learn</Link></p>
      <h1>Prepare for a sacrament</h1>
      <p className="lede">Lessons, prayers and tools for each sacrament, gathered in one place.</p>
      <FoldControls />
      {TOPICS.map((t, i) => (
        <Fold key={t.id} id={`prepare:${t.id}`} title={t.title} hint={t.blurb} open={i === 0}>
          {t.extra && <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>{t.extra.map((e) => <Link key={e.to} className="btn small" to={e.to}>{e.label}</Link>)}</div>}
          <ul className="fold-list">
            {t.lessons.filter((id) => titles[id] || !Object.keys(titles).length).map((id) => {
              const g = id.split('-')[0];
              return (
                <li key={id}><Link to={`/study/curriculum/${g}/${id}`}><span className="t">{titles[id] ?? id}</span><span className="d">{gradeLabel(g)}</span><span className="go" aria-hidden="true">→</span></Link></li>
              );
            })}
          </ul>
        </Fold>
      ))}
    </div>
  );
}
