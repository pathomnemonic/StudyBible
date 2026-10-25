import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { BOOK_PRAYERS, PRAYER_TAGS } from '../../data/prayerbook';
import { useSettings } from '../../lib/store';

const label = (t: string) => t.replace(/-/g, ' ');

export default function PrayerBookPage() {
  const [st] = useSettings();
  // Eastern readers see the prayers of their own tradition first
  const PRAYERS = st.tradition === 'latin' ? BOOK_PRAYERS : [...BOOK_PRAYERS].sort((a, b) => Number(b.tags.includes('eastern')) - Number(a.tags.includes('eastern')));
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [saved, setSaved] = useState('');
  const today = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
  const save = async (p: { id: string; title: string; text: string }) => {
    await db.journal.add({ date: today(), kind: 'prayer', title: p.title, body: p.text, refs: [], createdAt: Date.now(), updatedAt: Date.now() });
    setSaved(p.id);
  };
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return PRAYERS.filter((p) => (!tag || p.tags.includes(tag)) && (!t || `${p.title} ${p.tags.join(' ')} ${p.text}`.toLowerCase().includes(t)));
  }, [q, tag]);
  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 1500); } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="page">
      <p><Link to="/pray">← Prayer</Link></p>
      <h1>Prayer book</h1>
      <p className="lede">Traditional prayers, searchable by need: a feast, a worry, a person to pray for. Everything works offline.</p>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. anxious, Mary, dead, study" aria-label="Search prayers" style={{ width: '100%', marginBottom: 8 }} />
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className={`btn small${!tag ? ' primary' : ''}`} onClick={() => setTag('')}>All</button>
        {PRAYER_TAGS.map((t) => <button key={t} className={`btn small${tag === t ? ' primary' : ''}`} onClick={() => setTag(tag === t ? '' : t)}>{label(t)}</button>)}
      </div>
      {list.length === 0 && <p className="muted">No prayer matches. Try a shorter word.</p>}
      {list.map((p) => (
        <section className="card" key={p.id}>
          <div className="row between">
            <h2 className="card-title" style={{ margin: 0 }}><button className="linklike" aria-expanded={open === p.id} onClick={() => setOpen(open === p.id ? null : p.id)}>{p.title}</button></h2>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn small" onClick={() => copy(p.id, `${p.title}\n\n${p.text}`)}>{copied === p.id ? 'Copied' : 'Copy'}</button>
              <button className="btn small" disabled={saved === p.id} onClick={() => save(p)}>{saved === p.id ? <>Saved · <Link to="/pray/journal">open</Link></> : 'Save'}</button>
            </div>
          </div>
          {open === p.id && <>
            <p className="scripture" style={{ fontSize: '1.08rem', lineHeight: 1.6 }}>{p.text}</p>
            {p.note && <p className="muted small">{p.note}</p>}
          </>}
          {open !== p.id && <p className="muted small" style={{ margin: '4px 0 0' }}>{p.tags.slice(0, 4).map(label).join(' · ')}</p>}
        </section>
      ))}
      <p className="muted small">Texts are long-used traditional wordings, in the public domain. Psalm excerpts follow the Douay-Rheims numbering.</p>
    </div>
  );
}
