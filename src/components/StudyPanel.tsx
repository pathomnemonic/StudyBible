import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import NoteEditor from './NoteEditor';
import AddLinkDialog from './AddLinkDialog';
import { SECTIONS, TABS, gatherAll, relevance, MATCH_LABEL, type SectionKey, type StudyItem } from '../study/providers';
import { formatRef, parseRefId, refId, type Ref } from '../lib/refs';
import { passageText } from '../lib/bibleText';
import { useSettings } from '../lib/store';
import type { EditionRecord } from '../data/loader';
import { useEditions } from '../data/EditionsContext';
import { db, type Target } from '../db/db';
import { useToast } from './Toast';
import InlinePlayer from './InlinePlayer';
import WordStudy from './WordStudy';
import FathersCompare from './FathersCompare';
import XrefMap from './XrefMap';
import { embedFor } from '../lib/embed';
import { usePlayer } from '../data/PlayerContext';
import { loadBiay } from '../data/biay';
import { getJson } from '../data/loader';
import { getWork } from '../data/content';
import { reachOf } from '../study/density';

export const AUTH_LABEL: Record<string, string> = {
  doctrine: 'Official doctrine',
  magisterial: 'Church teaching',
  father: 'Church Father',
  saint: 'Saint / spiritual master',
  scholarship: 'Scholarly / editorial',
  reflection: 'Reflection / apologetics',
  historical: 'Historical commentary',
  media: 'Media',
};
const PERIOD_LABEL: Record<string, string> = { apostolic: 'Apostolic', patristic: 'Patristic', medieval: 'Medieval', 'early-modern': 'Early modern', modern: 'Modern', contemporary: 'Contemporary' };

const isReal = (i: StudyItem) => i.kind !== 'Search';

export default function StudyPanel({
  refs,
  edition,
  onClose,
  onOpenPassage,
  inline = false,
  initialTab = 'notes',
  scope = 'passage',
  onSelectRange,
  actions,
}: {
  refs: Ref[];
  edition: EditionRecord;
  onClose?: () => void;
  onOpenPassage: (r: Ref) => void;
  inline?: boolean;
  initialTab?: string;
  /** 'chapter' = nothing selected yet: the panel shows what is connected to the whole chapter */
  scope?: 'passage' | 'chapter';
  /** select a wider run of verses in the reader (used by "Select vv. 1–4") */
  onSelectRange?: (r: Ref) => void;
  /** verse actions (highlight, bookmark, copy, share…) shown under the title when the panel is a sheet */
  actions?: React.ReactNode;
}) {
  const [data, setData] = useState<Partial<Record<SectionKey, StudyItem[]>>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab === 'all' ? 'notes' : initialTab);
  const [authority, setAuthority] = useState('');
  const [period, setPeriod] = useState('');
  const [author, setAuthor] = useState('');
  const [filters, setFilters] = useState(false);
  const [noteTargets, setNoteTargets] = useState<Target[] | null>(null);
  const [addLink, setAddLink] = useState(false);
  const [compare, setCompare] = useState(false);
  const [xmap, setXmap] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const key = refs.map(refId).join('|');

  useEffect(() => {
    let live = true;
    setData({});
    setLoading(true);
    setShowAll(false);
    gatherAll(refs, (k, items) => live && setData((d) => ({ ...d, [k]: items }))).then(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const [settings, setSettings] = useSettings();
  const { get } = useEditions();
  const showOther = settings.showOtherLanguages;
  const foreign = (i: StudyItem) => !!i.lang && i.lang !== 'en';
  const vul = get('vulgate');
  const vcOf = (b: string, c: number) => vul?.verseCounts?.[b]?.[c - 1] ?? 0;
  const passes = (i: StudyItem) => (showOther || !foreign(i)) && (!authority || i.authority === authority) && (!period || i.period === period) && (!author || i.author === author || i.title === author);
  const items = (k: SectionKey) => (data[k] ?? []).filter(passes);
  // A note written for a run of verses counts on the run's last verse only, so the tab number matches the margin number.
  const sharedElsewhere = (i: StudyItem) => {
    const u = unitRange(i, refs);
    return !!u && (u.v2 ?? u.v1) !== (refs[0].v2 ?? refs[0].v1);
  };
  const tabCount = (sections: SectionKey[]) => sections.reduce((n, s) => n + (data[s] ?? []).filter((i) => isReal(i) && passes(i) && !(scope === 'passage' && refs.length === 1 && refs[0].v1 !== undefined && ((i.kind && CHAPTER_KINDS.has(i.kind)) || wholeChapter(i, vcOf) || wholeBook(i) || sharedElsewhere(i)))).length, 0);
  const authors = useMemo(() => [...new Set(Object.values(data).flat().filter((i) => i && isReal(i)).map((i) => (i as StudyItem).author ?? (i as StudyItem).title))].filter((a) => a && a.length < 60).sort(), [data]);
  const hiddenForeign = showOther ? 0 : Object.values(data).flat().filter((i) => i && isReal(i) && foreign(i as StudyItem)).length;
  const activeTab = TABS.find((t) => t.id === tab);
  const filtersOn = !!(authority || period || author);
  const heading = refs.map((r) => formatRef(r)).join('; ');
  const passageIds = refs.map(refId);
  const onNote = (t: Target) => setNoteTargets([t]);
  const open = (i: StudyItem, n: number, arr: StudyItem[], opts: { covers?: string; reading?: boolean } = {}) => (
    <Item key={i.id} item={i} edition={edition} onOpenPassage={onOpenPassage} onNote={onNote} covers={opts.covers} reading={opts.reading} />
  );

  // ---- the Notes tab: a reading stream of commentary, most specific first
  const noteList = TABS[0].sections.flatMap((k) => items(k)).filter(isReal);
  const notes = arrange(noteList, refs, false, vcOf);
  const comm = data.commentary ?? [];
  const summary = comm.find((i) => i.kind === 'Chapter summary');
  const intro = comm.find((i) => i.kind === 'Book introduction');
  const readLinks = comm.filter((i) => i.kind === 'Read with notes');
  const day = (data.biay ?? []).filter(isReal)[0];
  const LIMIT = 6;
  const noneSpecific = notes.specific.length === 0 && notes.units.length === 0;
  const shownSpecific = showAll ? notes.specific : notes.specific.slice(0, LIMIT);

  return (
    <aside className={`panel ${inline ? 'inline' : 'side'}`} aria-label="Study panel">
      <div className="panel-head">
        <div className="top">
          <h2>{heading}{scope === 'chapter' && <span className="scope-tag">whole chapter</span>}</h2>
          <button className="icon-btn" onClick={() => setNoteTargets(refs.map((r) => ({ type: 'passage', ref: refId(r) })))} aria-label="Write a note on this passage" title="Write a note on this passage">
            <Icon name="note" size={18} />
          </button>
          <button className="icon-btn" aria-pressed={filters || filtersOn} onClick={() => setFilters(!filters)} aria-label="Filter by author, authority or period" title="Filter">
            <Icon name="filter" size={17} />
          </button>
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="Close study panel">
              <Icon name="close" />
            </button>
          )}
        </div>
        {actions && <div className="panel-actions" role="toolbar" aria-label="Verse actions">{actions}</div>}
        <div className="ptabs" role="tablist">
          {TABS.map((t) => {
            const n = tabCount(t.sections);
            return (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={n === 0 && t.id !== 'words' && !loading ? 'dim' : ''}>
                {t.label}
                {n > 0 && <span className="n">{n}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel-body">
        {(filters || filtersOn) && (
          <div className="row filter-row">
            <select value={authority} onChange={(e) => setAuthority(e.target.value)} aria-label="Filter by doctrinal authority">
              <option value="">Any authority</option>
              {Object.entries(AUTH_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Filter by period">
              <option value="">Any period</option>
              {Object.entries(PERIOD_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={author} onChange={(e) => setAuthor(e.target.value)} aria-label="Filter by author">
              <option value="">Any author</option>
              {authors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            {filtersOn && <button className="btn small ghost" onClick={() => { setAuthority(''); setPeriod(''); setAuthor(''); }}>Clear</button>}
          </div>
        )}

        {tab === 'notes' && (
          <div className="stream">
            {scope === 'chapter' && (summary || readLinks.length > 0 || day) && (
              <section className="guide">
                {summary && <p className="guide-sum">{summary.excerpt}</p>}
                {day && open(day, 0, [])}
                {readLinks.length > 0 && (
                  <p className="small guide-links">
                    <span className="muted">Read it with notes: </span>
                    {readLinks.map((l) => (
                      <a key={l.id} className="chip" href={l.url} target="_blank" rel="noreferrer noopener" title={l.why}>{l.sourceName.replace(/ \(.*\)/, '')} ↗</a>
                    ))}
                  </p>
                )}
                {intro && <details className="small"><summary>About this book</summary><p>{intro.fullExcerpt ?? intro.excerpt}</p></details>}
              </section>
            )}
            {loading && notes.specific.length + notes.units.length + notes.weak.length === 0 && (
              <>
                <div className="skeleton" style={{ height: 90 }} />
                <div className="skeleton" style={{ height: 90 }} />
              </>
            )}
            {(hiddenForeign > 0 || showOther) && (
              <p className="muted small lang-note">
                {showOther ? (
                  <>Showing notes in other languages. <button className="linklike" onClick={() => setSettings({ showOtherLanguages: false })}>Hide them</button></>
                ) : (
                  <>{hiddenForeign} note{hiddenForeign === 1 ? '' : 's'} in Latin or another language hidden. <button className="linklike" onClick={() => setSettings({ showOtherLanguages: true })}>Show</button></>
                )}
              </p>
            )}
            {shownSpecific.map((i, n, arr) => open(i, n, arr, { reading: true }))}
            {notes.specific.length > LIMIT && !showAll && (
              <button className="btn small ghost" onClick={() => setShowAll(true)}>Show {notes.specific.length - LIMIT} more</button>
            )}
            {notes.units.map((g) => (
              <section key={rangeKey(g.range)} className="shared">
                {notes.specific.length > 0 || notes.units.length > 1 ? (
                  <details className="unit">
                    <summary>
                      <span>{g.items.length} {g.items.length === 1 ? 'note' : 'notes'} on {rangeLabel(g.range)} together</span>
                    </summary>
                    {g.items.map((i, n, arr) => open(i, n, arr, { covers: rangeLabel(g.range), reading: true }))}
                  </details>
                ) : (
                  <>
                    <p className="small muted shared-lead">Commentary on {formatRef(g.range)} as one passage{onSelectRange && <> · <button className="linklike" onClick={() => onSelectRange(g.range)}>select {rangeLabel(g.range)}</button></>}</p>
                    {g.items.map((i, n, arr) => open(i, n, arr, { covers: rangeLabel(g.range), reading: true }))}
                  </>
                )}
              </section>
            ))}
            {noneSpecific && !loading && (
              <div className="empty">
                <p style={{ margin: '0 0 8px' }}>No commentary is written on {scope === 'chapter' ? 'this chapter' : 'this verse'} alone. {notes.weak.length + notes.chapter.length > 0 ? 'Here is what the surrounding passage and the chapter offer.' : emptyMessage('commentary', refs[0].book)}</p>
                <p className="small" style={{ margin: 0 }}>
                  {TABS.filter((t) => t.id !== 'notes' && tabCount(t.sections) > 0).map((t) => (
                    <button key={t.id} className="chip" style={{ marginRight: 6 }} onClick={() => setTab(t.id)}>{t.label} {tabCount(t.sections)}</button>
                  ))}
                </p>
              </div>
            )}
            {notes.weak.length > 0 && (
              <details className="unit" open={noneSpecific}>
                <summary><span>More on this passage · {notes.weak.length}</span></summary>
                {notes.weak.map((i, n, arr) => open(i, n, arr, { reading: true }))}
              </details>
            )}
            {notes.chapter.length > 0 && (
              <details className="unit" open={noneSpecific}>
                <summary><span>About the whole chapter · {notes.chapter.length}</span></summary>
                {notes.chapter.map((i, n, arr) => open(i, n, arr))}
              </details>
            )}
            {notes.book.length > 0 && (
              <details className="unit">
                <summary><span>About the whole book · {notes.book.length}</span></summary>
                {notes.book.map((i, n, arr) => open(i, n, arr))}
              </details>
            )}
          </div>
        )}

        {tab === 'words' && <WordStudy refs={refs} />}
        {tab !== 'notes' && activeTab &&
          activeTab.sections.map((sk) => {
            const meta = SECTIONS.find((s) => s.key === sk)!;
            const list = items(sk).filter((i) => !(scope === 'passage' && i.kind && CHAPTER_KINDS.has(i.kind)));
            const real = list.filter(isReal);
            if (!list.length && !(sk in data) && loading) return <div key={sk} className="skeleton" style={{ height: 60 }} />;
            if (!list.length && !['catechism', 'catholic-answers'].includes(sk) && activeTab.sections.length > 1) return null;
            const { specific, units, weak, chapter: wideCh, book: wideBk } = arrange(list, refs, false, vcOf);
            const wide = [...wideCh, ...wideBk];
            return (
              <section key={sk} className="sect">
                <h3>
                  {meta.label} <span className="n">{real.length - wide.filter(isReal).length}</span>
                </h3>
                {meta.hint && <div className="muted small hint">{meta.hint}</div>}
                {sk === 'xref' && real.length > 2 && (
                  <>
                    <button className="btn small" aria-pressed={xmap} onClick={() => setXmap(!xmap)} style={{ marginBottom: 8 }}>{xmap ? 'Hide map' : 'Show map'}</button>
                    {xmap && <XrefMap items={list} center={heading} onOpen={(id) => { const r = parseRefId(id); if (r) onOpenPassage(r); }} />}
                  </>
                )}
                {list.length === 0 && <div className="empty">{emptyMessage(sk, refs[0].book)}</div>}
                {specific.map((i, n, arr) => open(i, n, arr))}
                {units.map((g) => g.items.map((i, n, arr) => open(i, n, arr, { covers: rangeLabel(g.range) })))}
                {weak.map((i, n, arr) => open(i, n, arr))}
                {wide.length > 0 && (
                  <details className="unit">
                    <summary><span>About the whole chapter · {wide.length}</span></summary>
                    {wide.map((i, n, arr) => open(i, n, arr))}
                  </details>
                )}
                {sk === 'links' && (
                  <button className="btn small" onClick={() => setAddLink(true)}>
                    <Icon name="plus" size={14} /> Add a link
                  </button>
                )}
              </section>
            );
          })}
        {tab === 'media' && (
          <p className="small"><button className="linklike" onClick={() => setAddLink(true)}>Attach a link you found to this passage</button></p>
        )}
      </div>
      {noteTargets && <NoteEditor initialTargets={noteTargets} originEdition={edition.id} onClose={() => setNoteTargets(null)} />}
      {addLink && <AddLinkDialog passages={passageIds} onClose={() => setAddLink(false)} />}
    </aside>
  );
}

/**
 * A note that was written for a run of verses ("vv. 1–4") is the same note whichever of those verses you tap. Instead of showing
 * it again and again, the panel tells you what it covers, lists verse-specific material first, and tucks the shared notes
 * into one group you can open, or select as a whole.
 */
function unitRange(i: StudyItem, sel: Ref[]): Ref | null {
  if (!i.ref || sel.length !== 1) return null;
  const s = sel[0];
  if (s.v1 === undefined || s.c1 !== s.c2) return null;
  const r = parseRefId(i.ref);
  if (!r || r.book !== s.book || r.v1 === undefined || r.c1 !== r.c2 || r.c1 !== s.c1) return null;
  const a = r.v1;
  const b = r.v2 ?? r.v1;
  const sa = s.v1;
  const sb = s.v2 ?? s.v1;
  if (!(a <= sa && sb <= b)) return null;
  if (a === sa && b === sb) return null;
  if (b - a + 1 > 60) return null;
  return r;
}
const rangeKey = (r: Ref) => `${r.c1}:${r.v1}-${r.v2 ?? r.v1}`;
const rangeLabel = (r: Ref) => `vv. ${r.v1}${r.v2 && r.v2 !== r.v1 ? '–' + r.v2 : ''}`;
/** below this an item is passage-level, off-site only, or a search link: it is listed after the notes that speak to the verse */
const WEAK_BELOW = 62;
const CHAPTER_KINDS = new Set(['Read with notes', 'Chapter summary', 'Book introduction']);
/** a note that covers (nearly) the whole chapter, or more, is about the chapter, not about the verse you tapped */
function wholeChapter(i: StudyItem, verseCount?: (book: string, chapter: number) => number): boolean {
  const r = i.ref ? parseRefId(i.ref) : null;
  if (!r || r.v1 === undefined) return !!r;
  return reachOf(r.c1, r.v1, r.c2, r.v2 ?? 999, verseCount?.(r.book, r.c1) ?? 0) === 'chapter';
}
/** a note spanning three or more chapters is about the book */
const wholeBook = (i: StudyItem): boolean => {
  const r = i.ref ? parseRefId(i.ref) : null;
  return !!r && r.c2 - r.c1 >= 2;
};
function arrange(list: StudyItem[], sel: Ref[], keepOrder = false, verseCount?: (book: string, chapter: number) => number) {
  const specific: StudyItem[] = [];
  const chapter: StudyItem[] = [];
  const book: StudyItem[] = [];
  const weak: StudyItem[] = [];
  const groups = new Map<string, { range: Ref; items: StudyItem[] }>();
  const verseLevel = sel.length === 1 && sel[0].v1 !== undefined;
  for (const i of list) {
    if (verseLevel && i.kind !== 'Book introduction' && wholeBook(i)) {
      book.push(i);
      continue;
    }
    if (verseLevel && ((i.kind && CHAPTER_KINDS.has(i.kind)) || wholeChapter(i, verseCount))) {
      (i.kind === 'Book introduction' ? book : chapter).push(i);
      continue;
    }
    const u = unitRange(i, sel);
    if (!u) (verseLevel && relevance(i, sel) < WEAK_BELOW ? weak : specific).push(i);
    else (groups.get(rangeKey(u)) ?? groups.set(rangeKey(u), { range: u, items: [] }).get(rangeKey(u))!).items.push(i);
  }
  if (!keepOrder) {
    const rank = (i: StudyItem) => relevance(i, sel);
    specific.sort((a, b) => rank(b) - rank(a));
    weak.sort((a, b) => rank(b) - rank(a));
    for (const g of groups.values()) g.items.sort((a, b) => rank(b) - rank(a));
  }
  // narrowest shared range first: it is the closest to the verse you tapped
  const units = [...groups.values()].sort((x, y) => (x.range.v2 ?? x.range.v1!) - x.range.v1! - ((y.range.v2 ?? y.range.v1!) - y.range.v1!));
  return { specific, units, chapter, book, weak };
}

function emptyMessage(sk: SectionKey, book: string): string {
  switch (sk) {
    case 'catechism':
      return 'No verified Catechism citation is on file for this passage. The shipped set is a checked seed; browse the doctrine topics for broader pointers.';
    case 'commentary':
      return ['TOB', 'JDT', 'WIS', 'SIR', 'BAR', '1MA', '2MA'].includes(book)
        ? 'Haydock’s module does not include the deuterocanonical books, and the Catena covers only the Gospels. Challoner’s notes and chapter summary, the Glossa (Latin) and the Fathers library may still have material; the chapter reading links below open full notes.'
        : 'No commentary note is attached to this exact verse. Try the chapter or neighbouring verses.';
    case 'fathers':
      return 'No work in the Fathers & saints library comments on or cites this passage. The library is growing; see Study → Fathers & saints for what is covered.';
    case 'catholic-answers':
      return 'No Catholic Answers page is linked to this passage yet.';
    default:
      return 'Nothing found for this passage.';
  }
}


/** Reads a library citation in its setting: the paragraph around it, or the whole Summa article it comes from. */
function CitationContext({ ctx }: { ctx: NonNullable<StudyItem['ctx']> }) {
  const [paras, setParas] = useState<string[] | null>(null);
  const [hit, setHit] = useState(0);
  const [heading, setHeading] = useState('');
  useEffect(() => {
    let live = true;
    (async () => {
      if (ctx.summa) {
        const q = await getJson<Record<string, { title: string; paras: string[] }>>(`library/summa/${ctx.summa}.json`, true).catch(() => null);
        const art = ctx.article ? q?.[ctx.article] : undefined;
        if (live && art) {
          setHeading(art.title);
          setParas(art.paras);
          setHit(ctx.para);
        }
      } else {
        const w = await getWork(ctx.work).catch(() => null);
        const sec = w?.sections[ctx.section];
        if (live && sec) {
          setHeading(sec.title);
          const lo = Math.max(0, ctx.para - 1);
          setParas(sec.paras.slice(lo, ctx.para + 2));
          setHit(ctx.para - lo);
        }
      }
    })();
    return () => { live = false; };
  }, [ctx.work, ctx.section, ctx.para, ctx.summa]);
  if (!paras) return <div className="ex muted">Loading…</div>;
  return (
    <div className="ex ctx">
      {heading && <div className="tr-label">{ctx.summa ? 'The whole article' : 'In context'} · {heading}</div>}
      {paras.map((p, i) => <p key={i} className={i === hit ? 'hit' : undefined}>{p}</p>)}
    </div>
  );
}

function Item({ item, edition, onOpenPassage, onNote, covers, reading = false }: { item: StudyItem; edition: EditionRecord; onOpenPassage: (r: Ref) => void; onNote: (t: Target) => void; covers?: string; reading?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [showVerses, setShowVerses] = useState(true);
  const [readCtx, setReadCtx] = useState(false);
  const [info, setInfo] = useState(false);
  const [playing, setPlaying] = useState(false);
  const embed = embedFor(item.audio) ?? embedFor(item.url);
  const player = usePlayer();
  const [preview, setPreview] = useState<{ v: number; c: number; text: string }[] | null>(null);
  const { get } = useEditions();
  const toast = useToast();
  const ed = get(edition.id) ?? edition;
  const target = item.xrefTarget && ['xref', 'quotes', 'parallels', 'typology', 'dependency'].includes(item.section) ? parseRefId(item.xrefTarget) : null;
  useEffect(() => {
    if (!target || !showVerses || preview) return;
    passageText(ed, target, 6).then(setPreview);
  }, [showVerses, item.id]);
  const original = item.fullExcerpt ?? item.excerpt ?? '';
  const foreignItem = !!item.lang && item.lang !== 'en';
  // a non-English item is shown as its English translation (when one exists) with the original beneath
  const full = foreignItem && item.translation ? item.translation : original;
  const CUT = reading ? 560 : 300;
  const long = full.length > CUT + 40;
  const text = expanded || !long ? full : full.slice(0, full.lastIndexOf(' ', CUT)) + '…';
  const head = (item.author ?? item.show ?? item.sourceName).replace(/ \(compiler\)/, '').replace(/ \(.*\)$/, '');
  const noteTarget: Target = item.xrefTarget && item.id.startsWith('ccc-') ? { type: 'catechism', para: +item.xrefTarget, label: item.title } : { type: 'commentary', itemId: item.id, label: `${item.title}${item.author ? ' — ' + item.author : ''}`, url: item.url };
  return (
    <article className={`item${reading ? ' reading' : ''}`} data-auth={item.authority}>
      {reading ? (
        <div className="byline">
          <strong>{head}</strong>
          <span className="work">{item.title !== head ? item.title : item.kind}</span>
          {covers && <span className="covers" title="This note was written for a run of verses">covers {covers}</span>}
        </div>
      ) : (
        <>
          <div className="kicker">
            <span className="dot" />
            <span>{item.kind ?? AUTH_LABEL[item.authority]}</span>
            {item.lang === 'la' && <span className="chip">Latin</span>}
            {covers && <span className="covers" title="This note was written for a run of verses">covers {covers}</span>}
            {item.date && <span style={{ fontWeight: 400 }}>· {item.date}</span>}
          </div>
          {item.internal ? (
            <Link className="t" to={item.internal}>{item.title}</Link>
          ) : item.url ? (
            <a className="t" href={item.url} target="_blank" rel="noreferrer">{item.title} <Icon name="external" size={12} /></a>
          ) : (
            <div className="t">{item.title}</div>
          )}
          {(item.author || item.show) && <div className="by">{[item.author, item.show].filter(Boolean).join(' · ')}</div>}
        </>
      )}
      {!reading && item.tags && item.tags.length > 0 && <div className="tag-row">{item.tags.slice(0, 4).map((t) => <span key={t} className="chip">{t}</span>)}</div>}
      {item.links && <div className="find-links">{item.links.map((l) => <a key={l.url} className="chip" href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>)}</div>}
      {item.quotes && item.quotes.length > 0 && (
        <div className="fq">
          {item.quotes.map((q) => (
            <blockquote key={q.href + q.text.slice(0, 12)}>
              <p>{/^[a-z[]/.test(q.text) ? '… ' : '“'}{q.text.replace(/^[“”"]/, '')}”</p>
              <footer><Link to={q.href}>{q.who}</Link></footer>
            </blockquote>
          ))}
        </div>
      )}
      {item.thumb && (
        <a href={item.url} target="_blank" rel="noreferrer" className="thumb">
          <img src={item.thumb} alt={`${item.title}, painting`} loading="lazy" />
        </a>
      )}
      {playing && embed && <InlinePlayer embed={embed} title={item.title} />}
      {text && foreignItem ? (
        <div className="ex foreign">
          {item.translation ? (
            <>
              <div className="tr-label">English translation (AI-assisted, not reviewed)</div>
              <div>{text}</div>
              <details className="orig">
                <summary>Latin original</summary>
                <div lang={item.lang}>{original}</div>
              </details>
            </>
          ) : (
            <>
              <div lang={item.lang}>{text}</div>
              <p className="tr-missing">No English translation has been made for this note yet. <a href={`https://translate.google.com/?sl=${item.lang}&tl=en&op=translate&text=${encodeURIComponent(original.slice(0, 4500))}`} target="_blank" rel="noreferrer">Translate with Google ↗</a></p>
            </>
          )}
        </div>
      ) : (
        text && (
          <div className="ex" lang={item.lang}>
            {text}
          </div>
        )
      )}
      {item.parts && item.parts.length > 0 && (
        <ol className="parts">
          {item.parts.map((p, n) => {
            const r = p.ref ? parseRefId(p.ref) : null;
            return (
              <li key={n}>
                <span className="pl">{p.label}</span>
                {r && <button className="linklike" onClick={() => onOpenPassage(r)}>{formatRef(r, { noDual: true })}</button>}
                {p.note && <span className="pn"> {p.note}</span>}
              </li>
            );
          })}
        </ol>
      )}
      {target && (
        <>
          <button className="btn small ghost" aria-expanded={showVerses} onClick={() => setShowVerses(!showVerses)}>{showVerses ? 'Hide verses' : 'Show verses'}</button>
          {showVerses && (
            <div className="ex xtext">
              {!preview && 'Loading…'}
              {preview?.map((p) => (
                <div key={p.c + '.' + p.v}>
                  <sup>{p.v}</sup> {p.text}
                </div>
              ))}
              {preview?.length === 0 && <span className="muted">Not present in this edition.</span>}
            </div>
          )}
        </>
      )}
      {item.ctx && readCtx && <CitationContext ctx={item.ctx} />}
      <div className="acts">
        {item.ctx && <button className="act strong" aria-expanded={readCtx} onClick={() => setReadCtx(!readCtx)}>{readCtx ? 'Hide context' : item.ctx.summa ? 'Read the whole article' : 'Read in context'}</button>}
        {long && <button className="act" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Read more'}</button>}
        {item.internal && reading === false && <Link className="act" to={item.internal}>Open</Link>}
        {item.episodeId && (
          <button
            className="act strong"
            onClick={async () => {
              const b = await loadBiay();
              const ep = b?.byId.get(item.episodeId!);
              if (ep) player.play(ep);
            }}
          >
            <Icon name="play" size={13} /> Play here
          </button>
        )}
        {embed && (
          <button className="act strong" onClick={() => setPlaying(!playing)}>
            <Icon name="play" size={13} /> {playing ? 'Close player' : 'Play here'}
          </button>
        )}
        {item.url && !item.internal && !reading && (
          <a className="act" href={item.url} target="_blank" rel="noreferrer">
            Open source <Icon name="external" size={12} />
          </a>
        )}
        {target && <button className="act" onClick={() => onOpenPassage(target)}>Open in reader</button>}
        {item.userLinkId && (
          <button className="act" onClick={async () => { await db.userLinks.delete(item.userLinkId!); toast('Link removed.'); }}>Remove</button>
        )}
        {!['mine', 'xref', 'doctrine', 'links'].includes(item.section) && <button className="act" onClick={() => onNote(noteTarget)}>Note</button>}
        <button className="act info-btn" aria-expanded={info} onClick={() => setInfo(!info)} aria-label="About this source" title="Source and why it is here">ⓘ</button>
      </div>
      {info && (
        <div className="info">
          <div>{AUTH_LABEL[item.authority]}{item.period ? ` · ${PERIOD_LABEL[item.period]}` : ''}{item.date ? ` · ${item.date}` : ''}</div>
          <div><strong>{MATCH_LABEL[item.match].split(' — ')[0]}</strong>. {item.why}</div>
          {item.basis && <div>{item.basis}</div>}
          <div>Source: {item.sourceName}{item.rightsNote ? ` · ${item.rightsNote}` : ''}</div>
          {item.url && reading && <div><a href={item.url} target="_blank" rel="noreferrer">Open the source <Icon name="external" size={11} /></a></div>}
        </div>
      )}
    </article>
  );
}
