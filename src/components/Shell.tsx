import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useSettings } from '../lib/store';
import CommandPalette from './CommandPalette';
import { useSync } from '../sync/state';
import { useT } from '../lib/i18n';
import type { Key } from '../i18n/en';

// The places you actually live in. Daily practice (Mass readings, plans, Bible in a Year, memorizing, prayer) sits under Today with a sub-menu. Settings and the account are reached from the sidebar, or the gear on Today.
const TABS = [
  { to: '/today', label: 'Today', key: 'nav.today' as Key, icon: 'sun', match: ['/today', '/pray', '/memorize', '/session'], home: true },
  { to: '/read', label: 'Bible', key: 'nav.bible' as Key, icon: 'read', match: ['/read'] },
  { to: '/study', label: 'Study', key: 'nav.study' as Key, icon: 'study', match: ['/study'] },
  { to: '/library', label: 'Notes', key: 'nav.notes' as Key, icon: 'library', match: ['/library'] },
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
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
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
  const fullscreenReader = (loc.pathname.startsWith('/read') && s.scriptureOnly) || loc.pathname.startsWith('/widget');
  const home = isHome(loc.pathname);
  return (
    <div className={`shell${fullscreenReader ? ' quiet' : ''}${home ? ' home-shell' : ''}`}>
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
          const active = tb.match.some((m) => loc.pathname.startsWith(m)) || (!!tb.home && loc.pathname === '/');
          return (
            <NavLink
              key={tb.to}
              to={tb.to === '/read' && s.last ? `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}` : tb.to}
              className={() => `tab${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="ico"><Icon name={tb.icon} /></span>
              <span>{t(tb.key)}</span>
            </NavLink>
          );
        })}
        <NavLink to="/settings" className={`tab more-tab${loc.pathname.startsWith('/settings') || loc.pathname.startsWith('/account') || loc.pathname.startsWith('/about') ? ' active' : ''}`} aria-label={`${t('nav.more')}: ${t('nav.settings')}, ${t('nav.account')}`}>
          <span className="ico"><Icon name="gear" /></span>
          <span>{t('nav.more')}</span>
        </NavLink>
        <div className="tab-spacer" />
        <NavLink to="/settings" className={`tab utility${loc.pathname.startsWith('/settings') ? ' active' : ''}`} aria-label="Settings and account">
          <span className="ico"><Icon name="gear" /></span>
          <span>{t('nav.settings')}</span>
        </NavLink>
        {!s.localOnly && <NavLink to="/account" className={`tab utility${loc.pathname.startsWith('/account') ? ' active' : ''}`} aria-label={sync.user ? `Account: ${sync.user.email}` : 'Sign in'}>
          <span className="ico">{sync.user ? <span className="avatar">{(sync.user.name || sync.user.email)[0].toUpperCase()}</span> : <Icon name="info" />}</span>
          <span>{sync.user ? t('nav.account') : t('nav.signin')}</span>
          {sync.user && <i className={`sync-dot ${sync.status}`} />}
        </NavLink>}
      </nav>
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
        {children}
      </main>
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </div>
  );
}
