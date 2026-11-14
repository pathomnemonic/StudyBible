// Checks that run inside the page. Each returns a list of short problem strings. Shared by the crawler (sweep.mjs) and the
// focused checks, so every screen is held to the same rules the reviewer would apply by eye.
export const INVARIANTS = () => {
  const out = [];
  // popups that are meant to float over a page
  const KNOWN_OVERLAYS = '[role=menu], .menu-list, .tool-menu-list, .glossary-pop, .term-pop, .lookup, .il-detail, .dottip-layer, .amb-tip, .tour-layer, .tour-card, .tour-dim, .trophy-toast, .modal, .update-banner, .offline-pill, .return-pill, .media-host.docked';
  // named bars that stick to the top or bottom of the screen and so pass over content while it scrolls
  const KNOWN_STICKY = '.lp-head, .mass-nav, .find-bar, .read-progress, .rosary-bar, .work-sel, .charades-startbar, .oc-nav, .tool-bar, .sleep-panel, .btn.sticky';
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none' && (e.offsetParent !== null || cs.position === 'fixed') && !(e.checkVisibility && !e.checkVisibility({ checkVisibilityCSS: true, contentVisibilityAuto: true })) && !(e.closest('details:not([open])') && !e.closest('summary')); };
  const label = (e) => (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 28);
  const root = document.querySelector('main') || document.body;
  const controls = [...root.querySelectorAll('a[href], button, [role=tab], [role=button], input, select, textarea, summary')].filter(vis);

  // 1. text spilling out of its box, and controls overlapping each other
  for (const e of controls) {
    const cs = getComputedStyle(e);
    if (e.scrollWidth > e.clientWidth + 3 && cs.overflowX === 'visible' && e.textContent.trim() && cs.display !== 'inline' && !e.closest('summary')) {
      // only text a reader can SEE counts: words for screen readers are clipped to a pixel on purpose (a button with an icon and a hidden label)
      const box = e.getBoundingClientRect(); let seenRight = 0;
      const walk = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      for (let t = walk.nextNode(); t; t = walk.nextNode()) {
        if (!t.textContent.trim()) continue;
        const host = t.parentElement; const hs = getComputedStyle(host); const hr = host.getBoundingClientRect();
        if ((hr.width <= 2 || hr.height <= 2) || /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)|inset\(50%\)/.test(hs.clip + hs.clipPath) || hs.visibility === 'hidden' || hs.opacity === '0') continue;
        const rg = document.createRange(); rg.selectNodeContents(t);
        for (const r of rg.getClientRects()) seenRight = Math.max(seenRight, r.right);
      }
      if (seenRight > box.right + 3) out.push(`text spills out of "${label(e)}" (${e.scrollWidth}>${e.clientWidth})`);
    }
  }
  const rects = controls.map((e) => [e, e.getBoundingClientRect()]);
  const seen = new Set();
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const [a, ra] = rects[i], [c, rc] = rects[j];
    if (a.contains(c) || c.contains(a)) continue;
    // Only the overlays this app knows about may float over content: popup menus, and the named sticky/fixed bars and panels once the page has scrolled.
    // Any other sticky or fixed element covering a control is a bug (the old rule exempted every sticky/fixed ancestor, which could hide real ones).
    const floats = (e) => { for (let n = e; n && n !== document.body; n = n.parentElement) { const ps = getComputedStyle(n).position; if ((ps === 'absolute' && n.closest('details')) || n.matches?.(KNOWN_OVERLAYS) || ((ps === 'fixed' || ps === 'sticky') && n.matches?.(KNOWN_STICKY))) return true; } return false; };
    if (floats(a) || floats(c)) continue;
    if (a.closest('svg') || c.closest('svg')) continue; // diagrams place their own marks, often overlapping on purpose
    // compare line by line, so an inline link that wraps over two lines is not mistaken for overlapping its neighbour
    let hit = false;
    // what is clipped away by a scrolling or overflow-hidden ancestor is not on screen, so it cannot overlap
    const clip = (e, r) => { let l = r.left, t = r.top, rt = r.right, b = r.bottom; for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX + cs.overflowY)) { const q = n.getBoundingClientRect(); l = Math.max(l, q.left); t = Math.max(t, q.top); rt = Math.min(rt, q.right); b = Math.min(b, q.bottom); } } return { left: l, top: t, right: rt, bottom: b }; };
    for (const x0 of a.getClientRects()) for (const y0 of c.getClientRects()) {
      const x = clip(a, x0), y = clip(c, y0);
      if (Math.min(x.right, y.right) - Math.max(x.left, y.left) > 6 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 6) hit = true;
    }
    if (hit && a.textContent.trim() && c.textContent.trim()) {
      const k = label(a) + '|' + label(c);
      if (!seen.has(k)) { seen.add(k); out.push(`"${label(a)}" overlaps "${label(c)}"`); }
    }
  }
  // 1b. a row of tabs must show every tab: tabs hidden behind a sideways scroll are never found (the Media tab's "Year, For you, …" bar once did this)
  for (const tl of root.querySelectorAll('[role=tablist]')) {
    if (!vis(tl)) continue;
    if (tl.scrollWidth > tl.clientWidth + 3 && /(auto|scroll)/.test(getComputedStyle(tl).overflowX) && !tl.hasAttribute('data-scrolls-by-design')) out.push(`tab row "${(tl.getAttribute('aria-label') || label(tl))}" hides tabs behind a sideways scroll (${tl.scrollWidth}>${tl.clientWidth})`);
  }
  // 2. the page itself scrolls sideways
  if (document.documentElement.scrollWidth > window.innerWidth + 2) out.push(`page scrolls sideways (${document.documentElement.scrollWidth}>${window.innerWidth})`);
  // 3. text that should never reach a reader: leaked code values, control characters, calendar-style region tags, mojibake
  // code samples shown on purpose (a JSON example in the help text) are not leaks
  let text = root.innerText || '';
  for (const c of root.querySelectorAll('code, pre')) { const t = c.innerText; if (t && t.length > 3) text = text.split(t).join(' '); }
  const leaks = [[/\bundefined\b/, 'the word "undefined"'], [/\bNaN\b/, '"NaN"'], [/\[object [A-Za-z]+\]/, '"[object …]"'], [/\{\{|\}\}/, 'template braces'], [/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/, 'control characters'], [/\[\s?[A-Z]{2,4}\s?\]/, 'a bracketed region tag like "[ US ]"'], [/Ã.|â€|Â\s/, 'garbled accents (mojibake)'], [/(^|[\n:=(,])\s*null\s*($|[\n,)])/i, 'the word "null" on its own']];
  for (const [re, what] of leaks) { const m = re.exec(text); if (m) out.push(`shows ${what}: …${text.slice(Math.max(0, m.index - 25), m.index + 30).replace(/\s+/g, ' ')}…`); }
  if (/Something went wrong|That page is not here/.test(text)) out.push('error or not-found screen');
  // 4. pictures that did not load, and controls with no name a screen reader could read
  for (const im of root.querySelectorAll('img')) if (vis(im) && im.complete && im.naturalWidth === 0 && im.src && !im.src.startsWith('data:')) out.push(`picture did not load: ${im.src.slice(-50)}`);
  for (const e of controls) if (e.matches('button, a[href], [role=tab], [role=button]') && !(e.textContent || '').trim() && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.getAttribute('title') && !e.querySelector('img[alt]:not([alt=""])')) out.push(`control with no name: <${e.tagName.toLowerCase()} class="${(e.className || '').toString().slice(0, 30)}">`);
  return out;
};

/** The words on the screen, reduced so that numbers and spacing do not matter: used to see whether a view comes back as it was. */
// what a tab shows, without the parts that change by design: popup menus left open by the crawler and the warm-up quiz (it is built from your progress)
export const SIGNATURE = () => { const c = (document.querySelector('main') || document.body).cloneNode(true); c.querySelectorAll('.lp-warm, details[open]:not(.fold), [role=menu]').forEach((n) => n.remove()); const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-99999px;top:0;width:360px'; host.appendChild(c); document.body.appendChild(host); const t = c.innerText || c.textContent || ''; host.remove(); return t.replace(/⋯/g, '').replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().slice(0, 4000); };

/** What a tab row and the page body are made of, in order, with identities kept: which tab is selected in every tab row, and the first forty link targets.
 *  Unlike SIGNATURE it keeps numbers (a Queue that quietly shows a different list must not pass). */
export const STRUCTURE = () => {
  const m = document.querySelector('main') || document.body;
  const rows = [...m.querySelectorAll('[role=tablist]')].map((tl) => [...tl.querySelectorAll('[role=tab]')].map((t) => `${t.getAttribute('aria-selected') === 'true' ? '*' : ''}${(t.textContent || '').trim().replace(/\s+/g, ' ').replace(/\d+/g, '#')}`).join('|'));
  const links = [...m.querySelectorAll('a[href]')].filter((a) => !a.closest('[role=menu], .tool-menu-list, details')).slice(0, 40).map((a) => a.getAttribute('href'));
  return JSON.stringify({ rows, links });
};

/**
 * Everything a tab panel is made of (a fold being open or shut is the reader's own state and does not count), in order, with nothing cut short: every tab row (label, selected), the visible tab panels, EVERY link
 * target and record id in the page body in order, and the full text with its numbers. Compared before and after leaving a tab, so a list that
 * comes back with a different item, order or count fails. Parts that are volatile by design are left out: an element can say so with
 * data-volatile, and popup menus, the warm-up quiz (built from progress) and open popups are excluded.
 */
export const PANEL_STATE = () => {
  const m = document.querySelector('main') || document.body;
  const EXCLUDE = '.lp-warm, [role=menu], details.tool-menu, details.act-more, [data-volatile], time';
  const keep = (e) => !e.closest(EXCLUDE);
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const rows = [...m.querySelectorAll('[role=tablist]')].filter(vis).map((tl) => [...tl.querySelectorAll('[role=tab]')].map((t) => `${t.getAttribute('aria-selected') === 'true' ? '*' : ''}${(t.textContent || '').trim().replace(/\s+/g, ' ')}`));
  const panels = [...m.querySelectorAll('[role=tabpanel]')].filter(vis).map((p) => `${p.id}|${p.getAttribute('aria-labelledby') ?? ''}`);
  const items = [...m.querySelectorAll('a[href]')].filter((a) => keep(a) && (vis(a) || a.closest('details'))).map((a) => a.getAttribute('href'));
  const ids = [...m.querySelectorAll('[data-id], [data-record-id], [data-key], [data-uid]')].filter(keep).map((e) => e.dataset.id ?? e.dataset.recordId ?? e.dataset.key ?? e.dataset.uid);
  // the text, from a copy with the excluded parts removed, laid out off screen so line breaks match what a reader sees
  const c = m.cloneNode(true);
  c.querySelectorAll(EXCLUDE).forEach((n) => n.remove());
  // whether a fold happens to be open is the reader's state, not the content's: read every fold as open and leave out the summary lines
  c.querySelectorAll('details').forEach((d) => { d.open = true; d.querySelectorAll(':scope > summary').forEach((x) => x.remove()); });
  const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-99999px;top:0;width:360px'; host.appendChild(c); document.body.appendChild(host);
  const text = (c.innerText || c.textContent || '').replace(/\s+/g, ' ').trim(); host.remove();
  return JSON.stringify({ rows, panels, items, ids, text });
};
