import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Collection, type Note, type Target } from '../../db/db';
import NoteEditor, { targetLabel } from '../../components/NoteEditor';
import RefLink from '../../components/RefLink';
import { renderMarkdown } from '../../lib/markdown';
import { formatRef, parseRefId, parseRefs, refId } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { download, exportAll, exportNotesMarkdown, importAll } from '../../db/ops';
import { fold } from '../../search/engine';
import { BOOK_ORDER } from '../../lib/canon';
import GraphPage from './GraphPage';

type Tab = 'notes' | 'graph' | 'highlights' | 'bookmarks' | 'collections' | 'xrefs' | 'saved' | 'history' | 'export';
const TABS: [Tab, string][] = [['notes', 'Notes'], ['graph', 'Knowledge graph'], ['highlights', 'Highlights'], ['bookmarks', 'Bookmarks'], ['collections', 'Collections'], ['xrefs', 'Connections'], ['saved', 'Saved'], ['history', 'History'], ['export', 'Export']];

export default function LibraryHome() {
  const loc = useLocation();
  const nav = useNavigate();
  const noteIdFromUrl = /\/library\/notes\/(\d+)/.exec(loc.pathname)?.[1];
  const [tab, setTab] = useState<Tab>('notes');
  return (
    <div className="page">
      <h1>Library</h1>
      <p className="lede">Your notes, highlights, bookmarks and collections. Private to this device unless you export them.</p>
      <div className="tabbar" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); if (noteIdFromUrl) nav('/library'); }}>{l}</button>)}</div>
      {tab === 'notes' && <Notes openId={noteIdFromUrl ? +noteIdFromUrl : undefined} />}
      {tab === 'graph' && <GraphPage />}
      {tab === 'highlights' && <Highlights />}
      {tab === 'bookmarks' && <Bookmarks />}
      {tab === 'collections' && <Collections />}
      {tab === 'xrefs' && <UserXrefs />}
      {tab === 'saved' && <Saved />}
      {tab === 'history' && <History />}
      {tab === 'export' && <ExportTab />}
    </div>
  );
}

function Notes({ openId }: { openId?: number }) {
  const notes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const folders = useLiveQuery(() => db.folders.toArray(), []) ?? [];
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [folder, setFolder] = useState<number | ''>('');
  const [kind, setKind] = useState('');
  const [editing, setEditing] = useState<Note | 'new' | 'question' | null>(null);
  const opened = openId ? notes.find((n) => n.id === openId) : undefined;
  const tags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))].sort(), [notes]);
  const list = notes.filter((n) => (!q || fold(`${n.title ?? ''} ${n.body} ${n.tags.join(' ')} ${n.targets.map(targetLabel).join(' ')}`).includes(fold(q))) && (!tag || n.tags.includes(tag)) && (folder === '' || n.folderId === folder) && (!kind || n.kind === kind));
  return (
    <>
      <div className="row" style={{ marginBottom: 8 }}>
        <input type="search" placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 160 }} aria-label="Search notes" />
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind"><option value="">All kinds</option>{['note', 'question', 'study', 'prayer'].map((k) => <option key={k}>{k}</option>)}</select>
        <select value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag"><option value="">Any tag</option>{tags.map((t) => <option key={t} value={t}>#{t}</option>)}</select>
        <select value={folder} onChange={(e) => setFolder(e.target.value ? +e.target.value : '')} aria-label="Folder"><option value="">Any folder</option>{folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <button className="btn small" onClick={() => { const n = prompt('Folder name'); if (n) db.folders.add({ name: n, createdAt: Date.now() }); }}>+ Folder</button>
        <button className="btn" onClick={() => setEditing('question')}>Add a question</button>
        <button className="btn primary" onClick={() => setEditing('new')}>New note</button>
      </div>
      {list.length === 0 && <div className="empty">No notes yet. Select a verse in the reader and tap the note icon, or start one here.</div>}
      {list.map((n) => (
        <div className="card" key={n.id}>
          <div className="row between"><h3>{n.title || (n.kind === 'question' ? 'Question' : 'Note')}</h3><span className="chip">{n.kind}</span></div>
          <div className="chips">{n.targets.map((t, i) => <TargetChip key={i} t={t} />)}</div>
          <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(n.body) }} />
          <div className="chips">{n.tags.map((t) => <span className="chip" key={t}>#{t}</span>)}{n.folderId && <span className="chip">📁 {folders.find((f) => f.id === n.folderId)?.name}</span>}</div>
          <div className="row" style={{ marginTop: 6 }}><button className="btn small" onClick={() => setEditing(n)}>Edit</button><span className="muted small">{new Date(n.updatedAt).toLocaleDateString()}</span></div>
        </div>
      ))}
      {(editing || opened) && <NoteEditor note={editing && typeof editing === 'object' ? editing : opened} kind={editing === 'question' ? 'question' : 'note'} onClose={() => setEditing(null)} />}
    </>
  );
}

export function TargetChip({ t }: { t: Target }) {
  if (t.type === 'passage') {
    const r = parseRefId(t.ref);
    return r ? <span className="chip"><RefLink refv={r} /></span> : null;
  }
  if (t.type === 'work') return <Link className="chip" to={`/study/works/${t.workId}/${t.section ?? ''}`}>{t.label}</Link>;
  if (t.type === 'episode') return <Link className="chip" to={`/listen/episode/${t.episodeId}`}>{t.label}</Link>;
  if (t.type === 'catechism') return <a className="chip" href={`https://www.scborromeo.org/ccc/para/${t.para}.htm`} target="_blank" rel="noreferrer">{t.label ?? `CCC §${t.para}`}</a>;
  if (t.type === 'commentary' && t.url) return <a className="chip" href={t.url} target="_blank" rel="noreferrer">{t.label}</a>;
  if (t.type === 'reading') return <Link className="chip" to={`/pray/readings/${t.date}`}>{t.label}</Link>;
  if (t.type === 'topic') return <Link className="chip" to={`/study/topics/${t.topicId}`}>{t.label}</Link>;
  return <span className="chip">{targetLabel(t)}</span>;
}

function Highlights() {
  const hs = useLiveQuery(() => db.highlights.toArray(), []) ?? [];
  const [color, setColor] = useState('');
  const list = hs.filter((h) => !color || h.color === color).sort((a, b) => BOOK_ORDER[a.book] - BOOK_ORDER[b.book] || a.c - b.c);
  return (
    <>
      <div className="chips" style={{ marginBottom: 8 }}>
        <button className={`chip${!color ? ' sel' : ''}`} onClick={() => setColor('')}>All</button>
        {['yellow', 'green', 'blue', 'pink', 'orange', 'purple'].map((c) => <button key={c} className={`chip${color === c ? ' sel' : ''}`} onClick={() => setColor(c)} style={{ borderLeft: `10px solid var(--hl-${c})` }}>{c}</button>)}
      </div>
      {list.length === 0 && <div className="empty">No highlights yet.</div>}
      <ul className="list">
        {list.map((h) => { const r = parseRefId(h.ref)!; return <li key={h.id} className="row between"><span><span className="chip" style={{ background: `var(--hl-${h.color})` }}>&nbsp;</span> <RefLink refv={r} /></span><button className="btn small ghost" onClick={() => db.highlights.delete(h.id!)}>Remove</button></li>; })}
      </ul>
    </>
  );
}

function Bookmarks() {
  const bs = useLiveQuery(() => db.bookmarks.orderBy('createdAt').reverse().toArray(), []) ?? [];
  return (
    <>
      {bs.length === 0 && <div className="empty">No bookmarks. Select a verse and tap the bookmark icon.</div>}
      <ul className="list">
        {bs.map((b) => { const r = parseRefId(b.ref)!; return <li key={b.id} className="row between"><span><RefLink refv={r} /> <span className="chip">{b.kind === 'later' ? 'study later' : 'bookmark'}</span></span><span className="row"><button className="btn small ghost" onClick={() => db.bookmarks.update(b.id!, { kind: b.kind === 'later' ? 'bookmark' : 'later' })}>{b.kind === 'later' ? 'Make bookmark' : 'Study later'}</button><button className="btn small ghost" onClick={() => db.bookmarks.delete(b.id!)}>Remove</button></span></li>; })}
      </ul>
    </>
  );
}

function Collections() {
  const cs = useLiveQuery(() => db.collections.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const saved = useLiveQuery(() => db.saved.toArray(), []) ?? [];
  const [name, setName] = useState('');
  const [adding, setAdding] = useState<Record<number, string>>({});
  const add = async (c: Collection, t: Target) => db.collections.put({ ...c, items: [...c.items, t], updatedAt: Date.now() });
  return (
    <>
      <div className="row" style={{ marginBottom: 10 }}>
        <input type="text" placeholder="New collection (e.g. Eucharist, Questions on Romans)" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }} />
        <button className="btn primary" onClick={async () => { if (name.trim()) { await db.collections.add({ name: name.trim(), items: [], createdAt: Date.now(), updatedAt: Date.now() }); setName(''); } }}>Create</button>
      </div>
      {cs.map((c) => (
        <div className="card" key={c.id}>
          <div className="row between"><h3>{c.name}</h3><button className="btn small danger" onClick={() => confirm('Delete this collection (its items are not deleted elsewhere)?') && db.collections.delete(c.id!)}>Delete</button></div>
          <div className="chips">{c.items.map((t, i) => <span key={i}><TargetChip t={t} /> <button aria-label="Remove item" style={{ border: 0, background: 'none' }} onClick={() => db.collections.put({ ...c, items: c.items.filter((_, j) => j !== i), updatedAt: Date.now() })}>×</button></span>)}</div>
          {c.items.length === 0 && <div className="empty">Empty. Add a passage or a saved item.</div>}
          <div className="row" style={{ marginTop: 6 }}>
            <input type="text" placeholder="Add passage, e.g. John 6:51-58" value={adding[c.id!] ?? ''} onChange={(e) => setAdding({ ...adding, [c.id!]: e.target.value })} onKeyDown={async (e) => { if (e.key === 'Enter') { const p = parseRefs(adding[c.id!] ?? ''); if (p.ok) { for (const x of p.refs) await add(c, { type: 'passage', ref: refId(convertRef('kjv', 'vulgate', x.ref).ref) }); setAdding({ ...adding, [c.id!]: '' }); } } }} style={{ flex: 1 }} aria-label="Add passage to collection" />
            {saved.length > 0 && <select aria-label="Add a saved item" value="" onChange={(e) => { const s = saved.find((x) => x.id === +e.target.value); if (s) add(c, s.type === 'catechism' ? { type: 'catechism', para: +s.key.split(':')[1], label: s.label } : { type: 'commentary', itemId: s.key, label: s.label, url: s.url }); }}><option value="">Add saved item…</option>{saved.map((s) => <option key={s.id} value={s.id}>{s.label.slice(0, 50)}</option>)}</select>}
          </div>
        </div>
      ))}
      {cs.length === 0 && <div className="empty">Collections gather passages, readings, Catechism paragraphs and notes around a topic.</div>}
    </>
  );
}

function UserXrefs() {
  const xs = useLiveQuery(() => db.userXrefs.toArray(), []) ?? [];
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [err, setErr] = useState('');
  const add = async () => {
    const pa = parseRefs(a);
    const pb = parseRefs(b);
    if (!pa.ok || !pb.ok) return setErr('Check both passages.');
    setErr('');
    await db.userXrefs.add({ from: refId(convertRef('kjv', 'vulgate', pa.refs[0].ref).ref), to: refId(convertRef('kjv', 'vulgate', pb.refs[0].ref).ref), comment: c, createdAt: Date.now() });
    setA(''); setB(''); setC('');
  };
  return (
    <>
      <p className="muted small">Personal cross-references connect any two passages with a note of your own. They appear only to you.</p>
      <div className="row" style={{ marginBottom: 8 }}>
        <input type="text" placeholder="From, e.g. Gen 22" value={a} onChange={(e) => setA(e.target.value)} /><input type="text" placeholder="To, e.g. Heb 11:17-19" value={b} onChange={(e) => setB(e.target.value)} /><input type="text" placeholder="Why? (optional)" value={c} onChange={(e) => setC(e.target.value)} style={{ flex: 1 }} /><button className="btn primary" onClick={add}>Connect</button>
      </div>
      {err && <div className="notice">{err}</div>}
      <ul className="list">{xs.map((x) => <li key={x.id} className="row between"><span><RefLink id={x.from} /> ↔ <RefLink id={x.to} /> {x.comment && <span className="muted small"> — {x.comment}</span>}</span><button className="btn small ghost" onClick={() => db.userXrefs.delete(x.id!)}>Remove</button></li>)}</ul>
      {xs.length === 0 && <div className="empty">None yet.</div>}
    </>
  );
}

function Saved() {
  const items = useLiveQuery(() => db.saved.orderBy('createdAt').reverse().toArray(), []) ?? [];
  return (
    <>
      {items.length === 0 && <div className="empty">Saved readings, Catechism paragraphs and sections of the Fathers appear here.</div>}
      <ul className="list">{items.map((s) => <li key={s.id} className="row between"><span><span className="chip">{s.type}</span> {s.url ? <a href={s.url} target={s.url.startsWith('#') ? undefined : '_blank'} rel="noreferrer">{s.label}</a> : s.label}</span><button className="btn small ghost" onClick={() => db.saved.delete(s.id!)}>Remove</button></li>)}</ul>
    </>
  );
}

function History() {
  const hs = useLiveQuery(() => db.history.orderBy('ts').reverse().limit(100).toArray(), []) ?? [];
  const nav = useNavigate();
  return (
    <>
      <div className="row between"><span className="muted small">Last 100 items opened.</span><button className="btn small" onClick={() => confirm('Clear reading history?') && db.history.clear()}>Clear</button></div>
      <ul className="list">
        {hs.map((h) => (
          <li key={h.id}><button className="btn ghost" style={{ padding: 0 }} onClick={() => {
            if (h.type === 'read') { const r = parseRefId(h.ref); if (r) nav(`/read/dra/${r.book}/${r.c1}`); }
            else if (h.type === 'work') nav(`/study/works/${h.ref}`);
            else if (h.type === 'episode') nav(`/listen/episode/${h.ref}`);
          }}>{h.label}</button> <span className="muted small">{new Date(h.ts).toLocaleString()}</span></li>
        ))}
      </ul>
    </>
  );
}

function ExportTab() {
  const [msg, setMsg] = useState('');
  return (
    <>
      <div className="card">
        <h3>Export</h3>
        <p className="muted">Take your notes with you. The JSON file contains everything (notes, highlights, bookmarks, collections, journal, plan progress, listening progress) and can be re-imported; the Markdown file is a readable copy of your notes for any other app. Scripture links use stable Vulgate-anchored ids, so they keep working across translations.</p>
        <div className="row">
          <button className="btn primary" onClick={async () => download(`studybible-export-${new Date().toISOString().slice(0, 10)}.json`, await exportAll())}>Export everything (JSON)</button>
          <button className="btn" onClick={async () => download('studybible-notes.md', await exportNotesMarkdown(), 'text/markdown')}>Export notes (Markdown)</button>
        </div>
      </div>
      <div className="card">
        <h3>Import</h3>
        <p className="muted small">Merging adds the file’s items to what is already here.</p>
        <input type="file" accept="application/json" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setMsg(`Imported ${await importAll(await f.text(), 'merge')} items.`); } catch (err: any) { setMsg(err.message); } }} />
        {msg && <p className="small">{msg}</p>}
      </div>
    </>
  );
}
