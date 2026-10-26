import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useSettings } from '../lib/store';
import CommandPalette from './CommandPalette';
import Modal from './Modal';
import Tour from './Tour';
import Welcome from './Welcome';
import { NewDot } from './Hints';
import { markSeen } from '../lib/seen';
import { startDriveBackup } from '../sync/drive';
import { useSync } from '../sync/state';
import { useT } from '../lib/i18n';
import type { Key } from '../i18n/en';
import BibleToolMenu from './BibleToolMenu';
import { BRAND } from '../lib/brand';
import BackupBanner from './BackupBanner';
import { snapshotIfDue } from '../lib/safety';
import { isBibleToolPath } from '../lib/bibleTools';
import { DAILY_PRAY, inBible, inLearn, inPray, inRead, inYou, under } from '../lib/tabs';

// Seven places along the bottom: Learn (the faith, taught), Read (texts and recordings beyond the Bible, read beside a Bible chapter), Study (anything educational), Today (where the app opens), the Bible, and Listen (the Bible in a Year, spoken).
// You (notes, plans, settings, downloads) is the first tab. Study tools live with the Bible tab. The Mass readings belong to Today.
const TABS = [
  { to: '/profile', label: 'You', key: 'nav.you' as Key, icon: 'user', match: [] as string[] },
  { to: '/room', label: 'Read', key: 'nav.room' as Key, icon: 'library', match: ['/room'] },
  { to: '/learn', label: 'Learn', key: 'nav.learn' as Key, icon: 'learn', match: [] as string[] },
  { to: '/today', label: 'Today', key: 'nav.today' as Key, icon: 'sun', match: ['/today', '/pray/readings'], home: true },
  { to: '/read', label: 'Bible', key: 'nav.bible' as Key, icon: 'read', match: ['/read'] },
  { to: '/pray', label: 'Pray', key: 'nav.pray' as Key, icon: 'pray', match: [] as string[] },
  { to: '/listen', label: 'Media', key: 'nav.listen' as Key, icon: 'listen', match: ['/listen'] },
];

/** Sub-menu shown across the daily-practice pages. */
const DAILY = [
  { to: '/today', label: 'Today' },
  { to: '/pray/readings', label: 'Mass readings' },
  { to: '/pray/plans', label: 'Plans' },
  { to: '/memorize', label: 'Memorize' },
];
const dailyActive = (path: string) => {
  let best = -1;
  let len = 0;
  DAILY.forEach((d, i) => {
    if ((path === d.to || path.startsWith(d.to + '/')) && d.to.length > len) {
      best = i;
      len = d.to.length;
    }
  });
  if (best < 0 && path.startsWith('/session')) best = 0;
  return best;
};
const isHome = (path: string) => path === '/' || path === '/today';
const inDaily = (path: string) => !isHome(path) && ['/today', '/pray/readings', '/pray/plans', '/memorize', '/session'].some((p) => path === p || path.startsWith(p + '/'));

/** Each tab remembers the last page you were on inside it for this visit, so leaving for a moment and tapping the tab again brings you back to it; tapping the tab you are already on goes to its start. */
const tabKey = (to: string) => `sb:tabloc:${to}`;
const lastIn = (to: string) => { try { return sessionStorage.getItem(tabKey(to)) || to; } catch { return to; } };
const ROOM_KEY = 'sb:room:last';
const lastRoom = () => { try { return localStorage.getItem(ROOM_KEY) || '/room'; } catch { return '/room'; } };

export default function Shell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [s] = useSettings();
  const sync = useSync();
  const t = useT();
  const [palette, setPalette] = useState(false);
  const [keys, setKeys] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement | null;
      if (e.key === '?' && !/INPUT|TEXTAREA|SELECT/.test(tg?.tagName ?? '') && !tg?.isContentEditable && !location.hash.startsWith('#/read')) setKeys(true);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    const open = () => setPalette(true);
    window.addEventListener('keydown', h);
    window.addEventListener('studybible:search', open);
    return () => {
      window.removeEventListener('keydown', h);
      window.removeEventListener('studybible:search', open);
    };
  }, []);
  // the Read tab returns to the work you were reading, not the front page
  useEffect(() => {
    const p = loc.pathname;
    const hit = TABS.find((tb) => tb.to === '/profile' ? inYou(p) : tb.to === '/pray' ? inPray(p) : tb.to === '/learn' ? inLearn(p) : tb.to === '/listen' ? p === '/listen' || p.startsWith('/listen/') : false);
    if (hit) { try { sessionStorage.setItem(tabKey(hit.to), p + loc.search); } catch { /* private mode */ } }
  }, [loc.pathname, loc.search]);
  useEffect(() => { if (loc.pathname === '/room' || loc.pathname.startsWith('/room/')) { try { localStorage.setItem(ROOM_KEY, loc.pathname + loc.search); } catch { /* private mode */ } } }, [loc.pathname, loc.search]);
  // anything marked data-seen clears its red dot when it is opened
  useEffect(() => {
    const h = (e: Event) => { const el = (e.target as HTMLElement | null)?.closest?.('[data-seen]'); const id = el?.getAttribute('data-seen'); if (id) markSeen(id); };
    document.addEventListener('click', h, true);
    return () => document.removeEventListener('click', h, true);
  }, []);
  // arriving at a tab any other way (a link, the address bar) counts as having opened it
  useEffect(() => {
    const p = loc.pathname;
    const hit = TABS.find((tb) => tb.to === '/profile' ? inYou(p) : tb.to === '/room' ? inRead(p) : tb.to === '/pray' ? inPray(p) : tb.to === '/learn' ? inLearn(p) : tb.to === '/read' ? inBible(p) : tb.to !== '/today' && (p === tb.to || p.startsWith(tb.to + '/')));
    if (hit) markSeen(`tab.${hit.to}`);
  }, [loc.pathname]);
  // ask the browser not to clear this site's data, and keep the Drive copy (if connected) up to date
  useEffect(() => { void navigator.storage?.persist?.(); startDriveBackup(); const t = window.setTimeout(() => void snapshotIfDue().catch(() => {}), 20000); return () => window.clearTimeout(t); }, []);
  // a menu that is open closes when anything else is tapped, on touch screens too
  useEffect(() => {
    const h = (e: Event) => { const open = document.querySelector('.more-btn[aria-expanded="true"]') as HTMLElement | null; if (open && !(e.target as HTMLElement).closest('.more-wrap')) open.click(); };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, []);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => { const a = () => setOffline(true), b = () => setOffline(false); window.addEventListener('offline', a); window.addEventListener('online', b); return () => { window.removeEventListener('offline', a); window.removeEventListener('online', b); }; }, []);
  const fullscreenReader = ((loc.pathname.startsWith('/read') || loc.pathname.startsWith('/room/work') || loc.pathname.startsWith('/study/works')) && s.scriptureOnly) || loc.pathname.startsWith('/widget');
  const home = isHome(loc.pathname);
  return (
    <div className={`shell${fullscreenReader ? ' quiet' : ''}${home ? ' home-shell' : ''}`}>
      {offline && <div className="offline-pill" role="status">Offline: everything you have opened or downloaded still works</div>}
      <a className="skip" href="#main">
        {t('nav.skip')}
      </a>
      <nav className="tabs" aria-label={t('nav.main')}>
        <div className="brand" aria-hidden="true">
          <span className="mark">✛</span>
          <span>{BRAND.name}</span>
        </div>
        <button className="tab utility search-tab" onClick={() => setPalette(true)} aria-label="Search and jump (Ctrl+K)" title="Search and jump (Ctrl+K)">
          <span className="ico"><Icon name="search" /></span>
          <span>{t('nav.search')}</span>
        </button>
        {TABS.map((tb) => {
          const p = loc.pathname;
          const active = tb.to === '/profile' ? inYou(p) : tb.to === '/room' ? inRead(p) : tb.to === '/pray' ? inPray(p) : tb.to === '/learn' ? inLearn(p) : tb.to === '/read' ? inBible(p) : (tb.match.some((m) => p === m || p.startsWith(m + '/'))) || (!!tb.home && p === '/');
          return (
            <NavLink
              key={tb.to}
              to={tb.to === '/read' && s.last ? `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}` : tb.to === '/room' ? lastRoom() : ['/pray', '/learn', '/listen', '/profile'].includes(tb.to) && !active ? lastIn(tb.to) : tb.to}
              className={() => `tab${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              data-seen={tb.to === '/today' ? undefined : `tab.${tb.to}`}
            >
              <span className="ico"><Icon name={tb.icon} /></span>
              <span>{t(tb.key)}</span>
              {tb.to !== '/today' && <NewDot id={`tab.${tb.to}`} label={`New: ${tb.label}`} />}
              {tb.to === '/profile' && sync.user && <i className={`sync-dot ${sync.status}`} />}
            </NavLink>
          );
        })}
        <div className="tab-spacer" />
      </nav>
      <main id="main" className="main">
        {!home && <BackupBanner />}
        {inDaily(loc.pathname) && !fullscreenReader && (
          <nav className="subnav" aria-label="Daily practice">
            {DAILY.map((d, i) => (
              <NavLink key={d.to} to={d.to} className={dailyActive(loc.pathname) === i ? 'on' : ''} aria-current={dailyActive(loc.pathname) === i ? 'page' : undefined}>{d.to === '/pray/readings' && s.tradition !== 'latin' ? 'Roman readings' : d.label}</NavLink>
            ))}
          </nav>
        )}
        {isBibleToolPath(loc.pathname) && !fullscreenReader && (
          <BibleToolMenu back={s.last ? `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}` : '/read'} />
        )}
        {(() => {
          const p = loc.pathname;
          const c: [string, string] | null = p.startsWith('/study/') && inLearn(p) ? ['/learn', 'Learn'] : p.startsWith('/study/') && inRead(p) ? ['/room', 'Read'] : p.startsWith('/study/') && !isBibleToolPath(p) ? ['/study', 'Explore'] : inYou(p) && p !== '/profile' ? ['/profile', 'You'] : /^\/pray\/[^/]+$/.test(p) && !inDaily(p) && !fullscreenReader ? ['/pray', 'Pray'] : p.startsWith('/listen/episode') ? ['/listen', 'Media'] : null;
          return c ? <nav className="crumbs" aria-label="Breadcrumb"><NavLink to={c[0]}>← {c[1]}</NavLink></nav> : null;
        })()}
        {children}
      </main>
      {keys && (
        <Modal title="Keyboard shortcuts" onClose={() => setKeys(false)}>
          <dl className="keys-list">{[['Ctrl/⌘ K', 'Jump to a passage, search, go anywhere'], ['?', 'This help'], ['← / →', 'Previous / next (day, chapter)'], ['Home page: i', 'Where today’s texts come from'], ['In the Bible: S', 'Study panel'], ['In the Bible: N', 'Note on the selection'], ['Esc', 'Close a panel']].map(([k, d]) => <div key={k}><dt><kbd>{k}</kbd></dt><dd>{d}</dd></div>)}</dl>
        </Modal>
      )}
      <Welcome />
      <Tour />
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </div>
  );
}
