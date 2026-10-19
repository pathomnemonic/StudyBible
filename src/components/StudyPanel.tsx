import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import NoteEditor from './NoteEditor';
import { SECTIONS, gatherAll, MATCH_LABEL, type SectionKey, type StudyItem } from '../study/providers';
import { formatRef, parseRefId, refId, type Ref } from '../lib/refs';
import { passageText } from '../lib/bibleText';
import type { EditionRecord } from '../data/loader';
import { useEditions } from '../data/EditionsContext';
import type { Target } from '../db/db';

const AUTH_LABEL: Record<string, string> = {
  doctrine: 'Official doctrine',
  magisterial: 'Authoritative Church teaching',
  father: 'Church Father',
  saint: 'Saint / spiritual master',
  scholarship: 'Scholarly / editorial',
  reflection: 'Private reflection / apologetics',
  historical: 'Historical commentary',
  media: 'Media',
};
const PERIOD_LABEL: Record<string, string> = { apostolic: 'Apostolic', patristic: 'Patristic', medieval: 'Medieval', 'early-modern': 'Early modern', modern: 'Modern', contemporary: 'Contemporary' };

export default function StudyPanel({
  refs,
  edition,
  onClose,
  onOpenPassage,
  inline = false,
}: {
  refs: Ref[];
  edition: EditionRecord;
  onClose?: () => void;
  onOpenPassage: (r: Ref) => void;
  inline?: boolean;
}) {
  const [data, setData] = useState<Partial<Record<SectionKey, StudyItem[]>>>({});
  const [loading, setLoading] = useState(true);
  const [authority, setAuthority] = useState('');
  const [period, setPeriod] = useState('');
  const [format, setFormat] = useState('');
  const [author, setAuthor] = useState('');
  const [open, setOpen] = useState<Set<SectionKey>>(new Set(['catechism', 'fathers', 'xref']));
  const [noteTargets, setNoteTargets] = useState<Target[] | null>(null);
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

  const all = useMemo(() => Object.values(data).flat() as StudyItem[], [data]);
  const authors = useMemo(() => [...new Set(all.map((i) => i.author).filter(Boolean) as string[])].sort(), [all]);
  const filtered = (k: SectionKey) =>
    (data[k] ?? []).filter(
      (i) => (!authority || i.authority === authority) && (!period || i.period === period) && (!format || i.format === format) && (!author || i.author === author),
    );
  const toggle = (k: SectionKey) => setOpen((s) => (s.has(k) ? new Set([...s].filter((x) => x !== k)) : new Set([...s, k])));

  return (
    <aside className={`panel ${inline ? '' : 'side'}`} aria-label="Study panel">
      <div className="panel-head">
        <h2>{refs.map((r) => formatRef(r)).join('; ')}</h2>
        <button className="btn small" onClick={() => setNoteTargets(refs.map((r) => ({ type: 'passage', ref: refId(r) })))}>
          <Icon name="note" size={16} /> Note
        </button>
        {onClose && (
          <button className="icon-btn" onClick={onClose} aria-label="Close study panel">
            <Icon name="close" />
          </button>
        )}
      </div>
      <div className="panel-body">
        <details className="small" style={{ marginBottom: 8 }}>
          <summary>
            <Icon name="filter" size={14} /> Filter
          </summary>
          <div className="row" style={{ marginTop: 6 }}>
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
            <select value={format} onChange={(e) => setFormat(e.target.value)} aria-label="Filter by format">
              <option value="">Any format</option>
              {['full-text', 'excerpt', 'summary', 'external-link', 'audio', 'video'].map((f) => (
                <option key={f} value={f}>{f.replace('-', ' ')}</option>
              ))}
            </select>
            <select value={author} onChange={(e) => setAuthor(e.target.value)} aria-label="Filter by author">
              <option value="">Any author</option>
              {authors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </details>
        <p className="muted small">
          Only material actually found for this passage is listed. Each item says why it is attached. Doctrine, tradition and private opinion are labelled separately.
        </p>
        {SECTIONS.map((s) => {
          const items = filtered(s.key);
          const total = (data[s.key] ?? []).length;
          const isOpen = open.has(s.key);
          return (
            <section key={s.key} className="sect">
              <h3>
                <button className="chip" onClick={() => toggle(s.key)} aria-expanded={isOpen}>
                  {isOpen ? '▾' : '▸'} {s.label}
                </button>
                <span className="muted">{s.key in data ? total : loading ? '…' : 0}</span>
              </h3>
              {isOpen && (
                <>
                  {s.hint && <div className="muted small" style={{ marginBottom: 6 }}>{s.hint}</div>}
                  {items.length === 0 && (s.key in data || !loading) && (
                    <div className="empty">
                      {s.key === 'liturgy'
                        ? 'No assigned reading on file for this passage. Liturgical connections come from the lectionary references you import or enter, and from cached LitCal data for solemnities and feasts (see Pray → Readings).'
                        : total && items.length === 0
                          ? 'Everything here is hidden by the current filter.'
                          : s.key === 'catechism'
                            ? 'No verified Catechism citation is on file for this passage. (The shipped set is a small, checked seed; browse the doctrine topics for broader pointers.)'
                            : 'Nothing found for this passage in the sources currently loaded.'}
                    </div>
                  )}
                  {items.slice(0, 40).map((i) => (
                    <Item key={i.id} item={i} edition={edition} onOpenPassage={onOpenPassage} onNote={(t) => setNoteTargets([t])} />
                  ))}
                </>
              )}
            </section>
          );
        })}
      </div>
      {noteTargets && <NoteEditor initialTargets={noteTargets} originEdition={edition.id} onClose={() => setNoteTargets(null)} />}
    </aside>
  );
}

function Item({ item, edition, onOpenPassage, onNote }: { item: StudyItem; edition: EditionRecord; onOpenPassage: (r: Ref) => void; onNote: (t: Target) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<{ v: number; c: number; text: string }[] | null>(null);
  const { get } = useEditions();
  const ed = get(edition.id) ?? edition;
  useEffect(() => {
    if (item.section !== 'xref' || !expanded || preview) return;
    const r = parseRefId(item.xrefTarget!);
    if (r) passageText(ed, r, 6).then(setPreview);
  }, [expanded]);
  const target = item.xrefTarget && item.section === 'xref' ? parseRefId(item.xrefTarget) : null;
  const text = expanded && item.fullExcerpt ? item.fullExcerpt : item.excerpt;
  return (
    <div className="item">
      <div className="t">{item.title}</div>
      {item.author && item.author !== item.title && <div className="by">{item.author}</div>}
      <div className="chips" style={{ marginBottom: 4 }}>
        <span className={`chip${item.authority === 'doctrine' || item.authority === 'magisterial' ? ' good' : ''}`}>{AUTH_LABEL[item.authority]}</span>
        {item.period && <span className="chip">{PERIOD_LABEL[item.period]}</span>}
        <span className="chip">{item.format.replace('-', ' ')}</span>
        {item.lang === 'la' && <span className="chip">Latin</span>}
        {item.date && <span className="chip">{item.date}</span>}
      </div>
      {text && (
        <div className="ex" lang={item.lang}>
          {text}
        </div>
      )}
      {item.fullExcerpt && item.fullExcerpt.length > (item.excerpt?.length ?? 0) && (
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
      <div className="why">
        <strong>{MATCH_LABEL[item.match].split(' — ')[0]}.</strong> {item.why}
      </div>
      <div className="muted small" style={{ marginTop: 4 }}>
        Source: {item.sourceName}
        {item.rightsNote ? ` · ${item.rightsNote}` : ''}
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        {item.internal && (
          <Link className="btn small" to={item.internal}>
            Open
          </Link>
        )}
        {item.url && (
          <a className="btn small" href={item.url} target="_blank" rel="noreferrer">
            Original source <Icon name="external" size={14} />
          </a>
        )}
        {target && (
          <button className="btn small" onClick={() => onOpenPassage(target)}>
            Open in reader
          </button>
        )}
        {item.section !== 'mine' && item.section !== 'xref' && item.section !== 'doctrine' && (
          <button
            className="btn small ghost"
            onClick={() =>
              onNote(
                item.xrefTarget && item.id.startsWith('ccc-')
                  ? { type: 'catechism', para: +item.xrefTarget, label: item.title }
                  : { type: 'commentary', itemId: item.id, label: `${item.title}${item.author ? ' — ' + item.author : ''}`, url: item.url }
              )
            }
          >
            Note on this
          </button>
        )}
      </div>
    </div>
  );
}
