// The two interaction loops of the crawler, kept apart from the route list and the viewport matrix so they can be tested on their own
// (e2e/crawler-selftest.mjs feeds them deliberately awkward fixtures).
import { PANEL_STATE, SIGNATURE } from './invariants.mjs';

/** the folds a reader opens: closed <details> in the page body, but not popup menus (the Bible tools dropdown, per-row "more" menus) */
export const FOLD_SELECTOR = 'main details:not(.tool-menu):not(.act-more):not([open]) > summary';
const label = (s) => (s || '').trim().replace(/\s+/g, ' ').slice(0, 30);

/**
 * Opens every fold, then every fold that opening them revealed, and so on until none is left closed.
 * There is a safety ceiling in case a page keeps producing folds for ever; reaching it is a FAILURE that names what is still closed,
 * never a quiet success with folds unvisited. Returns how many folds were actually opened.
 */
export async function openAllFolds(p, { note, where, click, check, ceiling = 60 }) {
  let opened = 0;
  for (let pass = 1; pass <= ceiling; pass++) {
    const n = await p.locator(FOLD_SELECTOR).count();
    if (!n) return opened;
    let progressed = false;
    for (let i = 0; i < n; i++) {
      const f = p.locator(FOLD_SELECTOR).first();
      if (!(await f.count())) break;
      const name = label(await f.innerText().catch(() => '')) || 'fold';
      if (await click(f, `fold "${name}"`)) { opened++; progressed = true; } else break;
      await p.waitForTimeout(60);
    }
    await check(`opening folds (pass ${pass})`);
    if (!progressed) break; // nothing could be clicked this pass: the click failures were reported; do not spin
  }
  const left = p.locator(FOLD_SELECTOR);
  const remaining = await left.count();
  if (remaining) {
    const names = []; for (let i = 0; i < Math.min(remaining, 5); i++) names.push(label(await left.nth(i).innerText().catch(() => '')) || 'fold');
    note(where, `${remaining} fold${remaining === 1 ? '' : 's'} still closed after ${ceiling} passes (not exercised): ${names.map((x) => `"${x}"`).join(', ')}${remaining > 5 ? ', …' : ''}`);
  }
  return opened;
}

/** wait until the page has stopped changing (lists stream in, quizzes load), so two captures are comparable; gives up after 6 s */
export async function settled(p, fn) {
  let last = await p.evaluate(fn);
  for (let i = 0; i < 15; i++) { await p.waitForTimeout(400); const now = await p.evaluate(fn); if (now === last) return now; last = now; }
  return last;
}

/** where two captured panel states first differ, in words */
export function describeDiff(a, b) {
  const A = JSON.parse(a), B = JSON.parse(b);
  for (const part of ['rows', 'panels', 'ids', 'items']) {
    const x = JSON.stringify(A[part]), y = JSON.stringify(B[part]);
    if (x !== y) {
      if (Array.isArray(A[part]) && Array.isArray(B[part]) && A[part].length !== B[part].length) return `${part}: ${A[part].length} before, ${B[part].length} after`;
      const i = (A[part] || []).findIndex((v, k) => JSON.stringify(v) !== JSON.stringify(B[part][k]));
      return `${part} differ at position ${i + 1}: ${JSON.stringify(A[part][i])?.slice(0, 50)} then ${JSON.stringify(B[part][i])?.slice(0, 50)}`;
    }
  }
  if (A.text !== B.text) { let i = 0; while (A.text[i] === B.text[i]) i++; return `text differs at character ${i}: "${A.text.slice(Math.max(0, i - 15), i + 30)}" then "${B.text.slice(Math.max(0, i - 15), i + 30)}"`; }
  return '';
}

/**
 * Exercises every tab row on the page, including rows that only appear after a tab is clicked (each is found by looking again after every row).
 * For each row: click every tab and capture its full state; then go back through the tabs in reverse and require each to come back exactly as it
 * was (selected state, panel, every link and id in order, the text with its numbers). aria-selected must be true after every click.
 */
export async function exerciseTabRows(p, { note, warn, where, click, check, stats }) {
  const done = new Set();
  for (let round = 0; round < 40; round++) {
    const lists = p.locator('[role=tablist]');
    const total = await lists.count();
    let target = -1, key = '';
    for (let g = 0; g < total; g++) {
      const l = lists.nth(g);
      if (!(await l.isVisible().catch(() => false))) continue;
      const names = await l.locator('[role=tab]').allInnerTexts().catch(() => []);
      if (names.length < 2) continue;
      const k = `${await l.getAttribute('aria-label').catch(() => '')}|${names.map((x) => label(x)).join('|')}`;
      if (!done.has(k)) { target = g; key = k; break; }
    }
    if (target < 0) return;
    done.add(key);
    const list = p.locator('[role=tablist]').nth(target);
    const tabs = list.locator('[role=tab]');
    const n = await tabs.count();
    const names = []; for (let i = 0; i < n; i++) names.push(label(await tabs.nth(i).innerText().catch(() => '')) || `tab ${i + 1}`);
    stats.tabGroups++;
    const first = new Map(); let prev = '';
    for (let i = 0; i < n; i++) {
      if (await tabs.nth(i).isDisabled().catch(() => false)) { warn(where, `tab "${names[i]}" is disabled, so it was not exercised`); continue; }
      if (!(await click(tabs.nth(i), `tab "${names[i]}"`))) continue;
      stats.tabs++;
      const state = await settled(p, PANEL_STATE);
      const sel = await tabs.nth(i).getAttribute('aria-selected');
      if (sel !== null && sel !== 'true') note(where, `tab "${names[i]}" was clicked but is not marked selected (aria-selected=${sel})`);
      await check(`tab "${names[i]}"`);
      if (state === prev) warn(where, `tab "${names[i]}" shows nothing different from the tab before it`);
      first.set(i, state); prev = state;
    }
    // back through every tab, last to first: each must come back as it was
    for (let i = n - 1; i >= 0; i--) {
      if (!first.has(i)) continue;
      if (!(await click(tabs.nth(i), `tab "${names[i]}" (coming back)`))) continue;
      const state = await settled(p, PANEL_STATE);
      const sel = await tabs.nth(i).getAttribute('aria-selected');
      if (sel !== null && sel !== 'true') note(where, `after coming back, tab "${names[i]}" is not marked selected`);
      const diff = state === first.get(i) ? '' : describeDiff(first.get(i), state);
      if (diff) note(where, `tab "${names[i]}" does not come back as it was (${diff})`);
    }
    // the SIGNATURE helper is kept for callers that want a coarse text comparison
    void SIGNATURE;
  }
}

/**
 * What a route must show, beyond "something rendered". `entry` is a manifest entry { path, kind, expect? }.
 *  - unknown-id: an EXPLICIT not-found state, [data-state="not-found"] (not blank, not "loading" for ever, not a different page's content)
 *  - every other kind: never the not-found state, never the error page
 *  - expect (a regular expression, as text): the page's own heading (or document title) must match it, so a route that renders the wrong page fails
 * Returns the problems found, as sentences.
 */
export async function routeMarkers(p, entry) {
  const s = await p.evaluate(() => {
    const h = (document.querySelector('main h1, .page h1, h1') || document.querySelector('main h2, .page h2, h2'));
    const m = document.querySelector('main') || document.body;
    return { heading: (h?.textContent || '').trim().replace(/\s+/g, ' '), title: document.title || '', notFound: !!document.querySelector('[data-state="not-found"]'), text: (m.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60) };
  });
  const out = [];
  if (/this page did not load|something went wrong/i.test(s.heading)) out.push(`the error page is showing ("${s.heading}")`);
  if (entry.kind === 'unknown-id') {
    if (!s.notFound) out.push(`an unknown id shows no explicit not-found state (no [data-state="not-found"]; the page says "${(s.heading || s.text).slice(0, 50)}")`);
  } else {
    if (s.notFound) out.push('the not-found state is showing for a route that should exist');
    if (entry.expect && ![s.heading, s.title].some((x) => new RegExp(entry.expect, 'i').test(x))) out.push(`this route should show a heading matching /${entry.expect}/, but shows "${(s.heading || s.text).slice(0, 50)}" (title "${s.title.slice(0, 40)}")`);
  }
  return out;
}
