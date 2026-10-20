import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JournalEntry } from '../../db/db';
import { renderMarkdown } from '../../lib/markdown';
import { formatRef, parseRefId, parseRefs, refId } from '../../lib/refs';
import RefLink from '../../components/RefLink';
import { PRAYERS } from '../../data/prayers';
import { fold } from '../../search/engine';

const todayIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

export default function JournalPage() {
  const [kind, setKind] = useState<JournalEntry['kind']>('journal');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<JournalEntry | null>(null);
  const entries = useLiveQuery(() => db.journal.orderBy('date').reverse().toArray(), []) ?? [];
  const list = entries.filter((e) => e.kind === kind && (!q || fold(`${e.title ?? ''} ${e.body}`).includes(fold(q))));
  const blank = (): JournalEntry => ({ date: todayIso(), kind, body: '', refs: [], createdAt: Date.now(), updatedAt: Date.now() });
  const save = async () => {
    if (!edit) return;
    const body = edit.body.trim();
    if (!body && !edit.title) return setEdit(null);
    const rec = { ...edit, updatedAt: Date.now() };
    if (edit.id) await db.journal.put(rec);
    else await db.journal.add(rec);
    setEdit(null);
  };
  const [refText, setRefText] = useState('');
  return (
    <div className="page">
      <Link to="/pray" className="small">← Pray</Link>
      <h1>Prayer journal</h1>
      <p className="lede">Private to this device. Export from Library → Export, or from Settings.</p>
      <div className="tabbar">
        {([['journal', 'Journal'], ['intention', 'Intentions'], ['prayer', 'Saved prayers']] as [JournalEntry['kind'], string][]).map(([k, l]) => <button key={k} aria-selected={kind === k} onClick={() => setKind(k)}>{l}</button>)}
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <input type="search" placeholder="Search past entries…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} aria-label="Search journal" />
        <button className="btn primary" onClick={() => setEdit(blank())}>New</button>
      </div>
      {edit && (
        <div className="card">
          <div className="row"><input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} aria-label="Date" /><input type="text" placeholder="Title (optional)" value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} style={{ flex: 1 }} /></div>
          <textarea value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} placeholder={kind === 'intention' ? 'Whom or what are you praying for?' : kind === 'prayer' ? 'A prayer you want to keep' : 'What are you noticing in prayer?'} aria-label="Entry" style={{ marginTop: 8 }} />
          <div className="chips" style={{ margin: '8px 0' }}>
            {edit.refs.map((r, i) => <span key={i} className="chip">{formatRef(parseRefId(r)!)} <button style={{ border: 0, background: 'none' }} onClick={() => setEdit({ ...edit, refs: edit.refs.filter((_, j) => j !== i) })} aria-label="Remove passage">×</button></span>)}
            <input type="text" placeholder="Link a passage…" value={refText} onChange={(e) => setRefText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { const p = parseRefs(refText); if (p.ok) { setEdit({ ...edit, refs: [...edit.refs, ...p.refs.map((x) => refId(x.ref))] }); setRefText(''); } } }} />
          </div>
          <div className="row"><button className="btn primary" onClick={save}>Save</button><button className="btn" onClick={() => setEdit(null)}>Cancel</button></div>
        </div>
      )}
      {list.length === 0 && !edit && <div className="empty">Your journal is empty. Write a line about what struck you today; it stays on this device.</div>}
      {list.map((e) => (
        <div className="card" key={e.id}>
          <div className="row between"><strong>{e.title || e.date}</strong><span className="muted small">{e.date}</span></div>
          <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(e.body) }} />
          <div className="chips">{e.refs.map((r) => <span className="chip" key={r}><RefLink id={r} /></span>)}</div>
          <div className="row" style={{ marginTop: 6 }}>
            <button className="btn small" onClick={() => setEdit(e)}>Edit</button>
            {kind === 'intention' && <button className="btn small" onClick={() => db.journal.put({ ...e, answered: !e.answered })}>{e.answered ? 'Reopen' : 'Mark answered / entrusted'}</button>}
            <button className="btn small danger" onClick={() => confirm('Delete this entry?') && db.journal.delete(e.id!)}>Delete</button>
            {e.answered && <span className="chip good">answered</span>}
          </div>
        </div>
      ))}
      {kind === 'prayer' && (
        <>
          <h2 style={{ fontSize: '1.1rem' }}>Traditional prayers</h2>
          <p className="muted small">Long-established wording that is not under a modern translation copyright. Liturgical texts (ICEL/USCCB) are not included.</p>
          {PRAYERS.map((p) => (
            <div className="card" key={p.id}>
              <h3>{p.title}</h3>
              <p style={{ fontFamily: 'var(--font-serif)' }}>{p.text}</p>
              <p className="muted small">{p.source}</p>
              <button className="btn small" onClick={() => db.journal.add({ date: todayIso(), kind: 'prayer', title: p.title, body: p.text, refs: [], createdAt: Date.now(), updatedAt: Date.now() })}>Save to my prayers</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
