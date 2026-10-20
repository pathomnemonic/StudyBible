import { useState } from 'react';
import { Link } from 'react-router-dom';

const VERSION = '2026-10b';
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
        <li>New layout: <strong>Profile</strong> (your notes, plans, settings), <strong>Study</strong>, <strong>Today</strong>, the <strong>Bible</strong> and <strong>Listen</strong>.</li>
        <li>The <Link to="/study/catechism">Catechism</Link> in full, with the Scripture it cites.</li>
        <li>Jesus’s words in red, and a Bible in a Year episode at the top of every chapter.</li>
        <li>Every page is still listed under <Link to="/more">Profile › Every page</Link>.</li>
      </ul>
    </section>
  );
}
