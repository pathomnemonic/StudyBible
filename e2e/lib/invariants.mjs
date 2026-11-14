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
    if (a.closest('.tool-menu-list') || c.closest('.tool-menu-list')) continue; // a dropdown is meant to float over the page
    // compare line by line, so an inline link that wraps over two lines is not mistaken for overlapping its neighbour
    let hit = false;
    for (const x of a.getClientRects()) for (const y of c.getClientRects()) {
      if (Math.min(x.right, y.right) - Math.max(x.left, y.left) > 6 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 6) hit = true;
    }
    if (hit && a.textContent.trim() && c.textContent.trim()) {
      const k = label(a) + '|' + label(c);
      if (!seen.has(k)) { seen.add(k); out.push(`"${label(a)}" overlaps "${label(c)}"`); }
    }
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
export const SIGNATURE = () => ((document.querySelector('main') || document.body).innerText || '').replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().slice(0, 4000);
