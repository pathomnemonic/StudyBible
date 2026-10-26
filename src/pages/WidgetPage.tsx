import { BRAND } from '../lib/brand';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { useEditions } from '../data/EditionsContext';
import { passageText } from '../lib/bibleText';
import { parseRefs, formatRef } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { verseForDay } from '../study/verseOfDay';
import { isDue } from '../lib/srs';

/**
 * A compact "widget" view for a small window, a pinned browser tab or an installed-app shortcut: today's verse, memorize
 * reviews due and plan progress. A web app cannot place widgets on a phone's home screen; that needs a native wrapper.
 */
export default function WidgetPage() {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const ed = get(s.defaultEdition === 'vulgate' ? 'dra' : s.defaultEdition) ?? editions[0];
  const [v, setV] = useState<{ label: string; text: string } | null>(null);
  const due = (useLiveQuery(() => db.memory.toArray(), []) ?? []).filter((c) => isDue(c)).length;
  const plans = useLiveQuery(() => db.planProgress.filter((p) => p.status === 'active').toArray(), []) ?? [];
  useEffect(() => {
    const p = parseRefs(verseForDay());
    if (!p.ok) return;
    passageText(ed, convertRef('kjv', 'vulgate', p.refs[0].ref).ref, 5).then((vs) => setV({ label: formatRef(p.refs[0].ref, { noDual: true }), text: vs.map((x) => x.text).join(' ') }));
  }, [ed.id]);
  return (
    <div className="page" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1 className="visually-hidden">{BRAND.name} widget</h1>
      <section className="card">
        <p className="muted small" style={{ margin: 0 }}>Verse of the day</p>
        <blockquote style={{ margin: '8px 0', fontFamily: 'var(--font-serif)', fontSize: '1.15rem', lineHeight: 1.6 }}>{v?.text ?? '…'}</blockquote>
        <p className="muted small" style={{ margin: 0 }}>{v?.label} ({ed.shortName})</p>
      </section>
      <section className="card">
        <p style={{ margin: 0 }}><Link to="/memorize">{due ? `${due} verse${due === 1 ? '' : 's'} to review` : 'Nothing to review right now'}</Link></p>
        {plans.map((p) => <p key={p.planId} className="muted small" style={{ margin: '4px 0 0' }}>{p.planId === 'biay' ? 'Bible in a Year' : p.planId}: {p.done.length} days done</p>)}
      </section>
      <p className="small"><Link to="/today">Open Today</Link> · <Link to="/read">Read</Link></p>
    </div>
  );
}
