import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useSettings } from '../lib/store';
import CommandPalette from './CommandPalette';
import Modal from './Modal';
import Tour from './Tour';
import { startDriveBackup } from '../sync/drive';
import { useSync } from '../sync/state';
import { useT } from '../lib/i18n';
import type { Key } from '../i18n/en';

// Five places along the bottom: Study (anything educational), Today (where the app opens), the Bible, the Reading room (texts and recordings beyond the Bible, read beside a Bible chapter), and Listen (the Bible in a Year, spoken).
// Profile (notes, plans, settings, prayer) is the round button at the top right of every screen. The Mass readings belong to Today.
const PROFILE_PATHS = ['/profile', '/library', '/settings', '/account', '/about', '/more', '/days', '/pray', '/memorize', '/session', '/share'];
const TABS = [
  { to: '/study', label: 'Study', key: 'nav.study' as Key, icon: 'study', match: ['/study'] },
  { to: '/today', label: 'Today', key: 'nav.today' as Key, icon: 'sun', match: ['/today', '/pray/readings'], home: true },
  { to: '/read', label: 'Bible', key: 'nav.bible' as Key, icon: 'read', match: ['/read'] },
  { to: '/room', label: 'Reading room', key: 'nav.room' as Key, icon: 'library', match: ['/room'] },
  { to: '/listen', label: 'Listen', key: 'nav.listen' as Key, icon: 'listen', match: ['/listen'] },
];

/** Sub-menu shown across the daily-practice pages. */
const DAILY = [
  { to: '/today', label: 'Today' },
  { to: '/pray/readings', label: 'Mass readings' },
  { to: '/pray/plans', label: 'Plans' },
  { to: '/memorize', label: 'Memorize' },
  { to: '/pray', label: 'Prayer' },
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
const inDaily = (path: string) => !isHome(path) && ['/today', '/pray', '/memorize', '/session'].some((p) => path === p || path.startsWith(p + '/'));

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
  // ask the browser not to clear this site's data, and keep the Drive copy (if connected) up to date
  useEffect(() => { void navigator.storage?.persist?.(); startDriveBackup(); }, []);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => { const a = () => setOffline(true), b = () => setOffline(false); window.addEventListener('offline', a); window.addEventListener('online', b); return () => { window.removeEventListener('offline', a); window.removeEventListener('online', b); }; }, []);
  const fullscreenReader = (loc.pathname.startsWith('/read') && s.scriptureOnly) || loc.pathname.startsWith('/widget');
  const home = isHome(loc.pathname);
  const profileActive = PROFILE_PATHS.some((m) => loc.pathname === m || loc.pathname.startsWith(m + '/')) && !loc.pathname.startsWith('/pray/readings');
  return (
    <div className={`shell${fullscreenReader ? ' quiet' : ''}${home ? ' home-shell' : ''}`}>
      {offline && <div className="offline-pill" role="status">Offline: everything you have opened or downloaded still works</div>}
      <a className="skip" href="#main">
        {t('nav.skip')}
      </a>
      <nav className="tabs" aria-label={t('nav.main')}>
        <div className="brand" aria-hidden="true">
          <span className="mark">✛</span>
          <span>Study Bible</span>
        </div>
        <button className="tab utility search-tab" onClick={() => setPalette(true)} aria-label="Search and jump (Ctrl+K)" title="Search and jump (Ctrl+K)">
          <span className="ico"><Icon name="search" /></span>
          <span>{t('nav.search')}</span>
        </button>
        {TABS.map((tb) => {
          const active = (tb.match.some((m) => loc.pathname === m || loc.pathname.startsWith(m + '/'))) || (!!tb.home && loc.pathname === '/');
          return (
            <NavLink
              key={tb.to}
              to={tb.to === '/read' && s.last ? `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}` : tb.to}
              className={() => `tab${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="ico"><Icon name={tb.icon} /></span>
              <span>{t(tb.key)}</span>
              {tb.to === '/profile' && sync.user && <i className={`sync-dot ${sync.status}`} />}
            </NavLink>
          );
        })}
        <div className="tab-spacer" />
      </nav>
      {!fullscreenReader && (
        <NavLink to="/profile" className={`profile-btn${profileActive ? ' active' : ''}`} aria-label="Profile: notes, plans, settings" aria-current={profileActive ? 'page' : undefined} title="Profile">
          <Icon name="user" size={20} />
          {sync.user && <i className={`sync-dot ${sync.status}`} />}
        </NavLink>
      )}
      <main id="main" className="main">
        {inDaily(loc.pathname) && !fullscreenReader && (
          <nav className="subnav" aria-label="Daily practice">
            {DAILY.map((d, i) => (
              <NavLink key={d.to} to={d.to} className={dailyActive(loc.pathname) === i ? 'on' : ''} aria-current={dailyActive(loc.pathname) === i ? 'page' : undefined}>{d.label}</NavLink>
            ))}
          </nav>
        )}
        {loc.pathname.startsWith('/study/') && (
          <nav className="crumbs" aria-label="Breadcrumb">
            <NavLink to="/study">← Study</NavLink>
          </nav>
        )}
        {['/library', '/settings', '/account', '/about', '/more', '/days'].some((p) => loc.pathname === p || loc.pathname.startsWith(p + '/')) && (
          <nav className="crumbs" aria-label="Breadcrumb">
            <NavLink to="/profile">← Profile</NavLink>
          </nav>
        )}
        {children}
      </main>
      {keys && (
        <Modal title="Keyboard shortcuts" onClose={() => setKeys(false)}>
          <dl className="keys-list">{[['Ctrl/⌘ K', 'Jump to a passage, search, go anywhere'], ['?', 'This help'], ['← / →', 'Previous / next (day, chapter)'], ['Home page: i', 'Where today’s texts come from'], ['In the Bible: S', 'Study panel'], ['In the Bible: N', 'Note on the selection'], ['Esc', 'Close a panel']].map(([k, d]) => <div key={k}><dt><kbd>{k}</kbd></dt><dd>{d}</dd></div>)}</dl>
        </Modal>
      )}
      <Tour />
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </div>
  );
}
