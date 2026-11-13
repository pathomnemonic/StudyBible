import { Link, useLocation } from 'react-router-dom';

/** Shown for an address the app does not know, so an old or mistyped shared link says so instead of silently landing on Today. */
export default function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <div className="page">
      <h1>That page is not here</h1>
      <p className="lede">Nothing lives at <code>{pathname}</code>. The link may be old or mistyped, or the page may have moved.</p>
      <p className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <Link className="btn primary" to="/">Go to Today</Link>
        <Link className="btn" to="/more">Every page in the app</Link>
        <Link className="btn ghost" to="/help">Help</Link>
      </p>
    </div>
  );
}
