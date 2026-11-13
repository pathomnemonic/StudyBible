import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, newUid, type Collection, type Target } from '../../db/db';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { formatRef, parseRefId, parseRefs, refId } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { collectionHtml, collectionMarkdown, moveItem, resolveAll, type Resolved } from '../../lib/collections';
import { download } from '../../db/ops';

/** One collection opened out: every item read back to its original (never copied), with ways to reorder, add from your own notes and marks, and export. */
export default function CollectionPage() {
  const { id } = useParams();
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const ed = get(s.defaultEdition) ?? editions[0];
  const c = useLiveQuery(() => db.collections.get(Number(id)), [id]);
  const notes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const highlights = useLiveQuery(() => db.highlights.toArray(), []) ?? [];
  const bookmarks = useLiveQuery(() => db.bookmarks.toArray(), []) ?? [];
  const [items, setItems] = useState<Resolved[]>([]);
  const [msg, setMsg] = useState('');
  const [pass, setPass] = useState('');
  const [ccc, setCcc] = useState('');
  const [url, setUrl] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [qText, setQText] = useState('');
  const [qKind, setQKind] = useState<'question' | 'note'>('question');
  const key = c ? JSON.stringify(c.items) : '';
  useEffect(() => { let live = true; if (c && ed) resolveAll(c, ed).then((r) => live && setItems(r)); return () => { live = false; }; }, [key, ed?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (patch: Partial<Collection>) => { if (c) await db.collections.put({ ...c, ...patch, updatedAt: Date.now() }); };
  const add = async (t: Target) => {
    if (!c) return;
    const dup = c.items.some((x) => JSON.stringify(x) === JSON.stringify(t));
    if (dup) { setMsg('That is already in this collection.'); return; }
    setMsg('');
    await save({ items: [...c.items, t] });
  };
  /** the reference by identity: an older record without one is given one first */
  const uidOf = async (table: 'notes' | 'highlights' | 'bookmarks', rowId: number) => {
    const row: { uid?: string } | undefined = await db.table(table).get(rowId);
    if (row?.uid) return row.uid;
    const uid = newUid();
    await db.table(table).update(rowId, { uid });
    return uid;
  };

  if (c === undefined) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!c) return <div className="page"><h1>Collection not found</h1><p><Link to="/library?tab=collections">Back to your collections</Link></p></div>;

  const addPassage = async () => {
    const p = parseRefs(pass);
    if (!p.ok) { setMsg('Check the passage, for example John 6:51-58.'); return; }
    await add({ type: 'passage', ref: refId(convertRef('kjv', 'vulgate', p.refs[0].ref).ref) });
    setPass('');
  };
  const addQuestion = async () => {
    if (!qText.trim()) return;
    const noteId = await db.notes.add({ kind: qKind, title: '', body: qText.trim(), targets: [], tags: [], chapterKeys: [], createdAt: Date.now(), updatedAt: Date.now() } as never) as number;
    await add({ type: 'note', uid: await uidOf('notes', noteId) });
    setQText('');
  };
  const move = (from: number, to: number) => void save({ items: moveItem(c.items, from, to) });
  const base = (n: string) => n.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'collection';
  const exportMd = () => download(`${base(c.name)}.md`, collectionMarkdown(c, items), 'text/markdown');
  const exportPdf = () => { const w = window.open('', '_blank'); if (!w) { setMsg('Your browser blocked the print window. Allow pop-ups for this site and try again.'); return; } w.document.write(collectionHtml(c, items)); w.document.close(); w.focus(); setTimeout(() => w.print(), 400); };

  return (
    <div className="page collection-page">
      <p className="small"><Link to="/library?tab=collections">← Collections</Link></p>
      <h1><input aria-label="Collection name" className="cp-name" value={c.name} onChange={(e) => void save({ name: e.target.value })} /></h1>
      <textarea aria-label="What this collection is for" className="cp-desc" rows={2} placeholder="What is this collection for? (optional)" value={c.description ?? ''} onChange={(e) => void save({ description: e.target.value })} />
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', margin: '8px 0 14px' }}>
        <button className="btn" onClick={exportMd} disabled={!items.length}>Export as Markdown</button>
        <button className="btn" onClick={exportPdf} disabled={!items.length}>Print or save as PDF</button>
        <span className="muted small" style={{ alignSelf: 'center' }}>{items.length} {items.length === 1 ? 'item' : 'items'}. Items point to the originals; nothing is copied.</span>
      </div>
      {msg && <p className="notice" role="status">{msg}</p>}

      <ol className="cp-list">
        {items.map((r, i) => (
          <li key={i} className="card cp-item">
            <div className="row between" style={{ gap: 8 }}>
              <span><span className="chip">{r.kind}</span> <strong>{r.title}</strong></span>
              <span className="row" style={{ gap: 4 }}>
                <button className="icon-btn" aria-label={`Move ${r.title} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>↑</button>
                <button className="icon-btn" aria-label={`Move ${r.title} down`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>↓</button>
                <button className="icon-btn" aria-label={`Remove ${r.title} from this collection`} onClick={() => void save({ items: c.items.filter((_, k) => k !== i) })}>✕</button>
              </span>
            </div>
            {r.missing && <p className="muted small">The original is no longer here (it may have been deleted). Remove this item, or restore it from Recently deleted.</p>}
            {r.text && <p className="cp-text clamp">{r.text}</p>}
            <p className="small">{r.to ? <Link to={r.to}>Open the original</Link> : r.url ? <a href={r.url} target="_blank" rel="noreferrer">Open the original ↗</a> : null}</p>
          </li>
        ))}
      </ol>
      {!items.length && <p className="muted">Nothing here yet. Add passages, your own notes, highlights and bookmarks, Catechism paragraphs, links and questions with the Add box.</p>}

      <section className="card" aria-label="Add to this collection">
        <h2 className="card-title">Add to this collection</h2>
        <div className="cp-add">
          <label>A passage or range
            <span className="row"><input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="John 6:51-58" onKeyDown={(e) => e.key === 'Enter' && void addPassage()} /><button className="btn small" onClick={() => void addPassage()}>Add</button></span>
          </label>
          <label>One of my notes
            <select value="" onChange={async (e) => { const n = notes.find((x) => x.id === +e.target.value); if (n) await add({ type: 'note', uid: await uidOf('notes', n.id!) }); }}>
              <option value="">Choose a note…</option>
              {notes.map((n) => <option key={n.id} value={n.id}>{(n.title || n.body.split('\n')[0] || 'Note').slice(0, 60)}</option>)}
            </select>
          </label>
          <label>One of my highlights
            <select value="" onChange={async (e) => { const h = highlights.find((x) => x.id === +e.target.value); if (h) await add({ type: 'highlight', uid: await uidOf('highlights', h.id!) }); }}>
              <option value="">Choose a highlight…</option>
              {highlights.map((h) => { const r = parseRefId(h.ref); return <option key={h.id} value={h.id}>{r ? formatRef(r) : h.ref} ({h.color})</option>; })}
            </select>
          </label>
          <label>One of my bookmarks
            <select value="" onChange={async (e) => { const b = bookmarks.find((x) => x.id === +e.target.value); if (b) await add({ type: 'bookmark', uid: await uidOf('bookmarks', b.id!) }); }}>
              <option value="">Choose a bookmark…</option>
              {bookmarks.map((b) => { const r = parseRefId(b.ref); return <option key={b.id} value={b.id}>{b.label || (r ? formatRef(r) : b.ref)}</option>; })}
            </select>
          </label>
          <label>A Catechism paragraph
            <span className="row"><input value={ccc} inputMode="numeric" onChange={(e) => setCcc(e.target.value)} placeholder="1324" /><button className="btn small" onClick={async () => { const n = parseInt(ccc, 10); if (n >= 1 && n <= 2865) { await add({ type: 'catechism', para: n }); setCcc(''); } else setMsg('The Catechism has paragraphs 1 to 2865.'); }}>Add</button></span>
          </label>
          <label>A source link
            <span className="row"><input value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} placeholder="Title" /><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /><button className="btn small" onClick={async () => { if (/^https?:\/\//i.test(url) && urlTitle.trim()) { await add({ type: 'link', url, label: urlTitle.trim() }); setUrl(''); setUrlTitle(''); } else setMsg('Give the link a title and an address that starts with http:// or https://.'); }}>Add</button></span>
          </label>
          <label>A new question or reflection
            <select value={qKind} onChange={(e) => setQKind(e.target.value as 'question' | 'note')} aria-label="Question or reflection"><option value="question">Question</option><option value="note">Reflection</option></select>
            <textarea rows={2} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Write it here; it is saved as one of your notes and listed here." />
            <button className="btn small" onClick={() => void addQuestion()}>Add</button>
          </label>
        </div>
        <p className="muted small">Church documents, Church writings and commentary join a collection from their own pages with “Add to collection”; they appear here with a link back to where they came from.</p>
      </section>
    </div>
  );
}
