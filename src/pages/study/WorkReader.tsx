import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getLibraryIndex, getWork, type LibraryWorkMeta } from '../../data/content';
import { db, type HighlightColor, type Note } from '../../db/db';
import { saveNote } from '../../db/ops';
import { useSettings } from '../../lib/store';
import RefLink from '../../components/RefLink';
import NoteEditor from '../../components/NoteEditor';
import TextSettings from '../../components/TextSettings';
import Icon from '../../components/Icon';
import { RecordedWork } from '../../components/RecordedBooks';
import BiblePane from '../../components/BiblePane';
import ReadAloud from '../../components/ReadAloud';
import WorkSelection from '../../components/WorkSelection';
import { FindInChapter, LookUp, ReadProgress } from '../../components/ReaderTools';
import { noteVisit, setShelf } from '../../lib/shelf';
import ShelfControl from '../../components/ShelfControl';
import { useWakeLock } from '../../lib/wakeLock';
import { forgetScroll, savedScroll, useScrollMemory } from '../../lib/scrollMemory';
import { setAmbience, stopAmbience } from '../../lib/ambience';
import { autoSound, AUTO_VOLUME_CAP } from '../../lib/atmosphere';
import { fold } from '../../search/engine';

const isHl = (n: Note) => n.tags.includes('highlight');
const colorOf = (n: Note): HighlightColor => (n.tags.find((t) => t.startsWith('hl-'))?.slice(3) as HighlightColor) ?? 'yellow';
const quoteOf = (n: Note) => (n.body.split('\n')[0] ?? '').replace(/^>\s*/, '').trim();

/** One paragraph with the reader's highlights drawn in, and any search hit marked. */
function Para({ text, hls, find, speaking }: { text: string; hls: { q: string; color: HighlightColor; id?: number }[]; find: string; speaking: boolean }) {
  const hits = hls.map((h) => ({ ...h, at: text.indexOf(h.q) })).filter((h) => h.at >= 0).sort((a, b) => a.at - b.at);
  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (const h of hits) {
    if (h.at < pos) continue;
    parts.push(text.slice(pos, h.at));
    parts.push(<mark key={h.at} className={`wk-hl hl-${h.color}`} style={{ background: `var(--hl-${h.color})`, color: 'inherit' }}>{text.slice(h.at, h.at + h.q.length)}</mark>);
    pos = h.at + h.q.length;
  }
  parts.push(text.slice(pos));
  void find;
  return <>{parts}{speaking ? '' : ''}</>;
}

export default function WorkReader() {
  const { workId = '', section } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const together = loc.pathname.startsWith('/room');
  const base = together ? '/room/work' : '/study/works';
  const [paneOpen, setPaneOpen] = useState(false);
  const [meta, setMeta] = useState<LibraryWorkMeta | null>(null);
  const [work, setWork] = useState<Awaited<ReturnType<typeof getWork>>>(null);
  const [toc, setToc] = useState(false);
  const [tocFind, setTocFind] = useState('');
  const [finding, setFinding] = useState(false);
  const [more, setMore] = useState(false);
  const [aloud, setAloud] = useState(false);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [note, setNote] = useState<{ quote?: string } | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);
  const [settings, setSettings] = useSettings();
  useWakeLock(settings.keepAwake);
  const [ts, setTs] = useState(false);
  const idx = Math.max(0, Number(section ?? 0) || 0);
  const swipe = useRef<[number, number] | null>(null);

  useEffect(() => {
    getLibraryIndex().then((l) => setMeta(l?.works.find((w) => w.id === workId) ?? null));
    setWork(null);
    getWork(workId).then(setWork).catch(() => setWork(null));
  }, [workId]);
  const sec = work?.sections[idx];
  useEffect(() => {
    if (!sec) return;
    noteVisit(workId, idx, work?.sections.length ?? 0);
    db.history.add({ ts: Date.now(), type: 'work', ref: `${workId}/${idx}`, label: `${meta?.title ?? workId}: ${sec.title}` });
    if (savedScroll(loc.pathname) === null) window.scrollTo(0, 0);
    document.title = `${sec.title} · ${meta?.title ?? ''}`;
    setSpeaking(null); setFinding(false);
  }, [workId, idx, !!sec]);
  useScrollMemory(loc.pathname, !!sec);

  // the reader's own highlights and notes for this section
  const mine = useLiveQuery(() => db.notes.filter((n) => n.targets.some((t) => t.type === 'work' && t.workId === workId && String(t.section ?? '') === String(idx))).toArray(), [workId, idx]) ?? [];
  const hls = mine.filter(isHl);
  const notes = mine.filter((n) => !isHl(n));
  const bookmarked = useLiveQuery(() => db.saved.where('key').equals(`work:${workId}/${idx}`).count(), [workId, idx]) ?? 0;

  const words = useMemo(() => (sec ? sec.paras.join(' ').split(/\s+/).length : 0), [sec]);
  const go = (i: number) => { if (!work) return; const k = Math.max(0, Math.min(work.sections.length - 1, i)); forgetScroll(`${base}/${workId}/${k}`); nav(`${base}/${workId}/${k}`); };
  const keys = useRef({ idx, go, finding });
  keys.current = { idx, go, finding };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input,textarea,select,[contenteditable]')) return;
      if (e.key === 'ArrowRight') keys.current.go(keys.current.idx + 1);
      else if (e.key === 'ArrowLeft') keys.current.go(keys.current.idx - 1);
      else if (e.key === '/') { e.preventDefault(); setFinding(true); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  // quiet sound, as in the Bible reader
  const soundOk = !settings.scriptureOnly || settings.focus.sound;
  const sound = !soundOk || settings.ambience.kind === 'off' ? 'off' : settings.ambience.kind === 'auto' ? autoSound('', 0) : settings.ambience.kind;
  const vol = settings.ambience.kind === 'auto' ? Math.min(settings.ambience.volume, AUTO_VOLUME_CAP) : settings.ambience.volume;
  useEffect(() => { setAmbience(sound, vol); }, [sound, vol]);
  useEffect(() => () => stopAmbience(), []);

  const matches = useMemo(() => {
    if (!work || !tocFind.trim()) return [];
    const f = fold(tocFind);
    const out: { i: number; title: string }[] = [];
    work.sections.forEach((s, i) => { if (s.paras.some((p) => fold(p).includes(f))) out.push({ i, title: s.title }); });
    return out.slice(0, 60);
  }, [work, tocFind]);

  if (!meta) return <div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /><i /></div>;
  if (!work || !sec) return <div className="center-note">Loading text…</div>;
  const quiet = settings.scriptureOnly;
  const last = work.sections.length - 1;
  const highlight = async (quote: string, p: number, color: HighlightColor) => {
    if (!sec.paras[p]?.includes(quote)) return;
    await saveNote({ kind: 'note', body: `> ${quote}`, tags: ['highlight', `hl-${color}`], targets: [{ type: 'work', workId, section: String(idx), label: `${meta.title}: ${sec.title}` }] } as never);
  };
  const toggleBookmark = () => { const key = `work:${workId}/${idx}`; if (bookmarked) void db.saved.where('key').equals(key).delete(); else void db.saved.add({ key, type: 'work', label: `${meta.title}: ${sec.title}`, url: `#/study/works/${workId}/${idx}`, createdAt: Date.now() }).catch(() => undefined); };
  const hlFor = (p: string) => hls.map((n) => ({ q: quoteOf(n), color: colorOf(n), id: n.id })).filter((h) => h.q && p.includes(h.q));
  return (
    <div className={`reader work-reader${together ? ' room-together' : ''}`} style={{ display: 'block' }}>
      <div className="reader-col" onTouchStart={(e) => { swipe.current = e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null; }} onTouchEnd={(e) => { const a = swipe.current; swipe.current = null; if (!a || window.innerWidth >= 700 || !window.getSelection()?.isCollapsed) return; const dx = e.changedTouches[0].clientX - a[0], dy = e.changedTouches[0].clientY - a[1]; if (Math.abs(dx) > 90 && Math.abs(dy) < 45) go(idx + (dx < 0 ? 1 : -1)); }}>
        {!quiet && (
          <div className="reader-bar">
            <Link to="/room" className="icon-btn" aria-label="Back to the Reading room" title="Reading room"><Icon name="library" /></Link>
            <button className="icon-btn" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous section"><Icon name="chevL" /></button>
            <div className="title">
              <button className="title-btn" onClick={() => setToc(!toc)} aria-expanded={toc} aria-haspopup="dialog">{meta.title} <span className="muted small">{idx + 1}/{work.sections.length}</span></button>
            </div>
            {together && <button className="btn small room-switch" onClick={() => setPaneOpen(!paneOpen)} aria-pressed={paneOpen}>{paneOpen ? 'Show the text' : 'Show the Bible'}</button>}
            <button className="icon-btn" onClick={() => setFinding(true)} aria-label="Find in this section" title="Find in this section ( / )"><Icon name="search" /></button>
            <button className="icon-btn tool-sm" aria-pressed={aloud} onClick={() => setAloud((a) => !a)} aria-label="Read aloud" title="Read this section aloud"><Icon name="listen" /></button>
            <button className="icon-btn tool-sm" aria-pressed={settings.ambience.kind !== 'off'} onClick={() => setSettings({ ambience: { ...settings.ambience, kind: settings.ambience.kind === 'off' ? 'auto' : 'off' }, ambienceTipSeen: true })} aria-label={settings.ambience.kind === 'off' ? 'Turn background sound on' : 'Turn background sound off'}><Icon name="music" /></button>
            <button className="icon-btn tool-sm" onClick={() => setTs(true)} aria-label="Text settings" title="Text, theme, atmosphere and sound"><Icon name="text" /></button>
            <button className="icon-btn tool-sm" aria-pressed={quiet} onClick={() => setSettings({ scriptureOnly: true })} aria-label="Focus mode" title="Focus mode: just the text"><Icon name="expand" /></button>
            <span className="more-wrap">
              <button className="icon-btn more-btn" aria-haspopup="menu" aria-expanded={more} onClick={() => setMore((m) => !m)} aria-label="More reading tools" title="More"><span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>⋯</span></button>
              {more && (
                <div className="more-menu" role="menu" onClick={() => setMore(false)}>
                  <button role="menuitem" onClick={() => setNote({})}>Note on this section</button>
                  {together && <button role="menuitem" className="menu-narrow" onClick={() => setPaneOpen(!paneOpen)}>{paneOpen ? 'Show the text' : 'Show the Bible beside it'}</button>}
                  <button role="menuitem" onClick={toggleBookmark}>{bookmarked ? 'Remove bookmark' : 'Bookmark this section'}</button>
                  <button role="menuitem" onClick={() => setToc(true)}>Contents and search the whole work</button>
                  {!together && <button role="menuitem" onClick={() => nav(`/room/work/${workId}/${idx}`)}>Open with a Bible beside it</button>}
                </div>
              )}
            </span>
            <button className="icon-btn" onClick={() => go(idx + 1)} disabled={idx >= last} aria-label="Next section"><Icon name="chevR" /></button>
          </div>
        )}
        {quiet && <button className="btn small" style={{ position: 'fixed', top: 8, right: 8, zIndex: 40 }} onClick={() => setSettings({ scriptureOnly: false })}>Exit focus mode</button>}
        {finding && !quiet && <FindInChapter onClose={() => setFinding(false)} />}
        {!quiet && <RecordedWork workId={workId} title={meta.title} />}
        {toc && !quiet && (
          <div className="card" style={{ maxWidth: 760, margin: '10px auto' }}>
            <input type="search" placeholder="Search the whole work…" value={tocFind} onChange={(e) => setTocFind(e.target.value)} style={{ width: '100%', marginBottom: 8 }} aria-label="Search the whole work" />
            {tocFind && <div className="small muted">{matches.length} section{matches.length === 1 ? '' : 's'} contain “{tocFind}”</div>}
            <ol className="list" style={{ maxHeight: 320, overflow: 'auto' }} start={1}>
              {(tocFind ? matches : work.sections.map((s, i) => ({ i, title: s.title }))).map((s) => (
                <li key={s.i}><button className="btn small ghost" aria-current={s.i === idx ? 'true' : undefined} onClick={() => { go(s.i); setToc(false); }}>{s.i + 1}. {s.title}</button></li>
              ))}
            </ol>
          </div>
        )}
        <div className={together ? `room-cols${paneOpen ? ' pane-open' : ''}` : undefined}>
          <article className="scripture work-text" aria-label={sec.title}>
            <div className="muted small" style={{ fontFamily: 'var(--font-sans)' }}>{meta.title} · {meta.author}</div>
            <h1 className="chapter-title">{sec.title}</h1>
            {!quiet && sec.scripture.length > 0 && (
              <div className="chips" style={{ fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
                <span className="muted small">On:</span>
                {sec.scripture.map((s) => <span className="chip" key={s}><RefLink id={s} /> · <Link to={`/study/passage/${s}`}>study</Link></span>)}
              </div>
            )}
            {sec.paras.map((p, i) => (
              <p key={i} data-p={i} className={speaking === i + 1 ? 'speaking' : undefined}><Para text={p} hls={hlFor(p)} find="" speaking={speaking === i + 1} /></p>
            ))}
            {!quiet && (
              <div style={{ fontFamily: 'var(--font-sans)' }}>
                {(hls.length > 0 || notes.length > 0) && (
                  <section aria-label="Your highlights and notes" className="work-mine">
                    <h2 className="eyebrow-h">Your highlights and notes</h2>
                    <ul className="list">
                      {mine.map((n) => (
                        <li key={n.id}>
                          <button className="linklike" onClick={() => setEditing(n)}>{isHl(n) ? <><mark className={`wk-hl hl-${colorOf(n)}`} style={{ background: `var(--hl-${colorOf(n)})`, color: 'inherit' }}>{short(quoteOf(n), 140)}</mark>{n.body.split('\n').slice(1).join(' ').trim() && <> {short(n.body.split('\n').slice(1).join(' ').trim(), 100)}</>}</> : short(n.title || n.body, 160)}</button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {idx >= last && <div className="card"><strong>You reached the end.</strong> <button className="btn small primary" onClick={() => setShelf(workId, { status: 'finished' })}>Mark as finished</button></div>}
                <ShelfControl workId={workId} total={work.sections.length} />
                <hr />
                <p className="muted small">
                  Translator/edition: {meta.translator}. Text: {meta.source.name} (<a href={meta.source.url} target="_blank" rel="noreferrer">original ↗</a>), public domain — {meta.rightsEvidence}
                </p>
                <div className="chapter-nav row between">
                  <button className="btn" disabled={idx === 0} onClick={() => go(idx - 1)}>← Previous</button>
                  <span className="muted small">Section {idx + 1} of {work.sections.length}</span>
                  <button className="btn primary" disabled={idx >= last} onClick={() => go(idx + 1)}>Next →</button>
                </div>
                <p className="muted small">Select text to highlight it or add a note. Swipe left or right, or use the arrow keys, to turn the page.</p>
              </div>
            )}
          </article>
          {together && <aside className="room-aside"><BiblePane suggest={sec.scripture} /></aside>}
        </div>
      </div>
      {!quiet && <ReadProgress words={words} label={sec.title.length > 38 ? sec.title.slice(0, 36) + '…' : sec.title} bookPos={`${idx + 1}/${work.sections.length}`} />}
      <LookUp />
      <WorkSelection onHighlight={highlight} onNote={(q) => setNote({ quote: q })} />
      {aloud && <ReadAloud key={`${workId}.${idx}`} verses={sec.paras.map((t, i) => ({ n: i + 1, text: t }))} lang="en" onVerse={setSpeaking} onClose={() => { setAloud(false); setSpeaking(null); }} onChapterEnd={() => go(idx + 1)} />}
      {note && <NoteEditor initialTargets={[{ type: 'work', workId, section: String(idx), label: `${meta.title}: ${sec.title}` }]} onClose={() => setNote(null)} {...(note.quote ? { note: undefined } : {})} />}
      {editing && <NoteEditor note={editing} onClose={() => setEditing(null)} />}
      {ts && <TextSettings onClose={() => setTs(false)} />}
    </div>
  );
}

const short = (s: string, n: number) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s);
