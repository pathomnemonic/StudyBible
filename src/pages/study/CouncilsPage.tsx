import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COUNCILS } from '../../data/councils';
import PrintButton from '../../components/PrintButton';
import ShareLinkButton from '../../components/ShareLinkButton';

/** Each of the twenty-one ecumenical councils in a few lines: why it met, what it settled, and why it matters today. */
export default function CouncilsPage() {
  const [sp] = useSearchParams();
  const [open, setOpen] = useState<number | null>(sp.get('n') ? +sp.get('n')! : null);
  const [theme, setTheme] = useState('');
  const themes = [...new Set(COUNCILS.map((c) => c.theme))];
  const shown = COUNCILS.filter((c) => !theme || c.theme === theme);
  return (
    <div className="page">
      <h1>The twenty-one councils <PrintButton /></h1>
      <p className="lede">Each ecumenical council met because something was at stake. Tap one to see why it met, what it settled and why it matters.</p>
      <div className="chips no-print" role="group" aria-label="Theme">
        <button className={`chip${!theme ? ' sel' : ''}`} aria-pressed={!theme} onClick={() => setTheme('')}>All</button>
        {themes.map((t) => <button key={t} className={`chip${theme === t ? ' sel' : ''}`} aria-pressed={theme === t} onClick={() => setTheme(t)}>{t}</button>)}
      </div>
      <ol className="list councils">
        {shown.map((c) => (
          <li key={c.n}>
            <button className="linklike t" aria-expanded={open === c.n} onClick={() => setOpen(open === c.n ? null : c.n)}>{c.n}. {c.name}</button>
            <span className="muted small"> · {c.years}</span>
            {open === c.n && (
              <div className="card" style={{ marginTop: 6 }}>
                <p className="muted small" style={{ margin: 0 }}>{c.place}. Called by {c.calledBy}.</p>
                <p><strong>Why it met.</strong> {c.why}</p>
                <p style={{ marginBottom: 2 }}><strong>What it settled.</strong></p>
                <ul>{c.settled.map((s) => <li key={s}>{s}</li>)}</ul>
                <p><strong>Why it matters.</strong> {c.matters}</p>
                <ShareLinkButton path={`/study/councils?n=${c.n}`} title={c.name} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <p className="muted small">Counted as the Catholic Church counts them. The Eastern Orthodox accept the first seven. Dates and summaries are simplified.</p>
    </div>
  );
}
