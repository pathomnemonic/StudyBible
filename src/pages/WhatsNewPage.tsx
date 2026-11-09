import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FEATURES } from '../lib/features';
import { NEW_AREAS, NEW_ITEMS, markWhatsNewSeen, seenDate } from '../lib/whatsNew';

const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

/** What was added lately, by area, most recent first. A small dot marks what you have not seen since your last visit. */
export default function WhatsNewPage() {
  const before = useRef(seenDate());
  useEffect(() => { markWhatsNewSeen(); }, []);
  return (
    <div className="page whatsnew">
      <h1>What’s new</h1>
      <p className="lede">What has been added lately, by area, with the newest first. Each one opens the page.</p>
      {NEW_AREAS.map((area) => {
        const items = NEW_ITEMS.filter((i) => i.area === area).sort((a, b) => b.date.localeCompare(a.date));
        if (!items.length) return null;
        return (
          <section key={area} className="sect" aria-labelledby={`wn-${area}`}>
            <h2 id={`wn-${area}`} className="eyebrow-h">{area}</h2>
            <ul className="list wn-list">
              {items.map((i) => {
                const f = i.id ? FEATURES.find((x) => x.id === i.id) : undefined;
                const to = f?.to ?? i.to;
                if (!to) return null;
                return (
                  <li key={i.id ?? i.to}>
                    <Link className="t" to={to}>{f?.title ?? i.title}</Link>
                    {i.date > before.current && <span className="wn-dot" title="New since your last visit"><span className="sr-only">New. </span></span>}
                    <span className="muted small"> · {fmt(i.date)}</span>
                    <div className="small">{i.line}</div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
