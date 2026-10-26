// Presenter view follows the slide deck in a second window.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
await ctx.addInitScript(() => localStorage.setItem('sb:tour', '1'));
const deck = await ctx.newPage();
const errs = []; deck.on('pageerror', (e) => errs.push(e.message));
await deck.goto(`${BASE}/#/study/curriculum/5`);
await deck.locator('a[href*="curriculum/5/"]').first().click();
await deck.click('text=Present as slides');
await deck.waitForSelector('.sl-stage');
const pres = await ctx.newPage();
await pres.goto(`${BASE}/#/presenter`);
await pres.waitForSelector('.presenter');
await pres.waitForSelector('text=slide 1 of', { timeout: 5000 });
await deck.bringToFront();
await deck.keyboard.press('ArrowRight');
await pres.waitForSelector('text=slide 2 of', { timeout: 5000 });
if (errs.length) { console.error('FAIL', errs); process.exit(1); }
await b.close();
console.log('present e2e ok');
