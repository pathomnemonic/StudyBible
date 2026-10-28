import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lookupTerm, type GlossaryEntry } from '../data/glossary';
import { popupY } from '../lib/popupPos';

/** Select a word or phrase anywhere (a reader, a lesson, a work) and, if it is a term of the faith, a small "Define" button appears. */
export default function GlossaryLayer() {
  const [hit, setHit] = useState<{ g?: GlossaryEntry; word?: string; x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let t: number | undefined;
    const f = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const s = window.getSelection();
        const txt = s?.toString().trim() ?? '';
        if (!s || s.isCollapsed || txt.length < 4 || txt.length > 40 || txt.split(/\s+/).length > 4) { setHit(null); setOpen(false); return; }
        if (s.anchorNode?.parentElement?.closest('input, textarea, [contenteditable], .glossary-pop')) return;
        const g = lookupTerm(txt);
        // a single word picked out of the Bible text: offer to see where else it appears
        const inBible = !!s.anchorNode?.parentElement?.closest('.reader .v, .reader .verse');
        const word = !g && inBible && /^[A-Za-z]{4,20}$/.test(txt) ? txt.toLowerCase() : undefined;
        if (!g && !word) { setHit(null); return; }
        const r = s.getRangeAt(0).getBoundingClientRect();
        setHit({ g, word, x: Math.max(8, Math.min(window.innerWidth - 300, r.left + r.width / 2 - 140)), y: popupY(r, 40) + (matchMedia('(pointer: coarse)').matches ? 0 : 46) });
        setOpen(false);
      }, 250);
    };
    document.addEventListener('selectionchange', f);
    return () => { window.clearTimeout(t); document.removeEventListener('selectionchange', f); };
  }, []);
  if (!hit) return null;
  const { g, word } = hit;
  if (!g && word) {
    return (
      <div className="glossary-pop" style={{ left: hit.x, top: hit.y }} onMouseDown={(e) => e.preventDefault()}>
        <div className="row" style={{ gap: 6 }}>
          <Link className="btn small" to={`/study/concordance?w=${encodeURIComponent(word)}`} onClick={() => setHit(null)}>Where else is “{word}”?</Link>
          {typeof speechSynthesis !== 'undefined' && <button className="btn small ghost" onClick={() => { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(word)); } catch { /* no speech */ } }} aria-label={`Hear ${word}`}>Hear it</button>}
        </div>
      </div>
    );
  }
  if (!g) return null;
  return (
    <div className="glossary-pop" style={{ left: hit.x, top: hit.y }} role="dialog" aria-label={`Meaning of ${g.term}`} onMouseDown={(e) => e.preventDefault()}>
      {!open
        ? <button className="btn small" onClick={() => setOpen(true)}>Define “{g.term}”</button>
        : (
          <div className="glossary-card">
            <strong>{g.term}</strong>
            <p>{g.definition}</p>
            <div className="row" style={{ gap: 8 }}>
              <Link className="btn small" to={`/study/catechism/${g.ccc}`} onClick={() => setHit(null)}>Catechism §{g.ccc}</Link>
              <Link className="btn small ghost" to={`/study/glossary?t=${encodeURIComponent(g.term)}`} onClick={() => setHit(null)}>Glossary</Link>
              <button className="btn small ghost" onClick={() => { setHit(null); window.getSelection()?.removeAllRanges(); }}>Close</button>
            </div>
          </div>
        )}
    </div>
  );
}
