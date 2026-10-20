import { useState } from 'react';
import { Link } from 'react-router-dom';

const VERSION = '2026-10';
const key = 'sb:whatsNew';
const seen = () => { try { return localStorage.getItem(key) === VERSION; } catch { return false; } };

/** A short, dismissible note about what changed. Shown once per release. */
export default function WhatsNew() {
  const [hide, setHide] = useState(seen);
  if (hide) return null;
  const close = () => { try { localStorage.setItem(key, VERSION); } catch { /* private mode */ } setHide(true); };
  return (
    <section className="whats-new" aria-label="What is new">
      <button className="galaxy-x" onClick={close} aria-label="Dismiss">×</button>
      <strong>New</strong>
      <ul>
        <li>Church-approved Bibles (NABRE, RSV-CE) open from the Translations list.</li>
        <li><Link to="/study/gallery">Gallery</Link> of paintings and engravings, with compare.</li>
        <li>Many more pictures in the text, and the Galaxy now includes the Fathers and saints.</li>
        <li>Everything is listed on the <Link to="/more">More</Link> page.</li>
      </ul>
    </section>
  );
}
