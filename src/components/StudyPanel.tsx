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
}: {
  refs: Ref[];
  edition: EditionRecord;
  onClose?: () => void;
  onOpenPassage: (r: Ref) => void;
  inline?: boolean;
  initialTab?: string;
}) {
  const [data, setData] = useState<Partial<Record<SectionKey, StudyItem[]>>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [authority, setAuthority] = useState('');
  const [period, setPeriod] = useState('');
  const [author, setAuthor] = useState('');
  const [noteTargets, setNoteTargets] = useState<Target[] | null>(null);
  const [addLink, setAddLink] = useState(false);
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
          <h2>{heading}</h2>
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
          {loading ? 'Gathering what is connected to this passage…' : total ? `${total} connected resource${total === 1 ? '' : 's'}${filtersOn ? ' (filtered)' : ''}` : 'Nothing connected yet — see the tabs below for what is covered.'}
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
            data={data}
            loading={loading}
            passes={passes}
            go={setTab}
            render={(i) => <Item key={i.id} item={i} edition={edition} onOpenPassage={onOpenPassage} onNote={(t) => setNoteTargets([t])} />}
          />
        )}

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
                {list.length === 0 && <div className="empty">{emptyMessage(sk, refs[0].book)}</div>}
                {(sk === 'fathers' || sk === 'saints' ? [...list].sort((a, b) => (a.author ?? '').localeCompare(b.author ?? '')) : list).map((i, n, arr) => (
                  <div key={i.id}>
                    {(sk === 'fathers' || sk === 'saints') && i.author && i.author !== arr[n - 1]?.author && <h4 className="by-author">{i.author}</h4>}
                    <Item item={i} edition={edition} onOpenPassage={onOpenPassage} onNote={(t) => setNoteTargets([t])} />
                  </div>
                ))}
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

function emptyMessage(sk: SectionKey, book: string): string {
  switch (sk) {
    case 'catechism':
      return 'No verified Catechism citation is on file for this passage. The shipped set is a checked seed; browse the doctrine topics for broader pointers.';
    case 'commentary':
      return ['TOB', 'JDT', 'WIS', 'SIR', 'BAR', '1MA', '2MA'].includes(book)
        ? 'Haydock’s module does not include the deuterocanonical books, and the Catena covers only the Gospels. The Glossa (Latin) and the Fathers library may still have material.'
        : 'No commentary note is attached to this exact verse. Try the chapter or neighbouring verses.';
    case 'fathers':
      return 'No work in the Fathers & saints library comments on or cites this passage. The library is growing; see Study → Fathers & saints for what is covered.';
    case 'catholic-answers':
      return 'No Catholic Answers page is linked to this passage yet.';
    default:
      return 'Nothing found for this passage.';
  }
}

function Overview({ data, loading, passes, go, render }: { data: Partial<Record<SectionKey, StudyItem[]>>; loading: boolean; passes: (i: StudyItem) => boolean; go: (t: string) => void; render: (i: StudyItem) => JSX.Element }) {
  const blocks = TABS.map((t) => {
    const all = t.sections.flatMap((s) => data[s] ?? []).filter((i) => isReal(i) && passes(i));
    return { t, all };
  });
  const any = blocks.some((b) => b.all.length);
  return (
    <>
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
        .map(({ t, all }) => (
          <section key={t.id} className="sect">
            <h3>
              {t.label} <span className="n">{all.length}</span>
              {all.length > 2 && (
                <button className="more" onClick={() => go(t.id)}>
                  See all {all.length} →
                </button>
              )}
            </h3>
            {all.slice(0, 2).map(render)}
          </section>
        ))}
    </>
  );
}

function Item({ item, edition, onOpenPassage, onNote }: { item: StudyItem; edition: EditionRecord; onOpenPassage: (r: Ref) => void; onNote: (t: Target) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const embed = embedFor(item.url);
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
