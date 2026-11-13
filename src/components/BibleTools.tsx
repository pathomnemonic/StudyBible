import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useDialogFocus } from '../lib/dialogFocus';
import { BIBLE_TOOLS, TOOL_GROUPS } from '../lib/bibleTools';
import type { Book } from '../lib/canon';

const PAUL = new Set(['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM']);
export interface ToolItem { label: string; onClick: () => void }

/** The toolbox: a sheet from the left with small boxes. First what belongs to this chapter, then this book, then every Bible tool by kind. */
export default function BibleTools({ book, chapter, onClose, items = [] }: { book: Book; chapter: number; onClose: () => void; items?: ToolItem[] }) {
  const drawer = useRef<HTMLElement>(null);
  useDialogFocus(drawer);
  const nav = useNavigate();
  const loc = useLocation();
  const at = useRef(loc.pathname);
  const [word, setWord] = useState('');
  useEffect(() => { if (loc.pathname !== at.current) onClose(); }, [loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  const here: [string, string, string][] = [
    [`/study/books/${book.id}`, `About ${book.name}`, 'Who wrote it, when, and an outline of the whole book.'],
    ...(book.group === 'Gospels' ? ([['/study/synopsis', 'Compare the Gospels', 'See this story in Matthew, Mark, Luke and John side by side.']] as [string, string, string][]) : []),
    ...(PAUL.has(book.id) ? ([[`/study/pauline?l=${book.id}`, `The argument of ${book.name}`, 'Paul’s letter in outline.']] as [string, string, string][]) : []),
    [`/study/passage/${book.id}.${chapter}`, `Study ${book.name} ${chapter}`, 'Everything on this chapter in one place: Fathers, notes, art and more.'],
  ];
  const go = (to: string) => { onClose(); nav(to); };
  return createPortal(
    <div className="drawer-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Toolbox" ref={drawer}>
        <div className="drawer-head">
          <h2>Toolbox</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="drawer-body bible-tools">
          {items.length > 0 && (
            <section className="drawer-now" aria-label="This chapter">
              <h3 className="eyebrow-h">This chapter</h3>
              <div className="drawer-grid">
                {items.map((it) => <button key={it.label} className="btn small" onClick={() => { onClose(); it.onClick(); }}>{it.label}</button>)}
              </div>
            </section>
          )}
          <form role="search" onSubmit={(e) => { e.preventDefault(); if (word.trim()) go(`/study/concordance?w=${encodeURIComponent(word.trim())}`); }} className="row" style={{ gap: 6, margin: '12px 0 0' }}>
            <input type="search" value={word} onChange={(e) => setWord(e.target.value)} placeholder="Look up a word in the whole Bible" aria-label="Look up a word in the whole Bible" style={{ flex: 1 }} />
            <button className="btn primary small">Look up</button>
          </form>
          <h3 className="eyebrow-h" style={{ marginTop: 14 }}>This book</h3>
          <div className="drawer-grid">{here.map(([to, t, d]) => <button key={to} className="btn small" title={d} onClick={() => go(to)}>{t}</button>)}</div>
          {TOOL_GROUPS.map(([g, name]) => (
            <section key={g}>
              <h3 className="eyebrow-h" style={{ marginTop: 14 }}>{name}</h3>
              <div className="drawer-grid">{BIBLE_TOOLS.filter((t) => t.group === g).map((t) => <button key={t.to} className="btn small" title={t.blurb} onClick={() => go(t.to)}>{t.label}</button>)}</div>
            </section>
          ))}
          <p className="muted small" style={{ marginTop: 14 }}><Link to="/study" onClick={onClose}>All study tools</Link>, including today’s Gospel and Sunday’s.</p>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
