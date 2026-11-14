// Checks that run inside the page. Each returns a list of short problem strings. Shared by the crawler (sweep.mjs) and the
// focused checks, so every screen is held to the same rules the reviewer would apply by eye.
export const INVARIANTS = () => {
  const out = [];
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none' && e.offsetParent !== null && !(e.checkVisibility && !e.checkVisibility({ checkVisibilityCSS: true, contentVisibilityAuto: true })) && !(e.closest('details:not([open])') && !e.closest('summary')); };
  const label = (e) => (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 28);
  const root = document.querySelector('main') || document.body;
  const controls = [...root.querySelectorAll('a[href], button, [role=tab], [role=button], input, select, textarea, summary')].filter(vis);

  // 1. text spilling out of its box, and controls overlapping each other
  for (const e of controls) {
    const cs = getComputedStyle(e);
    if (e.scrollWidth > e.clientWidth + 3 && cs.overflowX === 'visible' && e.textContent.trim() && cs.display !== 'inline' && !e.closest('summary')) out.push(`text spills out of "${label(e)}" (${e.scrollWidth}>${e.clientWidth})`);
  }
  const rects = controls.map((e) => [e, e.getBoundingClientRect()]);
  const seen = new Set();
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const [a, ra] = rects[i], [c, rc] = rects[j];
    if (a.contains(c) || c.contains(a)) continue;
    // a popup menu, or a sticky/fixed bar that has scrolled over the content, is meant to float over the page
    const floats = (e) => { for (let n = e; n && n !== document.body; n = n.parentElement) { const ps = getComputedStyle(n).position; if ((ps === 'absolute' && n.closest('details')) || ((ps === 'fixed' || ps === 'sticky') && window.scrollY > 4)) return true; } return false; };
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
  const text = root.innerText || '';
  const leaks = [[/\bundefined\b/, 'the word "undefined"'], [/\bNaN\b/, '"NaN"'], [/\[object [A-Za-z]+\]/, '"[object …]"'], [/\{\{|\}\}/, 'template braces'], [/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/, 'control characters'], [/\[\s?[A-Z]{2,4}\s?\]/, 'a bracketed region tag like "[ US ]"'], [/Ã.|â€|Â\s/, 'garbled accents (mojibake)'], [/\bnull\b(?!\s*(hypothesis|set))/i, 'the word "null"']];
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
