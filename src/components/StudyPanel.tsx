import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import NoteEditor from './NoteEditor';
import AddLinkDialog from './AddLinkDialog';
import { SECTIONS, TABS, gatherAll, MATCH_LABEL, type SectionKey, type StudyItem } from '../study/providers';
import { formatRef, parseRefId, refId, type Ref } from '../lib/refs';
import { passageText } from '../lib/bibleText';
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
  initialTab = 'all',
  scope = 'passage',
  onSelectRange,
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
}) {
  const [data, setData] = useState<Partial<Record<SectionKey, StudyItem[]>>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [authority, setAuthority] = useState('');
  const [period, setPeriod] = useState('');
  const [author, setAuthor] = useState('');
  const [noteTargets, setNoteTargets] = useState<Target[] | null>(null);
  const [addLink, setAddLink] = useState(false);
  const [compare, setCompare] = useState(false);
  const [xmap, setXmap] = useState(true);
  const key = refs.map(refId).join('|');

  useEffect(() => {
    let live = true;
    setData({});
    setLoading(true);
    gatherAll(refs, (k, items) => live && setData((d) => ({ ...d, [k]: items }))).then(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const passes = (i: StudyItem) => (!authority || i.authority === authority) && (!period || i.period === period) && (!author || i.author === author || i.title === author);
  const items = (k: SectionKey) => (data[k] ?? []).filter(passes);
  const tabCount = (sections: SectionKey[]) => sections.reduce((n, s) => n + (data[s] ?? []).filter((i) => isReal(i) && passes(i)).length, 0);
  const total = TABS.reduce((n, t) => n + tabCount(t.sections), 0);
  const authors = useMemo(() => [...new Set(Object.values(data).flat().filter((i) => i && isReal(i)).map((i) => (i as StudyItem).author ?? (i as StudyItem).title))].filter((a) => a && a.length < 60).sort(), [data]);
  const activeTab = TABS.find((t) => t.id === tab);
  const filtersOn = !!(authority || period || author);
  const heading = refs.map((r) => formatRef(r)).join('; ');
  const passageIds = refs.map(refId);

  return (
    <aside className={`panel ${inline ? 'inline' : 'side'}`} aria-label="Study panel">
      <div className="panel-head">
        <div className="top">
          <h2>{heading}{scope === 'chapter' && <span className="scope-tag">whole chapter</span>}</h2>
          <button className="btn small" onClick={() => setNoteTargets(refs.map((r) => ({ type: 'passage', ref: refId(r) })))}>
            <Icon name="note" size={15} /> Note
          </button>
          <button className="btn small" onClick={() => setAddLink(true)} title="Attach an article, video or episode you found">
            <Icon name="link" size={15} /> Add link
          </button>
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="Close study panel">
              <Icon name="close" />
            </button>
          )}
        </div>
        <div className="sub">
          {scope === 'chapter' && !loading ? `Study guide for this chapter · ${total} connected resource${total === 1 ? '' : 's'}. Tap a verse to narrow it to that verse.` : loading ? 'Gathering what is connected to this passage…' : total ? `${total} connected resource${total === 1 ? '' : 's'}${filtersOn ? ' (filtered)' : ''}` : 'Nothing connected yet — see the tabs below for what is covered.'}
        </div>
        <div className="ptabs" role="tablist">
          <button role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>
            Overview
          </button>
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
              {tabCount(t.sections) > 0 && <span className="n">{tabCount(t.sections)}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-body">
        <details className="small" style={{ marginBottom: 6 }} open={filtersOn}>
          <summary style={{ cursor: 'pointer', color: 'var(--muted)' }}>
            <Icon name="filter" size={13} /> Filter by author, authority or period {filtersOn && <span className="chip sel">on</span>}
          </summary>
          <div className="row" style={{ margin: '8px 0' }}>
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
        </details>

        {tab === 'all' && (
          <Overview
            sel={refs}
            scope={scope}
            data={data}
            loading={loading}
            passes={passes}
            go={setTab}
            render={(i, covers) => <Item key={i.id} item={i} edition={edition} onOpenPassage={onOpenPassage} onNote={(t) => setNoteTargets([t])} covers={covers} />}
          />
        )}

        {tab === 'words' && <WordStudy refs={refs} />}
        {activeTab &&
          activeTab.sections.map((sk) => {
            const meta = SECTIONS.find((s) => s.key === sk)!;
            const list = items(sk);
            const real = list.filter(isReal);
            if (!list.length && !(sk in data) && loading) return <div key={sk} className="skeleton" style={{ height: 60 }} />;
            if (!list.length && !['catechism', 'commentary', 'fathers', 'catholic-answers'].includes(sk) && activeTab.sections.length > 1) return null;
            return (
              <section key={sk} className="sect">
                <h3>
                  {meta.label} <span className="n">{real.length}</span>
                </h3>
                {meta.hint && <div className="muted small" style={{ margin: '-4px 0 8px' }}>{meta.hint}</div>}
                {sk === 'fathers' && real.length > 1 && (
                  <button className="btn small" aria-pressed={compare} onClick={() => setCompare(!compare)} style={{ marginBottom: 8 }}>{compare ? 'Show as a list' : 'Compare authors side by side'}</button>
                )}
                {sk === 'xref' && real.length > 2 && (
                  <>
                    <button className="btn small" aria-pressed={xmap} onClick={() => setXmap(!xmap)} style={{ marginBottom: 8 }}>{xmap ? 'Hide map' : 'Show map'}</button>
                    {xmap && <XrefMap items={list} center={heading} onOpen={(id) => { const r = parseRefId(id); if (r) onOpenPassage(r); }} />}
                  </>
                )}
                {list.length === 0 && <div className="empty">{emptyMessage(sk, refs[0].book)}</div>}
                {sk === 'fathers' && compare && <FathersCompare items={list} />}
                {!(sk === 'fathers' && compare) && (() => {
                  const base = sk === 'fathers' || sk === 'saints' ? [...list].sort((a, b) => (a.author ?? '').localeCompare(b.author ?? '')) : list;
                  const { specific, units, chapter } = arrange(base, refs);
                  const renderItem = (i: StudyItem, n: number, arr: StudyItem[], range?: Ref) => (
                    <div key={i.id}>
                      {(sk === 'fathers' || sk === 'saints') && i.author && i.author !== arr[n - 1]?.author && <h4 className="by-author">{i.author}</h4>}
                      <Item item={i} edition={edition} onOpenPassage={onOpenPassage} onNote={(t) => setNoteTargets([t])} covers={range ? rangeLabel(range) : undefined} />
                    </div>
                  );
                  return (
                    <>
                      {specific.map((i, n, arr) => renderItem(i, n, arr))}
                      {units.map((g) => (
                        <details key={rangeKey(g.range)} className="unit" open={specific.length === 0}>
                          <summary>
                            <span>Shared with the neighbouring verses · {rangeLabel(g.range)} <span className="n">{g.items.length}</span></span>
                          </summary>
                          <p className="small muted">{g.items.length === 1 ? 'This note was written' : 'These notes were written'} for {formatRef(g.range)} as a unit, so {g.items.length === 1 ? 'it appears' : 'they appear'} for each of those verses. {onSelectRange && <button className="linklike" onClick={() => onSelectRange(g.range)}>Select {rangeLabel(g.range)}</button>}</p>
                          {g.items.map((i, n, arr) => renderItem(i, n, arr, g.range))}
                        </details>
                      ))}
                      {chapter.length > 0 && (
                        <details className="unit">
                          <summary><span>About the whole chapter · {chapter.length}</span></summary>
                          {chapter.map((i, n, arr) => renderItem(i, n, arr))}
                        </details>
                      )}
                    </>
                  );
                })()}
                {sk === 'links' && (
                  <button className="btn small" onClick={() => setAddLink(true)}>
                    <Icon name="plus" size={14} /> Add a link
                  </button>
                )}
              </section>
            );
          })}

        <div className="legend" style={{ marginTop: 18 }}>
          {Object.entries({ doctrine: 'Doctrine', father: 'Fathers', saint: 'Saints', historical: 'Historical', scholarship: 'Scholarly', reflection: 'Apologetics', media: 'Media' }).map(([k, v]) => (
            <span key={k}>
              <i style={{ background: `var(--a-${k})` }} />
              {v}
            </span>
          ))}
        </div>
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
const CHAPTER_KINDS = new Set(['Read with notes', 'Chapter summary', 'Book introduction']);
function arrange(list: StudyItem[], sel: Ref[]) {
  const specific: StudyItem[] = [];
  const chapter: StudyItem[] = [];
  const groups = new Map<string, { range: Ref; items: StudyItem[] }>();
  const verseLevel = sel.length === 1 && sel[0].v1 !== undefined;
  for (const i of list) {
    if (verseLevel && i.kind && CHAPTER_KINDS.has(i.kind)) {
      chapter.push(i);
      continue;
    }
    const u = unitRange(i, sel);
    if (!u) specific.push(i);
    else (groups.get(rangeKey(u)) ?? groups.set(rangeKey(u), { range: u, items: [] }).get(rangeKey(u))!).items.push(i);
  }
  // narrowest shared range first: it is the closest to the verse you tapped
  const units = [...groups.values()].sort((x, y) => (x.range.v2 ?? x.range.v1!) - x.range.v1! - ((y.range.v2 ?? y.range.v1!) - y.range.v1!));
  return { specific, units, chapter };
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

function Overview({ scope, sel, data, loading, passes, go, render }: { scope: 'passage' | 'chapter'; sel: Ref[]; data: Partial<Record<SectionKey, StudyItem[]>>; loading: boolean; passes: (i: StudyItem) => boolean; go: (t: string) => void; render: (i: StudyItem, covers?: string) => JSX.Element }) {
  const blocks = TABS.map((t) => {
    const all = t.sections.flatMap((s) => data[s] ?? []).filter((i) => isReal(i) && passes(i) && !(sel.length === 1 && sel[0].v1 !== undefined && i.kind && CHAPTER_KINDS.has(i.kind)));
    const { specific, units } = arrange(all, sel);
    const ordered = [...specific.map((i) => ({ i, covers: undefined as string | undefined })), ...units.flatMap((g) => g.items.map((i) => ({ i, covers: rangeLabel(g.range) })))];
    return { t, all, ordered, nSpecific: specific.length };
  });
  const any = blocks.some((b) => b.all.length);
  // with nothing selected, lead with the chapter's own guide: its summary, where to read it with notes, and the matching Bible in a Year day
  const comm = data.commentary ?? [];
  const summary = comm.find((i) => i.kind === 'Chapter summary');
  const intro = comm.find((i) => i.kind === 'Book introduction');
  const links = comm.filter((i) => i.kind === 'Read with notes');
  const day = (data.biay ?? []).filter(isReal)[0];
  return (
    <>
      {scope === 'chapter' && (summary || links.length > 0 || day) && (
        <section className="sect guide">
          <h3>This chapter</h3>
          {summary && <p className="guide-sum">{summary.excerpt}</p>}
          {day && render(day)}
          {links.length > 0 && (
            <p className="small guide-links">
              <span className="muted">Read it with notes: </span>
              {links.map((l) => (
                <a key={l.id} className="chip" href={l.url} target="_blank" rel="noreferrer noopener" title={l.why}>{l.sourceName.replace(/ \(.*\)/, '')} ↗</a>
              ))}
            </p>
          )}
          {intro && <details className="small"><summary>About this book (Challoner)</summary><p>{intro.fullExcerpt ?? intro.excerpt}</p></details>}
        </section>
      )}
      {loading && !any && (
        <>
          <div className="skeleton" style={{ height: 70 }} />
          <div className="skeleton" style={{ height: 70 }} />
          <div className="skeleton" style={{ height: 70 }} />
        </>
      )}
      {!loading && !any && <div className="empty">Nothing in the loaded sources is attached to this passage. Try a neighbouring verse, or use <strong>Add link</strong> to attach something you found.</div>}
      {blocks
        .filter((b) => b.all.length)
        .map(({ t, all, ordered, nSpecific }) => (
          <section key={t.id} className="sect">
            <h3>
              {t.label} <span className="n">{all.length}</span>
              {all.length > 2 && (
                <button className="more" onClick={() => go(t.id)}>
                  See all {all.length} →
                </button>
              )}
            </h3>
            {ordered.slice(0, 2).map(({ i, covers }) => render(i, covers))}
            {nSpecific === 0 && ordered.length > 0 && ordered[0].covers && <p className="small muted" style={{ margin: '2px 0 0' }}>Nothing is specific to this verse in {t.label.toLowerCase()}; the note{ordered.length > 1 ? 's' : ''} above cover{ordered.length > 1 ? '' : 's'} {ordered[0].covers} together.</p>}
          </section>
        ))}
    </>
  );
}

function Item({ item, edition, onOpenPassage, onNote, covers }: { item: StudyItem; edition: EditionRecord; onOpenPassage: (r: Ref) => void; onNote: (t: Target) => void; covers?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const embed = embedFor(item.audio) ?? embedFor(item.url);
  const player = usePlayer();
  const [preview, setPreview] = useState<{ v: number; c: number; text: string }[] | null>(null);
  const { get } = useEditions();
  const toast = useToast();
  const ed = get(edition.id) ?? edition;
  const target = item.xrefTarget && item.section === 'xref' ? parseRefId(item.xrefTarget) : null;
  useEffect(() => {
    if (!target || !expanded || preview) return;
    passageText(ed, target, 6).then(setPreview);
  }, [expanded]);
  const long = !!item.fullExcerpt && item.fullExcerpt.length > (item.excerpt?.length ?? 0) + 10;
  const text = expanded && item.fullExcerpt ? item.fullExcerpt : item.excerpt;
  return (
    <article className="item" data-auth={item.authority}>
      <div className="kicker">
        <span className="dot" />
        <span>{item.kind ?? AUTH_LABEL[item.authority]}</span>
        <span>·</span>
        <span>{AUTH_LABEL[item.authority]}</span>
        {item.period && (
          <>
            <span>·</span>
            <span>{PERIOD_LABEL[item.period]}</span>
          </>
        )}
        {item.lang === 'la' && <span className="chip">Latin</span>}
        {covers && <span className="chip" title="This note covers a run of verses, not only the one you tapped">covers {covers}</span>}
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
      {item.tags && item.tags.length > 0 && <div className="tag-row">{item.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>}
      {item.links && <div className="find-links">{item.links.map((l) => <a key={l.url} className="chip" href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>)}</div>}
      {playing && embed && <InlinePlayer embed={embed} title={item.title} />}
      {text && (
        <div className={`ex${!expanded && long ? ' clamp' : ''}`} lang={item.lang}>
          {text}
        </div>
      )}
      {long && (
        <button className="btn small ghost" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
      {target && (
        <>
          <button className="btn small ghost" onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide text' : 'Show text'}</button>
          {expanded && (
            <div className="ex">
              {!preview && 'Loading…'}
              {preview?.map((p) => (
                <div key={p.c + '.' + p.v}>
                  <sup>{p.v}</sup> {p.text}
                </div>
              ))}
              {preview?.length === 0 && <span className="muted">Not present in this edition (the OpenBible data covers the 66 protocanonical books).</span>}
            </div>
          )}
        </>
      )}
      {item.basis && <div className="muted small">{item.basis}</div>}
      <details className="why">
        <summary style={{ cursor: 'pointer' }}>
          <strong>{MATCH_LABEL[item.match].split(' — ')[0]}</strong> — why this is here
        </summary>
        <div style={{ marginTop: 4 }}>
          {item.why}
          <div style={{ marginTop: 4 }}>
            Source: {item.sourceName}
            {item.rightsNote ? ` · ${item.rightsNote}` : ''}
          </div>
        </div>
      </details>
      <div className="acts">
        {item.internal && (
          <Link className="btn small" to={item.internal}>
            Open
          </Link>
        )}
        {item.episodeId && (
          <button
            className="btn small primary"
            onClick={async () => {
              const b = await loadBiay();
              const ep = b?.byId.get(item.episodeId!);
              if (ep) player.play(ep);
            }}
          >
            <Icon name="play" size={14} /> Play here
          </button>
        )}
        {embed && (
          <button className="btn small primary" onClick={() => setPlaying(!playing)}>
            <Icon name="play" size={14} /> {playing ? 'Close player' : 'Play here'}
          </button>
        )}
        {item.url && !item.internal && (
          <a className="btn small" href={item.url} target="_blank" rel="noreferrer">
            Original source <Icon name="external" size={13} />
          </a>
        )}
        {target && (
          <button className="btn small" onClick={() => onOpenPassage(target)}>
            Open in reader
          </button>
        )}
        {item.userLinkId && (
          <button className="btn small ghost" onClick={async () => { await db.userLinks.delete(item.userLinkId!); toast('Link removed.'); }}>
            Remove
          </button>
        )}
        {!['mine', 'xref', 'doctrine', 'links'].includes(item.section) && (
          <button
            className="btn small ghost"
            onClick={() =>
              onNote(
                item.xrefTarget && item.id.startsWith('ccc-')
                  ? { type: 'catechism', para: +item.xrefTarget, label: item.title }
                  : { type: 'commentary', itemId: item.id, label: `${item.title}${item.author ? ' — ' + item.author : ''}`, url: item.url },
              )
            }
          >
            Note on this
          </button>
        )}
      </div>
    </article>
  );
}
