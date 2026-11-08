import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../data/loader';
import { voiceSupported } from '../pray/useGuide';

interface KQ { id: string; theme: string; q: string; little: string; big: string; more: string; avoid: string; ccc: number[]; scripture: { ref: string; label: string; quote: string }[]; mystery?: string }

const THEMES: [string, string][] = [['god', 'God'], ['jesus', 'Jesus'], ['heaven', 'Heaven and death'], ['church', 'Church and Mass'], ['saints', 'Saints and Mary'], ['sad', 'Sadness and fear'], ['good', 'Being good']];

function Answer({ k, level }: { k: KQ; level: 'little' | 'big' }) {
  const [on, setOn] = useState(false);
  useEffect(() => () => { if (voiceSupported()) speechSynthesis.cancel(); }, []);
  const text = level === 'little' ? k.little : k.big;
  const toggle = () => {
    if (on) { speechSynthesis.cancel(); setOn(false); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${k.q} ${text}`);
    u.rate = 0.9; u.onend = () => setOn(false); u.onerror = () => setOn(false);
    setOn(true); speechSynthesis.speak(u);
  };
  return (
    <div className="kq-answer">
      <p className="kq-text">{text}</p>
      {k.mystery && <p className="kq-mystery"><strong>Honest about mystery.</strong> {k.mystery}</p>}
      {voiceSupported() && <p><button className="btn small" aria-pressed={on} onClick={toggle}>{on ? 'Stop' : 'Read it aloud'}</button></p>}
    </div>
  );
}

function Item({ k }: { k: KQ }) {
  const [level, setLevel] = useState<'little' | 'big'>(() => { try { return localStorage.getItem('sb:kqLevel') === 'little' ? 'little' : 'big'; } catch { return 'big'; } });
  const pick = (l: 'little' | 'big') => { setLevel(l); try { localStorage.setItem('sb:kqLevel', l); } catch { /* ignore */ } };
  return (
    <details className="kq-item card">
      <summary>{k.q}</summary>
      <div role="group" aria-label="Reading level" className="kq-levels">
        <button className={`chip${level === 'little' ? ' sel' : ''}`} aria-pressed={level === 'little'} onClick={() => pick('little')}>Little ones</button>
        <button className={`chip${level === 'big' ? ' sel' : ''}`} aria-pressed={level === 'big'} onClick={() => pick('big')}>Bigger kids</button>
      </div>
      <Answer k={k} level={level} />
      <div className="kq-grownup">
        <strong>For the grown-up</strong>
        <p><em>If they ask more.</em> {k.more}</p>
        <p><em>What not to say.</em> {k.avoid}</p>
        {k.scripture.map((s) => <blockquote key={s.ref} className="chain-quote"><p>“{s.quote}”</p><footer className="small muted">{s.label} (WEB Catholic)</footer></blockquote>)}
        {k.ccc.length > 0 && <p className="small">Catechism: {k.ccc.map((n, i) => <span key={n}>{i > 0 && ', '}<Link to={`/study/catechism/${n}`}>§{n}</Link></span>)}</p>}
      </div>
    </details>
  );
}

/** Real questions children ask, with short careful answers at two levels, a note for the grown-up, and checked sources. */
export default function KidsQuestionsPage() {
  const [all, setAll] = useState<KQ[] | null>(null);
  const [theme, setTheme] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { getJson<KQ[]>('kids/questions.json').then((d) => setAll(d ?? [])); }, []);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (all ?? []).filter((k) => (!theme || k.theme === theme) && (!s || `${k.q} ${k.little} ${k.big}`.toLowerCase().includes(s)));
  }, [all, theme, q]);
  return (
    <div className="page">
      <h1>The questions children ask</h1>
      <p className="lede">Real questions, with short and careful answers. These are best read with a grown-up, who can add their own words and answer the next question.</p>
      <p className="callout">Ask a grown-up too. Some of these questions are mysteries, and a good answer sometimes begins “The Church doesn’t say exactly…”.</p>
      <input className="input" type="search" placeholder="Search the questions" aria-label="Search the questions" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips" role="group" aria-label="Themes">
        <button className={`chip${theme === '' ? ' sel' : ''}`} aria-pressed={theme === ''} onClick={() => setTheme('')}>All</button>
        {THEMES.map(([id, label]) => <button key={id} className={`chip${theme === id ? ' sel' : ''}`} aria-pressed={theme === id} onClick={() => setTheme(id)}>{label}</button>)}
      </div>
      {!all ? <p className="center-note">Loading…</p> : shown.length === 0 ? <p className="muted">No question matches. Try another word.</p> : shown.map((k) => <Item key={k.id} k={k} />)}
      <p className="small muted">Quotations from the Bible are from the World English Bible, Catholic edition. Catechism numbers link to the text in this app. Each is checked against the text built into the app.</p>
    </div>
  );
}
