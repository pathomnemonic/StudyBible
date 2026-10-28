import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../../db/db';
import { saveNote } from '../../db/ops';
import { parseRefs, refId } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { BOOK_PRAYERS } from '../../data/prayerbook';
import FilterBar from '../../components/FilterBar';
import { HubHeader } from '../../components/Hub';
import { useSettings } from '../../lib/store';
import Speak from '../../pray/Speak';

const label = (t: string) => t.replace(/-/g, ' ');
/** The topics worth filtering by: any tag that more than one prayer carries, most used first. */
const TOPICS: [string, number][] = (() => {
  const n = new Map<string, number>();
  for (const p of BOOK_PRAYERS) for (const t of p.tags) n.set(t, (n.get(t) ?? 0) + 1);
  return [...n].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
})();

export default function PrayerBookPage() {
  const [st] = useSettings();
  // Eastern readers see the prayers of their own tradition first
  const PRAYERS = st.tradition === 'latin' ? BOOK_PRAYERS : [...BOOK_PRAYERS].sort((a, b) => Number(b.tags.includes('eastern')) - Number(a.tags.includes('eastern')));
  const [q, setQ] = useState('');
  const [sp] = useSearchParams();
  const [tag, setTag] = useState(sp.get('tag') ?? '');
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [saved, setSaved] = useState('');
  const [attach, setAttach] = useState<string | null>(null);
  const [passage, setPassage] = useState('');
  const [attachMsg, setAttachMsg] = useState('');
  const today = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
  const save = async (p: { id: string; title: string; text: string }) => {
    await db.journal.add({ date: today(), kind: 'prayer', title: p.title, body: p.text, refs: [], createdAt: Date.now(), updatedAt: Date.now() });
    setSaved(p.id);
  };
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return PRAYERS.filter((p) => (!tag || p.tags.includes(tag)) && (!t || `${p.title} ${p.tags.join(' ')} ${p.text}`.toLowerCase().includes(t)));
  }, [q, tag]);
  const attachTo = async (p: { id: string; title: string; text: string }) => {
    const r = parseRefs(passage);
    if (!r.ok) return setAttachMsg(r.error);
    await saveNote({ kind: 'prayer', title: p.title, body: p.text, tags: ['prayer'], targets: r.refs.map((x) => ({ type: 'passage' as const, ref: refId(convertRef('kjv', 'vulgate', x.ref).ref) })) } as any);
    setAttachMsg(`Attached to ${passage.trim()}. It now appears with that passage in the reader and the study panel, under your notes.`);
    setPassage('');
  };
  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 1500); } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="page">
      <HubHeader title="Prayer book" sub={`${BOOK_PRAYERS.length} prayers, searchable by need. Everything works offline.`} />
      <FilterBar active={tag ? 1 : 0}
        search={<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. anxious, Mary, dead, study" aria-label="Search prayers" />}>
        <label>Topic <select value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">All prayers</option>
          {TOPICS.map(([t, n]) => <option key={t} value={t}>{label(t)} ({n})</option>)}
        </select></label>
      </FilterBar>
      {list.length === 0 && <p className="muted">No prayer matches. Try a shorter word.</p>}
      {list.map((p) => (
        <section className="card" key={p.id}>
          <div className="row between">
            <h2 className="card-title" style={{ margin: 0 }}><button className="linklike" aria-expanded={open === p.id} onClick={() => setOpen(open === p.id ? null : p.id)}>{p.title}</button></h2>
            <div className="row" style={{ gap: 6 }}>
              <Speak title={p.title} text={p.text} />
              <button className="btn small" onClick={() => copy(p.id, `${p.title}\n\n${p.text}`)}>{copied === p.id ? 'Copied' : 'Copy'}</button>
              <Link className="btn small ghost" to={`/print/prayer/${p.id}`}>Print</Link>
              <button className="btn small ghost" onClick={() => copy(`link-${p.id}`, `${location.href.split('#')[0]}#/s/prayer/${p.id}`)}>{copied === `link-${p.id}` ? 'Link copied' : 'Link'}</button>
              <button className="btn small" disabled={saved === p.id} onClick={() => save(p)}>{saved === p.id ? <>Saved · <Link to="/pray/journal">open</Link></> : 'Save'}</button>
            </div>
          </div>
          {open === p.id && <>
            <div className="row" style={{ gap: 6, margin: '6px 0', flexWrap: 'wrap' }}>
              <button className="btn small" aria-expanded={attach === p.id} onClick={() => { setAttach(attach === p.id ? null : p.id); setAttachMsg(''); }}>Attach to a passage</button>
              {attach === p.id && <><input value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="e.g. Luke 1:46-55" aria-label="Passage to attach this prayer to" /><button className="btn small primary" disabled={!passage.trim()} onClick={() => attachTo(p)}>Attach</button></>}
            </div>
            {attach === p.id && attachMsg && <p className="small" role="status">{attachMsg}</p>}
            <p className="scripture" style={{ fontSize: '1.08rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{p.text}</p>
            {p.note && <p className="muted small">{p.note}</p>}
          </>}
          {open !== p.id && <p className="muted small" style={{ margin: '4px 0 0' }}>{p.tags.slice(0, 4).map(label).join(' · ')}</p>}
        </section>
      ))}
      <p className="muted small">Texts are long-used traditional wordings, in the public domain. Psalm excerpts follow the Douay-Rheims numbering unless noted. The prayers marked “Written for this app” are new and not from any liturgical text.</p>
    </div>
  );
}
