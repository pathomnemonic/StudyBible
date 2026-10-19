import { useState } from 'react';
import Modal from './Modal';
import { db } from '../db/db';
import { formatRef, parseRefId, parseRefs, refId } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { useToast } from './Toast';

/** Hostnames of publishers the app knows by name; the link is filed under that publisher's tab. */
export const SOURCE_BY_HOST: [RegExp, string, string][] = [
  [/(^|\.)catholic\.com$/, 'catholic-answers', 'Catholic Answers'],
  [/(^|\.)wordonfire\.org$/, 'word-on-fire', 'Word on Fire'],
  [/(^|\.)ascensionpress\.com$|(^|\.)ascensionpresents\.com$/, 'ascension', 'Ascension'],
];

export function sourceOf(url: string): { id?: string; name: string } {
  try {
    const h = new URL(url).hostname;
    const hit = SOURCE_BY_HOST.find(([re]) => re.test(h));
    return hit ? { id: hit[1], name: hit[2] } : { name: h.replace(/^www\./, '') };
  } catch {
    return { name: url };
  }
}

/** Attach any web page to a passage. The link is stored in the user's own library (and synced), never shared. */
export default function AddLinkDialog({ passages, initialUrl = '', initialTitle = '', onClose }: { passages: string[]; initialUrl?: string; initialTitle?: string; onClose: (saved?: boolean) => void }) {
  const toast = useToast();
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [note, setNote] = useState('');
  const [refText, setRefText] = useState('');
  const [err, setErr] = useState('');
  const src = url ? sourceOf(url) : null;

  const save = async () => {
    if (!/^https?:\/\//i.test(url.trim())) return setErr('Paste the full web address, starting with https://');
    const refs = [...passages];
    if (refText.trim()) {
      const p = parseRefs(refText);
      if (!p.ok) return setErr(p.error);
      for (const x of p.refs) refs.push(refId(convertRef('kjv', 'vulgate', x.ref).ref));
    }
    if (!refs.length) return setErr('Choose at least one passage.');
    const now = Date.now();
    for (const ref of refs) await db.userLinks.add({ ref, url: url.trim(), title: title.trim() || src?.name || url, sourceId: src?.id, note: note.trim() || undefined, createdAt: now });
    toast(`Link attached to ${refs.length} passage${refs.length === 1 ? '' : 's'}.`);
    onClose(true);
  };

  return (
    <Modal title="Attach a link to this passage" onClose={() => onClose()}>
      <p className="muted small">Found an article, video or episode that discusses this passage? Attach it so it appears next to the verse, in your library only. You choose the passage; nothing is copied from the page.</p>
      {passages.length > 0 && (
        <div className="chips" style={{ marginBottom: 8 }}>
          {passages.map((p) => (
            <span className="chip" key={p}>{formatRef(parseRefId(p)!)}</span>
          ))}
        </div>
      )}
      <label className="field"><span>Web address</span><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.catholic.com/qa/…" autoFocus /></label>
      {src && <p className="small muted" style={{ marginTop: -6 }}>Will be filed under <strong>{src.id ? src.name : 'Links you added'}</strong>.</p>}
      <label className="field"><span>Title</span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is it called?" /></label>
      <label className="field"><span>Your note (optional)</span><input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why it is useful, in your own words" /></label>
      <label className="field"><span>{passages.length ? 'Also attach to another passage (optional)' : 'Passage'}</span><input type="text" value={refText} onChange={(e) => setRefText(e.target.value)} placeholder="e.g. John 6:51-58" /></label>
      {err && <div className="notice">{err}</div>}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => onClose()}>Cancel</button>
        <button className="btn primary" onClick={save}>Attach link</button>
      </div>
    </Modal>
  );
}
