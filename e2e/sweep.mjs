// The crawler. For every route, at phone sizes (including big text) and a desktop size, it holds the screen to the rules in
// lib/invariants.mjs, then CLICKS what a reader would click (every tab, every fold) and re-checks after each click. A tab that
// is switched away and back must show the same thing it showed before (that is how the Year "Queue" bug looked).
// Env: SWEEP_FAST=1 (fewer sizes), BASE=<url>, ONLY=<route substring>.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { INVARIANTS, SIGNATURE } from './lib/invariants.mjs';

const BASE = process.env.BASE ?? 'http://localhost:4173';
const src = readFileSync(new URL('./smoke.mjs', import.meta.url), 'utf8');
let ROUTES = [...new Set([...src.matchAll(/'(\/[^']*)'/g)].map((m) => m[1]).filter((r) => !r.includes('?') && r !== '/read'))];
if (process.env.ONLY) ROUTES = ROUTES.filter((r) => r.includes(process.env.ONLY));
const SIZES = process.env.SWEEP_FAST
  ? [{ name: 'phone-320-bigtext', w: 320, h: 700, text: 1.3 }]
  : [{ name: 'phone-320-bigtext', w: 320, h: 700, text: 1.3 }, { name: 'phone-412', w: 412, h: 860, text: 1 }, { name: 'desktop', w: 1280, h: 800, text: 1 }];
const CONCURRENCY = 5;
const problems = new Map();
const note = (where, what) => { const k = `${what}`; if (!problems.has(k)) problems.set(k, new Set()); problems.get(k).add(where); };

const browser = await chromium.launch();
async function crawl(size, route) {
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h } });
  await ctx.addInitScript((t) => { try { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); } catch { /* */ } document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = `${t * 100}%`; }); }, size.text);
  const p = await ctx.newPage();
  const where = `${size.name} ${route}`;
  p.on('pageerror', (e) => note(where, `uncaught error: ${e.message.slice(0, 120)}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|WebSocket|net::ERR|Content Security|favicon|googleapis|ytimg|youtube|manifest|ServiceWorker/i.test(m.text())) note(where, `console error: ${m.text().slice(0, 120)}`); });
  try {
    await p.goto(`${BASE}/#${route}`); await p.waitForTimeout(450);
    const check = async (stage) => { for (const x of await p.evaluate(INVARIANTS)) note(`${where}${stage ? ` after ${stage}` : ''}`, x); };
    await check('');
    // folds
    const folds = p.locator('main details:not(.tool-menu) > summary');
    const nf = Math.min(await folds.count(), 6);
    for (let i = 0; i < nf; i++) { await folds.nth(i).click({ timeout: 1500 }).catch(() => undefined); await p.waitForTimeout(120); }
    if (nf) await check('opening folds');
    // tab groups: click each tab, check, then come back to the first and compare
    const groups = await p.locator('[role=tablist]').count();
    for (let g = 0; g < Math.min(groups, 4); g++) {
      const tabs = p.locator('[role=tablist]').nth(g).locator('[role=tab]');
      const n = Math.min(await tabs.count(), 8);
      if (n < 2) continue;
      await tabs.nth(0).click({ timeout: 1500 }).catch(() => undefined); await p.waitForTimeout(250);
      const first = await p.evaluate(SIGNATURE);
      for (let i = 1; i < n; i++) {
        const name = ((await tabs.nth(i).innerText().catch(() => '')) || `tab ${i}`).trim().slice(0, 18);
        await tabs.nth(i).click({ timeout: 1500 }).catch(() => undefined); await p.waitForTimeout(250);
        await check(`tab "${name}"`);
      }
      await tabs.nth(0).click({ timeout: 1500 }).catch(() => undefined); await p.waitForTimeout(350);
      const back = await p.evaluate(SIGNATURE);
      if (back !== first) note(where, `going back to the first tab of a tab row does not show what it showed before (row ${g + 1}: "${first.slice(0, 40)}…" then "${back.slice(0, 40)}…")`);
    }
  } catch (e) { note(where, `crawl failed: ${String(e.message).slice(0, 100)}`); }
  await ctx.close();
}

const jobs = SIZES.flatMap((s) => ROUTES.map((r) => [s, r]));
let next = 0, done = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < jobs.length) { const [s, r] = jobs[next++]; await crawl(s, r); if (++done % 25 === 0) console.log(`  …${done}/${jobs.length}`); }
}));
await browser.close();
if (problems.size) {
  console.error(`FAIL sweep: ${problems.size} kinds of problem on ${jobs.length} screens`);
  for (const [what, wheres] of [...problems].slice(0, 70)) console.error(`- ${what}\n    e.g. ${[...wheres].slice(0, 3).join(' | ')}${wheres.size > 3 ? ` (+${wheres.size - 3} more)` : ''}`);
  process.exit(1);
}
console.log(`sweep: ok (${jobs.length} screens)`);
