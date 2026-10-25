import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getLibraryIndex, getWork, type LibraryWorkMeta } from '../../data/content';
import { db } from '../../db/db';
import { useSettings } from '../../lib/store';
import RefLink from '../../components/RefLink';
import NoteEditor from '../../components/NoteEditor';
import TextSettings from '../../components/TextSettings';
import Icon from '../../components/Icon';
import { RecordedWork } from '../../components/RecordedBooks';
import BiblePane from '../../components/BiblePane';
import { useWakeLock } from '../../lib/wakeLock';
import { fold } from '../../search/engine';

export default function WorkReader() {
  const { workId = '', section } = useParams();
  const nav = useNavigate();
  // /room/... is the same reader with a Bible chapter open beside it
  const together = useLocation().pathname.startsWith('/room');
  const base = together ? '/room/work' : '/study/works';
  const [paneOpen, setPaneOpen] = useState(false);
  const [meta, setMeta] = useState<LibraryWorkMeta | null>(null);
  const [work, setWork] = useState<Awaited<ReturnType<typeof getWork>>>(null);
  const [toc, setToc] = useState(false);
  const [find, setFind] = useState('');
  const [note, setNote] = useState(false);
  const [settings, setSettings] = useSettings();
  useWakeLock(settings.keepAwake);
  const [ts, setTs] = useState(false);
  const idx = Math.max(0, Number(section ?? 0) || 0);

  useEffect(() => {
    getLibraryIndex().then((l) => setMeta(l?.works.find((w) => w.id === workId) ?? null));
    setWork(null);
    getWork(workId).then(setWork).catch(() => setWork(null));
  }, [workId]);
  const sec = work?.sections[idx];
  useEffect(() => {
    if (!sec) return;
    db.libraryProgress.put({ workId, section: String(idx), updatedAt: Date.now() });
    db.history.add({ ts: Date.now(), type: 'work', ref: `${workId}/${idx}`, label: `${meta?.title ?? workId}: ${sec.title}` });
    window.scrollTo(0, 0);
    document.title = `${sec.title} · ${meta?.title ?? ''}`;
  }, [workId, idx, !!sec]);

  const matches = useMemo(() => {
    if (!work || !find.trim()) return [];
    const f = fold(find);
    const out: { i: number; title: string }[] = [];
    work.sections.forEach((s, i) => {
      if (s.paras.some((p) => fold(p).includes(f))) out.push({ i, title: s.title });
    });
    return out.slice(0, 60);
  }, [work, find]);

  if (!meta) return <div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /><i /></div>;
  if (!work || !sec) return <div className="center-note">Loading text…</div>;
  const go = (i: number) => nav(`${base}/${workId}/${i}`);
  const quiet = settings.scriptureOnly;
  return (
    <div className={`page${together ? ' room-together' : ''}`} style={{ maxWidth: 'none' }}>
      {!quiet && (
        <div className="row between" style={{ maxWidth: together ? 'none' : 760, margin: '0 auto' }}>
          <Link to={'/room'} className="small">← Reading room</Link>
          <div className="row">
            {together ? <button className="btn small room-switch" onClick={() => setPaneOpen(!paneOpen)} aria-pressed={paneOpen}>{paneOpen ? 'Show the text' : 'Show the Bible'}</button> : <Link className="btn small" to={`/room/work/${workId}/${idx}`}>Read with the Bible</Link>}
            <button className="btn small" onClick={() => setToc(!toc)}>Contents</button>
            <button className="icon-btn" onClick={() => setTs(true)} aria-label="Text settings"><Icon name="text" /></button>
            <button className="icon-btn" aria-pressed={quiet} onClick={() => setSettings({ scriptureOnly: true })} aria-label="Reading mode" title="Reading mode (hide navigation)"><Icon name="expand" /></button>
          </div>
        </div>
      )}
      {!quiet && <RecordedWork workId={workId} />}
      {quiet && <button className="btn small" style={{ position: 'fixed', top: 8, right: 8 }} onClick={() => setSettings({ scriptureOnly: false })}>Exit reading mode</button>}
      {toc && !quiet && (
        <div className="card" style={{ maxWidth: 760, margin: '10px auto' }}>
          <input type="search" placeholder="Find in this work…" value={find} onChange={(e) => setFind(e.target.value)} style={{ width: '100%', marginBottom: 8 }} aria-label="Find in this work" />
          {find && <div className="small muted">{matches.length} section{matches.length === 1 ? '' : 's'} contain “{find}”</div>}
          <ol className="list" style={{ maxHeight: 320, overflow: 'auto' }} start={1}>
            {(find ? matches : work.sections.map((s, i) => ({ i, title: s.title }))).map((s) => (
              <li key={s.i}><button className="btn small ghost" onClick={() => { go(s.i); setToc(false); }}>{s.i + 1}. {s.title}</button></li>
            ))}
          </ol>
        </div>
      )}
      <div className={together ? `room-cols${paneOpen ? ' pane-open' : ''}` : undefined}>
      <article className="work-text" style={{ padding: '12px 4px 120px' }}>
        <div className="muted small" style={{ fontFamily: 'var(--font-sans)' }}>{meta.title} · {meta.author}</div>
        <h2>{sec.title}</h2>
        {!quiet && sec.scripture.length > 0 && (
          <div className="chips" style={{ fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
            <span className="muted small">On:</span>
            {sec.scripture.map((s) => <span className="chip" key={s}><RefLink id={s} /> · <Link to={`/study/passage/${s}`}>study</Link></span>)}
          </div>
        )}
        {sec.paras.map((p, i) => (
          <p key={i}>{find && fold(p).includes(fold(find)) ? <HL text={p} q={find} /> : p}</p>
        ))}
        {!quiet && (
          <div style={{ fontFamily: 'var(--font-sans)' }}>
            <hr />
            <p className="muted small">
              Translator/edition: {meta.translator}. Text: {meta.source.name} (<a href={meta.source.url} target="_blank" rel="noreferrer">original ↗</a>), public domain — {meta.rightsEvidence}
            </p>
            <div className="row">
              <button className="btn" disabled={idx === 0} onClick={() => go(idx - 1)}>← Previous</button>
              <button className="btn" disabled={idx >= work.sections.length - 1} onClick={() => go(idx + 1)}>Next →</button>
              <button className="btn" onClick={() => setNote(true)}><Icon name="note" size={16} /> Note on this section</button>
              <button className="btn" onClick={() => db.saved.add({ key: `work:${workId}/${idx}`, type: 'work', label: `${meta.title}: ${sec.title}`, url: `#/study/works/${workId}/${idx}`, createdAt: Date.now() }).catch(() => {})}><Icon name="bookmark" size={16} /> Save</button>
            </div>
            <p className="muted small">Section {idx + 1} of {work.sections.length}</p>
          </div>
        )}
      </article>
      {together && <aside className="room-aside"><BiblePane suggest={sec.scripture} /></aside>}
      </div>
      {note && <NoteEditor initialTargets={[{ type: 'work', workId, section: String(idx), label: `${meta.title}: ${sec.title}` }]} onClose={() => setNote(false)} />}
      {ts && <TextSettings onClose={() => setTs(false)} />}
    </div>
  );
}

function HL({ text, q }: { text: string; q: string }) {
  const f = fold(text);
  const i = f.indexOf(fold(q));
  if (i < 0 || f.length !== text.length) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}
