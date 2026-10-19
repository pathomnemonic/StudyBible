import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useSettings } from '../lib/store';
import CommandPalette from './CommandPalette';
import { useSync } from '../sync/state';

// Four places you actually live in. Daily practice (Mass readings, plans, listening, prayer, memorizing) is one tab with a
// sub-menu, so the bar stays short and the Bible stays first. On phones a fifth "More" tab reaches settings and the account.
const TABS = [
  { to: '/read', label: 'Bible', icon: 'read', match: ['/read'] },
  { to: '/study', label: 'Study', icon: 'study', match: ['/study'] },
  { to: '/today', label: 'Today', icon: 'sun', match: ['/today', '/pray', '/listen', '/memorize', '/session'] },
  { to: '/library', label: 'Notes', icon: 'library', match: ['/library'] },
];

/** Sub-menu shown across the daily-practice pages. */
const DAILY = [
  { to: '/today', label: 'Today' },
  { to: '/pray/readings', label: 'Mass readings' },
  { to: '/pray/plans', label: 'Plans' },
  { to: '/listen', label: 'Listen' },
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
const inDaily = (path: string) => ['/today', '/pray', '/listen', '/memorize', '/session'].some((p) => path === p || path.startsWith(p + '/'));

export default function Shell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [s] = useSettings();
  const sync = useSync();
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
  return (
    <div className={`shell${fullscreenReader ? ' quiet' : ''}`}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <nav className="tabs" aria-label="Main sections">
        <div className="brand" aria-hidden="true">
          <span className="mark">✛</span>
          <span>Study Bible</span>
        </div>
        <button className="tab utility search-tab" onClick={() => setPalette(true)} aria-label="Search and jump (Ctrl+K)" title="Search and jump (Ctrl+K)">
          <span className="ico"><Icon name="search" /></span>
          <span>Search</span>
        </button>
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to === '/read' && s.last ? `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}` : t.to}
            className={() => `tab${t.match.some((m) => loc.pathname.startsWith(m)) ? ' active' : ''}`}
            aria-current={t.match.some((m) => loc.pathname.startsWith(m)) ? 'page' : undefined}
          >
            <span className="ico"><Icon name={t.icon} /></span>
            <span>{t.label}</span>
          </NavLink>
        ))}
        <NavLink to="/settings" className={`tab more-tab${loc.pathname.startsWith('/settings') || loc.pathname.startsWith('/account') || loc.pathname.startsWith('/about') ? ' active' : ''}`} aria-label="More: settings, account, about">
          <span className="ico"><Icon name="gear" /></span>
          <span>More</span>
        </NavLink>
        <div className="tab-spacer" />
        <NavLink to="/settings" className={`tab utility${loc.pathname.startsWith('/settings') ? ' active' : ''}`} aria-label="Settings and account">
          <span className="ico"><Icon name="gear" /></span>
          <span>Settings</span>
        </NavLink>
        {!s.localOnly && <NavLink to="/account" className={`tab utility${loc.pathname.startsWith('/account') ? ' active' : ''}`} aria-label={sync.user ? `Account: ${sync.user.email}` : 'Sign in'}>
          <span className="ico">{sync.user ? <span className="avatar">{(sync.user.name || sync.user.email)[0].toUpperCase()}</span> : <Icon name="info" />}</span>
          <span>{sync.user ? 'Account' : 'Sign in'}</span>
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
