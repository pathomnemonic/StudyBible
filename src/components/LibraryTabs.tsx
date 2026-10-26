import { NavLink } from 'react-router-dom';

/** One strip across the three library pages, so they read as one place. */
export default function LibraryTabs() {
  return (
    <nav className="library-tabs" aria-label="Library">
      <NavLink to="/room">Read</NavLink>
      <NavLink to="/study/church">Church documents</NavLink>
      <NavLink to="/study/papal">Papal writings</NavLink>
      <NavLink to="/study/paths">Study paths</NavLink>
    </nav>
  );
}
