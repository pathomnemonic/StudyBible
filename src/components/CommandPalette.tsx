import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { BOOKS } from '../lib/canon';
import { parseRefs, formatRef } from '../lib/refs';
import { useSettings } from '../lib/store';

interface Cmd {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
}

const NAV: { label: string; to: string }[] = [
  { label: 'Today', to: '/today' },
  { label: 'Profile (notes, plans, settings)', to: '/profile' },
  { label: 'Catechism of the Catholic Church', to: '/study/catechism' },
  { label: 'Favourite days', to: '/days' },
  { label: 'Everything in the app (all pages)', to: '/more' },
  { label: 'Study paths (guided journeys)', to: '/study/paths' },
  { label: 'Sleep mode (a psalm read slowly)', to: '/pray/sleep' },
  { label: 'Who quoted this verse? (quotations)', to: '/study/quotations' },
  { label: 'Councils and Church documents', to: '/study/church' },
  { label: 'Reading room (saints, Fathers, catechisms)', to: '/study/fathers' },
  { label: 'Key words and phrases', to: '/study/terms' },
  { label: 'Scripture universe (galaxy)', to: '/study/universe' },
  { label: 'Time and place', to: '/study/timespace' },
  { label: 'Picture gallery (paintings and engravings)', to: '/study/gallery' },
  { label: 'Share a verse as a picture', to: '/share' },
  { label: 'Bible in a Year', to: '/listen' },
  { label: 'Read with the Church (guided session)', to: '/session' },
  { label: 'Read', to: '/read' },
  { label: 'Study home', to: '/study' },
  { label: 'Fathers & saints library', to: '/study/fathers' },
  { label: 'Catechism & doctrine', to: '/study/doctrine' },
  { label: 'Sources & rights', to: '/study/sources' },
  { label: 'Biblical theology explorer', to: '/study/themes' },
  { label: 'Textual history', to: '/study/textual' },
  { label: 'The biblical world: journeys and archaeology', to: '/study/world' },
  { label: 'Maps', to: '/study/maps' },
  { label: 'Concordance', to: '/study/concordance' },
  { label: 'Topical index', to: '/study/topical' },
  { label: 'Books and outlines', to: '/study/books' },
  { label: 'Genealogies and family trees', to: '/study/people' },
  { label: 'Gospel synopsis', to: '/study/synopsis' },
  { label: 'Paul’s letters: outlines', to: '/study/pauline' },
  { label: 'Parables, miracles, prophecies, covenants', to: '/study/index' },
  { label: 'Listen', to: '/listen' },
  { label: 'Today’s readings', to: '/pray/readings' },
  { label: 'Pray', to: '/pray' },
  { label: 'Journal', to: '/pray/journal' },
  { label: 'Reading plans', to: '/pray/plans' },
  { label: 'Memorize Scripture', to: '/memorize' },
  { label: 'My library (notes, highlights, bookmarks)', to: '/library' },
  { label: 'Account & sync', to: '/account' },
  { label: 'Settings', to: '/settings' },
  { label: 'About & feature status', to: '/about' },
];

/** ⌘K / Ctrl+K: jump to any passage, search everything, or go anywhere in the app. */
export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const nav = useNavigate();
  const [s] = useSettings();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  const cmds = useMemo<Cmd[]>(() => {
    const out: Cmd[] = [];
    const t = q.trim();
    const go = (to: string) => () => {
      onClose();
      nav(to);
    };
    if (t) {
      const p = parseRefs(t);
      if (p.ok) {
        for (const { ref } of p.refs.slice(0, 1)) {
          const v = ref.v1 ? `?v=${ref.v1}${ref.v2 && ref.v2 !== ref.v1 && ref.c2 === ref.c1 ? '-' + ref.v2 : ''}` : '';
          out.push({ id: 'ref', group: 'Go to passage', label: formatRef(ref), hint: 'Open in reader', run: go(`/read/${s.defaultEdition}/${ref.book}/${ref.c1}${v}`) });
        }
      }
      out.push({ id: 'search', group: 'Search', label: `Search everything for “${t}”`, hint: 'Scripture, teaching, Fathers', run: go(`/study/search?q=${encodeURIComponent(t)}`) });
      const lc = t.toLowerCase();
      for (const b of BOOKS.filter((b) => b.name.toLowerCase().includes(lc)).slice(0, 5)) {
        out.push({ id: 'b-' + b.id, group: 'Books', label: b.name, run: go(`/read/${s.defaultEdition}/${b.id}/1`) });
      }
    }
    const lc = t.toLowerCase();
    for (const n of NAV.filter((n) => !lc || n.label.toLowerCase().includes(lc))) out.push({ id: n.to, group: 'Go to', label: n.label, run: go(n.to === '/read' && s.last ? `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}` : n.to) });
    return out;
  }, [q, nav, onClose, s.defaultEdition, s.last]);

  useEffect(() => setSel(0), [q]);
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') (e.preventDefault(), setSel((i) => Math.min(i + 1, cmds.length - 1)));
    else if (e.key === 'ArrowUp') (e.preventDefault(), setSel((i) => Math.max(i - 1, 0)));
    else if (e.key === 'Enter') (e.preventDefault(), cmds[sel]?.run());
    else if (e.key === 'Escape') onClose();
  };
  let last = '';
  return (
    <div className="palette-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={key} placeholder="Type a passage (Jn 6:51-58), a topic, or a page…" aria-label="Command palette input" />
        <ul role="listbox">
          {cmds.map((c, i) => {
            const head = c.group !== last ? <li key={'g' + c.group} className="group" role="presentation">{c.group}</li> : null;
            last = c.group;
            return (
              <Fragment key={c.id}>
                {head}
                <li key={c.id} role="option" aria-selected={i === sel} onMouseEnter={() => setSel(i)} onClick={c.run}>
                  <Icon name={c.group === 'Search' ? 'search' : c.group === 'Go to' ? 'chevR' : 'read'} size={16} />
                  <span style={{ flex: 1 }}>{c.label}</span>
                  {c.hint && <span className="muted small">{c.hint}</span>}
                </li>
              </Fragment>
            );
          })}
          {!cmds.length && <li role="presentation">No matches</li>}
        </ul>
        <div className="hint"><span>↑↓ select</span><span>↵ open</span><span>esc close</span></div>
      </div>
    </div>
  );
}
