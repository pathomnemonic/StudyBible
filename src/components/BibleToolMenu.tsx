import { useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BIBLE_TOOLS } from '../lib/bibleTools';

/** One slim bar for the Bible tools: a way back to the text, and a single menu naming the tool you are in. */
export default function BibleToolMenu({ back }: { back: string }) {
  const loc = useLocation();
  const ref = useRef<HTMLDetailsElement>(null);
  const cur = BIBLE_TOOLS.find((t) => loc.pathname === t.match || loc.pathname.startsWith(t.match + '/'));
  const groups: [string, typeof BIBLE_TOOLS][] = [['The text', BIBLE_TOOLS.filter((t) => t.group === 'text')], ['Words and topics', BIBLE_TOOLS.filter((t) => t.group === 'words')]];
  return (
    <nav className="tool-bar" aria-label="Bible tools">
      <NavLink to={back} className="tool-back">← Reading</NavLink>
      <details ref={ref} className="tool-menu">
        <summary>{cur?.label ?? 'Bible tools'}<span aria-hidden="true">▾</span></summary>
        <div className="tool-menu-list" onClick={() => ref.current?.removeAttribute('open')}>
          {groups.map(([g, list]) => (
            <div key={g}><p className="tool-g">{g}</p>{list.map((t) => <NavLink key={t.to} to={t.to} className={t === cur ? 'on' : ''}><strong>{t.label}</strong><small>{t.blurb}</small></NavLink>)}</div>
          ))}
        </div>
      </details>
    </nav>
  );
}
