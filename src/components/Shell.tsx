import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useSettings } from '../lib/store';
import CommandPalette from './CommandPalette';
import { useSync } from '../sync/state';

const TABS = [
  { to: '/today', label: 'Today', icon: 'sun', match: '/today' },
  { to: '/read', label: 'Read', icon: 'read', match: '/read' },
  { to: '/study', label: 'Study', icon: 'study', match: '/study' },
  { to: '/listen', label: 'Listen', icon: 'listen', match: '/listen' },
  { to: '/pray', label: 'Pray', icon: 'pray', match: '/pray' },
  { to: '/library', label: 'Library', icon: 'library', match: '/library' },
];

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
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const fullscreenReader = loc.pathname.startsWith('/read') && s.scriptureOnly;
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
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to === '/read' && s.last ? `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}` : t.to}
            className={() => `tab${loc.pathname.startsWith(t.match) ? ' active' : ''}`}
            aria-current={loc.pathname.startsWith(t.match) ? 'page' : undefined}
          >
            <span className="ico"><Icon name={t.icon} /></span>
            <span>{t.label}</span>
          </NavLink>
        ))}
        <div className="tab-spacer" />
        <button className="tab utility" onClick={() => setPalette(true)} aria-label="Search and jump (Ctrl+K)" title="Search and jump (Ctrl+K)">
          <span className="ico"><Icon name="search" /></span>
          <span>Search</span>
        </button>
        <NavLink to="/settings" className={`tab utility${loc.pathname.startsWith('/settings') ? ' active' : ''}`} aria-label="Settings and account">
          <span className="ico"><Icon name="gear" /></span>
          <span>Settings</span>
        </NavLink>
        <NavLink to="/account" className={`tab utility${loc.pathname.startsWith('/account') ? ' active' : ''}`} aria-label={sync.user ? `Account: ${sync.user.email}` : 'Sign in'}>
          <span className="ico">{sync.user ? <span className="avatar">{(sync.user.name || sync.user.email)[0].toUpperCase()}</span> : <Icon name="info" />}</span>
          <span>{sync.user ? 'Account' : 'Sign in'}</span>
          {sync.user && <i className={`sync-dot ${sync.status}`} />}
        </NavLink>
      </nav>
      <main id="main" className="main">
        {children}
      </main>
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </div>
  );
}
