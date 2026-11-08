import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadChains, loadLives, loadSituations } from '../chains/load';
import type { Chain, Life, Situation } from '../chains/types';
import { getLibraryIndex, getWork, type LibraryWorkMeta } from '../data/content';
import { COURSE } from '../data/course';
import { getBookText } from '../data/loader';
import { flattenChapter } from '../lib/bibleText';
import { KIND_LABEL, KIND_MODE, collectSources, fromChain, fromLesson, fromLife, fromSituation, fromWork, reflectionQuestions, type Booklet, type BookletKind } from '../lib/booklet';
import { BRAND } from '../lib/brand';
import { getBook } from '../lib/canon';
import { parseRefs } from '../lib/refs';

type Size = 'a5' | 'letter' | 'a4';
const SIZES: Record<Size, { label: string; css: string; page: string; font: string; h: string }> = {
  a5: { label: 'A5 booklet pages', css: 'A5', page: '148mm', font: '10.5pt', h: '186mm' },
  letter: { label: 'Letter, one column', css: 'letter', page: '8.5in', font: '12pt', h: '9.2in' },
  a4: { label: 'A4, one column', css: 'A4', page: '210mm', font: '12pt', h: '255mm' },
};
const KINDS = Object.keys(KIND_LABEL) as BookletKind[];

interface Choice { id: string; title: string }

/** Pick a study booklet and print it, or save it as a PDF from the print dialog. Cover, contents, quoted pages, a sources page and fixed-template questions. */
export default function PrintBookletPage() {
  const [sp, setSp] = useSearchParams();
  const kind = (KINDS.includes(sp.get('k') as BookletKind) ? sp.get('k') : 'argument') as BookletKind;
  const size = (sp.get('size') && SIZES[sp.get('size') as Size] ? sp.get('size') : 'a5') as Size;
  const id = sp.get('id') ?? '';
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';
  const [choices, setChoices] = useState<Choice[]>([]);
  const [lib, setLib] = useState<LibraryWorkMeta[]>([]);
  const [book, setBook] = useState<Booklet | null>(null);
  const [err, setErr] = useState('');
  const set = (patch: Record<string, string>) => { const n = new URLSearchParams(sp); for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k); } setSp(n, { replace: true }); };

  useEffect(() => { getLibraryIndex().then((x) => setLib(x?.works ?? [])); }, []);
  useEffect(() => {
    let live = true;
    (async () => {
      let list: Choice[] = [];
      const mode = KIND_MODE[kind];
      if (mode) list = (await loadChains(mode)).map((c) => ({ id: c.id, title: c.title }));
      else if (kind === 'mentor') list = (await loadSituations()).map((s) => ({ id: s.id, title: s.title }));
      else if (kind === 'life') list = (await loadLives()).map((l) => ({ id: l.id, title: l.name }));
      else if (kind === 'lesson') list = COURSE.map((l) => ({ id: l.id, title: l.title }));
      else list = lib.filter((w) => !w.indexOnly && w.sections.length).map((w) => ({ id: w.id, title: `${w.title} (${w.author})` }));
      if (live) setChoices(list);
    })();
    return () => { live = false; };
  }, [kind, lib]);

  useEffect(() => {
    let live = true;
    setBook(null); setErr('');
    if (!id) return;
    (async () => {
      try {
        let b: Booklet | null = null;
        const mode = KIND_MODE[kind];
        if (mode) { const c = (await loadChains(mode)).find((x: Chain) => x.id === id); b = c ? fromChain(kind, c) : null; }
        else if (kind === 'mentor') { const s = (await loadSituations()).find((x: Situation) => x.id === id); b = s ? fromSituation(s) : null; }
        else if (kind === 'life') { const l = (await loadLives()).find((x: Life) => x.id === id); b = l ? fromLife(l) : null; }
        else if (kind === 'lesson') {
          const l = COURSE.find((x) => x.id === id);
          if (l) {
            const passages: { ref: string; verses: { n: number; text: string }[] }[] = [];
            for (const part of l.refs.split(/\s*;\s*/)) {
              const r = parseRefs(part);
              if (!r.ok) continue;
              const ref = r.refs[0].ref;
              try {
                const data = await getBookText('webc', ref.book);
                const ch = flattenChapter(data.chapters[ref.c1 - 1]).filter((v) => v.n >= (ref.v1 ?? 1) && v.n <= (ref.v2 ?? 999)).slice(0, 18);
                if (ch.length) passages.push({ ref: `${getBook(ref.book).name} ${ref.c1}:${ref.v1}${ref.v2 && ref.v2 !== ref.v1 ? `–${ref.v2}` : ''}`, verses: ch.map((v) => ({ n: v.n, text: v.text })) });
              } catch { /* passage left out */ }
            }
            b = fromLesson(l, passages);
          }
        } else {
          const meta = lib.find((w) => w.id === id);
          const w = meta && (await getWork(id));
          if (meta && w) {
            const a = Math.max(0, w.sections.findIndex((s) => s.id === from));
            const z = to ? w.sections.findIndex((s) => s.id === to) : a;
            b = fromWork(meta, w.sections.slice(a, Math.min(w.sections.length - 1, Math.max(a, z)) + 1));
          }
        }
        if (live) { if (b) setBook(b); else setErr('That booklet could not be found.'); }
      } catch { if (live) setErr('That booklet could not be built. Please try another.'); }
    })();
    return () => { live = false; };
  }, [kind, id, from, to, lib]);

  const work = kind === 'work' ? lib.find((w) => w.id === id) : undefined;
  const sources = useMemo(() => (book ? collectSources(book, lib) : []), [book, lib]);
  const questions = useMemo(() => (book ? reflectionQuestions(book) : []), [book]);
  const sz = SIZES[size];
  const printed = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const contents = book ? [...book.sections.map((s) => s.heading), 'Sources', 'Questions to think about'] : [];

  return (
    <div className="page bk-page">
      <style>{`@media print { @page { size: ${sz.css}; margin: 14mm 13mm; } }
.bk-sheet { --bk-font: ${sz.font}; --bk-w: ${sz.page}; --bk-h: ${sz.h}; }`}</style>
      <div className="no-print bk-controls">
        <h1>Print a study booklet</h1>
        <p className="lede">Choose a booklet, then print it or save it as a PDF. Quotations are the ones already checked against the app’s texts.</p>
        <div className="bk-grid">
          <label className="small">Kind of booklet
            <select value={kind} onChange={(e) => set({ k: e.target.value, id: '', from: '', to: '' })} aria-label="Kind of booklet">
              {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </label>
          <label className="small">Which one
            <select value={id} onChange={(e) => set({ id: e.target.value, from: '', to: '' })} aria-label="Which booklet">
              <option value="">Choose…</option>
              {choices.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          {kind === 'work' && work && (
            <>
              <label className="small">From section
                <select value={from || work.sections[0].id} onChange={(e) => set({ from: e.target.value, to: '' })} aria-label="From section">
                  {work.sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </label>
              <label className="small">To section
                <select value={to || from || work.sections[0].id} onChange={(e) => set({ from: from || work.sections[0].id, to: e.target.value })} aria-label="To section">
                  {work.sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </label>
            </>
          )}
          <label className="small">Paper
            <select value={size} onChange={(e) => set({ size: e.target.value })} aria-label="Paper size">
              {(Object.keys(SIZES) as Size[]).map((s) => <option key={s} value={s}>{SIZES[s].label}</option>)}
            </select>
          </label>
        </div>
        <div className="row" style={{ gap: 8, margin: '10px 0' }}>
          <button className="btn primary" disabled={!book} onClick={() => window.print()}>Print or save as PDF</button>
        </div>
        {kind === 'work' && <p className="small muted">A long work is printed as an extract: up to about 3,000 words from the sections you choose.</p>}
        <p className="small muted">For A5, choose your printer’s A5 paper or “2 pages per sheet” on A4. In the print dialog, turn off headers and footers for a clean page.</p>
        {err && <p className="notice" role="alert">{err}</p>}
        {!id && !err && <p className="muted">Choose a booklet to see a preview.</p>}
      </div>

      {book && (
        <article className={`bk-sheet bk-${size}`} aria-label={`Booklet: ${book.title}`}>
          <section className="bk-cover bk-pg">
            <p className="bk-kind">{book.subtitle}</p>
            <h1 className="bk-title">{book.title}</h1>
            {book.question && <p className="bk-q">{book.question}</p>}
            <p className="bk-app">{BRAND.name}</p>
            <p className="bk-date">Printed {printed}</p>
          </section>
          <section className="bk-pg bk-contents">
            <h2>Contents</h2>
            <ol>{contents.map((c, i) => <li key={i}>{c}</li>)}</ol>
          </section>
          {book.sections.map((s, si) => (
            <section key={si} className="bk-sec">
              <h2>{s.heading}</h2>
              {s.lead?.map((t, i) => <p key={i} className="bk-lead">{t}</p>)}
              {s.items.map((it, i) => (
                <figure key={i} className="bk-item">
                  {it.kind !== 'text' || !it.quote ? <figcaption className="bk-label">{it.label}{it.when ? <span> · {it.when}</span> : null}</figcaption> : null}
                  {it.quote && <blockquote className="bk-quote"><p>{it.quote}</p></blockquote>}
                  {it.cite && it.quote && <p className="bk-cite">{it.cite}</p>}
                  {it.note && <p className="bk-note">{it.note}</p>}
                </figure>
              ))}
            </section>
          ))}
          {book.trimmed && <p className="bk-note">This is an extract. The rest of the work is in the app’s library.</p>}
          <section className="bk-sec bk-break">
            <h2>Sources</h2>
            <p className="bk-lead">Every work quoted in this booklet, with the translator and the print date the app records for it.</p>
            <ul className="bk-sources">
              {sources.map((r) => <li key={r.key}><strong>{r.name}</strong>{r.lines.map((l, i) => <span key={i} className="bk-src-line">{l}</span>)}</li>)}
            </ul>
            <p className="bk-note">Made with {BRAND.name}. Printed {printed}.</p>
          </section>
          <section className="bk-sec bk-break">
            <h2>Questions to think about</h2>
            <ol className="bk-questions">{questions.map((q, i) => <li key={i}>{q}<span className="bk-lines" aria-hidden="true" /></li>)}</ol>
          </section>
        </article>
      )}
    </div>
  );
}
