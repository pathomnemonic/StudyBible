import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FEATURES, STATUS_LABEL, type Status } from '../featureStatus';
import { CANON_NOTES } from '../lib/canon';
import { useEffect } from 'react';
import { getJson } from '../data/loader';

const COLOR: Record<Status, string> = { working: 'good', partial: 'warn', 'needs-license': 'warn', 'needs-credentials': 'warn', planned: '' };

export default function AboutPage() {
  const [f, setF] = useState<Status | ''>('');
  const [built, setBuilt] = useState('');
  useEffect(() => { getJson<{ generated: string }>('manifest.json', true).then((m) => setBuilt(m?.generated ?? '')).catch(() => {}); }, []);
  const list = FEATURES.filter((x) => !f || x.status === f);
  return (
    <div className="page">
      <h1>About & feature status</h1>
      <p className="lede">A study library built on legitimately available texts. This page says plainly what works, what is partial, and what needs a licence, credentials or future work.</p>
      <p className="muted small">Text and study data last built {built || '…'}. The app updates itself quietly when you are online.</p>
      {CANON_NOTES.map((n, i) => <div className="notice info" key={i}>{n}</div>)}
      <div className="chips" style={{ margin: '10px 0' }}>
        <button className={`chip${!f ? ' sel' : ''}`} onClick={() => setF('')}>All</button>
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <button key={s} className={`chip${f === s ? ' sel' : ''}`} onClick={() => setF(s)}>{STATUS_LABEL[s]}</button>)}
      </div>
      {list.map((x, i) => (
        <div className="card" key={i}>
          <div className="row between"><strong>{x.name}</strong><span className={`chip ${COLOR[x.status]}`}>{STATUS_LABEL[x.status]}</span></div>
          <div className="muted small">{x.area}</div>
          <p className="small">{x.detail}</p>
          {x.next && <p className="small muted"><strong>Next:</strong> {x.next.deliverable}. <strong>Blocked by:</strong> {x.next.blocker}. <strong>Done when:</strong> {x.next.test}.</p>}
        </div>
      ))}
      <section className="card" id="method">
        <h2 className="card-title">How we choose, label and check sources</h2>
        <ul className="small bullets">
          <li><strong>Scripture</strong> comes only from public-domain texts with a recorded source and licence. Each edition says where it came from and whether it is Church-approved.</li>
          <li><strong>Every study item says why it is attached to a passage</strong>: the source quotes it, comments on it verse by verse, cites it, is about the chapter, or only shares a topic. Use the filter in the study panel to show only the stronger kinds.</li>
          <li><strong>Authority is shown on each item</strong> (Scripture, Church teaching, Father or Doctor, saint, historical commentary, popular teaching) and is never raised by the way an item looks. Notes and summaries written for this app are labelled as such.</li>
          <li><strong>Matches made by the calendar or by a title</strong> (for example a homily for a Sunday) say so, and are not claimed to treat the passage.</li>
          <li><strong>Checks:</strong> citations are verified against source text where possible; the data validator and tests run on every change; links to other sites are not copied and may change.</li>
          <li><strong>Found a mistake?</strong> Use “Report a problem” on an item, or <a href="https://github.com/pathomnemonic/StudyBible/issues/new?template=data-correction.md" target="_blank" rel="noreferrer">open a correction</a> with the source that shows the right version. Nothing you have written in your notes is sent.</li>
          <li><a href="https://github.com/pathomnemonic/StudyBible/blob/main/docs/CHANGELOG.md" target="_blank" rel="noreferrer">What changed</a> lists app changes and content changes separately.</li>
        </ul>
      </section>
      <p className="small"><Link to="/study/sources">Sources & licensing</Link> · <Link to="/settings">Settings</Link></p>
    </div>
  );
}
