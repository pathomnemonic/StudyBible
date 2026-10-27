import { lazy, Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import Icon from './Icon';

const StudyHome = lazy(() => import('../pages/study/StudyHome'));

/** The Bible's study tools in a sheet that slides in from the left, opened by the menu button at the top of the reader. */
export default function ExploreDrawer({ onClose }: { onClose: () => void }) {
  const loc = useLocation();
  const at = useRef(loc.pathname);
  useEffect(() => { if (loc.pathname !== at.current) onClose(); /* leaving the page closes the sheet */ }, [loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return createPortal(
    <div className="drawer-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Explore the Bible">
        <div className="drawer-head">
          <h2>Explore the Bible</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          <Suspense fallback={<div className="center-note">Loading…</div>}><StudyHome embedded /></Suspense>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
