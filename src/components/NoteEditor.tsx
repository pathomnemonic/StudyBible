import { useState } from 'react';
import { useToast } from './Toast';
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

/** Optional starting structures; a free-form note stays the default. */
const TEMPLATES: { name: string; text: string }[] = [
  { name: 'Observe · Interpret · Apply', text: '## Observe\nWhat does the text say? Who, what, where, when?\n\n## Interpret\nWhat does it mean? What does the Church teach about it?\n\n## Apply\nWhat is God asking of me?\n' },
  { name: 'Lectio divina', text: '## Lectio (read)\n\n## Meditatio (what word or phrase stays with me?)\n\n## Oratio (my prayer in response)\n\n## Contemplatio (resting in God)\n' },
  { name: 'Questions to follow up', text: '## Questions\n- \n- \n\n## Where I could look\n- \n' },
  { name: 'Argument map', text: '## Claim\nWhat is the author arguing?\n\n## Because (premise or evidence)\n- \n\n## But (contrast or objection)\n- \n\n## Therefore (conclusion)\n\n## Question the author answers\n' },
  { name: 'Historical context', text: '## Setting\nAuthor, audience, date, place:\n\n## Background\n\n## Why it matters for the passage\n' },
];

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
  const toast = useToast();
  const [body, setBody] = useState(note?.body ?? '');
  const [title, setTitle] = useState(note?.title ?? '');
  const [k, setK] = useState<NoteKind>(note?.kind ?? kind);
  const [targets, setTargets] = useState<Target[]>(note?.targets ?? initialTargets);
  const [tags, setTags] = useState((note?.tags ?? []).join(', '));
  const [folderId, setFolderId] = useState<number | undefined>(note?.folderId);
  const [addRef, setAddRef] = useState('');
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(false);
  const [revisit, setRevisit] = useState<number | undefined>(note?.revisitAt);
  const [dictating, setDictating] = useState(false);
  const SR = typeof window !== 'undefined' ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition) : undefined;
  const dictate = () => {
    if (!SR) return;
    const r = new SR();
    r.lang = navigator.language || 'en-US';
    r.interimResults = false;
    r.onresult = (e: any) => setBody((b) => `${b}${b && !/\s$/.test(b) ? ' ' : ''}${Array.from(e.results).map((x: any) => x[0].transcript).join(' ')}`);
    r.onend = () => setDictating(false);
    r.onerror = () => setDictating(false);
    setDictating(true);
    r.start();
  };
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
      revisitAt: revisit,
    } as any);
    if (!note?.id) { try { if (!localStorage.getItem('sb:backupNudge')) { localStorage.setItem('sb:backupNudge', '1'); toast('Saved on this device. Keep a copy any time in Settings → Export.'); } } catch { /* private mode */ } }
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
      {!preview && !body.trim() && (
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', margin: '6px 0' }} aria-label="Optional note templates">
          <span className="muted small">Start from:</span>
          {TEMPLATES.map((t) => <button type="button" key={t.name} className="btn small" onClick={() => setBody(t.text)}>{t.name}</button>)}
        </div>
      )}
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
      <div className="row" style={{ marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
        <label className="small">Remind me to come back to this{' '}
          <select value={revisit && revisit > Date.now() ? 'set' : revisit ? 'due' : ''} onChange={(e) => { const v = e.target.value; const d = (n: number) => Date.now() + n * 86400000; setRevisit(v === '' ? undefined : v === 'week' ? d(7) : v === 'month' ? d(30) : v === 'season' ? d(90) : revisit); }} aria-label="Come back to this">
            <option value="">no</option>
            {revisit && <option value={revisit > Date.now() ? 'set' : 'due'}>{`on ${new Date(revisit).toLocaleDateString()}`}</option>}
            <option value="week">in a week</option><option value="month">in a month</option><option value="season">in three months</option>
          </select>
        </label>
        {SR && !preview && <button type="button" className="btn small" aria-pressed={dictating} onClick={dictate} disabled={dictating}>{dictating ? 'Listening…' : '🎤 Dictate'}</button>}
      </div>
      {SR && <p className="muted small">Dictation uses your browser’s speech service; on some browsers the audio is sent to the browser’s maker to be turned into text. Nothing is recorded or kept by this app.</p>}
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
