import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReadingBlock from '../../components/ReadingBlock';
import { LINK_LABEL, THREADS } from '../../data/threads';
import { convertRef } from '../../lib/versification';
import { parseRefs, type Ref } from '../../lib/refs';

const toRefs = (s: string): Ref[] => { const p = parseRefs(s); return p.ok ? p.refs.map((x) => convertRef('kjv', 'vulgate', x.ref).ref) : []; };

export default function StoryPage() {
  const { id } = useParams();
  const t = THREADS.find((x) => x.id === id);
  const steps = useMemo(() => (t ? t.steps.map((s) => ({ ...s, refs: toRefs(s.ref) })) : []), [t]);
  if (!t) {
    return (
      <div className="page">
        <p><Link to="/study">← Study</Link></p>
        <h1>Follow a story</h1>
        <p className="lede">Trace one thread through the whole Bible, one passage at a time. Each step says whether it continues the story in the text, whether a later writer recalls it, or whether it is a reading from the Church’s tradition.</p>
        <div className="grid">{THREADS.map((x) => <Link key={x.id} to={`/study/story/${x.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="card-title">{x.title}</h2><p className="muted">{x.blurb}</p><p className="muted small">{x.steps.length} passages</p></Link>)}</div>
      </div>
    );
  }
  return (
    <div className="page">
      <p><Link to="/study/story">← All stories</Link></p>
      <h1>{t.title}</h1>
      <p className="lede">{t.blurb}</p>
      <ol className="story-steps">
        {steps.map((s, i) => (
          <li key={i} className="card">
            <div className="muted small">{i + 1} of {steps.length} · {LINK_LABEL[s.link]}</div>
            <ReadingBlock refs={s.refs} label={s.ref} text={s.caption} max={12} />
          </li>
        ))}
      </ol>
      <p className="muted small">Captions are written for this app. Passages are shown in your chosen translation.</p>
    </div>
  );
}
