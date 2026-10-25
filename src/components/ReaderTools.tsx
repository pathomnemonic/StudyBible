import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/** "n min left" and a percentage for the chapter being read, quiet in the corner (like a Kindle's progress line). */
export function ReadProgress({ words, label, bookPos }: { words: number; label: string; bookPos?: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const f = () => {
      const a = document.querySelector('.scripture') as HTMLElement | null;
      if (!a) return;
      const r = a.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.5;
      setPct(Math.max(0, Math.min(100, Math.round(((window.innerHeight * 0.35 - r.top) / Math.max(1, total)) * 100))));
    };
    f();
    window.addEventListener('scroll', f, { passive: true });
    window.addEventListener('resize', f);
    return () => { window.removeEventListener('scroll', f); window.removeEventListener('resize', f); };
  }, [words, label]);
  const left = Math.max(0, Math.ceil((words * (1 - pct / 100)) / 230));
  return <div className="read-progress" aria-hidden="true">{label} · {pct >= 99 ? 'end of chapter' : `${left} min left`} · {pct}%{bookPos ? ` · ${bookPos}` : ''}</div>;
}

/** Find words in the chapter on the page: highlights every match and steps between them. Uses the browser's highlight API where it has one. */
export function FindInChapter({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [n, setN] = useState(0);
  const [at, setAt] = useState(0);
  const ranges = useRef<Range[]>([]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); return () => { (CSS as any).highlights?.delete('find-hit'); (CSS as any).highlights?.delete('find-cur'); }; }, []);
  useEffect(() => {
    const hl = (CSS as any).highlights;
    ranges.current = [];
    hl?.delete('find-hit'); hl?.delete('find-cur');
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) { setN(0); return; }
    const root = document.querySelector('.scripture');
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = w.nextNode())) {
      const t = (node.nodeValue ?? '').toLowerCase();
      let i = t.indexOf(needle);
      while (i >= 0) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + needle.length); ranges.current.push(r); i = t.indexOf(needle, i + needle.length); }
    }
    setN(ranges.current.length);
    setAt(0);
    if (hl && (window as any).Highlight) hl.set('find-hit', new (window as any).Highlight(...ranges.current));
  }, [q]);
  useEffect(() => {
    const r = ranges.current[at];
    const hl = (CSS as any).highlights;
    if (!r) return;
    if (hl && (window as any).Highlight) hl.set('find-cur', new (window as any).Highlight(r));
    const rect = r.getBoundingClientRect();
    if (rect.top < 90 || rect.bottom > window.innerHeight - 120) window.scrollBy({ top: rect.top - window.innerHeight * 0.35, behavior: 'smooth' });
  }, [at, n]);
  const step = (d: number) => n && setAt((x) => (x + d + n) % n);
  return (
    <div className="find-bar" role="search">
      <input ref={input} type="search" value={q} placeholder="Find in this chapter" aria-label="Find in this chapter" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') step(e.shiftKey ? -1 : 1); if (e.key === 'Escape') onClose(); }} />
      <span className="muted small" aria-live="polite">{q.trim().length < 2 ? '' : n ? `${at + 1} of ${n}` : 'none'}</span>
      <button className="icon-btn" onClick={() => step(-1)} aria-label="Previous match">↑</button>
      <button className="icon-btn" onClick={() => step(1)} aria-label="Next match">↓</button>
      <button className="icon-btn" onClick={onClose} aria-label="Close find">×</button>
    </div>
  );
}

/** Select a word or two in the text and a small "Look up" button appears: a short definition, and a way to search the Bible for it. */
export function LookUp() {
  const [pos, setPos] = useState<{ x: number; y: number; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [defs, setDefs] = useState<string[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    const f = () => {
      const s = window.getSelection();
      const t = s?.toString().trim() ?? '';
      if (!s || s.isCollapsed || !t || t.length > 40 || t.split(/\s+/).length > 3 || !/[a-zA-Z]/.test(t)) { setPos(null); setOpen(false); return; }
      const a = s.anchorNode?.parentElement;
      if (!a?.closest('.scripture')) { setPos(null); return; }
      const r = s.getRangeAt(0).getBoundingClientRect();
      setPos({ x: Math.min(window.innerWidth - 90, Math.max(8, r.left + r.width / 2 - 40)), y: Math.max(8, r.top - 44), text: t });
      setOpen(false);
    };
    document.addEventListener('selectionchange', f);
    return () => document.removeEventListener('selectionchange', f);
  }, []);
  useEffect(() => { setDefs(null); setErr(''); }, [pos?.text]);
  if (!pos) return null;
  const word = pos.text.replace(/[^\p{L}' -]/gu, '').toLowerCase();
  const lookup = async () => {
    setOpen(true);
    if (defs) return;
    try {
      const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`, { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('none');
      const j = await r.json();
      const out: string[] = [];
      for (const e of (j.en ?? []).slice(0, 3)) for (const d of (e.definitions ?? []).slice(0, 2)) out.push(`${e.partOfSpeech}: ${String(d.definition).replace(/<[^>]+>/g, '')}`);
      setDefs(out.length ? out : []);
    } catch { setErr('No definition was found (or you are offline).'); setDefs([]); }
  };
  return (
    <div className="lookup" style={{ left: pos.x, top: pos.y }} onMouseDown={(e) => e.preventDefault()}>
      {!open && <button className="btn small" onClick={lookup}>Look up</button>}
      {open && (
        <div className="lookup-card">
          <strong>{word}</strong>
          {!defs && !err && <p className="muted small">Looking up…</p>}
          {defs?.map((d, i) => <p key={i} className="small" style={{ margin: '4px 0' }}>{d}</p>)}
          {err && <p className="muted small">{err}</p>}
          <p className="small" style={{ margin: '6px 0 0' }}><Link to={`/study/search?q=${encodeURIComponent(word)}`}>Search the Bible and library for “{word}”</Link> · <a href={`https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`} target="_blank" rel="noreferrer">Wiktionary ↗</a></p>
        </div>
      )}
    </div>
  );
}
