// The crawler. For every route, at the phone, tablet and desktop widths (and with large text), it holds the screen to the rules in
// lib/invariants.mjs, then CLICKS every fold and every tab of every tab row and re-checks after each click. A tab that is switched
// away and back must show what it showed before (that is how the Year "Queue" bug looked).
//
// Matrix:  SWEEP_MODE=fast (default for pull requests: 320 px with large text, and 390 px)
//          SWEEP_MODE=full (every width: 320 360 390 412 768 1024 1280, and large text at 320, 390 and 1280)
//          SWEEP_SIZES=320,390-big   picks sizes by name, for splitting a full run across machines
// Other:   BASE=<url>, ONLY=<route substring>, SWEEP_SHARD=2/4 (a slice of the routes)
//
// Nothing is capped: every fold and every tab is clicked; a control that cannot be clicked is reported, never skipped silently.
// Network: a first-party request that fails, or answers 4xx/5xx, fails the sweep (URL, status and route are printed).
// Third-party requests (video players, fonts, podcasts) are only counted; see THIRD_PARTY below and docs/QUALITY.md.
import { chromium } from 'playwright';
import { INVARIANTS } from './lib/invariants.mjs';
import { CRAWL, EXCLUDED } from './lib/routes.mjs';
import { openAllFolds, exerciseTabRows, routeMarkers } from './lib/crawl.mjs';
import { parseShard, parseConcurrency, pickSizes, pickRoutes } from './lib/config.mjs';

const BASE = process.env.BASE ?? 'http://localhost:4173';
const HOST = new URL(BASE).host;
export const ROUTE_EXCLUSIONS = EXCLUDED;
// the whole route manifest (e2e/lib/routes.mjs; tests/route-manifest.test.ts keeps it in step with src/App.tsx)
const KIND = new Map(CRAWL.map((c) => [c.path, c.kind]));
const ENTRY = new Map(CRAWL.map((c) => [c.path, c]));
const W = (w, text = 1) => ({ name: text === 1 ? `${w}` : `${w}-big`, w, h: w >= 768 ? 900 : 760, text });
const ALL = [W(320), W(360), W(390), W(412), W(768), W(1024), W(1280), W(320, 1.3), W(390, 1.3), W(1280, 1.3)];
const MODE = process.env.SWEEP_MODE ?? (process.env.SWEEP_FAST === '0' ? 'full' : 'fast');
let ROUTES, SIZES, CONCURRENCY, SHARD;
try {
  if (!['fast', 'full'].includes(MODE)) throw new Error(`SWEEP_MODE "${MODE}" must be fast or full`);
  SHARD = parseShard(process.env.SWEEP_SHARD ?? '1/1');
  CONCURRENCY = parseConcurrency(process.env.SWEEP_CONCURRENCY ?? '5');
  ROUTES = pickRoutes(CRAWL.map((c) => c.path), process.env.ONLY, SHARD);
  SIZES = process.env.SWEEP_SIZES !== undefined ? pickSizes(process.env.SWEEP_SIZES, ALL) : MODE === 'full' ? ALL : [W(320, 1.3), W(390)];
  if (!SIZES.length) throw new Error('no viewport sizes selected');
} catch (e) { console.error(`FAIL sweep configuration: ${e.message}`); process.exit(2); }
console.log(`sweep configuration: mode=${MODE} shard=${SHARD.join('/')} concurrency=${CONCURRENCY} routes=${ROUTES.length} sizes=${SIZES.map((x) => x.name).join(',')} base=${BASE}`);

/** Third-party hosts the app embeds or links to. Their failures are counted, never failures of this app (we do not control them). */
const THIRD_PARTY = /(^|\.)(youtube(-nocookie)?\.com|ytimg\.com|googlevideo\.com|google\.com|gstatic\.com|googleapis\.com|vimeo\.com|spotify\.com|scdn\.co|archive\.org|librivox\.org|ascensionpress\.com|podcasts?\.apple\.com|itunes\.apple\.com|simplecast\.com|libsyn\.com|buzzsprout\.com|megaphone\.fm|anchor\.fm|transistor\.fm)$/i;
const NET_KINDS = new Set(['document', 'script', 'stylesheet', 'font', 'image', 'fetch', 'xhr', 'media']);

const problems = new Map();
const warnings = new Map();
const note = (where, what) => { if (!problems.has(what)) problems.set(what, new Set()); problems.get(what).add(where); };
const warn = (where, what) => { if (!warnings.has(what)) warnings.set(what, new Set()); warnings.get(what).add(where); };
const stats = { crawls: 0, folds: 0, tabGroups: 0, tabs: 0, clicksFailed: 0, thirdPartyFailed: 0, firstPartyRequests: 0 };

const browser = await chromium.launch();
async function crawl(size, route) {
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h } });
  await ctx.addInitScript((t) => { try { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); } catch { /* */ } document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = `${t * 100}%`; }); }, size.text);
  const p = await ctx.newPage();
  const where = `${size.name}px ${route}`;
  p.on('pageerror', (e) => note(where, `uncaught error: ${e.message.slice(0, 120)}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|WebSocket|Content Security|ServiceWorker/i.test(m.text()) && !THIRD_PARTY.test((m.location()?.url || '').split('/')[2] ?? '')) note(where, `console error: ${m.text().slice(0, 140)}`); });
  p.on('requestfailed', (r) => {
    let u; try { u = new URL(r.url()); } catch { return; }
    const err = r.failure()?.errorText ?? '';
    if (/ERR_ABORTED|aborted/i.test(err)) return; // navigation moved on
    if (u.host !== HOST) { if (!THIRD_PARTY.test(u.hostname)) warn(where, `third-party host not on the allowlist failed: ${u.hostname}`); stats.thirdPartyFailed++; return; }
    if (NET_KINDS.has(r.resourceType())) note(where, `first-party request failed (${err}): ${u.pathname}`);
  });
  p.on('response', (r) => {
    let u; try { u = new URL(r.url()); } catch { return; }
    if (u.host === HOST) stats.firstPartyRequests++;
    if (r.status() < 400) return;
    if (u.host !== HOST) { stats.thirdPartyFailed++; return; }
    note(where, `first-party ${r.status()} for ${u.pathname}`);
  });
  try {
    await p.goto(`${BASE}/#${route}`);
    // a route-specific marker, not just "something rendered": a real heading, not the error page and not the not-found page
    if (KIND.get(route) === 'unknown-id') {
      // an address with an id that does not exist must SAY so (not stay blank, not load for ever, not break): any clear message will do
      await p.waitForFunction(() => ((document.querySelector('main') || document.body).innerText || '').replace(/\s+/g, ' ').trim().length > 12, null, { timeout: 15000 }).catch(() => note(where, 'an unknown id leaves the page blank (it should say it was not found)'));
      await p.waitForTimeout(5000);
      const msg = ((await p.evaluate(() => (document.querySelector('main') || document.body).innerText)) || '').replace(/\s+/g, ' ').trim();
      if (/^(← ?\w+\s*)?(loading|…)/i.test(msg) || /loading( plan| text|…)?\s*$/i.test(msg)) note(where, `an unknown id loads for ever ("${msg.slice(0, 40)}")`);
    } else {
      await p.waitForSelector('main h1, main h2, main [role=heading], .page h1, .page h2, [role=heading]', { timeout: 15000 }).catch(() => note(where, 'no heading appeared (the route rendered nothing recognisable)'));
    }
    await p.waitForTimeout(450);
    for (const x of await routeMarkers(p, ENTRY.get(route))) note(where, x);
    const check = async (stage) => {
      let found = await p.evaluate(INVARIANTS);
      if (found.length) { await p.waitForTimeout(700); const again = new Set(await p.evaluate(INVARIANTS)); found = found.filter((x) => again.has(x)); } // entry animations move things for a moment
      for (const x of found) note(`${where}${stage ? ` after ${stage}` : ''}`, x);
    };
    await check('');
    const click = async (loc, what) => {
      try { await loc.click({ timeout: 2500 }); return true; }
      catch (e) { stats.clicksFailed++; note(where, `could not click ${what}: ${String(e.message).split('\n')[0].slice(0, 90)}`); return false; }
    };

    // every fold, and every fold that opening one reveals, until none is closed (a ceiling that is hit is a failure, not a pass)
    stats.folds += await openAllFolds(p, { note, where, click, check });
    // every tab row (including rows that only appear after a click), every tab, then back through them all
    await exerciseTabRows(p, { note, warn, where, click, check, stats });
    stats.crawls++;
  } catch (e) { note(where, `crawl failed: ${String(e.message).slice(0, 100)}`); }
  await ctx.close();
}

const jobs = SIZES.flatMap((s) => ROUTES.map((r) => [s, r]));
let next = 0, done = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < jobs.length) { const [s, r] = jobs[next++]; await crawl(s, r); if (++done % 25 === 0) console.log(`  …${done}/${jobs.length}`); }
}));
await browser.close();

console.log(`sweep mode=${MODE}: ${ROUTES.length} routes × ${SIZES.length} sizes (${SIZES.map((s) => s.name).join(', ')}) = ${jobs.length} screens`);
console.log(`exercised: ${stats.folds} folds, ${stats.tabGroups} tab rows, ${stats.tabs} tabs; ${stats.firstPartyRequests} first-party requests checked; ${stats.clicksFailed} clicks failed; ${stats.thirdPartyFailed} third-party failures counted (not failures of this app)`);
console.log(`exclusions: ${Object.entries(ROUTE_EXCLUSIONS).map(([r, why]) => `${r} (${why})`).join('; ') || 'none'}`);
if (warnings.size) { console.log(`warnings (${warnings.size}, not failures):`); for (const [what, wheres] of [...warnings].slice(0, 25)) console.log(`  ~ ${what}  e.g. ${[...wheres].slice(0, 2).join(' | ')}${wheres.size > 2 ? ` (+${wheres.size - 2})` : ''}`); }
if (!stats.crawls && !problems.size) problems.set('no screen was crawled successfully', new Set(['sweep']));
if (problems.size) {
  console.error(`FAIL sweep: ${problems.size} kinds of problem on ${jobs.length} screens`);
  for (const [what, wheres] of [...problems].slice(0, 70)) console.error(`- ${what}\n    e.g. ${[...wheres].slice(0, 3).join(' | ')}${wheres.size > 3 ? ` (+${wheres.size - 3} more)` : ''}`);
  process.exit(1);
}
console.log(`sweep: ok (${jobs.length} screens)`);
