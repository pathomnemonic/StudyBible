import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useSettings } from '../lib/store';

const TABS = [
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
  const fullscreenReader = loc.pathname.startsWith('/read') && s.scriptureOnly;
  return (
    <div className={`shell${fullscreenReader ? ' quiet' : ''}`}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <nav className="tabs" aria-label="Main sections">
        <div className="brand" aria-hidden="true">
          <span className="cross">✛</span>
          <span>Study Bible</span>
        </div>
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to === '/read' && s.last ? `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}` : t.to}
            className={() => `tab${loc.pathname.startsWith(t.match) ? ' active' : ''}`}
            aria-current={loc.pathname.startsWith(t.match) ? 'page' : undefined}
          >
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </NavLink>
        ))}
        <div className="tab-spacer" />
        <button className="tab utility" onClick={() => nav('/study/search')} aria-label="Search">
          <Icon name="search" />
          <span>Search</span>
        </button>
        <NavLink to="/settings" className={`tab utility${loc.pathname.startsWith('/settings') ? ' active' : ''}`} aria-label="Settings and account">
          <Icon name="gear" />
          <span>Settings</span>
        </NavLink>
      </nav>
      <main id="main" className="main">
        {children}
      </main>
    </div>
  );
}
