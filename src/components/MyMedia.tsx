import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { parseRefs, refId } from '../lib/refs';
import { convertRef } from '../lib/versification';
import RefLink from './RefLink';
import InlinePlayer from './InlinePlayer';
import { embedFor } from '../lib/embed';

/** Extract an 11-character YouTube id from the common URL shapes. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1, 12);
    if (u.hostname.endsWith('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = /^\/(?:embed|shorts|live)\/([\w-]{11})/.exec(u.pathname);
      return m?.[1] ?? null;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/**
 * A personal queue of links to Catholic media (videos, talks, other podcasts). YouTube links can be played through
 * YouTube's own privacy-enhanced embed, which is the platform-sanctioned way; everything else opens at the publisher.
 * Nothing is downloaded or re-hosted.
 */
export default function MyMedia() {
  const items = useLiveQuery(() => db.media.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [ref, setRef] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const add = async () => {
    if (!/^https?:\/\//.test(url)) return;
    const p = ref.trim() ? parseRefs(ref) : null;
    await db.media.add({ title: title.trim() || url, url, refs: p && p.ok ? p.refs.map((x) => refId(convertRef('kjv', 'vulgate', x.ref).ref)) : [], createdAt: Date.now() });
    setTitle('');
    setUrl('');
    setRef('');
  };
  return (
    <section className="card" style={{ marginTop: 16 }}>
      <h3>My media queue</h3>
      <p className="muted small">Add a link to any video, talk or podcast episode, optionally tied to a passage. YouTube, Spotify, Apple Podcasts and Vimeo links, and direct audio files, play right here; others open at the publisher. Include only content you are allowed to watch; credit stays with the original publisher.</p>
      <div className="row">
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} style={{ flex: 1, minWidth: 180 }} aria-label="Media URL" />
        <input type="text" placeholder="Passage (optional)" value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Passage" />
        <button className="btn" onClick={add}>Add</button>
      </div>
      <ul className="list">
        {items.map((m) => {
          const yt = embedFor(m.url);
          return (
            <li key={m.id}>
              <div className="row between">
                <span>{m.title} <span className="muted small">{new URL(m.url).hostname}</span> {m.refs.map((r) => <span className="chip" key={r}><RefLink id={r} /></span>)}</span>
                <span className="row">
                  {yt && <button className="btn small" onClick={() => setOpen(open === m.id ? null : m.id!)}>{open === m.id ? 'Hide' : 'Play here'}</button>}
                  <a className="btn small" href={m.url} target="_blank" rel="noreferrer">Original ↗</a>
                  <button className="btn small ghost" onClick={() => db.media.delete(m.id!)}>Remove</button>
                </span>
              </div>
              {yt && open === m.id && <InlinePlayer embed={yt} title={m.title} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
