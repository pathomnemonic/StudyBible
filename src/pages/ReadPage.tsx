import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEditions } from '../data/EditionsContext';
import { getBookText } from '../data/loader';
import type { BookData } from '../lib/types';
import { adjacentBook, getBook, BOOK_BY_ID } from '../lib/canon';
import { formatRef, parseRefId, refId, type Ref } from '../lib/refs';
import { anchorChaptersFor, chapterAlignmentNote, bookAlignmentNote, psalmDualLabel, toAnchor } from '../lib/versification';
import { anchorChapterText, anchorToNative, chapterTitle, flattenChapter, nativeToAnchorRef, type AnchorText } from '../lib/bibleText';
import { useSettings } from '../lib/store';
import { db, type HighlightColor, type Target } from '../db/db';
import { setHighlight, toggleBookmark, rangesOverlap } from '../db/ops';
import ChapterText, { type VerseDecor } from '../components/ChapterText';
import BookPicker from '../components/BookPicker';
import Icon from '../components/Icon';
import NoteEditor from '../components/NoteEditor';
import Modal from '../components/Modal';
import StudyPanel from '../components/StudyPanel';
import TextSettings from '../components/TextSettings';
import CompareModal from '../components/CompareModal';
import { verseResourceCounts } from '../study/density';
import { getBooksInfo, sectionFor, type BookInfo } from '../study/refData';
import { convertRef } from '../lib/versification';
import { Link } from 'react-router-dom';

const COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink', 'orange', 'purple'];

function groupConsecutive(nums: number[]): [number, number][] {
  const s = [...new Set(nums)].sort((a, b) => a - b);
  const out: [number, number][] = [];
  for (const n of s) {
    const last = out[out.length - 1];
    if (last && n === last[1] + 1) last[1] = n;
    else out.push([n, n]);
  }
  return out;
}

export default function ReadPage() {
  const { edition: edId = 'dra', book = 'JHN', chapter = '1' } = useParams();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const { get, editions, planned } = useEditions();
  const [settings, setSettings] = useSettings();
  const edition = get(edId) ?? editions[0];
  const parallelId = sp.get('p');
  const parallel = parallelId ? get(parallelId) : undefined;
  const bk = BOOK_BY_ID[book] ?? BOOK_BY_ID.JHN;
  const chNum = Math.max(1, Math.min(+chapter || 1, edition.chapters[bk.id] ?? 1));

  const [data, setData] = useState<BookData | null>(null);
  const [error, setError] = useState('');
  const [selNative, setSelNative] = useState<number[]>([]);
  const [selAnchor, setSelAnchor] = useState<number[]>([]); // parallel mode: anchor verse numbers (within anchorChapter)
  const [picker, setPicker] = useState(false);
  const [noteFor, setNoteFor] = useState<Target[] | null>(null);
  const [panel, setPanel] = useState(false);
  const [compare, setCompare] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [textSettings, setTextSettings] = useState(false);
  const [editionPicker, setEditionPicker] = useState(false);
  const lastClicked = useRef<number | null>(null);
  const [bookInfo, setBookInfo] = useState<BookInfo | undefined>();
  useEffect(() => {
    getBooksInfo().then((all) => setBookInfo(all?.[bk.id]));
  }, [bk.id]);
  const [anchorDensity, setAnchorDensity] = useState<Map<number, number>>(new Map());

  // -------- load text
  useEffect(() => {
    let live = true;
    setData(null);
    setError('');
    getBookText(edition.id, bk.id)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(`Could not load ${bk.name} in ${edition.shortName}. If you are offline, download this edition in Settings → Offline reading while connected. (${e.message})`));
    return () => {
      live = false;
    };
  }, [edition.id, bk.id]);

  const chapterData = data?.chapters[chNum - 1];
  const flat = useMemo(() => flattenChapter(chapterData), [chapterData]);
  const anchorChapters = useMemo(() => anchorChaptersFor(edition.scheme, bk.id, chNum), [edition.scheme, bk.id, chNum]);
  const primaryAnchorChapter = anchorChapters[0];

  // native verse -> anchor
  const anchorOf = useMemo(() => {
    const m = new Map<number, ReturnType<typeof toAnchor>>();
    for (const v of flat) m.set(v.n, toAnchor(edition.scheme, bk.id, chNum, v.n));
    return m;
  }, [flat, edition.scheme, bk.id, chNum]);

  // how many resources are connected to each verse (margin markers)
  useEffect(() => {
    let live = true;
    setAnchorDensity(new Map());
    (async () => {
      const merged = new Map<number, number>();
      for (const c of anchorChapters) {
        const vc = (editions.find((e) => e.scheme === 'vulgate') ?? edition).verseCounts?.[bk.id]?.[c - 1] ?? 0;
        if (!vc) continue;
        const m = await verseResourceCounts(bk.id, c, vc);
        for (const [v, n] of m) merged.set(c * 1000 + v, n);
      }
      if (live) setAnchorDensity(merged);
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [bk.id, anchorChapters.join(), edition.id]);
  const density = useMemo(() => {
    const m = new Map<number, number>();
    for (const [n, a] of anchorOf) {
      const d = anchorDensity.get(a.c * 1000 + a.v1);
      if (d) m.set(n, d);
    }
    return m;
  }, [anchorOf, anchorDensity]);

  // -------- deep link ?v=51-58 and remember position
  const vParam = sp.get('v');
  useEffect(() => {
    if (vParam && flat.length) {
      const m = /^(\d+)(?:-(\d+))?$/.exec(vParam);
      if (m) {
        const a = +m[1];
        const b = m[2] ? +m[2] : a;
        setSelNative(Array.from({ length: b - a + 1 }, (_, i) => a + i));
        setTimeout(() => document.querySelector(`[data-v="${a}"]`)?.scrollIntoView({ block: 'center' }), 60);
      }
    } else {
      setSelNative([]);
    }
    setSelAnchor([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vParam, flat, edition.id, bk.id, chNum]);

  useEffect(() => {
    setSettings({ last: { edition: edition.id, book: bk.id, chapter: chNum } });
    const key = `${edition.id}.${bk.id}.${chNum}`;
    (async () => {
      const last = await db.history.orderBy('ts').last();
      if (!last || last.ref !== `${bk.id}.${primaryAnchorChapter}`) {
        db.history.add({ ts: Date.now(), type: 'read', ref: `${bk.id}.${primaryAnchorChapter}`, label: `${bk.name} ${chNum}` });
      }
    })();
    const saved = sessionStorage.getItem('scroll.' + key);
    if (saved && !vParam) setTimeout(() => window.scrollTo(0, +saved), 80);
    else if (!vParam) window.scrollTo(0, 0);
    const onScroll = () => sessionStorage.setItem('scroll.' + key, String(window.scrollY));
    window.addEventListener('scroll', onScroll, { passive: true });
    document.title = `${bk.name} ${chNum} · Study Bible`;
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edition.id, bk.id, chNum]);

  // -------- user marks
  const highlights = useLiveQuery(async () => {
    const out = [];
    for (const c of anchorChapters) out.push(...(await db.highlights.where('[book+c]').between([bk.id, 0], [bk.id, c], true, true).toArray()));
    return out.filter((h) => anchorChapters.some((c) => rangesOverlap(parseRefId(h.ref)!, { book: bk.id, c1: c, c2: c })));
  }, [bk.id, anchorChapters.join()]);
  const notes = useLiveQuery(async () => {
    const out = [];
    for (const c of anchorChapters) out.push(...(await db.notes.where('chapterKeys').equals(`${bk.id}.${c}`).toArray()));
    return out;
  }, [bk.id, anchorChapters.join()]);
  const bookmarks = useLiveQuery(() => db.bookmarks.toArray(), []);

  const hlFor = useCallback(
    (c: number, v: number): HighlightColor | undefined => {
      let found: HighlightColor | undefined;
      for (const h of highlights ?? []) {
        const r = parseRefId(h.ref)!;
        if (rangesOverlap(r, { book: bk.id, c1: c, v1: v, c2: c, v2: v })) found = h.color;
      }
      return found;
    },
    [highlights, bk.id],
  );
  const noteAt = useCallback(
    (c: number, v: number) =>
      (notes ?? []).some((n) =>
        n.targets.some((t) => {
          if (t.type !== 'passage') return false;
          const r = parseRefId(t.ref);
          return !!r && r.v1 !== undefined && rangesOverlap(r, { book: bk.id, c1: c, v1: v, c2: c, v2: v });
        }),
      ),
    [notes, bk.id],
  );
  const bmAt = useCallback(
    (c: number, v: number) =>
      (bookmarks ?? []).some((b) => {
        const r = parseRefId(b.ref);
        return !!r && r.v1 !== undefined && rangesOverlap(r, { book: bk.id, c1: c, v1: v, c2: c, v2: v });
      }),
    [bookmarks, bk.id],
  );

  const decor = useMemo(() => {
    const m = new Map<number, VerseDecor>();
    for (const [n, a] of anchorOf) m.set(n, { highlight: hlFor(a.c, a.v1), note: noteAt(a.c, a.v1), bookmark: bmAt(a.c, a.v1) });
    return m;
  }, [anchorOf, hlFor, noteAt, bmAt]);

  // -------- selection
  const parallelMode = !!parallel;
  const onVerse = (n: number, e: { shiftKey?: boolean }, menu?: boolean) => {
    setSelNative((cur) => {
      if (menu) return cur.includes(n) ? cur : [...cur, n];
      if (e.shiftKey && lastClicked.current != null) {
        const [a, b] = [lastClicked.current, n].sort((x, y) => x - y);
        return Array.from({ length: b - a + 1 }, (_, i) => a + i);
      }
      return cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n];
    });
    lastClicked.current = n;
  };

  /** anchor Refs for the current selection (grouped into contiguous ranges) */
  const selRefs: Ref[] = useMemo(() => {
    if (parallelMode) {
      const c = primaryAnchorChapter;
      return groupConsecutive(selAnchor).map(([a, b]) => ({ book: bk.id, c1: c, v1: a, c2: c, v2: b }));
    }
    return groupConsecutive(selNative).map(([a, b]) => nativeToAnchorRef(edition, bk.id, chNum, a, b).ref);
  }, [selNative, selAnchor, parallelMode, edition, bk.id, chNum, primaryAnchorChapter]);
  const selExact = useMemo(
    () => parallelMode || groupConsecutive(selNative).every(([a, b]) => nativeToAnchorRef(edition, bk.id, chNum, a, b).exact),
    [selNative, parallelMode, edition, bk.id, chNum],
  );
  const selRefsRef = useRef<Ref[]>([]);
  selRefsRef.current = selRefs;
  const hasSel = selRefs.length > 0;
  const clearSel = () => {
    setSelNative([]);
    setSelAnchor([]);
    if (vParam) {
      sp.delete('v');
      setSp(sp, { replace: true });
    }
  };

  const go = (b: string, c: number, v?: string) => nav(`/read/${edition.id}/${b}/${c}${parallelId ? `?p=${parallelId}` : ''}${v ? `${parallelId ? '&' : '?'}v=${v}` : ''}`);
  const prev = () => {
    if (chNum > 1) go(bk.id, chNum - 1);
    else {
      const pb = adjacentBook(bk.id, -1);
      if (pb) go(pb.id, edition.chapters[pb.id]);
    }
  };
  const next = () => {
    if (chNum < (edition.chapters[bk.id] ?? 1)) go(bk.id, chNum + 1);
    else {
      const nb = adjacentBook(bk.id, 1);
      if (nb) go(nb.id, 1);
    }
  };

  /** Switch translation without losing the passage. */
  const switchEdition = (id: string) => {
    const target = get(id);
    if (!target) return;
    let ref: Ref;
    if (selRefs.length) ref = selRefs[0];
    else {
      const first = flat[0] ? anchorOf.get(flat[0].n)! : { c: primaryAnchorChapter, v1: 1 };
      ref = { book: bk.id, c1: first.c, v1: first.v1, c2: first.c, v2: first.v1 };
    }
    const t = anchorToNative(target, { ...ref, c2: ref.c1, v2: ref.v1 });
    const ch = Math.min(t.chapter, target.chapters[bk.id] ?? 1);
    const v = selRefs.length ? anchorToNative(target, ref) : null;
    nav(`/read/${id}/${bk.id}/${ch}${parallelId && parallelId !== id ? `?p=${parallelId}` : ''}${v?.v1 ? `${parallelId && parallelId !== id ? '&' : '?'}v=${v.v1}${v.v2 && v.v2 !== v.v1 ? '-' + v.v2 : ''}` : ''}`);
    setSettings({ defaultEdition: id });
    setEditionPicker(false);
  };
  const setParallel = (id: string | null) => {
    if (id) sp.set('p', id);
    else sp.delete('p');
    setSp(sp, { replace: true });
    setSettings({ parallelEdition: id });
    setSelNative([]);
    setSelAnchor([]);
  };

  // -------- actions
  const applyColor = async (c: HighlightColor | null) => {
    for (const r of selRefs) await setHighlight(r, c, edition.id);
  };
  const doBookmark = async () => {
    for (const r of selRefs) await toggleBookmark(r, 'bookmark', edition.id);
  };
  const copyText = async () => {
    const lines: string[] = [];
    if (parallelMode) return;
    for (const [a, b] of groupConsecutive(selNative)) {
      for (const v of flat.filter((x) => x.n >= a && x.n <= b)) lines.push(`${v.n} ${v.text}`);
    }
    const label = `${bk.name} ${chNum}:${groupConsecutive(selNative).map(([a, b]) => (a === b ? a : `${a}–${b}`)).join(', ')}`;
    await navigator.clipboard?.writeText(`${lines.join(' ')}\n— ${label} (${edition.shortName})`);
  };
  const copyLink = async () => {
    const [a, b] = parallelMode ? [selAnchor[0], selAnchor[selAnchor.length - 1]] : [Math.min(...selNative), Math.max(...selNative)];
    const base = location.href.split('?')[0].split('#')[0];
    await navigator.clipboard?.writeText(`${base}#/read/${edition.id}/${bk.id}/${chNum}?v=${a}${b !== a ? '-' + b : ''}`);
  };

  // -------- keyboard shortcuts
  const keyRef = useRef({ prev, next, applyColor, hasSel, panel, clearSel });
  keyRef.current = { prev, next, applyColor, hasSel, panel, clearSel };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input,textarea,select,[contenteditable],[role=dialog]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = keyRef.current;
      if (e.key === 'ArrowLeft') k.prev();
      else if (e.key === 'ArrowRight') k.next();
      else if (e.key === 's' && k.hasSel) setPanel((p) => !p);
      else if (e.key === 'n' && k.hasSel) {
        e.preventDefault();
        setNoteFor(selRefsRef.current.map((r) => ({ type: 'passage', ref: refId(r) })));
      } else if (/^[1-6]$/.test(e.key) && k.hasSel) k.applyColor(COLORS[+e.key - 1]);
      else if (e.key === 'Escape') {
        if (k.panel) setPanel(false);
        else k.clearSel();
      } else if (e.key === '?') setShortcuts(true);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // -------- header labels
  const psalmDual = bk.id === 'PSA' && edition.scheme === 'vulgate' ? psalmDualLabel(chNum) : '';
  const chapterNote = chapterAlignmentNote(edition.scheme, bk.id, chNum) ?? bookAlignmentNote(edition.scheme, bk.id);
  const selLabel = selRefs.map((r) => formatRef(r, { abbr: true })).join('; ');

  return (
    <div className={`reader${settings.showVerseNumbers ? '' : ' hide-nums'}${panel && hasSel ? ' has-panel' : ''}`}>
      <div className="reader-col">
        <div className="reader-bar">
          <button className="icon-btn" onClick={prev} aria-label="Previous chapter">
            <Icon name="chevL" />
          </button>
          <div className="title">
            <button className="title-btn" onClick={() => setPicker(true)} aria-haspopup="dialog">
              {bk.name} {chNum}
            </button>
            <button className="chip ed-chip" onClick={() => setEditionPicker(true)} aria-label={`Translation: ${edition.name}. Change translation`}>
              {edition.shortName}
            </button>
            <span className="ed-switch segmented" role="group" aria-label="Translation">
              {editions.map((e) => (
                <button key={e.id} aria-pressed={e.id === edition.id} onClick={() => e.id !== edition.id && switchEdition(e.id)} title={e.name}>
                  {e.shortName}
                </button>
              ))}
            </span>
            {parallel && (
              <button className="chip" onClick={() => setEditionPicker(true)} aria-label="Change parallel translation">
                ‖ {parallel.shortName}
              </button>
            )}
          </div>
          <button className="icon-btn" aria-pressed={parallelMode} onClick={() => (parallelMode ? setParallel(null) : setParallel(settings.parallelEdition && settings.parallelEdition !== edition.id ? settings.parallelEdition : editions.find((e) => e.id !== edition.id && e.id !== 'vulgate')?.id ?? editions.find((e) => e.id !== edition.id)!.id))} aria-label="Toggle parallel translations" title="Parallel translations">
            <Icon name="columns" />
          </button>
          <button className="icon-btn" onClick={() => setTextSettings(true)} aria-label="Text settings" title="Text size, spacing and theme">
            <Icon name="text" />
          </button>
          <button
            className="icon-btn"
            aria-pressed={settings.scriptureOnly}
            onClick={() => {
              setSettings({ scriptureOnly: !settings.scriptureOnly });
              clearSel();
            }}
            aria-label="Scripture-only mode"
            title="Scripture only: hides navigation and study tools"
          >
            <Icon name="expand" />
          </button>
          <button className="icon-btn" onClick={next} aria-label="Next chapter">
            <Icon name="chevR" />
          </button>
        </div>

        {error && <div className="notice">{error}</div>}
        {!data && !error && <div className="center-note">Loading {bk.name}…</div>}
        {data && chapterData && !parallelMode && (
          <article className="scripture" aria-label={`${bk.name} chapter ${chNum}`}>
            <h1 className="chapter-title">
              {bk.id === 'PSA' ? `Psalm ${chNum}` : `${bk.name} ${chNum}`}
            </h1>
            {(() => {
              const kjvCh = convertRef('vulgate', 'kjv', { book: bk.id, c1: primaryAnchorChapter, v1: 1, c2: primaryAnchorChapter, v2: 1 }).ref.c1;
              const line = sectionFor(bookInfo, kjvCh);
              return line ? (
                <div className="subtitle">
                  {line} · <Link to={`/study/books/${bk.id}`}>About this book</Link>
                </div>
              ) : null;
            })()}
            {chNum === 1 && bookInfo && <div className="notice info"><strong>{bk.name}.</strong> {bookInfo.intro}</div>}
            {psalmDual && <div className="subtitle">Hebrew / English numbering: Psalm {psalmDual}</div>}
            {bk.id === 'PSA' && edition.scheme === 'english' && anchorChapters[0] !== chNum && <div className="subtitle">Vulgate (Douay) numbering: Psalm {anchorChapters.join('–')}</div>}
            {chNum === 1 && data.intro && data.intro.length > 0 && data.intro.map((p, i) => <p key={i} className="subtitle">{p}</p>)}
            {chNum === 1 && bk.note && <div className="notice info">{bk.note}</div>}
            {chapterNote && <div className="notice">{chapterNote}</div>}
            <ChapterText chapter={chapterData} selected={new Set(selNative)} decor={decor} onVerse={onVerse as any} lang={edition.language} density={settings.scriptureOnly ? undefined : density} onMarker={(n) => { setSelNative([n]); lastClicked.current = n; setPanel(true); }} />
            {chapterData.notes && Object.keys(chapterData.notes).length > 0 && (
              <section aria-label="Footnotes" className="subtitle" style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <strong>Notes</strong>
                {Object.entries(chapterData.notes).map(([v, ns]) => ns.map((n, i) => <p key={v + '-' + i} style={{ margin: '4px 0' }}><span className="vn" style={{ verticalAlign: 'baseline' }}>{v}</span> {n}</p>))}
              </section>
            )}
            {!settings.scriptureOnly && (
              <p className="subtitle" style={{ marginTop: 24 }}>
                {edition.attribution}
              </p>
            )}
            <div className="chapter-nav">
              <button className="btn" onClick={prev}>← Previous</button>
              <button className="btn" onClick={next}>Next →</button>
            </div>
          </article>
        )}
        {data && parallelMode && parallel && (
          <ParallelView
            book={bk.id}
            anchorChapters={anchorChapters}
            left={edition}
            right={parallel}
            selected={new Set(selAnchor)}
            onToggle={(v, shift) => {
              setSelAnchor((cur) => {
                if (shift && lastClicked.current != null) {
                  const [a, b] = [lastClicked.current, v].sort((x, y) => x - y);
                  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
                }
                return cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
              });
              lastClicked.current = v;
            }}
            onPrev={prev}
            onNext={next}
          />
        )}
      </div>

      {panel && hasSel && <StudyPanel refs={selRefs} edition={edition} onClose={() => setPanel(false)} onOpenPassage={(r) => nav(`/read/${edition.id}/${r.book}/${anchorToNative(edition, r).chapter}?v=${anchorToNative(edition, r).v1 ?? ''}${anchorToNative(edition, r).v2 && anchorToNative(edition, r).v2 !== anchorToNative(edition, r).v1 ? '-' + anchorToNative(edition, r).v2 : ''}`)} />}

      {hasSel && !panel && !settings.scriptureOnly && (
        <div className="actionbar" role="toolbar" aria-label="Verse actions">
          <span className="refl">{selLabel}</span>
          {COLORS.map((c) => (
            <button key={c} className="sw" style={{ background: `var(--hl-${c})` }} aria-label={`Highlight ${c}`} onClick={() => applyColor(c)} />
          ))}
          <button className="icon-btn" onClick={() => applyColor(null)} aria-label="Remove highlight" title="Remove highlight">
            <Icon name="trash" size={18} />
          </button>
          <span className="sep" />
          <button className="icon-btn" onClick={() => setNoteFor(selRefs.map((r) => ({ type: 'passage', ref: refId(r) })))} aria-label="Add note" title="Note">
            <Icon name="note" />
          </button>
          <button className="icon-btn" onClick={doBookmark} aria-label="Bookmark" title="Bookmark">
            <Icon name="bookmark" />
          </button>
          <button className="icon-btn" onClick={() => setPanel(true)} aria-label="Study this passage" title="Study: teaching, Fathers, cross-references…">
            <Icon name="study" />
          </button>
          <button className="icon-btn" onClick={() => setCompare(true)} aria-label="Compare translations" title="Compare translations">
            <Icon name="compare" />
          </button>
          {!parallelMode && (
            <button className="icon-btn" onClick={copyText} aria-label="Copy text" title="Copy text with reference">
              <Icon name="copy" />
            </button>
          )}
          <button className="icon-btn" onClick={copyLink} aria-label="Copy link" title="Copy link to this passage">
            <Icon name="link" />
          </button>
          <button className="icon-btn" onClick={clearSel} aria-label="Clear selection">
            <Icon name="close" />
          </button>
          {!selExact && <div className="notice" style={{ width: '100%' }}>Numbering differs between editions here; the anchored passage may be a verse or two off.</div>}
        </div>
      )}

      {settings.scriptureOnly && (
        <button className="btn small" style={{ position: 'fixed', top: 8, right: 8, zIndex: 50 }} onClick={() => setSettings({ scriptureOnly: false })}>
          Exit scripture-only
        </button>
      )}

      {picker && (
        <BookPicker
          edition={edition}
          current={bk.id}
          onClose={() => setPicker(false)}
          onPick={(b, c) => {
            setPicker(false);
            go(b, c);
          }}
        />
      )}
      {noteFor && <NoteEditor initialTargets={noteFor} originEdition={edition.id} onClose={() => setNoteFor(null)} />}
      {compare && hasSel && <CompareModal refs={selRefs} editions={editions} onClose={() => setCompare(false)} />}
      {shortcuts && (
        <Modal title="Keyboard shortcuts" onClose={() => setShortcuts(false)}>
          <table className="small">
            <tbody>
              {[['Ctrl/⌘ K', 'Jump to a passage, search, go anywhere'], ['← / →', 'Previous / next chapter'], ['Click, Shift-click', 'Select verse / range'], ['S', 'Open or close the study panel'], ['N', 'Note on the selection'], ['1–6', 'Highlight colours'], ['Esc', 'Close panel / clear selection'], ['?', 'This help']].map(([k, d]) => (
                <tr key={k}><td style={{ paddingRight: 16 }}><kbd>{k}</kbd></td><td>{d}</td></tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
      {textSettings && <TextSettings onClose={() => setTextSettings(false)} />}
      {editionPicker && (
        <Modal title="Translations" onClose={() => setEditionPicker(false)}>
          {editions.map((e) => (
            <div key={e.id} className="card">
              <div className="row between">
                <strong>{e.name}</strong>
                <span className={`chip ${e.rights === 'public-domain' ? 'good' : ''}`}>{e.rights.replace('-', ' ')}</span>
              </div>
              <p className="muted small">{e.languageName} · {e.tradition}</p>
              <p className="small">{e.catholicStatus}</p>
              <div className="row">
                <button className="btn small primary" onClick={() => switchEdition(e.id)}>Read in {e.shortName}</button>
                {e.id !== edition.id && <button className="btn small" onClick={() => { setParallel(e.id); setEditionPicker(false); }}>Show alongside</button>}
              </div>
            </div>
          ))}
          <h3 style={{ fontSize: '1rem' }}>Not available in this build</h3>
          {planned.map((p) => (
            <div key={p.id} className="card" style={{ opacity: 0.85 }}>
              <div className="row between">
                <strong>{p.name}</strong>
                <span className="chip warn">{p.rights === 'licensed' ? 'license required' : 'external'}</span>
              </div>
              <p className="muted small">{p.publisher}</p>
              <p className="small">{p.note}</p>
              {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="small">Publisher site ↗</a>}
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ParallelView({
  book,
  anchorChapters,
  left,
  right,
  selected,
  onToggle,
  onPrev,
  onNext,
}: {
  book: string;
  anchorChapters: number[];
  left: import('../data/loader').EditionRecord;
  right: import('../data/loader').EditionRecord;
  selected: Set<number>;
  onToggle: (v: number, shift: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const c = anchorChapters[0];
  const [a, setA] = useState<AnchorText | null>(null);
  const [b, setB] = useState<AnchorText | null>(null);
  useEffect(() => {
    let live = true;
    setA(null);
    setB(null);
    anchorChapterText(left, book, c).then((x) => live && setA(x));
    anchorChapterText(right, book, c).then((x) => live && setB(x));
    return () => {
      live = false;
    };
  }, [left.id, right.id, book, c]);
  if (!a || !b) return <div className="center-note">Loading parallel text…</div>;
  const verses = [...new Set([...a.verses.keys(), ...b.verses.keys()])].sort((x, y) => x - y);
  const skip = new Set<number>();
  const cell = (side: AnchorText, v: number) => {
    const e = side.verses.get(v);
    if (!e) return <span className="muted">—</span>;
    return (
      <>
        <span className="vno">{e.native}</span>
        {e.text}
        {!e.exact && <div className="cave">{e.note ?? 'numbering differs'}</div>}
      </>
    );
  };
  const rows = verses.filter((v) => !skip.has(v));
  const ln = bookAlignmentNote(left.scheme, book) ?? bookAlignmentNote(right.scheme, book);
  return (
    <div className="scripture" style={{ maxWidth: 'none' }}>
      <h1 className="chapter-title">
        {getBook(book).name} {c}
        {book === 'PSA' && psalmDualLabel(c) ? ` (Hebrew ${psalmDualLabel(c)})` : ''}
      </h1>
      <div className="subtitle">Rows are aligned by the app's stable verse identifiers (Vulgate anchor), so differing numbering stays side by side.</div>
      {ln && <div className="notice">{ln}</div>}
      <table className="parallel">
        <thead>
          <tr>
            <th>{left.name}</th>
            <th>{right.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v} className={selected.has(v) ? 'selected' : ''} onClick={(e) => onToggle(v, e.shiftKey)} style={{ cursor: 'pointer' }}>
              <td lang={left.language}>{cell(a, v)}</td>
              <td lang={right.language}>{cell(b, v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="chapter-nav">
        <button className="btn" onClick={onPrev}>← Previous</button>
        <button className="btn" onClick={onNext}>Next →</button>
      </div>
    </div>
  );
}
