import { beginSave } from '../lib/dirty';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

/** The teacher's own notes on a lesson: what to change, what worked, what to add. Kept as an ordinary note (tagged with the lesson), so it is saved, backed up and synced with everything else. */
export default function MyLessonNotes({ grade, lessonId, title }: { grade: string; lessonId: string; title: string }) {
  const tag = `lesson:${grade}/${lessonId}`;
  const note = useLiveQuery(async () => (await db.notes.toArray()).find((n) => n.tags.includes(tag)), [tag]);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { setText(note?.body ?? ''); setSaved(false); }, [note?.id, tag]);
  const save = async () => {
    const body = text.trim();
    const done = beginSave(`lesson-notes:${tag}`);
    if (note?.id) { if (body) await db.notes.put({ ...note, body, updatedAt: Date.now() }); else await db.notes.delete(note.id); }
    else if (body) await db.notes.add({ kind: 'study', title: `My notes on the lesson: ${title}`, body, targets: [], tags: [tag], chapterKeys: [], createdAt: Date.now(), updatedAt: Date.now() } as never);
    done();
    setSaved(true);
  };
  return (
    <section className="sect no-print" aria-label="My notes on this lesson">
      <h2 className="eyebrow-h">My notes on this lesson</h2>
      <p className="small muted">What you change, what worked, what to add next time. Saved on this device with your other notes, and in your backups.</p>
      <textarea data-editor={`lesson-notes:${tag}`} value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} rows={4} style={{ width: '100%' }} aria-label="My notes on this lesson" />
      <div className="row" style={{ gap: 8 }}>
        <button className="btn small" onClick={() => void save()} disabled={!text.trim() && !note}>Save my notes</button>
        {saved && <span className="muted small" role="status">Saved.</span>}
      </div>
    </section>
  );
}
