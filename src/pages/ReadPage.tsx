import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import BiayBar from '../components/BiayBar';
import NextChapters from '../components/NextChapters';
import ChapterArt from '../art/chapterArt';
import { FindInChapter, LookUp, ReadProgress } from '../components/ReaderTools';
import { setHighlight, toggleBookmark, rangesOverlap } from '../db/ops';
import ChapterText, { type VerseDecor } from '../components/ChapterText';
import TermPopover from '../components/TermPopover';
import { loadTerms, makeMatcher, type TermBrief } from '../study/terms';
import BookPicker from '../components/BookPicker';
import Icon from '../components/Icon';
import NoteEditor from '../components/NoteEditor';
import Modal from '../components/Modal';
import StudyPanel from '../components/StudyPanel';
import TextSettings from '../components/TextSettings';
import { atmosphereFor, MOOD_SOUND, passageSound, autoSound, AUTO_VOLUME_CAP } from '../lib/atmosphere';
import { setAmbience, stopAmbience } from '../lib/ambience';
import { useT } from '../lib/i18n';
import Motes from '../components/Motes';
import { buzz } from '../lib/haptics';
import { approvedLinks } from '../lib/approved';
import NotePopover from '../components/NotePopover';
import { EnableEditionDialog, useChoosable } from '../components/EditionGate';
import { expandNote } from '../lib/readable';
import { jesusWords, type RedRanges } from '../study/jesusWords';
import { artForChapter, type InlineFig } from '../study/inlineArt';
import { useQuiet, endQuiet } from '../lib/quiet';
import CompareModal from '../components/CompareModal';
import ReadAloud from '../components/ReadAloud';
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

function useWide(query = '(min-width: 1180px)') {
  const [w, setW] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const m = matchMedia(query);
    const f = () => setW(m.matches);
    m.addEventListener('change', f);
    f();
    return () => m.removeEventListener('change', f);
  }, [query]);
  return w;
}

function QuietClock({ endsAt, onEnd }: { endsAt: number; onEnd: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => window.clearInterval(t);
  }, []);
  if (endsAt < 0) return <button onClick={onEnd}>End session</button>;
  const m = Math.max(1, Math.ceil((endsAt - now) / 60_000));
  return <button onClick={onEnd} title="End the session">{m} min · end</button>;
}

export default function ReadPage() {
  const { edition: edId = 'dra', book = 'JHN', chapter = '1' } = useParams();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const loc = useLocation();
  type Trail = { path: string; label: string; prev?: Trail };
  const from = (loc.state as { from?: Trail } | null)?.from;
  const { get, editions, planned } = useEditions();
  const [settings, setSettings] = useSettings();
  const t = useT();
  const edition = get(edId) ?? editions[0];
  const { choosable, isOn } = useChoosable(edId);
  const [enabling, setEnabling] = useState<typeof edition | null>(null);
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
  const swipe = useRef<[number, number] | null>(null);
  const [moreMenu, setMoreMenu] = useState(false);
  const wide = useWide();
  const silentRef = useRef(false);
  const wideRef = useRef(wide);
  wideRef.current = wide;
  const [compare, setCompare] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [aloud, setAloud] = useState(false);
  const [textSettings, setTextSettings] = useState(false);
  const [editionPicker, setEditionPicker] = useState(false);
  const lastClicked = useRef<number | null>(null);
  const [bookInfo, setBookInfo] = useState<BookInfo | undefined>();
  useEffect(() => {
    getBooksInfo().then((all) => setBookInfo(all?.[bk.id]));
  }, [bk.id]);
  const [termList, setTermList] = useState<TermBrief[]>([]);
  const [termPop, setTermPop] = useState<{ id: string; at: DOMRect } | null>(null);
  useEffect(() => {
    if (settings.sparkles) loadTerms().then(setTermList);
  }, [settings.sparkles]);
  const matcher = useMemo(() => (settings.sparkles && (!settings.scriptureOnly || settings.focus.sparkles) && termList.length ? makeMatcher(termList, edition.language === 'la') : null), [settings.sparkles, settings.scriptureOnly, settings.focus.sparkles, termList, edition.language]);
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
  const [figs, setFigs] = useState<InlineFig[]>([]);
  const [red, setRed] = useState<RedRanges | null>(null);
  useEffect(() => { let live = true; setRed(null); if (settings.redLetters !== false) jesusWords(edition.id, bk.id, chNum).then((r) => live && setRed(r)); return () => { live = false; }; }, [edition.id, bk.id, chNum, settings.redLetters]);
  useEffect(() => {
    if ((settings.scriptureOnly && !settings.focus.art) || settings.inlineArt === false) { setFigs([]); return; }
    let live = true;
    artForChapter(bk.id, anchorChapters).then((f) => live && setFigs(f));
    return () => { live = false; };
  }, [bk.id, anchorChapters.join(), settings.scriptureOnly, settings.focus.art, settings.inlineArt]);
  const figureMap = useMemo(() => {
    const m = new Map<number, InlineFig[]>();
    for (const f of figs) {
      const n = anchorToNative(edition, f.ref);
      if (n.chapter !== chNum || !n.v1) continue;
      m.set(n.v2 ?? n.v1, [...(m.get(n.v2 ?? n.v1) ?? []), f]);
    }
    return m;
  }, [figs, edition.id, chNum]);

  // native verse -> anchor
  const anchorOf = useMemo(() => {
    const m = new Map<number, ReturnType<typeof toAnchor>>();
    for (const v of flat) m.set(v.n, toAnchor(edition.scheme, bk.id, chNum, v.n));
    return m;
  }, [flat, edition.scheme, bk.id, chNum]);

  // the ordinary footnotes every Bible carries (alternate readings, “some manuscripts…”), from WEB-C, shown in any translation
  const webcEd = get('webc');
  const [stdNotes, setStdNotes] = useState<Map<number, string[]>>(new Map());
  const [notePop, setNotePop] = useState<{ n: number; notes: string[]; at: DOMRect } | null>(null);
  useEffect(() => {
    let live = true;
    const clean = (t: string) => expandNote(t.replace(/^\d+[:.]\d+(?:[-–]\d+)?\s+/, ''));
    if (edition.id === 'webc') {
      const m = new Map<number, string[]>();
      for (const [v, ns] of Object.entries(chapterData?.notes ?? {})) m.set(+v, ns.map(clean));
      setStdNotes(m);
      return;
    }
    setStdNotes(new Map());
    if (!webcEd || webcEd.unalignedBooks?.[bk.id]) return;
    (async () => {
      const byAnchor = new Map<string, string[]>();
      for (const c of anchorChapters) {
        const at = await anchorChapterText(webcEd, bk.id, c);
        for (const [v, e] of at.verses) if (e.footnotes?.length) byAnchor.set(`${c}.${v}`, e.footnotes.map(clean));
      }
      const m = new Map<number, string[]>();
      for (const [n, a] of anchorOf) {
        const hit = byAnchor.get(`${a.c}.${a.v1}`);
        if (hit) m.set(n, hit);
      }
      if (live) setStdNotes(m);
    })();
    return () => { live = false; };
  }, [edition.id, bk.id, chNum, anchorOf, chapterData]);

  // how many resources are connected to each verse (margin markers)
  useEffect(() => {
    let live = true;
    setAnchorDensity(new Map());
    (async () => {
      const merged = new Map<number, number>();
      for (const c of anchorChapters) {
        const vc = (editions.find((e) => e.scheme === 'vulgate') ?? edition).verseCounts?.[bk.id]?.[c - 1] ?? 0;
        if (!vc) continue;
        const m = await verseResourceCounts(bk.id, c, vc, edition.id === 'dra');
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

  /** notes that belong to the whole chapter (not repeated on every verse) */
  const chapterCount = useMemo(() => anchorChapters.reduce((n, c) => n + (anchorDensity.get(c * 1000) ?? 0), 0), [anchorDensity, anchorChapters]);

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
    buzz();
    setSelNative((cur) => {
      if (menu) return cur.includes(n) ? cur : [...cur, n];
      if (e.shiftKey && lastClicked.current != null) {
        const [a, b] = [lastClicked.current, n].sort((x, y) => x - y);
        return Array.from({ length: b - a + 1 }, (_, i) => a + i);
      }
      return cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n];
    });
    lastClicked.current = n;
    // tapping a verse opens what is connected to it, everywhere (docked beside the text on wide screens, a sheet on phones)
    if (!menu && !settings.scriptureOnly && (dockOn || window.innerWidth >= 700)) setPanel(true);
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
  const infinite = !parallelMode && (settings.scrollMode === 'infinite' || (settings.scriptureOnly && settings.focus.scroll));
  const [finding, setFinding] = useState(false);
  const dockOn = wide && settings.studyDock && !settings.scriptureOnly && !parallelMode;
  const chapterRef: Ref = { book: bk.id, c1: anchorChapters[0], c2: anchorChapters[anchorChapters.length - 1] };
  const panelOpen = dockOn || (panel && hasSel);
  const panelRefs = hasSel ? selRefs : [chapterRef];

  // atmosphere: a backdrop mood for this book or passage, and optional ambience that can follow it
  const mood = atmosphereFor(bk.id, primaryAnchorChapter, settings.atmosphere);
  useEffect(() => {
    const root = document.documentElement;
    if (mood) root.dataset.atm = mood;
    else delete root.dataset.atm;
    root.style.setProperty('--atm-n', String(primaryAnchorChapter % 12));
    return () => {
      delete root.dataset.atm;
      root.style.removeProperty('--atm-n');
    };
  }, [mood, primaryAnchorChapter]);
  useEffect(() => {
    const root = document.documentElement;
    if (settings.scriptureOnly) root.dataset.silent = '1';
    else delete root.dataset.silent;
    return () => {
      delete root.dataset.silent;
    };
  }, [settings.scriptureOnly]);
  const soundAllowed = !settings.scriptureOnly || settings.focus.sound;
  const sound = !soundAllowed || settings.ambience.kind === 'off' ? 'off' : settings.ambience.kind === 'auto' ? autoSound(bk.id, primaryAnchorChapter, mood) : (settings.ambience.match && (passageSound(bk.id, primaryAnchorChapter) ?? (mood && MOOD_SOUND[mood])) ? (passageSound(bk.id, primaryAnchorChapter) ?? MOOD_SOUND[mood!]!) : settings.ambience.kind);
  const soundVolume = settings.ambience.kind === 'auto' ? Math.min(settings.ambience.volume, AUTO_VOLUME_CAP) : settings.ambience.volume;
  useEffect(() => {
    setAmbience(sound, soundVolume);
  }, [sound, soundVolume]);
  useEffect(() => () => stopAmbience(), []);
  const quiet = useQuiet();
  silentRef.current = settings.scriptureOnly;
  useEffect(() => {
    if (!panelOpen || dockOn || !hasSel) return;
    const el = document.querySelector(`.v[data-v="${selNative[0]}"]`);
    if (!el) return;
    // Only move the page when the verse would be hidden behind the sheet (or off the top), and then only as far as needed.
    const t = window.setTimeout(() => {
      const sheet = document.querySelector('aside.panel.side') as HTMLElement | null;
      const sheetTop = sheet && getComputedStyle(sheet).position === 'fixed' ? sheet.getBoundingClientRect().top : window.innerHeight;
      const r = el.getBoundingClientRect();
      const header = 64;
      if (r.bottom > sheetTop - 24 || r.top < header) {
        const want = header + Math.max(24, (sheetTop - header) * 0.2);
        window.scrollBy({ top: r.top - want, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches || settings.motion === 'none' ? 'auto' : 'smooth' });
      }
    }, 60);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen, selNative.join()]);
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

  const markSpeaking = useCallback((n: number | null) => {
    document.querySelectorAll('.v.speaking').forEach((e) => e.classList.remove('speaking'));
    if (n != null) {
      const el = document.querySelector(`.v[data-v="${n}"]`);
      el?.classList.add('speaking');
      el?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }, []);

  // -------- keyboard shortcuts
  const keyRef = useRef({ prev, next, applyColor, hasSel, panel, clearSel, dockOn });
  keyRef.current = { prev, next, applyColor, hasSel, panel, clearSel, dockOn };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input,textarea,select,[contenteditable],[role=dialog]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = keyRef.current;
      if (e.key === '/') { e.preventDefault(); setFinding(true); }
      else if (e.key === 'ArrowLeft') k.prev();
      else if (e.key === 'ArrowRight') k.next();
      else if (e.key === 's') {
        if (k.dockOn) setSettings({ studyDock: false });
        else if (k.hasSel) setPanel((p) => !p);
        else if (wideRef.current) setSettings({ studyDock: true });
      }
      else if (e.key === 'n' && k.hasSel) {
        e.preventDefault();
        setNoteFor(selRefsRef.current.map((r) => ({ type: 'passage', ref: refId(r) })));
      } else if (/^[1-6]$/.test(e.key) && k.hasSel) k.applyColor(COLORS[+e.key - 1]);
      else if (e.key === 'Escape') {
        if (k.hasSel) k.clearSel();
        else if (k.panel) setPanel(false);
        else if (silentRef.current) { setSettings({ scriptureOnly: false }); endQuiet(); }
      } else if (e.key === '?') setShortcuts(true);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // -------- header labels
  const psalmDual = bk.id === 'PSA' && edition.scheme === 'vulgate' ? psalmDualLabel(chNum) : '';
  const chapterNote = chapterAlignmentNote(edition.scheme, bk.id, chNum) ?? bookAlignmentNote(edition.scheme, bk.id);
  const selLabel = selRefs.map((r) => formatRef(r, { abbr: true })).join('; ');

  /** Open a connected passage and remember where you were, so the reader can step back (and back again through a chain of connections). */
  const openConnection = (r: Ref) => {
    const n = anchorToNative(edition, r);
    const url = `/read/${edition.id}/${r.book}/${n.chapter}?v=${n.v1 ?? ''}${n.v2 && n.v2 !== n.v1 ? '-' + n.v2 : ''}`;
    const lo = selNative.length ? selNative[0] : 0;
    const hi = selNative.length ? selNative[selNative.length - 1] : 0;
    const path = `/read/${edition.id}/${bk.id}/${chNum}${lo ? `?v=${lo}${hi > lo ? '-' + hi : ''}` : ''}`;
    const label = `${bk.name} ${chNum}${lo ? `:${lo}${hi > lo ? '–' + hi : ''}` : ''}`;
    nav(url, { state: { from: { path, label, prev: from } satisfies Trail } });
  };

  const verseActions = (
    <>
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
          <button className="icon-btn" onClick={() => nav(`/share?ref=${encodeURIComponent(refId(selRefs[0]))}`)} aria-label="Share as image" title="Share this passage as an image">
            <Icon name="expand" />
          </button>
          <button className="icon-btn" onClick={copyLink} aria-label="Copy link" title="Copy link to this passage">
            <Icon name="link" />
          </button>
          <button className="icon-btn" onClick={clearSel} aria-label="Clear selection">
            <Icon name="close" />
          </button>
    </>
  );

  return (
    <div className={`reader${settings.showVerseNumbers && (!settings.scriptureOnly || settings.focus.numbers) ? '' : ' hide-nums'}${panelOpen ? ' has-panel' : ''}`}>
      <div className="reader-col" onTouchStart={(e) => { swipe.current = e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null; }} onTouchEnd={(e) => { const a = swipe.current; swipe.current = null; if (!a || window.innerWidth >= 700 || !window.getSelection()?.isCollapsed) return; const dx = e.changedTouches[0].clientX - a[0], dy = e.changedTouches[0].clientY - a[1]; if (Math.abs(dx) > 90 && Math.abs(dy) < 45) (dx < 0 ? next : prev)(); }}>
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
              {choosable.map((e) => (
                <button key={e.id} aria-pressed={e.id === edition.id} onClick={() => e.id !== edition.id && switchEdition(e.id)} title={e.name}>
                  {e.shortName}
                </button>
              ))}
              <button onClick={() => setEditionPicker(true)} title={t('reader.more')} aria-label={t('reader.more')}>⋯</button>
            </span>
            {parallel && (
              <button className="chip" onClick={() => setEditionPicker(true)} aria-label="Change parallel translation">
                ‖ {parallel.shortName}
              </button>
            )}
          </div>
          <button className="icon-btn tool-sm" aria-pressed={parallelMode} onClick={() => (parallelMode ? setParallel(null) : setParallel(settings.parallelEdition && settings.parallelEdition !== edition.id ? settings.parallelEdition : choosable.find((e) => e.id !== edition.id && e.id !== 'vulgate')?.id ?? choosable.find((e) => e.id !== edition.id)!.id))} aria-label="Toggle parallel translations" title="Parallel translations">
            <Icon name="columns" />
          </button>
          <button className="icon-btn" onClick={() => window.dispatchEvent(new Event('studybible:search'))} aria-label="Search or go to a passage" title="Search or go to a passage (Ctrl+K)">
            <Icon name="search" />
          </button>
          {wide && !settings.scriptureOnly && !parallelMode && (
            <button className="icon-btn" aria-pressed={dockOn} onClick={() => setSettings({ studyDock: !settings.studyDock })} aria-label="Study panel" title="Study panel: commentary, Fathers, cross-references, Church teaching (S)">
              <Icon name="study" />
            </button>
          )}
          <button className="icon-btn tool-sm" aria-pressed={aloud} onClick={() => setAloud((a) => !a)} aria-label="Read aloud" title="Read this chapter aloud">
            <Icon name="listen" />
          </button>
          <button className="icon-btn tool-sm" aria-pressed={settings.ambience.kind !== 'off'} onClick={() => setSettings({ ambience: { ...settings.ambience, kind: settings.ambience.kind === 'off' ? 'auto' : 'off' }, ambienceTipSeen: true })} aria-label={settings.ambience.kind === 'off' ? t('reader.soundOn') : t('reader.soundOff')} title="Reading sound: on/off">
            <Icon name="music" />
          </button>
          <button className="icon-btn tool-sm" onClick={() => setTextSettings(true)} aria-label={t('reader.settings')} title="Text, theme, atmosphere, sound and quiet reading">
            <Icon name="text" />
          </button>
          <button
            className="icon-btn tool-sm"
            aria-pressed={settings.scriptureOnly}
            onClick={() => {
              setSettings({ scriptureOnly: !settings.scriptureOnly });
              clearSel();
            }}
            aria-label="Focus mode"
            title="Focus mode: just the text, in one unbroken scroll (change what it hides in Reading settings)"
          >
            <Icon name="expand" />
          </button>
          <span className="more-wrap">
            <button className="icon-btn more-btn" aria-haspopup="menu" aria-expanded={moreMenu} onClick={() => setMoreMenu((m) => !m)} aria-label="More reading tools" title="More">
              <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>⋯</span>
            </button>
            {moreMenu && (
              <div className="more-menu" role="menu" onClick={() => setMoreMenu(false)}>
                <button role="menuitem" onClick={() => setEditionPicker(true)}>Translation: {edition.shortName} (and Church-approved Bibles)</button>
                <button role="menuitem" onClick={() => (parallelMode ? setParallel(null) : setParallel(settings.parallelEdition && settings.parallelEdition !== edition.id ? settings.parallelEdition : choosable.find((e) => e.id !== edition.id && e.id !== 'vulgate')?.id ?? choosable.find((e) => e.id !== edition.id)!.id))}>Parallel translations {parallelMode ? '(on)' : ''}</button>
                <button role="menuitem" onClick={() => setFinding(true)}>Find in this chapter ( / )</button>
                <button role="menuitem" onClick={() => setAloud((a) => !a)}>Read aloud {aloud ? '(on)' : ''}</button>
                <button role="menuitem" onClick={() => setTextSettings(true)}>Reading settings, atmosphere and sound</button>
                <button role="menuitem" onClick={() => { setSettings({ scriptureOnly: !settings.scriptureOnly }); clearSel(); }}>Focus mode</button>
              </div>
            )}
          </span>
          <button className="icon-btn" onClick={next} aria-label="Next chapter">
            <Icon name="chevR" />
          </button>
        </div>

        {!wide && !settings.hintVerse && !settings.scriptureOnly && (
          <div className="notice info hint" role="note">
            <span>Tap any verse to see its commentary, Church Fathers, cross-references, Catechism links and more.</span>
            <button className="btn small" onClick={() => setSettings({ hintVerse: true })}>Got it</button>
          </div>
        )}
        {error && <div className="notice">{error}</div>}
        <BiayBar book={bk.id} chapters={anchorChapters} />
        {!data && !error && <div className="center-note">Loading {bk.name}…</div>}
        {data && chapterData && !parallelMode && (
          <article className="scripture" aria-label={`${bk.name} chapter ${chNum}`}>
            <h1 className="chapter-title has-art">
              {bk.id === 'PSA' ? `Psalm ${chNum}` : `${bk.name} ${chNum}`}
              {chapterCount > 0 && dockOn && (
                <button className="rm chapter-rm" title={`${chapterCount} notes about the whole chapter`} aria-label={`${chapterCount} notes about the whole chapter. Open study panel`} onClick={() => { setSelNative([]); setSelAnchor([]); setSettings({ studyDock: true }); }}>
                  {chapterCount}
                </button>
              )}
            </h1>
            <ChapterArt book={bk.id} chapter={primaryAnchorChapter} text={flat.map((v) => v.text).join(' ')} />
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
            <ChapterText chapter={chapterData} selected={new Set(selNative)} decor={decor} onVerse={onVerse as any} lang={edition.language} density={settings.scriptureOnly && !settings.focus.markers ? undefined : density} onMarker={(n) => { setSelNative([n]); lastClicked.current = n; setPanel(true); }} wordFx={settings.wordFx && (!settings.scriptureOnly || settings.focus.effects)} red={red} figures={figureMap} stdNotes={stdNotes} onStdNote={(n, el) => setNotePop({ n, notes: stdNotes.get(n) ?? [], at: el.getBoundingClientRect() })} terms={matcher} onTerm={(id, el) => setTermPop({ id, at: el.getBoundingClientRect() })} />
            {stdNotes.size > 0 && (
              <section aria-label="Notes on the text" className="subtitle" style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <strong>Notes on the text</strong>{edition.id !== 'webc' && <span className="muted"> (these are the World English Bible’s notes on its own wording of the passage; this translation may read differently)</span>}
                {[...stdNotes.entries()].sort((a, b) => a[0] - b[0]).map(([v, ns]) => ns.map((n, i) => <p key={v + '-' + i} style={{ margin: '4px 0' }}><span className="vn std" style={{ verticalAlign: 'baseline' }}>{v}</span> {n}</p>))}
              </section>
            )}
            {!settings.scriptureOnly && (
              <p className="subtitle" style={{ marginTop: 24 }}>
                {edition.attribution}
              </p>
            )}
            {infinite ? (
              <NextChapters editionId={edition.id} chapters={edition.chapters} lang={edition.language} book={bk.id} chapter={chNum} wordFx={settings.wordFx && (!settings.scriptureOnly || settings.focus.effects)} redLetters={settings.redLetters !== false} />
            ) : (
              <div className="chapter-nav">
                <button className="btn" onClick={prev}>{t('reader.prev')}</button>
                <button className="btn" onClick={next}>{t('reader.next')}</button>
              </div>
            )}
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

      {termPop && termList.find((t) => t.id === termPop.id) && <TermPopover term={termList.find((t) => t.id === termPop.id)!} at={termPop.at} onClose={() => setTermPop(null)} onOff={() => { setSettings({ sparkles: false }); setTermPop(null); }} />}
      {from && (
        <div className="return-pill" role="navigation" aria-label="Return to where you were">
          <button className="rp-back" onClick={() => nav(from.path, { state: from.prev ? { from: from.prev } : undefined })}>← Back to {from.label}</button>
          <button className="rp-x" aria-label="Dismiss" onClick={() => nav(loc.pathname + loc.search, { replace: true, state: null })}>×</button>
        </div>
      )}
      {finding && <FindInChapter onClose={() => setFinding(false)} />}
      {!parallelMode && <LookUp />}
      {settings.readProgress && !parallelMode && flat.length > 0 && <ReadProgress words={flat.reduce((n, v) => n + v.text.split(/\s+/).length, 0)} label={`${bk.name} ${chNum}`} bookPos={`chapter ${chNum} of ${edition.chapters[bk.id] ?? chNum}`} />}
      {panelOpen && <StudyPanel onSelectRange={(r) => { const n = anchorToNative(edition, r); if (n.chapter === chNum && n.v1) { const hi = n.v2 ?? n.v1; setSelNative(Array.from({ length: hi - n.v1 + 1 }, (_, k) => n.v1! + k)); lastClicked.current = n.v1; } }} key={dockOn && !hasSel ? 'chapter' : 'sel'} scope={hasSel ? 'passage' : 'chapter'} refs={panelRefs} edition={edition} onClose={() => (dockOn ? setSettings({ studyDock: false }) : setPanel(false))} onOpenPassage={openConnection} actions={hasSel && !dockOn && !settings.scriptureOnly ? verseActions : undefined} />}

      {hasSel && (dockOn || !panelOpen) && !settings.scriptureOnly && (
        <div className="actionbar" role="toolbar" aria-label="Verse actions">
          {verseActions}
          {!dockOn && !settings.scriptureOnly && <button className="btn primary" onClick={() => setPanel(true)}>Study this passage</button>}
          {!selExact && <div className="notice" style={{ width: '100%' }}>Numbering differs between editions here; the anchored passage may be a verse or two off.</div>}
        </div>
      )}

      {settings.scriptureOnly && (
        <div className="silent-ui">
          {quiet.endsAt !== 0 && <QuietClock endsAt={quiet.endsAt} onEnd={endQuiet} />}
          {quiet.finished && <span className="silent-done" role="status">Your time is complete.</span>}
          <button onClick={() => { setSettings({ scriptureOnly: false }); endQuiet(); }}>Leave focus mode</button>
        </div>
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
      {aloud && !parallelMode && flat.length > 0 && (
        <ReadAloud
          key={`${edition.id}.${bk.id}.${chNum}`}
          verses={flat}
          lang={edition.language}
          biayFor={{ book: bk.id, chapters: anchorChapters }}
          startAt={selNative[0]}
          onVerse={markSpeaking}
          onClose={() => setAloud(false)}
          onChapterEnd={next}
        />
      )}
      {shortcuts && (
        <Modal title="Keyboard shortcuts" onClose={() => setShortcuts(false)}>
          <table className="small">
            <tbody>
              {[['Ctrl/⌘ K', 'Jump to a passage, search, go anywhere'], ['/', 'Find in this chapter'], ['← / →', 'Previous / next chapter'], ['Click, Shift-click', 'Select verse / range'], ['S', 'Open or close the study panel'], ['N', 'Note on the selection'], ['1–6', 'Highlight colours'], ['Esc', 'Close panel / clear selection'], ['?', 'This help']].map(([k, d]) => (
                <tr key={k}><td style={{ paddingRight: 16 }}><kbd>{k}</kbd></td><td>{d}</td></tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
      {!settings.scriptureOnly && settings.motes && settings.motion !== 'none' && settings.theme !== 'zen' && <Motes />}
      {!settings.ambienceTipSeen && settings.ambience.kind !== 'off' && !settings.scriptureOnly && (
        <div className="amb-tip" role="status">
          <p><strong>Soft sound is playing while you read.</strong> Turn it off, or choose nature, music, classical piano or chant, with the note icon above or in Reading settings.</p>
          <div className="row">
            <button className="btn small" onClick={() => setSettings({ ambience: { ...settings.ambience, kind: 'off' }, ambienceTipSeen: true })}>Turn off</button>
            <button className="btn small" onClick={() => { setSettings({ ambienceTipSeen: true }); setTextSettings(true); }}>Choose…</button>
            <button className="btn small primary" onClick={() => setSettings({ ambienceTipSeen: true })}>Keep it</button>
          </div>
        </div>
      )}
      {notePop && <NotePopover notes={notePop.notes} at={notePop.at} verse={notePop.n} source={edition.id === 'webc' ? 'World English Bible (Catholic edition)' : 'WEB-C'} onClose={() => setNotePop(null)} />}
      {enabling && <EnableEditionDialog edition={enabling} onClose={() => setEnabling(null)} />}
      {textSettings && <TextSettings onClose={() => setTextSettings(false)} />}
      {editionPicker && (
        <Modal title="Translations" onClose={() => setEditionPicker(false)}>
          <div className="card" style={{ borderColor: 'var(--accent)' }}>
            <strong>Church-approved modern translations</strong>
            <p className="muted small" style={{ margin: '4px 0 8px' }}>The Bibles most Catholics read today are under copyright, so their text cannot be built into this app. Open this chapter in them at the publisher’s or a licensed reader (opens in a new tab). The translations below that are built in are public-domain.</p>
            <div className="chips">
              {approvedLinks(bk.id, (() => { const w = get('webc'); return w ? anchorToNative(w, { book: bk.id, c1: primaryAnchorChapter, c2: primaryAnchorChapter }).chapter : chNum; })()).map((a) => <a key={a.id} className="chip" href={a.url} target="_blank" rel="noreferrer" title={a.note}>{a.name.replace(/ \(.*\)/, '')} ↗</a>)}
            </div>
          </div>
          {editions.map((e) => (
            <div key={e.id} className="card">
              <div className="row between">
                <strong>{e.name}</strong>
                <span className="row" style={{ gap: 4 }}>
                  {e.approval === 'approved' && <span className="chip good" title={e.approvalNote}>Church-approved</span>}
                  {e.approval === 'none' && <span className="chip" title={e.approvalNote}>Not Church-approved</span>}
                  <span className={`chip ${e.rights === 'public-domain' ? 'good' : ''}`}>{e.rights.replace('-', ' ')}</span>
                </span>
              </div>
              <p className="muted small">{e.languageName} · {e.tradition}</p>
              <p className="small">{e.approvalNote ?? e.catholicStatus}</p>
              <div className="row">
                {isOn(e.id) ? (
                  <>
                    <button className="btn small primary" onClick={() => switchEdition(e.id)}>Read in {e.shortName}</button>
                    {e.id !== edition.id && <button className="btn small" onClick={() => { setParallel(e.id); setEditionPicker(false); }}>Show alongside</button>}
                  </>
                ) : (
                  <button className="btn small" onClick={() => { setEditionPicker(false); setEnabling(e); }}>Off by default · turn on…</button>
                )}
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
