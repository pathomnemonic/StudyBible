import { useState } from 'react';
import Modal from './Modal';
import { db, type Note, type NoteKind, type Target } from '../db/db';
import { saveNote } from '../db/ops';
import { renderMarkdown } from '../lib/markdown';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatRef, parseRefId, parseRefs } from '../lib/refs';
import { refId } from '../lib/refs';

export function targetLabel(t: Target): string {
  if (t.type === 'passage') {
    const r = parseRefId(t.ref);
    return r ? formatRef(r) : t.ref;
  }
  if (t.type === 'catechism') return t.label ?? `CCC ${t.para}`;
  return t.label;
}

export default function NoteEditor({
  note,
  initialTargets = [],
  kind = 'note',
  originEdition,
  onClose,
}: {
  note?: Note;
  initialTargets?: Target[];
  kind?: NoteKind;
  originEdition?: string;
  onClose: (saved?: number) => void;
}) {
  const [body, setBody] = useState(note?.body ?? '');
  const [title, setTitle] = useState(note?.title ?? '');
  const [k, setK] = useState<NoteKind>(note?.kind ?? kind);
  const [targets, setTargets] = useState<Target[]>(note?.targets ?? initialTargets);
  const [tags, setTags] = useState((note?.tags ?? []).join(', '));
  const [folderId, setFolderId] = useState<number | undefined>(note?.folderId);
  const [addRef, setAddRef] = useState('');
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(false);
  const folders = useLiveQuery(() => db.folders.toArray(), []) ?? [];

  const addPassage = () => {
    const r = parseRefs(addRef);
    if (!r.ok) return setErr(r.error + (r.suggestions.length ? ' — did you mean ' + r.suggestions.join(', ') + '?' : ''));
    setErr('');
    setTargets([...targets, ...r.refs.map((p) => ({ type: 'passage' as const, ref: refId(p.ref) }))]);
    setAddRef('');
  };

  const save = async () => {
    if (!body.trim() && !title.trim()) return onClose();
    const id = await saveNote({
      id: note?.id,
      title: title.trim() || undefined,
      body,
      kind: k,
      targets,
      folderId,
      tags: tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
      originEdition: note?.originEdition ?? originEdition,
    });
    onClose(id);
  };

  const remove = async () => {
    if (note?.id && confirm('Delete this note? This cannot be undone.')) {
      await db.notes.delete(note.id);
      onClose();
    }
  };

  return (
    <Modal title={note ? 'Edit note' : k === 'question' ? 'New question' : 'New note'} onClose={() => onClose()}>
      <div className="row" style={{ marginBottom: 8 }}>
        {(['note', 'question', 'study', 'prayer'] as NoteKind[]).map((x) => (
          <button key={x} className={`chip${k === x ? ' sel' : ''}`} onClick={() => setK(x)}>
            {x}
          </button>
        ))}
      </div>
      <input type="text" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
      <div className="chips" style={{ marginBottom: 8 }}>
        {targets.map((t, i) => (
          <span key={i} className="chip">
            {targetLabel(t)}{' '}
            <button style={{ border: 0, background: 'none', cursor: 'pointer' }} aria-label={`Remove ${targetLabel(t)}`} onClick={() => setTargets(targets.filter((_, j) => j !== i))}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="row" style={{ marginBottom: 8 }}>
        <input type="text" placeholder="Connect another passage, e.g. 1 Cor 11:23-26" value={addRef} onChange={(e) => setAddRef(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPassage()} style={{ flex: 1 }} aria-label="Connect another passage" />
        <button className="btn small" onClick={addPassage}>
          Add
        </button>
      </div>
      {err && <div className="notice">{err}</div>}
      <div className="row between small muted" style={{ marginBottom: 4 }}>
        <span>Markdown supported (**bold**, *italic*, &gt; quote, - lists)</span>
        <button className="btn small ghost" onClick={() => setPreview(!preview)}>
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>
      {preview ? <div className="md card" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} /> : <textarea value={body} onChange={(e) => setBody(e.target.value)} autoFocus aria-label="Note text" />}
      <div className="row" style={{ marginTop: 8 }}>
        <input type="text" placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} style={{ flex: 1 }} aria-label="Tags" />
        <select value={folderId ?? ''} onChange={(e) => setFolderId(e.target.value ? +e.target.value : undefined)} aria-label="Folder">
          <option value="">No folder</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      <p className="muted small">Notes are private and stored only on this device unless you export them.</p>
      <div className="row between">
        <div>{note?.id && <button className="btn danger" onClick={remove}>Delete</button>}</div>
        <div className="row">
          <button className="btn" onClick={() => onClose()}>
            Cancel
          </button>
          <button className="btn primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
