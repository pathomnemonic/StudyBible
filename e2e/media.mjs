// Media: Meditate plays through the global player; a show's settings change the skip buttons.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/listen?tab=meditate`);
await p.waitForSelector('.med-list li');
await p.locator('.med-list .icon-btn').first().click();
await p.waitForSelector('.player');
// the skip buttons start at 15 / 30 and follow the show's settings
await p.locator('.player button[aria-label^="Forward"]').waitFor();
await p.click('.player button[aria-label="Open the full player"]');
await p.click('text=This show’s settings');
await p.locator('.show-settings select').nth(1).selectOption('60');
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
const label = await p.locator('.player button[aria-label^="Forward"]').first().getAttribute('aria-label');
if (label !== 'Forward 60 seconds') { console.error('FAIL forward label', label); process.exit(1); }
if (errs.length) { console.error('FAIL', errs.join('; ')); process.exit(1); }
await b.close();
console.log('media e2e ok');
