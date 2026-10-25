import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudyPanel from '../../components/StudyPanel';
import { parseRefId, formatRef } from '../../lib/refs';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { readerPath } from '../../lib/nav';
import { passageText } from '../../lib/bibleText';
import GroupSheet from '../../components/GroupSheet';

/** Full-page version of the verse study panel, reachable from topics, library and search. */
export default function PassageStudy() {
  const { refId = '' } = useParams();
  const r = parseRefId(refId);
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const nav = useNavigate();
  const ed = get(s.defaultEdition) ?? editions[0];
  const [sheet, setSheet] = useState(false);
  const [text, setText] = useState<{ v: number; text: string }[]>([]);
  useEffect(() => {
    if (r) passageText(ed, r, 14).then(setText);
  }, [refId, ed.id]);
  if (!r) return <div className="page">Unrecognised passage.</div>;
  return (
    <div className="page">
      <div className="row between"><h1 style={{ margin: 0 }}>{formatRef(r)}</h1><span className="row no-print" style={{ gap: 6 }}><button className="btn small" aria-pressed={sheet} onClick={() => setSheet(!sheet)}>Group sheet</button><button className="btn small" onClick={() => window.print()}>Print</button></span></div>
      {sheet && <GroupSheet r={r} text={text} translation={ed.name} />}
      <div className="card" lang={ed.language} style={{ fontFamily: 'var(--font-serif)' }}>
        {text.map((t) => (
          <span key={t.v}><sup style={{ color: 'var(--accent)' }}>{t.v}</sup> {t.text} </span>
        ))}
        <div className="muted small" style={{ fontFamily: 'var(--font-sans)', marginTop: 6 }}>{ed.name}</div>
      </div>
      <StudyPanel refs={[r]} edition={ed} inline onOpenPassage={(x) => nav(readerPath(ed, x))} />
    </div>
  );
}
