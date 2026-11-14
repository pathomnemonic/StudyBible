// Every setting that ThemeApplier writes to the page must take effect the moment it is changed (not only after another setting changes or a reload),
// and stay across a reload and across routes. Verse lines, footnote marks and layout were once missing from the effect's dependency list.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); } });
const p = await ctx.newPage(); p.setDefaultTimeout(15000);
const attr = (n) => p.evaluate((k) => document.documentElement.dataset[k], n);

// the reader's text settings panel
async function openTextSettings() {
  if (await p.locator('[aria-label="One verse per line"]').count()) return;
  await p.locator('button[aria-label^="Toolbox"]').click();
  await p.locator('text=Reading settings').first().click();
  await p.waitForSelector('[aria-label="One verse per line"]', { state: 'attached' });
}
const tap = (label) => p.locator(`[aria-label="${label}"]`).evaluate((e) => e.click());
await p.goto(`${BASE}/#/read/web-c/JHN/1`); await p.waitForSelector('button[aria-label^="Toolbox"]');
await p.locator('button:has-text("Got it")').first().click().catch(() => {});
await openTextSettings();

// 1. one verse per line: only this setting changes
const v0 = await attr('verses');
await tap('One verse per line'); await p.waitForTimeout(150);
const v1 = await attr('verses');
if (v1 === v0) fail(`"one verse per line" did not change data-verses at once (${v0})`);
await tap('One verse per line'); await p.waitForTimeout(150);
if ((await attr('verses')) !== v0) fail('toggling it back should restore data-verses');

// 2. footnote marks
const n0 = await attr('notemarks');
await tap('Footnote marks'); await p.waitForTimeout(150);
const n1 = await attr('notemarks');
if (n1 === n0) fail(`"footnote marks" did not change data-notemarks at once (${n0})`);
// it survives a reload and another route
await p.reload(); await p.waitForSelector('button[aria-label^="Toolbox"]');
if ((await attr('notemarks')) !== n1) fail('footnote marks setting lost on reload');
await p.goto(`${BASE}/#/pray`); await p.waitForTimeout(400);
if ((await attr('notemarks')) !== n1) fail('footnote marks setting lost on another route');
// restore
await p.goto(`${BASE}/#/read/web-c/JHN/1`); await p.waitForSelector('button[aria-label^="Toolbox"]'); await openTextSettings();
await tap('Footnote marks'); await p.waitForTimeout(150);

// 3. layout (Profile: Make it yours)
await p.goto(`${BASE}/#/profile`); await p.waitForSelector('text=Make it yours');
await p.locator('summary:has-text("Make it yours")').click().catch(() => {});
await p.waitForSelector('[role=group][aria-label="Layout"]');
const l0 = await attr('layout');
const other = l0 === 'compact' ? 'Classic' : 'Compact';
await p.locator(`[role=group][aria-label="Layout"] button:has-text("${other}")`).click(); await p.waitForTimeout(200);
const l1 = await attr('layout');
if (l1 === l0) fail(`layout did not change data-layout at once (${l0})`);
await p.reload(); await p.waitForSelector('text=Make it yours');
if ((await attr('layout')) !== l1) fail('layout lost on reload');
await p.goto(`${BASE}/#/today`); await p.waitForTimeout(300);
if ((await attr('layout')) !== l1) fail('layout lost across routes');

// 4. the same, with the system theme and high contrast
await p.emulateMedia({ colorScheme: 'dark', contrast: 'more' }).catch(() => {});
await p.goto(`${BASE}/#/profile`); await p.waitForSelector('text=Make it yours');
await p.locator('summary:has-text("Make it yours")').click().catch(() => {});
await p.waitForSelector('[role=group][aria-label="Layout"]');
await p.locator(`[role=group][aria-label="Layout"] button:has-text("${l0 === 'compact' ? 'Compact' : 'Classic'}")`).click(); await p.waitForTimeout(200);
if ((await attr('layout')) !== l0) fail('layout change with dark+high-contrast system theme did not apply');
await b.close(); console.log('themeapplier ok');
